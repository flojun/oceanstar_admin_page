/**
 * FAQ 안내 창의 질문 찾기. 외부 서비스 없이 브라우저에서 돈다.
 *  1) 뜻 묶음(CONCEPTS): 손님이 쓰는 말(애기, 데리러, 캔슬 …)을 FAQ 항목으로 잇는다.
 *     primary = 그 뜻의 대표 질문. 질문 문장에 그 말이 들어 있으면 다음, 답에만 있으면 조금.
 *  2) 겹침 점수: 한국어는 글자 두 개씩, 영어는 단어로 질문·답과 얼마나 겹치는지.
 * FAQ 문안을 인자로 받는다(faqData 를 직접 부르지 않아 node 로 바로 검사할 수 있다).
 * 확인: node --no-warnings scripts/test_faq_search.ts
 */
import type { FaqGroup, FaqItem } from "../faqData";
import type { Lang } from "../tours";

export type FaqHit = { item: FaqItem; group: string; score: number };
export type FaqAnswer = { best: FaqHit | null; related: FaqHit[]; confident: boolean; price: boolean };

type Concept = { ko: string[]; en: string[]; primary?: Partial<Record<Lang, string>> };

// 한 글자짜리(비, 짐 …)는 다른 말 속에 잘 섞여 들어가 두 글자 이상으로 적는다
const CONCEPTS: Record<string, Concept> = {
    swim: { ko: ["수영못", "수영을못", "수영을전혀", "수영할줄", "맥주병", "물무서", "물공포", "물이무서", "헤엄"], en: ["can't swim", "cannot swim", "cant swim", "non-swimmer", "non swimmer", "not swim", "swimmer"], primary: { ko: "q1-1", en: "q1-1" } },
    kids: { ko: ["아이", "애기", "아기", "유아", "어린이", "아동", "몇살", "몇세", "나이", "개월", "초등", "자녀", "미성년", "키즈", "딸", "아들"], en: ["child", "kid", "baby", "toddler", "infant", "age", "years old", "year old", "minor"], primary: { ko: "q1-2", en: "q1-2" } },
    pregnant: { ko: ["임산부", "임신", "임부", "뱃속"], en: ["pregnan"], primary: { ko: "q1-3", en: "q1-3" } },
    seasick: { ko: ["멀미", "울렁", "속이안좋", "토할", "구토", "흔들"], en: ["seasick", "sea sick", "motion sick", "nausea", "rocking", "bumpy"], primary: { ko: "q1-4", en: "q1-4" } },
    senior: { ko: ["노약자", "노인", "어르신", "부모님", "할머니", "할아버지", "고령", "연세", "나이많", "70대", "60대", "80대", "심장", "관절", "허리", "무릎", "지병"], en: ["senior", "elderly", "old people", "grandparent", "grandma", "grandpa", "parents", "heart", "knee", "joint"], primary: { ko: "q1-5", en: "q1-5" } },
    confirm: { ko: ["확정", "예약확인", "바우처", "컨펌", "확인문자", "티켓"], en: ["confirm", "voucher", "ticket"], primary: { ko: "q2-1", en: "q2-1" } },
    pickup: { ko: ["픽업", "데리러", "호텔", "숙소", "셔틀", "집합", "만나는", "미팅장소", "어디로가", "어디서만나", "태우러", "데려다"], en: ["pickup", "pick up", "pick-up", "hotel", "meeting point", "meet", "shuttle", "where do we"], primary: { ko: "q2-2", en: "q2-2" } },
    solo: { ko: ["혼자", "1명", "한명", "몇명", "인원", "최소인원", "출발인원", "소수"], en: ["alone", "solo", "one person", "1 person", "just me", "minimum", "how many people"], primary: { ko: "q2-3", en: "q2-3" } },
    session: { ko: ["1부", "2부", "오전", "시간대", "출발시간", "몇시에", "몇시출발", "아침"], en: ["session", "morning", "time slot", "what time", "start time", "departure time"], primary: { ko: "q2-4", en: "q2-4" } },
    sameday: { ko: ["당일", "오늘", "내일", "급하게", "미리예약", "언제예약", "얼마나빨리", "마감", "매진", "자리있"], en: ["same day", "same-day", "today", "tomorrow", "last minute", "how early", "sold out", "in advance", "advance"], primary: { ko: "q2-5", en: "q2-5" } },
    turtle: { ko: ["거북", "100%", "보장", "못보면", "안보이", "못만나"], en: ["turtle", "guarantee", "don't see", "not see"], primary: { ko: "q3-1", en: "q3-1" } },
    duration: { ko: ["몇시간", "소요", "총시간", "진행순서", "일정", "코스", "스케줄", "걸려", "걸리"], en: ["how long", "duration", "hours", "itinerary", "schedule"], primary: { ko: "q3-2", en: "q3-2" } },
    activity: { ko: ["액티비티", "패들", "카약", "씨체어", "보트다이빙", "다이빙", "강제", "필수", "꼭해야", "안해도", "뭐해", "뭘해", "뭐하"], en: ["activit", "paddle", "kayak", "sup ", "sea chair", "diving", "mandatory", "required to", "have to do"], primary: { ko: "q3-3", en: "q3-3" } },
    marine: { ko: ["돌고래", "고래", "만타", "물고기", "열대어", "산호", "바다생물", "해양생물"], en: ["dolphin", "whale", "manta", "fish", "coral", "marine life", "sea life"], primary: { ko: "q3-4", en: "q3-4" } },
    bring: { ko: ["준비물", "챙겨", "가져가", "가져와", "뭐가져", "필요한", "타월", "타올", "수건", "선크림", "겉옷", "후드"], en: ["bring", "pack", "towel", "sunscreen", "what to wear", "need to take"], primary: { ko: "q4-1", en: "q4-1" } },
    photo: { ko: ["사진", "영상", "고프로", "촬영", "카메라", "인생샷", "수중"], en: ["photo", "picture", "video", "gopro", "camera", "underwater"], primary: { ko: "q4-2", en: "q4-2" } },
    toilet: { ko: ["화장실", "샤워", "탈의", "옷갈아", "씻"], en: ["restroom", "toilet", "bathroom", "shower", "changing room"], primary: { ko: "q4-3", en: "q4-3" } },
    weather: { ko: ["날씨", "비오", "비가", "비와", "우천", "바람", "태풍", "파도가높", "기상", "악천후"], en: ["weather", "rain", "storm", "wind", "typhoon", "hurricane"], primary: { ko: "q5-1", en: "q5-1" } },
    private: { ko: ["프라이빗", "단독", "전세", "대관", "생일", "돌잔치", "행사", "기업", "워크숍", "웨딩", "파티", "단체", "우리끼리"], en: ["private", "event", "party", "birthday", "corporate", "wedding", "group", "charter"], primary: { ko: "q5-2", en: "q5-2" } },
    tip: { ko: ["매너팁", "팁"], en: ["tip", "gratuity"], primary: { ko: "q5-3", en: "q5-3" } },
    refund: { ko: ["환불", "취소", "캔슬", "위약금", "수수료"], en: ["refund", "cancel"], primary: { ko: "q6-1", en: "q6-1" } },
    change: { ko: ["변경", "날짜바꾸", "일정바꾸", "날짜를바꾸", "연기", "미루"], en: ["change the date", "change my", "reschedule", "move my"], primary: { ko: "q7-4" } },
    swimsuit: { ko: ["수영복", "래쉬가드", "입고"], en: ["swimsuit", "swimwear", "bathing suit", "wear it"], primary: { ko: "q7-1", en: "q7-1" } },
    luggage: { ko: ["캐리어", "짐", "가방", "수하물", "보관"], en: ["luggage", "suitcase", "bag", "store"], primary: { ko: "q7-2", en: "q7-2" } },
    food: { ko: ["음식", "음료", "간식", "라면", "먹을", "식사", "점심", "아침밥", "마실"], en: ["food", "drink", "snack", "lunch", "ramen", "eat"], primary: { ko: "q7-3", en: "q4-1" } },
    why: { ko: ["왜오션스타", "다른업체", "차이", "비교", "장점", "뭐가좋", "어디가좋", "추천이유"], en: ["why", "different from", "compare", "better than", "other companies"], primary: { ko: "q7-5", en: "q7-3" } },
    touch: { ko: ["만지", "만져", "터치", "쓰다듬"], en: ["touch", "pet the"], primary: { ko: "q7-6", en: "q7-4" } },
    late: { ko: ["늦으면", "늦어", "늦을", "지각", "놓치", "늦게"], en: ["late", "miss the pickup", "missed"], primary: { ko: "q7-7", en: "q7-5" } },
    // FAQ 에 없는 질문. 안내 창이 투어 요금 보기로 이어 준다
    price: { ko: ["가격", "요금", "얼마", "비용", "금액", "할인"], en: ["price", "cost", "how much", "discount", "rate"] },
};

