#!/usr/bin/env node
/**
 * ESLint 기준선 비교. 리뉴얼 전 코드에 이미 error 가 수백 개 있으므로 "0개"를 요구하지 않고
 * "파일별 error 수가 기준선보다 늘지 않았는가"만 본다. 새 파일은 error 0 이어야 한다.
 *
 *   node scripts/qa/lint-diff.mjs --save-baseline   # 리뉴얼 전 1회
 *   node scripts/qa/lint-diff.mjs                   # 비교 (늘었으면 exit 1)
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const BASE = path.join(ROOT, "qa", "baseline", "eslint.json");

let out;
try {
    out = execFileSync("npx", ["eslint", "src", "-f", "json"], { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString();
} catch (e) {
    out = e.stdout?.toString(); // error 가 있으면 exit 1 이지만 JSON 은 나온다
}
const counts = {};
for (const r of JSON.parse(out)) if (r.errorCount) counts[path.relative(ROOT, r.filePath)] = r.errorCount;
const total = Object.values(counts).reduce((a, b) => a + b, 0);

if (process.argv.includes("--save-baseline")) {
    fs.mkdirSync(path.dirname(BASE), { recursive: true });
    fs.writeFileSync(BASE, JSON.stringify({ total, files: counts }, null, 2));
    console.log(`✔ ESLint 기준선 저장: error ${total}개 / 파일 ${Object.keys(counts).length}개`);
    process.exit(0);
}
if (!fs.existsSync(BASE)) {
    console.error("기준선 없음 — 리뉴얼 전 커밋에서 --save-baseline 을 먼저 실행하세요.");
    process.exit(2);
}
const base = JSON.parse(fs.readFileSync(BASE, "utf8"));
const worse = Object.entries(counts).filter(([f, n]) => n > (base.files[f] ?? 0));
console.log(`ESLint error: 기준선 ${base.total} → 현재 ${total}`);
for (const [f, n] of worse) console.log(`  ✖ ${f}: ${base.files[f] ?? 0} → ${n}`);
process.exit(worse.length ? 1 : 0);
