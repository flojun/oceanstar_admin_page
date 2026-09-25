#!/usr/bin/env node
/**
 * 오션스타 UI ↔ 기능 정적 감사 (static audit)
 *
 * 소스 전체를 TypeScript AST로 읽어
 *   1) 라우트(페이지·API·리다이렉트) 목록
 *   2) 페이지별로 렌더되는 모든 인터랙티브 요소(버튼·링크·폼·클릭 가능한 요소)
 *   3) 각 요소의 핸들러가 실제로 하는 일(API 호출, Supabase 테이블 조작, 이동, 내보내기 …)
 * 을 뽑아 인벤토리를 만들고, 다음을 검사한다.
 *   - 존재하지 않는 페이지로 가는 링크 / 존재하지 않는 API·메서드 호출
 *   - 핸들러가 없는 버튼, 빈 핸들러
 *   - 접근 가능한 이름이 없는 아이콘 버튼 (E2E 선택자·접근성)
 *   - 로케일 파일에 없는 번역 키, 페이지에 없는 #앵커
 *
 * 리뉴얼 전후 비교:
 *   node scripts/qa/audit-ui.mjs --save-baseline   # 현재 상태를 qa/baseline 에 저장 (리뉴얼 전 1회)
 *   node scripts/qa/audit-ui.mjs --compare         # 기준선과 비교 → 사라진 기능이 있으면 exit 1
 *
 * 비교는 파일·줄 번호가 아니라 "기능" 단위(예: 고객 화면의 어떤 버튼이 POST /api/stripe/checkout 을
 * 호출한다)로 하므로, 컴포넌트를 쪼개거나 파일을 옮겨도 기능이 살아 있으면 통과한다.
 * 의도된 변경(모달→페이지, 맛집→블로그 등)은 qa/renewal-expected-changes.json 에 적어 승인한다.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");
const QA_DIR = path.join(ROOT, "qa");
const BASELINE_DIR = path.join(QA_DIR, "baseline");
const REPORT_DIR = path.join(QA_DIR, "reports");
const EXPECTED_CHANGES = path.join(QA_DIR, "renewal-expected-changes.json");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
};

// ─────────────────────────────────────────────────────────────
// 설정: 라우트 → 화면 구분(surface)
// ─────────────────────────────────────────────────────────────
function surfaceOf(route) {
    if (route.startsWith("/api/")) return "api";
    if (route.startsWith("/dashboard") || route === "/login") return "admin";
    if (route.startsWith("/agency-")) return "agency";
    if (route.startsWith("/checkin")) return "checkin";
    return "customer";
}

// ─────────────────────────────────────────────────────────────
// 파일 수집 & 파싱
// ─────────────────────────────────────────────────────────────
function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join("/");

const sourceFiles = walk(SRC).filter((f) => /\.(tsx?|mts)$/.test(f) && !f.endsWith(".d.ts"));
const sfCache = new Map();
function getSf(abs) {
    if (!sfCache.has(abs)) {
        const text = fs.readFileSync(abs, "utf8");
        const kind = abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
        sfCache.set(abs, ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, kind));
    }
    return sfCache.get(abs);
}
const lineOf = (node) => node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1;
const squash = (s, n = 90) => {
    const t = String(s).replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

// ─────────────────────────────────────────────────────────────
// 모듈 해석 (@/ 별칭 + 상대 경로)
// ─────────────────────────────────────────────────────────────
function resolveModule(spec, fromFile) {
    let base;
    if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
    else return null;
    for (const cand of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    }
    return null;
}

const importsCache = new Map();
function importsOf(abs) {
    if (importsCache.has(abs)) return importsCache.get(abs);
    const sf = getSf(abs);
    const out = new Set();
    const visit = (n) => {
        if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
            if (!(ts.isImportDeclaration(n) && n.importClause?.isTypeOnly)) {
                const r = resolveModule(n.moduleSpecifier.text, abs);
                if (r) out.add(r);
            }
        }
        if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) {
            const r = resolveModule(n.arguments[0].text, abs);
            if (r) out.add(r);
        }
        ts.forEachChild(n, visit);
    };
    visit(sf);
    importsCache.set(abs, out);
    return out;
}

function closure(entries) {
    const seen = new Set();
    const stack = [...entries];
    while (stack.length) {
        const f = stack.pop();
        if (seen.has(f)) continue;
        seen.add(f);
        for (const d of importsOf(f)) stack.push(d);
    }
    return seen;
}

// ─────────────────────────────────────────────────────────────
// 라우트 수집
// ─────────────────────────────────────────────────────────────
function routeFromAppPath(abs) {
    const segs = path.relative(APP, path.dirname(abs)).split(path.sep).filter(Boolean);
    const kept = segs.filter((s) => !(s.startsWith("(") && s.endsWith(")")) && !s.startsWith("@"));
    return "/" + kept.join("/");
}

const appFiles = sourceFiles.filter((f) => f.startsWith(APP + path.sep));
const pageRoutes = appFiles
    .filter((f) => /[/\\]page\.tsx?$/.test(f))
    .map((file) => {
        const route = routeFromAppPath(file);
        // 페이지 디렉터리까지 내려가며 만나는 layout 들
        const layouts = [];
        let dir = APP;
        for (const seg of path.relative(APP, path.dirname(file)).split(path.sep).filter(Boolean).concat([null])) {
            for (const name of ["layout.tsx", "layout.ts", "template.tsx"]) {
                const cand = path.join(dir, name);
                if (fs.existsSync(cand)) layouts.push(cand);
            }
            if (seg) dir = path.join(dir, seg);
        }
        return { route, file, layouts: [...new Set(layouts)], surface: surfaceOf(route) };
    })
    .sort((a, b) => a.route.localeCompare(b.route));

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const apiRoutes = appFiles
    .filter((f) => /[/\\]route\.tsx?$/.test(f))
    .map((file) => {
        const sf = getSf(file);
        const methods = [];
        for (const st of sf.statements) {
            const exported = st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
            if (!exported) continue;
            if (ts.isFunctionDeclaration(st) && st.name && HTTP_METHODS.includes(st.name.text)) methods.push(st.name.text);
            if (ts.isVariableStatement(st))
                for (const d of st.declarationList.declarations)
                    if (ts.isIdentifier(d.name) && HTTP_METHODS.includes(d.name.text)) methods.push(d.name.text);
        }
        return { route: routeFromAppPath(file), file, methods };
    })
    .sort((a, b) => a.route.localeCompare(b.route));

// 메타데이터 라우트 (sitemap.ts → /sitemap.xml 등)
const metaRoutes = [];
for (const [name, route] of [["sitemap", "/sitemap.xml"], ["robots", "/robots.txt"], ["manifest", "/manifest.webmanifest"]]) {
    if (appFiles.some((f) => path.dirname(f) === APP && path.basename(f).startsWith(name + "."))) metaRoutes.push(route);
}

// public/ 정적 파일
const publicDir = path.join(ROOT, "public");
const publicPaths = new Set(fs.existsSync(publicDir) ? walk(publicDir).map((f) => "/" + path.relative(publicDir, f).split(path.sep).join("/")) : []);

// next.config 리다이렉트 (리뉴얼 때 추가될 301)
function readRedirects() {
    const cfg = ["next.config.ts", "next.config.mjs", "next.config.js"].map((n) => path.join(ROOT, n)).find((p) => fs.existsSync(p));
    if (!cfg) return [];
    const sf = ts.createSourceFile(cfg, fs.readFileSync(cfg, "utf8"), ts.ScriptTarget.Latest, true);
    const out = [];
    const visit = (n) => {
        if (ts.isObjectLiteralExpression(n)) {
            const get = (k) => {
                const p = n.properties.find((pp) => ts.isPropertyAssignment(pp) && pp.name.getText() === k);
                return p && ts.isPropertyAssignment(p) ? p.initializer : null;
            };
            const src = get("source");
            const dst = get("destination");
            if (src && dst && ts.isStringLiteralLike(src) && ts.isStringLiteralLike(dst)) {
                const perm = get("permanent");
                out.push({ source: src.text, destination: dst.text, permanent: perm ? perm.kind === ts.SyntaxKind.TrueKeyword : null });
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
}
const redirects = readRedirects();

function routeToRegex(route) {
    const body = route
        .split("/")
        .map((seg) => {
            if (/^\[\[\.\.\..+\]\]$/.test(seg)) return "(?:/.*)?";
            if (/^\[\.\.\..+\]$/.test(seg)) return "/.+";
            if (/^\[.+\]$/.test(seg)) return "/[^/]+";
            if (/^:[\w]+\*$/.test(seg)) return "(?:/.*)?";
            if (/^:[\w]+$/.test(seg)) return "/[^/]+";
            return seg ? "/" + seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
        })
        .join("");
    return new RegExp("^" + (body || "/") + "/?$");
}
const pageMatchers = pageRoutes.map((p) => ({ route: p.route, re: routeToRegex(p.route) }));
const apiMatchers = apiRoutes.map((a) => ({ ...a, re: routeToRegex(a.route) }));
const redirectMatchers = redirects.map((r) => ({ ...r, re: routeToRegex(r.source) }));

/** 내부 경로가 실제로 존재하는지 */
function resolveInternalPath(p) {
    const clean = p.split("#")[0].split("?")[0] || "/";
    // 템플릿 파라미터(:param)는 "아무 세그먼트"로 본다
    const probe = clean.replace(/:param/g, "x");
    const page = pageMatchers.find((m) => m.re.test(probe));
    if (page) return { ok: true, kind: "page", route: page.route };
    const api = apiMatchers.find((m) => m.re.test(probe));
    if (api) return { ok: true, kind: "api", route: api.route };
    if (publicPaths.has(clean) || metaRoutes.includes(clean)) return { ok: true, kind: "static", route: clean };
    const red = redirectMatchers.find((m) => m.re.test(probe));
    if (red) return { ok: true, kind: "redirect", route: red.source, destination: red.destination };
    return { ok: false };
}

