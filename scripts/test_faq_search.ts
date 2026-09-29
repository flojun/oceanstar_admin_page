/**
 * FAQ 안내 창 질문 찾기 검사. 손님이 실제로 칠 법한 말 → 1순위로 나와야 할 FAQ.
 * 실행: node --no-warnings scripts/test_faq_search.ts
 */
import assert from 'node:assert';
import { FAQ } from '../src/components/site/faqData.ts';
import { answerFor } from '../src/components/site/faq/faqSearch.ts';

type Case = [query: string, expect: string | string[]];

const KO: Case[] = [
    ['수영 못해도 돼요?', 'q1-1'],
    ['물이 무서운데 괜찮을까요', 'q1-1'],
    ['애기 몇살부터 탈수있어요', 'q1-2'],
    ['아이 데리고 가도 되나요', 'q1-2'],
    ['임신 중인데 괜찮나요', 'q1-3'],
    ['멀미 심해요', 'q1-4'],
    ['배 많이 흔들려요?', 'q1-4'],
    ['부모님이 70대신데 괜찮을까요', 'q1-5'],
    ['바우처 출력해야 하나요', 'q2-1'],
    ['호텔로 데리러 오나요', 'q2-2'],
    ['픽업 장소', 'q2-2'],
    ['혼자 가도 되나요', 'q2-3'],
    ['1부 2부 차이', 'q2-4'],
    ['오늘 예약 되나요', 'q2-5'],
    ['거북이 못 보면 어떡해요', 'q3-1'],
    ['몇 시간 걸려요', 'q3-2'],
    ['카약 꼭 해야해요?', 'q3-3'],
    ['돌고래 볼 수 있어요?', 'q3-4'],
    ['뭐 챙겨가요', 'q4-1'],
    ['준비물', 'q4-1'],
    ['고프로 대여', 'q4-2'],
    ['수중 사진 찍어주나요', 'q4-2'],
    ['화장실 있어요?', 'q4-3'],
    ['샤워할 수 있나요', 'q4-3'],
    ['비 오면 취소돼요?', ['q6-2', 'q5-1']],
    ['날씨 안 좋으면', ['q5-1', 'q6-2']],
    ['생일 파티 하고 싶어요', 'q5-2'],
    ['팁 얼마 줘요', 'q5-3'],
    ['환불 규정', 'q6-1'],
    ['캔슬하면 돈 돌려받나요', 'q6-1'],
    ['프라이빗 환불', 'q6-3'],
    ['수영복 입고 가요?', 'q7-1'],
    ['캐리어 맡길 수 있나요', 'q7-2'],
    ['점심 주나요', 'q7-3'],
    ['날짜 바꾸고 싶어요', 'q7-4'],
    ['왜 오션스타예요', 'q7-5'],
    ['거북이 만져도 돼요?', 'q7-6'],
    ['픽업 늦으면?', 'q7-7'],
];

const EN: Case[] = [
    ["I can't swim", 'q1-1'],
    ['kids age', 'q1-2'],
    ['is it ok if pregnant', 'q1-3'],
    ['I get seasick', 'q1-4'],
    ['my grandparents are 75', 'q1-5'],
    ['do I need a voucher', 'q2-1'],
    ['pickup from my hotel', 'q2-2'],
    ['traveling alone', 'q2-3'],
    ['which session is better', 'q2-4'],
    ['book for today', 'q2-5'],
    ['are turtles guaranteed', 'q3-1'],
    ['how long is the tour', 'q3-2'],
    ['do I have to kayak', 'q3-3'],
    ['dolphins', 'q3-4'],
    ['what should I bring', 'q4-1'],
    ['gopro rental', 'q4-2'],
    ['is there a bathroom', 'q4-3'],
    ['what if it rains', ['q5-1', 'q6-2']],
    ['birthday party', 'q5-2'],
    ['how much tip', 'q5-3'],
    ['refund policy', 'q6-1'],
    ['wear swimsuit', 'q7-1'],
    ['big suitcase', 'q7-2'],
    ['why choose you', 'q7-3'],
    ['can I touch the turtles', 'q7-4'],
    ['what if I am late for pickup', 'q7-5'],
];

let fail = 0;
for (const [lang, cases] of [['ko', KO], ['en', EN]] as const) {
    for (const [q, expect] of cases) {
        const r = answerFor(q, FAQ[lang], lang);
        const ok = r.best && (Array.isArray(expect) ? expect : [expect]).includes(r.best.item.id);
        if (!ok) {
            fail++;
            console.log(`✗ [${lang}] "${q}" → ${r.best?.item.id ?? '없음'} (${r.best?.score.toFixed(1)}) 기대 ${expect} · ${r.best?.item.q ?? ''}`);
        }
    }
}

// 없는 질문은 억지로 고르지 않는다 · 요금은 요금 안내로
assert.equal(answerFor('주차장 있나요 렌터카', FAQ.ko, 'ko').confident, false, '관계없는 질문에 확신하면 안 된다');
assert.equal(answerFor('투어 가격 얼마예요', FAQ.ko, 'ko').price, true);
assert.equal(answerFor('투어 가격 얼마예요', FAQ.ko, 'ko').best, null, '요금만 물으면 FAQ 를 억지로 고르지 않는다');
assert.equal(answerFor('how much does it cost', FAQ.en, 'en').best, null);
assert.equal(answerFor('팁 얼마 줘요', FAQ.ko, 'ko').best?.item.id, 'q5-3', '팁 + 얼마는 팁 질문');
assert.equal(answerFor('', FAQ.ko, 'ko').best, null);

const total = KO.length + EN.length;
console.log(`FAQ 찾기: ${total - fail}/${total}`);
assert.equal(fail, 0, `${fail}개가 기대한 질문을 1순위로 찾지 못했다`);