// 조사·어미·질문투. 모든 질문에 흔해서 겹침 점수를 흐린다
const KO_STOP = ["가능한가요", "있나요", "있어요", "있을까요", "되나요", "돼요", "되요", "하나요", "해요", "할수", "수있", "인가요", "나요", "까요", "어떻게", "어떡", "궁금", "알려", "주세요", "하면", "에서", "는데", "은데", "그리고", "혹시", "정말", "진짜"];
const EN_STOP = new Set(["the", "a", "an", "is", "are", "do", "does", "can", "could", "i", "we", "you", "my", "our", "to", "of", "for", "in", "on", "at", "it", "be", "if", "what", "how", "there", "any", "and", "or", "with", "will", "should", "would", "your", "this", "that", "me", "us"]);

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").toLowerCase();
const clean = (s: string) => strip(s).replace(/[^\p{L}\p{N}%'\s-]/gu, " ").replace(/\s+/g, " ").trim();
const tight = (s: string) => clean(s).replace(/[\s'-]/g, "");

function grams(s: string, lang: Lang): Set<string> {
    if (lang === "en") {
        return new Set(clean(s).split(" ").filter((w) => w.length > 2 && !EN_STOP.has(w)).map((w) => w.replace(/(ies|es|s)$/, "")));
    }
    let t = tight(s);
    for (const w of KO_STOP) t = t.split(w).join(" ");
    const out = new Set<string>();
    for (const part of t.split(" ")) for (let i = 0; i < part.length - 1; i++) out.add(part.slice(i, i + 2));
    return out;
}

function dice(a: Set<string>, b: Set<string>): number {
    if (!a.size || !b.size) return 0;
    let n = 0;
    for (const g of a) if (b.has(g)) n++;
    return (2 * n) / (a.size + b.size);
}

// 영어는 단어 첫머리부터 맞춘다(tip 이 multiple 에 걸리지 않게, kid 는 kids 에 걸리게)
const has = (text: string, trigger: string, lang: Lang) =>
    lang === "en" ? ` ${clean(text)} `.includes(` ${trigger}`) : tight(text).includes(trigger.replace(/\s/g, ""));

export function conceptsIn(query: string, lang: Lang): string[] {
    return Object.keys(CONCEPTS).filter((k) => CONCEPTS[k][lang].some((w) => has(query, w, lang)));
}

export function rankFaq(query: string, groups: FaqGroup[], lang: Lang): FaqHit[] {
    const cs = conceptsIn(query, lang);
    const qg = grams(query, lang);
    const hits: FaqHit[] = [];
    for (const g of groups) for (const item of g.items) {
        let score = 0;
        for (const k of cs) {
            const c = CONCEPTS[k];
            if (c.primary?.[lang] === item.id) score += 6;
            else if (c[lang].some((w) => has(item.q, w, lang))) score += 4;
            else if (item.a && c[lang].some((w) => has(item.a!, w, lang))) score += 1.5;
        }
        score += 6 * dice(qg, grams(item.q, lang)) + 2 * dice(qg, grams(item.a ?? "", lang));
        if (score > 0.6) hits.push({ item, group: g.group, score });
    }
    return hits.sort((a, b) => b.score - a.score);
}

/** 안내 창 한 번에 쓸 답: 가장 맞는 질문 하나 + 비슷한 질문 셋 */
export function answerFor(query: string, groups: FaqGroup[], lang: Lang): FaqAnswer {
    const cs = conceptsIn(query, lang);
    const price = cs.includes("price");
    // 요금만 묻는 질문은 FAQ 에 답이 없다 - '얼마' 같은 글자 겹침으로 엉뚱한 질문을 고르지 않는다
    const hits = price && cs.length === 1 ? [] : rankFaq(query, groups, lang);
    const best = hits[0] && hits[0].score >= 2 ? hits[0] : null;
    const related = best ? hits.slice(1).filter((h) => h.score >= Math.max(1.5, best.score * 0.35)).slice(0, 3) : [];
    return { best, related, confident: !!best && best.score >= 4, price };
}