// ─────────────────────────────────────────────────────────────
// 로케일 (src/locales/{ko,en}.ts → 평탄화된 키)
// ─────────────────────────────────────────────────────────────
function literalToJs(node) {
    if (!node) return undefined;
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isTemplateExpression(node)) return node.getText().slice(1, -1);
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalToJs);
    if (ts.isObjectLiteralExpression(node)) {
        const o = {};
        for (const p of node.properties) if (ts.isPropertyAssignment(p)) o[p.name.getText().replace(/^["']|["']$/g, "")] = literalToJs(p.initializer);
        return o;
    }
    if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression?.(node)) return literalToJs(node.expression);
    return undefined;
}
function loadLocale(lang) {
    const file = path.join(SRC, "locales", `${lang}.ts`);
    if (!fs.existsSync(file)) return {};
    const sf = getSf(file);
    for (const st of sf.statements)
        if (ts.isVariableStatement(st))
            for (const d of st.declarationList.declarations) if (d.initializer && ts.isObjectLiteralExpression(d.initializer)) return literalToJs(d.initializer);
    return {};
}
function flatten(obj, prefix = "", out = {}) {
    for (const [k, v] of Object.entries(obj || {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
        else out[key] = v;
    }
    return out;
}
const locales = { ko: flatten(loadLocale("ko")), en: flatten(loadLocale("en")) };
const localeHas = (lang, key) => Object.prototype.hasOwnProperty.call(locales[lang], key) || Object.keys(locales[lang]).some((k) => k.startsWith(key + "."));

// ─────────────────────────────────────────────────────────────
// 이름 해석 (스코프 → 로컬 선언 / props / import)
// ─────────────────────────────────────────────────────────────
function bindingHas(nameNode, name) {
    if (ts.isIdentifier(nameNode)) return nameNode.text === name;
    if (ts.isObjectBindingPattern(nameNode) || ts.isArrayBindingPattern(nameNode))
        return nameNode.elements.some((el) => ts.isBindingElement(el) && bindingHas(el.name, name));
    return false;
}
const unwrapFn = (init) => {
    if (!init) return null;
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
    // useCallback(fn, deps) / useMemo(() => fn) / debounce(fn)
    if (ts.isCallExpression(init) && init.arguments[0] && (ts.isArrowFunction(init.arguments[0]) || ts.isFunctionExpression(init.arguments[0]))) return init.arguments[0];
    if (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) return unwrapFn(init.expression);
    return null;
};

function resolveName(name, fromNode) {
    for (let a = fromNode.parent; a; a = a.parent) {
        const stmts = ts.isBlock(a) || ts.isSourceFile(a) || ts.isModuleBlock(a) || ts.isCaseClause(a) ? a.statements : null;
        if (stmts) {
            for (const st of stmts) {
                if (ts.isFunctionDeclaration(st) && st.name?.text === name) return { kind: "fn", node: st };
                if (ts.isVariableStatement(st))
                    for (const d of st.declarationList.declarations) {
                        if (ts.isIdentifier(d.name) && d.name.text === name) {
                            const fn = unwrapFn(d.initializer);
                            return fn ? { kind: "fn", node: fn } : { kind: "value", node: d };
                        }
                        if (bindingHas(d.name, name)) return { kind: "hook", node: d };
                    }
                if (ts.isImportDeclaration(st) && st.importClause && ts.isStringLiteral(st.moduleSpecifier)) {
                    const ic = st.importClause;
                    if (ic.name?.text === name) return { kind: "import", spec: st.moduleSpecifier.text, imported: "default", file: st.getSourceFile().fileName };
                    if (ic.namedBindings && ts.isNamedImports(ic.namedBindings))
                        for (const el of ic.namedBindings.elements)
                            if (el.name.text === name) return { kind: "import", spec: st.moduleSpecifier.text, imported: (el.propertyName || el.name).text, file: st.getSourceFile().fileName };
                }
            }
        }
        if (ts.isFunctionLike(a) && a.parameters) for (const p of a.parameters) if (bindingHas(p.name, name)) return { kind: "prop", node: p };
    }
    return null;
}

function findExport(file, name) {
    const sf = getSf(file);
    for (const st of sf.statements) {
        const exported = st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        const isDefault = st.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
        if (ts.isFunctionDeclaration(st) && exported && ((name === "default" && isDefault) || st.name?.text === name)) return st;
        if (ts.isVariableStatement(st) && exported)
            for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) return unwrapFn(d.initializer) || d;
        if (ts.isExportAssignment(st) && name === "default" && ts.isIdentifier(st.expression)) return findLocalTop(sf, st.expression.text);
    }
    // export { a as b }
    for (const st of sf.statements)
        if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause) && !st.moduleSpecifier)
            for (const el of st.exportClause.elements) if (el.name.text === name) return findLocalTop(sf, (el.propertyName || el.name).text);
    return null;
}
function findLocalTop(sf, name) {
    for (const st of sf.statements) {
        if (ts.isFunctionDeclaration(st) && st.name?.text === name) return st;
        if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) return unwrapFn(d.initializer) || d;
    }
    return null;
}
const isUseServer = (file) => {
    const sf = getSf(file);
    const first = sf.statements[0];
    return !!first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === "use server";
};

// ─────────────────────────────────────────────────────────────
// 효과(effect) 추출 — 핸들러가 실제로 하는 일
// ─────────────────────────────────────────────────────────────
function urlsFromExpr(node) {
    if (node && ts.isParenthesizedExpression(node)) return urlsFromExpr(node.expression);
    if (node && ts.isConditionalExpression(node)) return [...urlsFromExpr(node.whenTrue), ...urlsFromExpr(node.whenFalse)];
    const u = urlFromExpr(node);
    return u ? [u] : [];
}
function urlFromExpr(node, depth = 0) {
    if (!node) return null;
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isIdentifier(node) && depth < 3) {
        const r = resolveName(node.text, node);
        if (r?.kind === "value" && r.node.initializer) return urlFromExpr(r.node.initializer, depth + 1);
        return null;
    }
    if (ts.isConditionalExpression(node)) return urlFromExpr(node.whenTrue, depth + 1);
    if (ts.isTemplateExpression(node)) {
        let s = node.head.text;
        for (const span of node.templateSpans) {
            const e = span.expression.getText();
            s += (/SUPABASE_URL/.test(e) ? "{SUPABASE}" : /SITE_URL|origin|baseUrl|BASE_URL/i.test(e) ? "" : ":param") + span.literal.text;
        }
        return s;
    }
    if (ts.isNewExpression(node) && node.expression.getText() === "URL" && node.arguments?.[0]) return urlFromExpr(node.arguments[0]);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const l = urlFromExpr(node.left);
        return l ? l + ":param" : null;
    }
    if (ts.isParenthesizedExpression(node)) return urlFromExpr(node.expression);
    return null;
}
function methodFromOpts(opts) {
    if (!opts || !ts.isObjectLiteralExpression(opts)) return "GET";
    const m = opts.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === "method");
    if (m && ts.isPropertyAssignment(m) && ts.isStringLiteralLike(m.initializer)) return m.initializer.text.toUpperCase();
    return m ? "DYNAMIC" : "GET";
}
function chainFind(expr, name) {
    // a.b().c().from('x').select() 에서 .from(...) 호출 찾기
    for (let e = expr; e; ) {
        if (ts.isCallExpression(e)) {
            if (ts.isPropertyAccessExpression(e.expression) && e.expression.name.text === name) return e;
            e = e.expression;
        } else if (ts.isPropertyAccessExpression(e) || ts.isNonNullExpression(e) || ts.isParenthesizedExpression(e)) e = e.expression;
        else if (ts.isAwaitExpression(e)) e = e.expression;
        else break;
    }
    return null;
}
const DB_OPS = new Set(["select", "insert", "update", "upsert", "delete"]);
const STORAGE_OPS = new Set(["upload", "remove", "list", "download", "getPublicUrl", "move", "copy", "createSignedUrl", "update"]);
const EXPORT_RE = /^(writeFile|writeFileXLSX|saveAs|toPng|toBlob|toJpeg|toSvg|html2canvas|writeBuffer|download|downloadFile|exportTo\w*|export\w*(Excel|Xlsx|Pptx|Image|Csv))$/i;

const MAX_DEPTH = 8;

function collectEffects(root, ctx = { depth: 0, visited: new Set(), server: false }) {
    const out = new Map();
    const add = (e) => {
        const key = effectKey(e);
        if (!out.has(key)) out.set(key, e);
    };
    const recurseInto = (fnNode, server) => {
        const id = `${fnNode.getSourceFile().fileName}:${fnNode.pos}`;
        if (ctx.visited.has(id) || ctx.depth >= MAX_DEPTH) return;
        ctx.visited.add(id);
        const sub = collectEffects(fnNode, { depth: ctx.depth + 1, visited: ctx.visited, server: server || ctx.server });
        for (const e of sub) add(e);
    };
    const followIdentifier = (idNode) => {
        const r = resolveName(idNode.text, idNode);
        if (!r) return;
        if (r.kind === "fn") recurseInto(r.node, false);
        else if (r.kind === "prop") add({ kind: "prop-callback", name: idNode.text, owner: enclosingComponent(idNode) });
        else if (r.kind === "import") {
            const f = resolveModule(r.spec, r.file);
            if (!f) return;
            const server = isUseServer(f);
            if (server) add({ kind: "server-action", name: r.imported, module: rel(f) });
            const target = findExport(f, r.imported);
            if (target && (ts.isFunctionLike(target) || ts.isFunctionDeclaration(target))) recurseInto(target, server);
        }
    };

    const visit = (n) => {
        if (ts.isCallExpression(n)) {
            const callee = n.expression;
            const calleeText = callee.getText();
            const lastName = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : "";

            if (lastName === "fetch" && (ts.isIdentifier(callee) || /^(window|globalThis)\.fetch$/.test(calleeText))) {
                const urls = urlsFromExpr(n.arguments[0]);
                for (const url of urls.length ? urls : [null]) add({ kind: "fetch", url: url ?? `<${squash(n.arguments[0]?.getText() ?? "?", 40)}>`, method: methodFromOpts(n.arguments[1]), server: ctx.server || undefined });
            } else if (DB_OPS.has(lastName) || STORAGE_OPS.has(lastName)) {
                const fromCall = chainFind(callee.expression ?? callee, "from");
                if (fromCall && fromCall.arguments[0] && ts.isStringLiteralLike(fromCall.arguments[0])) {
                    const isStorage = /\.storage\s*\.from$/.test(fromCall.expression.getText().replace(/\s+/g, ""));
                    if (isStorage && STORAGE_OPS.has(lastName)) add({ kind: "storage", bucket: fromCall.arguments[0].text, op: lastName });
                    else if (!isStorage && DB_OPS.has(lastName)) add({ kind: "db", table: fromCall.arguments[0].text, op: lastName, server: ctx.server || undefined });
                }
            } else if (lastName === "rpc" && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
                add({ kind: "rpc", name: n.arguments[0].text });
            } else if (/\.auth\.(signInWithPassword|signOut|signUp|getUser|getSession|resetPasswordForEmail)$/.test(calleeText)) {
                if (lastName !== "getUser" && lastName !== "getSession") add({ kind: "auth", op: lastName });
            } else if (lastName === "channel" && /supabase/i.test(calleeText)) {
                add({ kind: "realtime", channel: n.arguments[0] ? squash(n.arguments[0].getText(), 40) : "?" });
            } else if (/^router\.(push|replace)$/.test(calleeText) || /^(redirect|permanentRedirect|NextResponse\.redirect)$/.test(calleeText) || /^(window\.)?location\.(assign|replace)$/.test(calleeText)) {
                const urls = urlsFromExpr(n.arguments[0]);
                for (const u of urls.length ? urls : [`<${squash(n.arguments[0]?.getText() ?? "?", 40)}>`]) add({ kind: "nav", target: u, via: calleeText });
            } else if (/^(router\.(back|refresh)|(window\.)?location\.reload|(window\.)?history\.back)$/.test(calleeText)) {
                add({ kind: "nav", target: `<${calleeText}>`, via: calleeText });
            } else if (/^window\.open$/.test(calleeText)) {
                add({ kind: "open-window", target: urlFromExpr(n.arguments[0]) ?? `<${squash(n.arguments[0]?.getText() ?? "?", 40)}>` });
            } else if (/(scrollIntoView|scrollTo|scrollBy)$/.test(lastName)) {
                add({ kind: "scroll" });
            } else if (/clipboard\.write(Text)?$/.test(calleeText)) {
                add({ kind: "clipboard" });
            } else if (/^(window\.)?print$/.test(calleeText)) {
                add({ kind: "print" });
            } else if (/^(window\.)?(confirm|alert|prompt)$/.test(calleeText)) {
                add({ kind: "dialog", type: lastName });
            } else if (/(^|\.)gtag$/.test(calleeText)) {
                add({ kind: "analytics", event: n.arguments[1] && ts.isStringLiteralLike(n.arguments[1]) ? n.arguments[1].text : "?" });
            } else if (/localStorage\.(setItem|removeItem)$/.test(calleeText) || /sessionStorage\.(setItem|removeItem)$/.test(calleeText)) {
                add({ kind: "local-storage", key: n.arguments[0] && ts.isStringLiteralLike(n.arguments[0]) ? n.arguments[0].text : "?" });
            } else if (EXPORT_RE.test(lastName)) {
                add({ kind: "export", via: calleeText });
            } else if (/^(new\s+)?Notification|requestPermission$|pushManager\.subscribe$/.test(calleeText)) {
                add({ kind: "push-permission" });
            } else if (/^set[A-Z]\w*$/.test(lastName) && ts.isIdentifier(callee)) {
                const r = resolveName(lastName, callee);
                if (!r || r.kind === "hook") add({ kind: "state", name: lastName.slice(3) });
                else followIdentifier(callee);
            } else if (ts.isIdentifier(callee)) {
                // scrollToSection('tours') 처럼 스크롤 헬퍼에 문자열을 넘기면 #앵커 이동으로 기록
                const r = resolveName(callee.text, callee);
                if (r?.kind === "fn" && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0]) && /scrollIntoView|scrollTo|getElementById/.test(r.node.getText()))
                    add({ kind: "anchor", target: "#" + n.arguments[0].text });
                followIdentifier(callee);
            }
            // 인자로 넘긴 함수 (handleSubmit(onSubmit), startTransition(fn) …)
            for (const a of n.arguments) {
                if (!ts.isIdentifier(a)) continue;
                const r = resolveName(a.text, a);
                if (r && (r.kind === "fn" || r.kind === "import")) followIdentifier(a);
            }
        } else if (ts.isNewExpression(n) && /^(ExcelJS\.Workbook|Workbook|PptxGenJS|pptxgen)$/.test(n.expression.getText())) {
            add({ kind: "export", via: `new ${n.expression.getText()}` });
        } else if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            const lhs = n.left.getText();
            if (/^(window\.)?location(\.href)?$/.test(lhs)) {
                const urls = urlsFromExpr(n.right);
                for (const u of urls.length ? urls : [`<${squash(n.right.getText(), 40)}>`]) add({ kind: "nav", target: u, via: "location.href" });
            }
            if (/document\.cookie$/.test(lhs)) add({ kind: "cookie" });
            if (/\.download$/.test(lhs)) add({ kind: "export", via: "a.download" });
        } else if (ts.isJsxAttribute(n) && n.name.getText() === "download") {
            add({ kind: "export", via: "a[download]" });
        }
        ts.forEachChild(n, visit);
    };
    if (ts.isFunctionLike(root) && root.body) visit(root.body);
    else visit(root);
    return [...out.values()];
}

function effectKey(e) {
    switch (e.kind) {
        case "fetch":
            return `fetch ${e.method} ${normalizeUrl(e.url)}`;
        case "db":
            return `db ${e.table}.${e.op}`;
        case "storage":
            return `storage ${e.bucket}.${e.op}`;
        case "rpc":
            return `rpc ${e.name}`;
        case "auth":
            return `auth ${e.op}`;
        case "realtime":
            return `realtime ${e.channel}`;
        case "nav":
            return `nav ${normalizeUrl(e.target)}`;
        case "open-window":
            return `open ${normalizeUrl(e.target)}`;
        case "server-action":
            return `action ${e.name}`;
        case "state":
            return `state ${e.name}`;
        case "prop-callback":
            return `prop ${e.name}`;
        case "dialog":
            return `dialog ${e.type}`;
        case "analytics":
            return `analytics ${e.event}`;
        case "local-storage":
            return `localStorage ${e.key}`;
        case "export":
            return `export`;
        case "anchor":
            return `anchor ${e.target}`;
        case "external":
            return `external ${normalizeUrl(e.target)}`;
        case "scroll":
            return "scroll";
        default:
            return e.kind;
    }
}
function normalizeUrl(u) {
    if (!u) return "?";
    let s = String(u);
    if (s.startsWith("<")) return s;
    s = s.replace(/^https?:\/\/(www\.)?/, (m) => m); // 외부 URL은 그대로
    if (s.startsWith("/")) s = s.split("?")[0].split("#")[0] || "/";
    else if (/^https?:/.test(s)) {
        try {
            const url = new URL(s.replace(/:param/g, "x"));
            s = `${url.origin}${url.pathname}`.replace(/\/x(?=\/|$)/g, "/:param");
        } catch {
            /* keep */
        }
    }
    return s;
}
/** 비교·요약용: "의미 있는" 효과만 (상태 변경·prop 콜백 제외) */
const MEANINGFUL = new Set(["fetch", "db", "storage", "rpc", "auth", "nav", "open-window", "server-action", "clipboard", "print", "export", "cookie", "push-permission", "local-storage", "analytics"]);

// ─────────────────────────────────────────────────────────────
// JSX 인터랙티브 요소 추출
// ─────────────────────────────────────────────────────────────
const EVENT_ATTRS = ["onClick", "onMouseDown", "onPointerDown", "onTouchEnd", "onSubmit", "onDoubleClick", "onContextMenu", "onDrop", "onDragEnd", "onDragStart", "onChange", "onValueChange", "onSelect", "onCheckedChange", "onKeyDown", "onConfirm", "onSave", "onDelete", "onClose"];
const NATIVE_FIELDS = new Set(["input", "select", "textarea"]);
const LUCIDE_HINT = /^[A-Z][A-Za-z0-9]*$/;

function attrsOf(opening) {
    const map = new Map();
    let spread = false;
    for (const p of opening.attributes.properties) {
        if (ts.isJsxSpreadAttribute(p)) spread = true;
        else map.set(p.name.getText(), p.initializer ?? null);
    }
    return { map, spread };
}
function attrString(init) {
    if (!init) return true;
    if (ts.isStringLiteral(init)) return init.text;
    if (ts.isJsxExpression(init) && init.expression) {
        const e = init.expression;
        if (ts.isStringLiteralLike(e)) return e.text;
        return { expr: e };
    }
    return null;
}

function tKeyOf(call) {
    if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== "t") return null;
    const a = call.arguments[0];
    if (!a) return null;
    if (ts.isStringLiteralLike(a)) return a.text;
    if (ts.isTemplateExpression(a)) return a.head.text + "*";
    return null;
}

function labelOf(el) {
    const parts = [];
    const icons = [];
    const visit = (n, depth = 0) => {
        if (depth > 6 || parts.join(" ").length > 120) return;
        if (ts.isJsxText(n)) {
            const s = n.getText().replace(/\s+/g, " ").trim();
            if (s) parts.push(s);
            return;
        }
        if (ts.isJsxExpression(n) && n.expression) {
            const e = n.expression;
            const key = tKeyOf(e);
            if (key) {
                const ko = locales.ko[key];
                parts.push(typeof ko === "string" && ko ? ko : `{t:${key}}`);
                return;
            }
            if (ts.isStringLiteralLike(e)) {
                parts.push(e.text);
                return;
            }
            if (ts.isConditionalExpression(e)) {
                const alts = [e.whenTrue, e.whenFalse].map((x) => (ts.isStringLiteralLike(x) ? x.text : tKeyOf(x) ? locales.ko[tKeyOf(x)] ?? `{t:${tKeyOf(x)}}` : null)).filter(Boolean);
                if (alts.length) {
                    parts.push(alts.join(" / "));
                    return;
                }
            }
            if (ts.isIdentifier(e) || ts.isPropertyAccessExpression(e)) {
                parts.push(`{${squash(e.getText(), 30)}}`);
                return;
            }
            ts.forEachChild(e, (c) => visit(c, depth + 1));
            return;
        }
        if (ts.isJsxSelfClosingElement(n) || ts.isJsxElement(n)) {
            const op = ts.isJsxElement(n) ? n.openingElement : n;
            const tag = op.tagName.getText();
            const { map } = attrsOf(op);
            const aria = map.get("aria-label") ?? map.get("alt") ?? map.get("title");
            const s = aria !== undefined ? attrString(aria) : null;
            if (typeof s === "string" && s) parts.push(s);
            else if (LUCIDE_HINT.test(tag) && ts.isJsxSelfClosingElement(n)) icons.push(tag);
            if (ts.isJsxElement(n)) for (const c of n.children) visit(c, depth + 1);
            return;
        }
        ts.forEachChild(n, (c) => visit(c, depth + 1));
    };
    const op = ts.isJsxElement(el) ? el.openingElement : el;
    const { map } = attrsOf(op);
    for (const a of ["aria-label", "title", "value", "placeholder"]) {
        const s = map.has(a) ? attrString(map.get(a)) : null;
        if (typeof s === "string" && s) {
            parts.push(s);
            break;
        }
        if (s && typeof s === "object") {
            const k = tKeyOf(s.expr);
            if (k) {
                parts.push(locales.ko[k] ?? `{t:${k}}`);
                break;
            }
        }
    }
    if (ts.isJsxElement(el)) for (const c of el.children) visit(c);
    const text = squash([...new Set(parts)].join(" "), 80);
    const hasAccessibleName = parts.length > 0;
    return { text: text || (icons.length ? `[icon:${icons.slice(0, 2).join("+")}]` : ""), icons, hasAccessibleName };
}

function enclosingComponent(node) {
    for (let a = node.parent; a; a = a.parent) {
        if (ts.isFunctionDeclaration(a) && a.name && /^[A-Z]/.test(a.name.text)) return a.name.text;
        if (ts.isVariableDeclaration(a) && ts.isIdentifier(a.name) && /^[A-Z]/.test(a.name.text)) return a.name.text;
    }
    return null;
}
function insideForm(node) {
    for (let a = node.parent; a; a = a.parent) {
        const op = ts.isJsxElement(a) ? a.openingElement : null;
        if (op && op.tagName.getText() === "form") return true;
    }
    return false;
}

function hrefsOf(init) {
    const s = attrString(init);
    if (s && typeof s === "object") {
        const urls = urlsFromExpr(s.expr);
        if (urls.length) return urls;
    }
    const one = hrefOf(init);
    return one ? [one] : [];
}
function formSubmitEffects(node) {
    for (let a = node.parent; a; a = a.parent) {
        if (ts.isJsxElement(a) && a.openingElement.tagName.getText() === "form") {
            const init = attrsOf(a.openingElement).map.get("onSubmit");
            const expr = init && ts.isJsxExpression(init) ? init.expression : null;
            if (!expr) return [];
            if (ts.isIdentifier(expr)) {
                const r = resolveName(expr.text, expr);
                return r?.kind === "fn" ? collectEffects(r.node, { depth: 0, visited: new Set(), server: false }) : [];
            }
            return collectEffects(expr, { depth: 0, visited: new Set(), server: false });
        }
    }
    return [];
}
function hrefOf(init) {
    const s = attrString(init);
    if (typeof s === "string") return s;
    if (s && typeof s === "object") {
        const u = urlFromExpr(s.expr);
        if (u) return u;
        if (ts.isObjectLiteralExpression(s.expr)) {
            const p = s.expr.properties.find((pp) => ts.isPropertyAssignment(pp) && pp.name.getText() === "pathname");
            if (p && ts.isPropertyAssignment(p)) return urlFromExpr(p.initializer) ?? `<${squash(p.initializer.getText(), 40)}>`;
        }
        return `<${squash(s.expr.getText(), 40)}>`;
    }
    return null;
}

const elementsByFile = new Map();
const idsByFile = new Map();
const tKeysByFile = new Map();

function extractFile(abs) {
    const sf = getSf(abs);
    const elements = [];
    const ids = new Set();
    const tKeys = new Map();
    const visit = (n) => {
        if (ts.isCallExpression(n)) {
            const k = tKeyOf(n);
            if (k) tKeys.set(k, lineOf(n));
        }
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
            const op = ts.isJsxElement(n) ? n.openingElement : n;
            const tag = op.tagName.getText();
            const { map, spread } = attrsOf(op);
            const idAttr = map.has("id") ? attrString(map.get("id")) : null;
            if (typeof idAttr === "string") ids.add(idAttr);
            const events = EVENT_ATTRS.filter((a) => map.has(a));
            const isLink = (tag === "a" || tag === "Link") && map.has("href");
            const isNativeButton = tag === "button" || (tag === "input" && ["submit", "button"].includes(attrString(map.get("type"))));
            const isForm = tag === "form";
            const isField = NATIVE_FIELDS.has(tag) && !isNativeButton;
            if (isLink || isNativeButton || isForm || events.length) {
                const typeAttr = map.has("type") ? attrString(map.get("type")) : null;
                const handlers = {};
                const effects = new Map();
                for (const ev of events) {
                    const init = map.get(ev);
                    const expr = init && ts.isJsxExpression(init) ? init.expression : null;
                    if (!expr) continue;
                    handlers[ev] = squash(expr.getText(), 70);
                    let found;
                    if (ts.isIdentifier(expr)) {
                        const r = resolveName(expr.text, expr);
                        if (r?.kind === "fn") found = collectEffects(r.node, { depth: 0, visited: new Set(), server: false });
                        else if (r?.kind === "prop") found = [{ kind: "prop-callback", name: expr.text, owner: enclosingComponent(expr) }];
                        else found = collectEffects(expr, { depth: 0, visited: new Set(), server: false });
                    } else found = collectEffects(expr, { depth: 0, visited: new Set(), server: false });
                    for (const e of found) effects.set(effectKey(e), e);
                }
                let href = null;
                if (isLink) {
                    const hrefs = hrefsOf(map.get("href"));
                    href = hrefs.join(" | ") || null;
                    for (const h of hrefs) {
                        if (h.startsWith("<")) continue;
                        const e = /^(https?:|mailto:|tel:|sms:|kakao)/.test(h) ? { kind: "external", target: h } : h.startsWith("#") ? { kind: "anchor", target: h } : { kind: "nav", target: h, via: tag };
                        effects.set(effectKey(e), e);
                    }
                }
                // submit 버튼은 감싼 <form onSubmit> 의 효과를 물려받는다
                if (isNativeButton && !map.has("onClick") && (typeAttr === "submit" || (!typeAttr && insideForm(n)))) {
                    for (const e of formSubmitEffects(n)) effects.set(effectKey(e), e);
                }
                const label = labelOf(n);
                let kind = isLink ? "link" : isForm ? "form" : isNativeButton ? "button" : isField ? "field" : /^[a-z]/.test(tag) ? "clickable" : "component";
                if (kind === "component" && events.some((e) => e === "onClick")) kind = "button";
                const onlyChange = events.length && events.every((e) => ["onChange", "onValueChange", "onKeyDown", "onSelect", "onCheckedChange"].includes(e));
                if ((kind === "component" || kind === "clickable") && onlyChange) kind = "field";
                elements.push({
                    file: rel(abs),
                    line: lineOf(op),
                    component: enclosingComponent(n),
                    tag,
                    kind,
                    label: label.text,
                    hasAccessibleName: label.hasAccessibleName,
                    href,
                    type: typeof typeAttr === "string" ? typeAttr : null,
                    inForm: isNativeButton ? insideForm(n) : undefined,
                    spread,
                    handlers,
                    effects: [...effects.values()],
                    disabledAttr: map.has("disabled") || undefined,
                });
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(sf);
    elementsByFile.set(abs, elements);
    idsByFile.set(abs, ids);
    tKeysByFile.set(abs, tKeys);
}
for (const f of sourceFiles) if (f.endsWith(".tsx") || f.endsWith(".ts")) extractFile(f);

// ─────────────────────────────────────────────────────────────
// 컴포넌트 경계 넘기: <CurrencySelectModal onSelect={processPayment}> 이면
// CurrencySelectModal 안에서 onSelect(...) 를 부르는 버튼에 processPayment 의 효과를 붙인다
// ─────────────────────────────────────────────────────────────
const usageEffects = new Map(); // "Component.prop" → Map<effectKey, effect>
for (const abs of sourceFiles) {
    if (!abs.endsWith(".tsx")) continue;
    const visit = (n) => {
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
            const op = ts.isJsxElement(n) ? n.openingElement : n;
            const tag = op.tagName.getText().split(".").pop();
            if (/^[A-Z]/.test(tag)) {
                for (const p of op.attributes.properties) {
                    if (!ts.isJsxAttribute(p) || !p.initializer || !ts.isJsxExpression(p.initializer) || !p.initializer.expression) continue;
                    const expr = p.initializer.expression;
                    let effs = null;
                    if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) effs = collectEffects(expr, { depth: 0, visited: new Set(), server: false });
                    else if (ts.isIdentifier(expr)) {
                        const r = resolveName(expr.text, expr);
                        if (r?.kind === "fn") effs = collectEffects(r.node, { depth: 0, visited: new Set(), server: false });
                        else if (r?.kind === "prop") effs = [{ kind: "prop-callback", name: expr.text, owner: enclosingComponent(expr) }];
                        else if (r?.kind === "import") effs = collectEffects(expr, { depth: 0, visited: new Set(), server: false });
                    }
                    if (!effs?.length) continue;
                    const key = `${tag}.${p.name.getText()}`;
                    if (!usageEffects.has(key)) usageEffects.set(key, new Map());
                    for (const e of effs) usageEffects.get(key).set(effectKey(e), e);
                }
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(getSf(abs));
}
function expandProp(owner, name, depth = 0, seen = new Set()) {
    const key = `${owner}.${name}`;
    if (!owner || depth > 5 || seen.has(key)) return [];
    seen.add(key);
    const out = [];
    for (const e of usageEffects.get(key)?.values() || []) {
        if (e.kind === "prop-callback") out.push(...expandProp(e.owner, e.name, depth + 1, seen));
        else out.push({ ...e, viaProp: key });
    }
    return out;
}
for (const list of elementsByFile.values()) {
    for (const el of list) {
        const extra = [];
        for (const e of el.effects) if (e.kind === "prop-callback") extra.push(...expandProp(e.owner || el.component, e.name));
        const seen = new Set(el.effects.map(effectKey));
        for (const e of extra) {
            if (seen.has(effectKey(e))) continue;
            seen.add(effectKey(e));
            el.effects.push(e);
        }
    }
}

// 파일 전체 효과(로드 시 데이터 조회 포함)
const fileEffects = new Map();
for (const f of sourceFiles) fileEffects.set(f, collectEffects(getSf(f), { depth: 0, visited: new Set(), server: isUseServer(f) }));

// ─────────────────────────────────────────────────────────────
// 페이지 단위 조립
// ─────────────────────────────────────────────────────────────
const fileToPages = new Map();
const pages = {};
for (const p of pageRoutes) {
    const files = closure([p.file, ...p.layouts]);
    for (const f of files) {
        if (!fileToPages.has(f)) fileToPages.set(f, new Set());
        fileToPages.get(f).add(p.route);
    }
    const caps = new Set();
    const tKeys = new Set();
    for (const f of files) {
        for (const e of fileEffects.get(f) || []) if (MEANINGFUL.has(e.kind)) caps.add(effectKey(e));
        for (const k of tKeysByFile.get(f)?.keys() || []) tKeys.add(k);
    }
    pages[p.route] = {
        surface: p.surface,
        file: rel(p.file),
        layouts: p.layouts.map(rel),
        files: [...files].map(rel).sort(),
        capabilities: [...caps].sort(),
        localeKeys: [...tKeys].sort(),
    };
}

// 요소에 라우트/서피스 붙이기
const elements = [];
for (const [abs, list] of elementsByFile) {
    const routes = [...(fileToPages.get(abs) || [])].sort();
    const surfaces = [...new Set(routes.map(surfaceOf))].sort();
    for (const el of list) elements.push({ ...el, routes, surfaces });
}
elements.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

// API 라우트 효과
const apiInventory = apiRoutes.map((a) => {
    const sf = getSf(a.file);
    const perMethod = {};
    for (const m of a.methods) {
        const node = findExport(a.file, m);
        perMethod[m] = node ? collectEffects(node, { depth: 0, visited: new Set(), server: true }).filter((e) => MEANINGFUL.has(e.kind) || e.kind === "db").map(effectKey) : [];
    }
    const text = sf.getFullText();
    const auth = [
        /CRON_SECRET/.test(text) && "cron-secret",
        /auth\.getUser|getUser\(\)/.test(text) && "supabase-session",
        /constructEvent|stripe-signature/i.test(text) && "stripe-signature",
        /agency_session|jwt\.verify/.test(text) && "agency-jwt",
    ].filter(Boolean);
    return { route: a.route, file: rel(a.file), methods: a.methods, auth, effects: perMethod };
});

// ─────────────────────────────────────────────────────────────
// 검사
// ─────────────────────────────────────────────────────────────
const issues = [];
const issue = (severity, code, loc, message) => issues.push({ severity, code, where: loc, message });

for (const el of elements) {
    const loc = `${el.file}:${el.line}`;
    const reachable = el.routes.length > 0;
    // 링크 대상
    for (const e of el.effects) {
        const target = e.kind === "nav" ? e.target : null;
        if (target && target.startsWith("/") && !target.startsWith("//")) {
            const r = resolveInternalPath(target);
            if (!r.ok) issue("error", "broken-link", loc, `"${el.label || el.tag}" → ${target} (해당 페이지/파일 없음)`);
        }
        if (e.kind === "fetch" && e.url?.startsWith("/api/")) {
            const p = e.url.split("?")[0].replace(/:param/g, "x");
            const api = apiMatchers.find((m) => m.re.test(p));
            if (!api) issue("error", "missing-api", loc, `"${el.label || el.tag}" → ${e.method} ${e.url} (API 라우트 없음)`);
            else if (!["DYNAMIC"].includes(e.method) && !api.methods.includes(e.method)) issue("error", "missing-api-method", loc, `"${el.label || el.tag}" → ${e.method} ${api.route} (라우트에 ${e.method} 핸들러 없음: ${api.methods.join(",")})`);
        }
        if (e.kind === "anchor" && e.target.length > 1 && reachable) {
            const id = decodeURIComponent(e.target.slice(1));
            const pagesHere = el.routes;
            const found = pagesHere.some((r) => pages[r].files.some((f) => idsByFile.get(path.join(ROOT, f))?.has(id)));
            if (!found) issue("warn", "missing-anchor", loc, `"${el.label}" → #${id} (같은 페이지에 id="${id}" 없음)`);
        }
    }
    if (el.kind === "button" && el.tag === "button" && !el.spread) {
        const hasClick = ["onClick", "onMouseDown", "onPointerDown", "onTouchEnd"].some((h) => el.handlers[h]);
        const submits = el.type === "submit" || (!el.type && el.inForm);
        if (!hasClick && !submits) issue("warn", "dead-button", loc, `<button> "${el.label}" 에 onClick 도 없고 폼 submit 도 아님`);
        if (hasClick && /^\(\)\s*=>\s*\{\s*\}$/.test(el.handlers.onClick)) issue("warn", "empty-handler", loc, `"${el.label}" onClick 이 빈 함수`);
    }
    if ((el.kind === "button" || el.kind === "link") && /^(button|a|Link)$/.test(el.tag) && !el.hasAccessibleName && !el.spread)
        issue("info", "no-accessible-name", loc, `${el.tag} ${el.label || "(내용 없음)"} — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움`);
    if (el.kind === "clickable" && el.handlers.onClick && reachable && el.surfaces.includes("customer"))
        issue("info", "non-semantic-click", loc, `<${el.tag}> 에 onClick — 키보드로 누를 수 없음 ("${el.label}")`);
}

// 파일 전체 fetch (핸들러 밖, 예: useEffect 로드) 도 API 존재 확인
for (const [abs, effs] of fileEffects) {
    for (const e of effs) {
        if (e.kind === "fetch" && e.url?.startsWith("/api/")) {
            const p = e.url.split("?")[0].replace(/:param/g, "x");
            const api = apiMatchers.find((m) => m.re.test(p));
            if (!api) issue("error", "missing-api", rel(abs), `${e.method} ${e.url} (API 라우트 없음)`);
            else if (e.method !== "DYNAMIC" && !api.methods.includes(e.method)) issue("error", "missing-api-method", rel(abs), `${e.method} ${api.route} (핸들러: ${api.methods.join(",")})`);
        }
        if (e.kind === "nav" && e.target?.startsWith("/") && !resolveInternalPath(e.target).ok) issue("error", "broken-link", rel(abs), `이동 대상 ${e.target} 없음 (${e.via})`);
    }
}

// 로케일 키
const missingLocale = [];
for (const [abs, keys] of tKeysByFile) {
    for (const [k, line] of keys) {
        if (k.endsWith("*")) continue;
        for (const lang of ["ko", "en"]) if (!localeHas(lang, k)) missingLocale.push({ key: k, lang, where: `${rel(abs)}:${line}` });
    }
}
{
    const byKey = new Map();
    for (const m of missingLocale) byKey.set(m.key + "@" + m.where, [...(byKey.get(m.key + "@" + m.where) || []), m]);
    for (const list of byKey.values()) {
        const m = list[0];
        const langs = list.map((x) => x.lang);
        // 두 언어 모두 없으면 무조건 노출, 한쪽만 없으면 그 언어 분기에서만 노출
        issue(langs.length === 2 ? "error" : "warn", "missing-locale-key", m.where, `t("${m.key}") 가 ${langs.map((l) => l + ".ts").join("·")} 에 없음 → 해당 언어 화면에 키 문자열이 그대로 노출될 수 있음`);
    }
}
const usedKeys = new Set([...tKeysByFile.values()].flatMap((m) => [...m.keys()]));
const usedPrefixes = [...usedKeys].filter((k) => k.endsWith("*")).map((k) => k.slice(0, -1));
const unusedLocale = Object.keys(locales.ko).filter((k) => !usedKeys.has(k) && !usedPrefixes.some((p) => k.startsWith(p)) && ![...usedKeys].some((u) => k.startsWith(u + ".")));

// 고아 파일(어떤 페이지·API 라우트에서도 import 되지 않음)
const serverReach = closure(apiRoutes.map((a) => a.file));
const orphanFiles = sourceFiles
    .filter((f) => (f.endsWith(".tsx") || f.includes(`${path.sep}components${path.sep}`)) && !fileToPages.has(f) && !serverReach.has(f))
    .filter((f) => !f.startsWith(path.join(APP, "api")) && !/[/\\](layout|not-found|page|route|sitemap|robots)\.tsx?$/.test(f) && !f.endsWith("middleware.ts") && !f.endsWith("proxy.ts"))
    .map(rel);

// ─────────────────────────────────────────────────────────────
// 인벤토리 저장
// ─────────────────────────────────────────────────────────────
let gitCommit = null;
try {
    gitCommit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
} catch {
    /* not a git checkout */
}

const inventory = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    gitCommit,
    routes: {
        pages: pageRoutes.map((p) => ({ route: p.route, surface: p.surface, file: rel(p.file) })),
        api: apiInventory,
        meta: metaRoutes,
        redirects,
    },
    pages,
    elements,
    locale: { koKeys: Object.keys(locales.ko).length, enKeys: Object.keys(locales.en).length, referenced: [...usedKeys].sort(), unused: unusedLocale },
    orphanFiles,
    issues,
};

// 서피스별 "기능 지도": 의미 있는 효과 → 그 효과를 일으키는 요소(라벨)들
function capabilityMap(inv) {
    const map = {};
    for (const el of inv.elements) {
        for (const s of el.surfaces) {
            for (const e of el.effects) {
                if (!MEANINGFUL.has(e.kind) && e.kind !== "external") continue;
                const key = effectKey(e);
                map[s] ??= {};
                map[s][key] ??= [];
                const lbl = el.label || `<${el.tag}>`;
                if (!map[s][key].includes(lbl)) map[s][key].push(lbl);
            }
        }
    }
    return map;
}
inventory.capabilityMap = capabilityMap(inventory);

fs.mkdirSync(REPORT_DIR, { recursive: true });
const outJson = option("--out") || path.join(REPORT_DIR, "ui-inventory.json");
fs.writeFileSync(outJson, JSON.stringify(inventory, null, 2));
fs.writeFileSync(path.join(REPORT_DIR, "ui-inventory.md"), renderMarkdown(inventory));

if (flag("--save-baseline")) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
    fs.writeFileSync(path.join(BASELINE_DIR, "ui-inventory.json"), JSON.stringify(inventory, null, 2));
    fs.writeFileSync(path.join(BASELINE_DIR, "ui-inventory.md"), renderMarkdown(inventory));
    console.log(`✔ 기준선 저장: qa/baseline/ui-inventory.{json,md} (commit ${gitCommit})`);
}

// ─────────────────────────────────────────────────────────────
// 요약 출력
// ─────────────────────────────────────────────────────────────
const count = (sev) => issues.filter((i) => i.severity === sev).length;
console.log(
    `페이지 ${pageRoutes.length} · API ${apiRoutes.length} · 인터랙티브 요소 ${elements.length} (버튼 ${elements.filter((e) => e.kind === "button").length}, 링크 ${elements.filter((e) => e.kind === "link").length}, 폼 ${elements.filter((e) => e.kind === "form").length})`,
);
console.log(`문제: error ${count("error")} · warn ${count("warn")} · info ${count("info")}  → qa/reports/ui-inventory.md`);
for (const i of issues.filter((x) => x.severity === "error")) console.log(`  ✖ [${i.code}] ${i.where}  ${i.message}`);
if (flag("--verbose")) for (const i of issues.filter((x) => x.severity === "warn")) console.log(`  ⚠ [${i.code}] ${i.where}  ${i.message}`);

let exitCode = count("error") > 0 && flag("--strict") ? 1 : 0;

// ─────────────────────────────────────────────────────────────
// 기준선 비교
// ─────────────────────────────────────────────────────────────
if (flag("--compare")) {
    const basePath = option("--compare") || path.join(BASELINE_DIR, "ui-inventory.json");
    if (!fs.existsSync(basePath)) {
        console.error(`기준선 파일이 없습니다: ${rel(basePath)} — 리뉴얼 전 커밋에서 --save-baseline 을 먼저 실행하세요.`);
        process.exit(2);
    }
    const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
    const expected = fs.existsSync(EXPECTED_CHANGES) ? JSON.parse(fs.readFileSync(EXPECTED_CHANGES, "utf8")) : {};
    const result = compare(base, inventory, expected);
    fs.writeFileSync(path.join(REPORT_DIR, "renewal-diff.md"), renderDiff(result, base, inventory));
    fs.writeFileSync(path.join(REPORT_DIR, "renewal-diff.json"), JSON.stringify(result, null, 2));
    const blocking = result.filter((r) => r.severity === "error" && !r.accepted);
    console.log(`\n기준선(${base.gitCommit}) 대비: 차단 ${blocking.length} · 승인된 변경 ${result.filter((r) => r.accepted).length} · 경고 ${result.filter((r) => r.severity === "warn" && !r.accepted).length} → qa/reports/renewal-diff.md`);
    for (const r of blocking) console.log(`  ✖ [${r.code}] ${r.surface ?? ""} ${r.subject} — ${r.message}`);
    if (blocking.length) exitCode = 1;
}

process.exit(exitCode);

// ═════════════════════════════════════════════════════════════
function compare(base, cur, expected) {
    const out = [];
    const accepted = (code, subject, surface) => {
        const list = expected.accept || [];
        const hit = list.find((a) => (!a.code || a.code === code) && (!a.surface || a.surface === surface) && (a.subject === subject || (a.subjectPrefix && subject.startsWith(a.subjectPrefix))));
        return hit ? hit.reason || "승인됨" : null;
    };
    const push = (severity, code, surface, subject, message) => {
        const acc = accepted(code, subject, surface);
        out.push({ severity, code, surface, subject, message, accepted: !!acc, reason: acc || undefined });
    };

    // 1) 라우트: 사라진 페이지는 리다이렉트가 있어야 한다
    const curRoutes = new Set(cur.routes.pages.map((p) => p.route));
    const curRedirect = (r) => (cur.routes.redirects || []).find((x) => routeToRegex(x.source).test(r.replace(/\[[^\]]+\]/g, "x")));
    for (const p of base.routes.pages) {
        if (curRoutes.has(p.route)) continue;
        const red = curRedirect(p.route);
        if (red) push("info", "route-redirected", p.surface, p.route, `→ ${red.destination} (${red.permanent ? "permanent" : "temporary"})`);
        else push("error", "route-removed", p.surface, p.route, "페이지가 사라졌고 next.config 리다이렉트도 없음 (북마크·QR·광고 링크 404)");
    }
    for (const p of cur.routes.pages) if (!base.routes.pages.some((b) => b.route === p.route)) push("info", "route-added", p.surface, p.route, "신규 페이지");

    // 2) API 라우트·메서드
    for (const a of base.routes.api) {
        const c = cur.routes.api.find((x) => x.route === a.route);
        if (!c) push("error", "api-removed", "api", a.route, "API 라우트가 사라짐");
        else for (const m of a.methods) if (!c.methods.includes(m)) push("error", "api-method-removed", "api", `${m} ${a.route}`, "메서드가 사라짐");
    }

    // 3) 버튼 ↔ 기능: 기준선에서 어떤 버튼이 일으키던 효과를, 지금도 같은 화면의 어떤 요소가 일으키는가
    const bm = base.capabilityMap || {};
    const cm = cur.capabilityMap || {};
    for (const [surface, caps] of Object.entries(bm)) {
        for (const [cap, labels] of Object.entries(caps)) {
            if (cm[surface]?.[cap]) continue;
            const sev = /^(fetch|db|storage|rpc|action|auth|export|clipboard|print)\b/.test(cap) ? "error" : "warn";
            push(sev, "feature-unwired", surface, cap, `기준선에서 [${labels.slice(0, 4).join(" | ")}] 가(이) 하던 일을 지금은 어떤 버튼도 하지 않음`);
        }
    }
    for (const [surface, caps] of Object.entries(cm)) for (const cap of Object.keys(caps)) if (!bm[surface]?.[cap]) push("info", "feature-added", surface, cap, `신규: [${caps[cap].slice(0, 3).join(" | ")}]`);

    // 4) 페이지 로드 기능(버튼 밖, 예: 가용 좌석 조회) — 서피스 단위 합집합으로 비교
    const surfaceCaps = (inv) => {
        const m = {};
        for (const p of Object.values(inv.pages)) for (const c of p.capabilities) (m[p.surface] ??= new Set()).add(c);
        return m;
    };
    const bs = surfaceCaps(base);
    const cs = surfaceCaps(cur);
    for (const [surface, set] of Object.entries(bs))
        for (const c of set) if (!cs[surface]?.has(c) && /^(fetch|db|storage|rpc|action|realtime|auth)\b/.test(c)) push("error", "capability-removed", surface, c, "화면에서 더 이상 호출하지 않음 (로드 시 조회 포함)");

    // 5) 문구: 기준선에서 쓰던 번역 키가 지금은 안 쓰이면 문구 유실 가능 (PRD G2)
    const curKeys = new Set(cur.locale.referenced);
    for (const k of base.locale.referenced) if (!curKeys.has(k)) push("warn", "text-unreferenced", "customer", k, `문구 "${squash(locales.ko[k] ?? "?", 40)}" 가 더 이상 화면에서 쓰이지 않음`);

    // 6) 버튼 라벨: 기준선 라벨이 같은 서피스에서 사라짐 (디자인상 문구 변경일 수 있어 경고)
    const labelSet = (inv, s) => new Set(inv.elements.filter((e) => e.surfaces.includes(s) && (e.kind === "button" || e.kind === "link") && e.label && !e.label.startsWith("[icon") && !e.label.startsWith("{")).map((e) => e.label));
    for (const s of ["customer", "admin", "agency", "checkin"]) {
        const cl = labelSet(cur, s);
        for (const l of labelSet(base, s)) if (!cl.has(l)) push("warn", "label-missing", s, l, "같은 이름의 버튼/링크가 없음 (이름만 바뀐 것인지 확인)");
    }

    // 7) 새로 생긴 정적 검사 문제. 기준선에 없던 죽은 버튼·빈 핸들러·없는 앵커·없는 번역 키는 리뉴얼이 만든 것이므로 차단.
    //    (메시지에 줄 번호가 없어서 코드가 밀려도 같은 문제는 같은 키)
    const BLOCK_WHEN_NEW = new Set(["dead-button", "empty-handler", "missing-anchor", "missing-locale-key"]);
    const baseIssueKeys = new Set(base.issues.map((i) => i.code + i.message));
    for (const i of cur.issues) {
        if (baseIssueKeys.has(i.code + i.message)) continue;
        if (i.severity === "error" || BLOCK_WHEN_NEW.has(i.code)) push("error", `new-${i.code}`, null, i.where, i.message);
    }

    // 8) 필수 리다이렉트 (expected.requiredRedirects)
    for (const r of expected.requiredRedirects || []) {
        const red = (cur.routes.redirects || []).find((x) => x.source === r.source);
        if (!red && !curRoutes.has(r.source)) push("error", "redirect-missing", "customer", r.source, `→ ${r.destination} 리다이렉트 필요 (${r.reason || ""})`);
        else if (red && red.destination !== r.destination) push("error", "redirect-wrong", "customer", r.source, `목적지 ${red.destination} ≠ 기대 ${r.destination}`);
    }
    const order = { error: 0, warn: 1, info: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity] || String(a.surface).localeCompare(String(b.surface)) || a.subject.localeCompare(b.subject));
}

function renderDiff(result, base, cur) {
    const L = [];
    L.push(`# 리뉴얼 전후 기능 비교`, "");
    L.push(`- 기준선: \`${base.gitCommit}\` (${base.generatedAt})`, `- 현재: \`${cur.gitCommit}\` (${cur.generatedAt})`, "");
    const blocking = result.filter((r) => r.severity === "error" && !r.accepted);
    L.push(`**배포 차단 ${blocking.length}건** · 승인된 변경 ${result.filter((r) => r.accepted).length}건 · 경고 ${result.filter((r) => r.severity === "warn" && !r.accepted).length}건`, "");
    L.push("> 차단 항목은 기능이 사라졌거나 버튼과 끊어진 것입니다. 의도한 변경이면 `qa/renewal-expected-changes.json` 의 `accept` 에 사유와 함께 추가하세요.", "");
    const section = (title, rows) => {
        if (!rows.length) return;
        L.push(`## ${title}`, "", "| 코드 | 화면 | 대상 | 내용 |", "|---|---|---|---|");
        for (const r of rows) L.push(`| ${r.code} | ${r.surface ?? ""} | \`${r.subject}\` | ${String(r.message).replace(/\|/g, "\\|")}${r.reason ? ` _(승인: ${r.reason})_` : ""} |`);
        L.push("");
    };
    section("🔴 배포 차단", blocking);
    section("🟡 경고", result.filter((r) => r.severity === "warn" && !r.accepted));
    section("✅ 승인된 변경", result.filter((r) => r.accepted));
    section("ℹ️ 참고 (신규·리다이렉트)", result.filter((r) => r.severity === "info" && !r.accepted));
    return L.join("\n");
}

function renderMarkdown(inv) {
    const L = [];
    const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    L.push(`# UI ↔ 기능 인벤토리 (자동 생성)`, "");
    L.push(`> \`node scripts/qa/audit-ui.mjs\` 가 소스 코드를 읽어 만든 표입니다. 손으로 고치지 마세요.`, `> 생성: ${inv.generatedAt} · 커밋 \`${inv.gitCommit}\``, "");
    const c = (sev) => inv.issues.filter((i) => i.severity === sev).length;
    L.push(`## 요약`, "", `| 항목 | 수 |`, `|---|---|`);
    L.push(`| 페이지 라우트 | ${inv.routes.pages.length} |`, `| API 라우트 | ${inv.routes.api.length} |`, `| 인터랙티브 요소 | ${inv.elements.length} |`);
    L.push(`| 정적 검사 error / warn / info | ${c("error")} / ${c("warn")} / ${c("info")} |`, `| 번역 키 (ko/en) · 미사용 | ${inv.locale.koKeys}/${inv.locale.enKeys} · ${inv.locale.unused.length} |`, "");

    L.push(`## 정적 검사 결과`, "");
    const shown = inv.issues.filter((i) => i.severity !== "info");
    if (!shown.length) L.push("error/warn 없음", "");
    else {
        L.push("| 등급 | 코드 | 위치 | 내용 |", "|---|---|---|---|");
        for (const i of shown) L.push(`| ${i.severity} | ${i.code} | \`${i.where}\` | ${esc(i.message)} |`);
        L.push("");
    }
    const infos = inv.issues.filter((i) => i.severity === "info");
    if (infos.length) {
        L.push(`<details><summary>info ${infos.length}건 (접근성·선택자 관련)</summary>`, "", "| 코드 | 위치 | 내용 |", "|---|---|---|");
        for (const i of infos) L.push(`| ${i.code} | \`${i.where}\` | ${esc(i.message)} |`);
        L.push("", "</details>", "");
    }

    L.push(`## 라우트`, "", "| 경로 | 화면 | 파일 |", "|---|---|---|");
    for (const p of inv.routes.pages) L.push(`| \`${p.route}\` | ${p.surface} | \`${p.file}\` |`);
    L.push("", "| API | 메서드 | 인증 | 하는 일 |", "|---|---|---|---|");
    for (const a of inv.routes.api) L.push(`| \`${a.route}\` | ${a.methods.join(", ")} | ${a.auth.join(", ") || "—"} | ${esc(Object.entries(a.effects).map(([m, e]) => `**${m}** ${e.join(", ")}`).join("<br>"))} |`);
    L.push("");

    L.push(`## 화면별 기능 지도 (어떤 기능을 어떤 버튼이 일으키는가)`, "");
    for (const [surface, caps] of Object.entries(inv.capabilityMap)) {
        L.push(`### ${surface}`, "", "| 기능(효과) | 버튼/링크 |", "|---|---|");
        for (const [cap, labels] of Object.entries(caps).sort()) L.push(`| \`${esc(cap)}\` | ${esc(labels.slice(0, 8).join(" · "))}${labels.length > 8 ? ` 외 ${labels.length - 8}` : ""} |`);
        L.push("");
    }

    L.push(`## 페이지별 인터랙티브 요소`, "");
    for (const [route, p] of Object.entries(inv.pages)) {
        const els = inv.elements.filter((e) => e.routes.includes(route) && e.kind !== "field");
        L.push(`### \`${route}\` (${p.surface}) — 요소 ${els.length}개`, "");
        L.push(`로드/전체 기능: ${p.capabilities.filter((x) => !x.startsWith("state")).map((x) => `\`${x}\``).join(" ") || "—"}`, "");
        L.push("| 종류 | 라벨 | 하는 일 | 위치 |", "|---|---|---|---|");
        for (const e of els) {
            const eff = e.effects.filter((x) => x.kind !== "state" && x.kind !== "prop-callback").map((x) => effectKey(x)).join(", ");
            const st = e.effects.filter((x) => x.kind === "state").map((x) => x.name).slice(0, 3).join(",");
            const h = Object.entries(e.handlers)[0];
            L.push(`| ${e.kind} | ${esc(e.label || `<${e.tag}>`)} | ${esc(eff || (st ? `상태: ${st}` : h ? `${h[0]}: ${h[1]}` : "—"))} | \`${e.file}:${e.line}\` |`);
        }
        L.push("");
    }
    if (inv.orphanFiles.length) L.push(`## 어떤 페이지에서도 쓰이지 않는 파일`, "", ...inv.orphanFiles.map((f) => `- \`${f}\``), "");
    if (inv.locale.unused.length) L.push(`<details><summary>코드에서 참조되지 않는 번역 키 ${inv.locale.unused.length}개</summary>`, "", inv.locale.unused.map((k) => `\`${k}\``).join(" "), "", "</details>", "");
    return L.join("\n");
}
