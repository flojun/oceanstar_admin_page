# -*- coding: utf-8 -*-
"""고객후기 페이지(한국어) 보드. 데스크탑 1440 · 모바일 375 + 후기 작성 창 두 장.

운영 중인 사이트(src/components/landing/ReservationClientPage.tsx 의 #reviews,
src/components/GoogleReviews.tsx, src/app/api/reviews/route.ts)를 옮겼다.
  - 순서: 홈페이지 후기 → 구글 리뷰 → GetYourGuide (운영자 요청: 홈페이지 후기 먼저)
  - 후기 작성: 예약번호(영숫자 6자리)로 확인해야 쓸 수 있다. 사이트 API 규칙
    그대로 — 예약 1건당 후기 1개, 결제대기·결제실패·취소·환불 예약은 불가,
    사진은 JPG · PNG · WEBP 최대 5장, 장당 1.5MB.
  - 문구: src/locales/ko.ts 의 review / reviewModal 문자열.
후기 본문과 사진은 운영 DB 에 공개로 올라와 있는 실제 후기(reviews 14건,
google_reviews 5건)를 그대로 옮겼다. 이름은 사이트와 같은 maskName 규칙으로 가린다.
GetYourGuide 후기는 저장소·DB 에 없어 지어내지 않는다 — 연동 자리만 그린다.

꼴은 상세페이지(build_detail.py)의 토큰·내비·푸터·폰트 서브셋을 그대로 쓴다.
"""
import io, os, re
import build_detail as D          # 불러오면 상세 보드도 다시 찍힌다(결과는 같다)
import _detail_ko, _detail_en
import _reviews_en

D.C = _detail_ko                  # 푸터·맺음 문안은 브랜드 공통(오전 상세의 것)
LANG = "ko"                       # build() 가 보드마다 바꾼다

# 화면 문구(한/영). 한국어는 src/locales/ko.ts, 영어는 en.ts 의 review·reviewModal 값을 따른다.
TX = {
    "ko": dict(star="별점 {n}점", photo_alt="{name} 님이 올린 투어 사진", more="더보기", verified="예약 확인 후기",
               hero_alt="다이아몬드헤드를 배경으로 뱃머리에 앉은 두 사람",
               h1='생생한 <span class="hl">리얼 후기</span>', sub="당일 취소, 노쇼 없이 검증된 고객님들의 찐 후기입니다.",
               g_alt="구글", mrt_alt="마이리얼트립", loved="업계 통합 누적 리뷰 15,000+",
               tabs="후기 모아보기", tab_site="홈페이지 후기", tab_google="구글 리뷰",
               prev="이전 {w}", next="다음 {w}", w_site="후기", w_google="리뷰",
               end_b="후기 {n}개 더 보기", end_s="전체 후기를 최신순으로 볼 수 있어요",
               site_h2="홈페이지 후기",
               site_lede="오션스타에서 예약하고 다녀오신 분만 남길 수 있어요.<br>예약번호로 한 번 더 확인한 후기입니다.",
               write="후기 작성하기", google_h2="구글 리뷰",
               google_line='구글 맵 기준 <b class="n">5,000+</b>개의 실제 고객 리뷰', google_go="구글에서 전체 리뷰 보기",
               gyg_h2="GetYourGuide 리뷰", gyg_line="해외 여행객이 GetYourGuide 에서 예약하고 남긴 후기",
               gyg_go="GetYourGuide에서 전체 리뷰 보기", gyg_note="배포 때 GetYourGuide 후기를 불러와 이 자리에 보여 줍니다.",
               oid_label="예약 번호 (영숫자 6자리)", oid_aria="예약 번호", checked="확인됨",
               ok_line="예약이 확인되었어요. 이제 후기를 남길 수 있어요.",
               oid_help="예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다.",
               name_label="이름 (초성 또는 닉네임 가능)", name_ph="김오션", name_aria="이름", rating="별점", pts="5점",
               content_label="후기 내용", content_ph="다녀오신 투어의 소중한 경험을 들려주세요!",
               photo_label="사진 첨부 <span>(선택, 최대 5장)</span>", add_photo="사진 추가",
               photo_help="JPG · PNG · WEBP, 장당 1.5MB까지", rule1="예약 1건당 후기는 1개만 남길 수 있어요.",
               rule2="취소 · 환불되었거나 결제 대기 중인 예약은 후기를 남길 수 없어요.", submit="리뷰 등록하기",
               m_aria="후기 작성", m_h2="솔직한 후기를 남겨주세요", close="닫기",
               k_write="후기 작성 창", k_page="고객후기", suffix=""),
    "en": dict(star="Rated {n} out of 5", photo_alt="Tour photo from {name}", more="Read more", verified="Verified booking",
               hero_alt="Two people sitting on the bow with Diamond Head behind",
               h1='Real <span class="hl">reviews</span>',
               sub="Verified guests only. No same-day cancellations or no-shows.",
               g_alt="Google", mrt_alt="MyRealTrip", loved="15,000+ reviews across platforms",
               tabs="Review sources", tab_site="Our site", tab_google="Google",
               prev="Previous {w}", next="Next {w}", w_site="review", w_google="review",
               end_b="{n} more reviews", end_s="See every review, newest first",
               site_h2="Reviews on our site",
               site_lede="Only guests who booked with OceanStar can post here.<br>Every review is checked against a booking number.",
               write="Write a Review", google_h2="Google reviews",
               google_line='<b class="n">5,000+</b> real customer reviews on Google Maps', google_go="View all reviews on Google",
               gyg_h2="GetYourGuide reviews", gyg_line="Reviews from travelers who booked on GetYourGuide",
               gyg_go="View all on GetYourGuide", gyg_note="GetYourGuide reviews will load here when the site goes live.",
               oid_label="Booking number (6 letters and digits)", oid_aria="Booking number", checked="Verified",
               ok_line="Booking verified. You can write your review now.",
               oid_help="You can find this on the voucher sent after booking confirmation and payment.",
               name_label="Name (initials or nickname)", name_ph="John D.", name_aria="Name", rating="Rating", pts="5 / 5",
               content_label="Your review", content_ph="Please share your experience from the tour!",
               photo_label="Photos <span>(optional, up to 5)</span>", add_photo="Add photos",
               photo_help="JPG · PNG · WEBP, up to 1.5MB each", rule1="One review per booking.",
               rule2="Cancelled, refunded or unpaid bookings can’t be reviewed.", submit="Submit Review",
               m_aria="Write a review", m_h2="Share your honest review", close="Close",
               k_write="후기 작성 창", k_page="고객후기", suffix=" · 영문"),
}


def t(k, **kw):
    v = TX[LANG][k]
    return v.format(**kw) if kw else v
HERE = D.HERE
I_ARROW, I_STAR, icon = D.I_ARROW, D.I_STAR, D.icon

I_STAR_F = icon('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 '
                '5.8-.8z"></path>', 16, 0, "currentColor")
I_CHECK = icon('<path d="M5 12.5l4.2 4.2L19 7"></path>', 16, 2.2)
I_SHIELD = icon('<path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6z"></path>'
                '<path d="M8.8 12.2l2.2 2.2 4.4-4.6"></path>', 16, 1.8)
I_PEN = icon('<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"></path>'
             '<path d="M13.5 8.5l2 2"></path>', 18, 1.8)
I_CAM = icon('<path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10H4z"></path>'
             '<circle cx="12" cy="13.2" r="3.3"></circle>', 22, 1.6)
I_X = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 18, 2)
I_LEFT = icon('<path d="M15 5l-7 7 7 7"></path>', 18, 2)
I_RIGHT = icon('<path d="M9 5l7 7-7 7"></path>', 18, 2)


def mask(name):
    """사이트 maskName 과 같다: 첫 글자 + * + 끝 글자."""
    name = name.strip()
    if len(name) <= 1:
        return name
    if len(name) == 2:
        return name[0] + "*"
    return name[0] + "*" * (len(name) - 2) + name[-1]


def stars(n=5):
    return f'<span class="rstars" aria-label="{t("star", n=n)}">' + I_STAR_F * n + "</span>"


# 홈페이지 후기 — 운영 DB reviews (is_hidden = false), 최신순. 본문 원문 그대로.
# 보드는 앞 9건(폰 5건)만 그리므로 뒤 후기의 사진 파일은 싣지 않는다(캔버스 용량).
# (작성자, 날짜, 본문, 사진 파일들)
SITE = [
    ("요미이잉", "2026.06.30",
     "덕분에 너무 재밌는 경험했습니다 ㅎㅎ\n그늘막 천장이 있고, 라면, 과자까지 챙겨주시는👍\n"
     "모든 크루들이 다 친절합니다!", []),
    ("김웅", "2026.06.11",
     "정말 즐거운 하루였습니다. 거북이 굉장히 많이 봤습니다~~^^ 크루분들도 친절하고 "
     "유쾌하시고 재밌었어요", ["rv_1.webp"]),
    ("은땡땡", "2026.05.25",
     "거북이도 많이보고 직원분들도 모두 친절하셔서 재밌는 투어 하고왔습니다 !! \n"
     "마지막에 돌아오는길에는 돌고래까지 !! 너무 좋은 추억이였습니다! 감사합니다 완전 추천!!", []),
    ("률루랄라", "2026.04.29",
     "서로 다 모르는 사이라 분위기가 처음에 어색했는데 너무 재밌게 잘 이끌어주시고 안전하게 "
     "재밌게 잘 즐겼습니다!!\n멋있고 예쁜 사진도 많이 찍고 너무너무 재밌었습니다!!", ["rv_2.webp"]),
    ("김승호", "2026.04.29",
     "신혼여행으로 방문해서 신청한 선셋 크루즈였는데, 정말 이번 여행에서 가장 잘한 선택이라고 "
     "느낄 만큼 만족스러운 시간이었어요 ♥\n처음에는 날씨가 흐려서 살짝 걱정도 했지만, 그 걱정이 "
     "무색하게도 바다에 나가자마자 분위기가 너무 좋았고, 무엇보다도 운 좋게 고래까지 볼 수 "
     "있어서 감동이 배가 되었어요.", ["rv_3.webp"]),
    ("James Cole", "2026.04.29",
     "We had an amazing snorkeling experience! Saw so many fish and turtles. Staff & captain "
     "were kind and knowledgeable. We also appreciated the small group size, snacks, and festive "
     "music. 10/10 would recommend!!", []),
    ("정지수", "2026.04.29",
     "배 출발하자마자 운 좋게 흑등고래랑 거북이 바로 보면서 시작했네요ㅎㅎ날씨도 너무 좋았고, "
     "직원분들이 적극적으로 사진도 많이 찍어주시고 부족한 것 없이 너무 잘해주셨습니다! 덕분에 "
     "평생 두 번 다시 못해볼 경험 많이 한 것 같습니다ㅎㅎ감사하고 행복했습니다!", ["rv_4.webp"]),
    ("장하늘", "2026.04.29",
     "너무 좋아여! 진짜 재밌어서 내일 모레 다시 예약했습니다!! 크루들 모두 친절하시고 액티비티 "
     "자체가 그냥 너무 최고에요...!!! 오션스타와 함께여서 더욱 즐거웠던 선셋액티비티 진짜 "
     "지인한테도 추천해줄 찐 여행코스입니다! ( 근데 무조건 오션스타여야함 )", ["rv_5.webp"]),
    ("Sarah Rivers", "2026.04.29",
     "Amazing! So fun and relaxing, boat crew was amazing and friendly! Highly recommend this "
     "tour if you are visiting Hawaii!", ["rv_6.webp"]),
    ("박하림", "2026.04.28",
     "하와이에서 제일 기대되는 투어였는데 기대이상이었습니다. 액티비티, 크루, 배, 날씨까지 완벽한 "
     "하루 였습니다. 가족들과 함께 좋은 추억 만들고 갑니다~ 다음에 또 오겠습니다. 번창하세요!",
     []),
    ("조인성", "2026.04.28",
     "거북이 무조건 볼 수 있는 투어!! 거북이뿐만아니라 눈앞에서 물고기 지나다니는거 볼 수 있어서 "
     "너무너무 낭만적이고 좋았어요 ㅠㅠ 스노클링 말고도 액티비티가 많아서 너무 재밌었어요.",
     []),
    ("김예진", "2026.04.28",
     "하와이에서 제일 유명한 투어라고 해서 신청했는데 유명한 이유를 알겠습니다 진짜 너무 "
     "친절하시구 오늘 날씨도 좋아서 거북이 10마리는 넘게 본 것 같아요!!! 그리고 한국인은 역시 "
     "물놀이 후 컵라면이죠 ㅎㅎㅎ", []),
    ("여행조하", "2026.04.28",
     "지금까지 하와이 여행 중 제일 재미있었어요!! \n거북이도 정말 가까이서보고! 왜 다들 추천하고 "
     "후기가 많은곳인지 알 수 있었어요! 한국인분이 운영해서 전체적으로 편했고 언어에 신경쓰지 "
     "않고 편안하게 놀 수 있어수 좋았습니다ㅎㅎㅎ", []),
    ("Kristina Lua", "2026.04.17",
     "Best experience ever they were very welcoming understanding and attentive to your needs "
     "and everyone was very friendly and me and my family had a blast", []),
]

# 구글 리뷰 — 운영 DB google_reviews (is_visible = true). 날짜 칸은 옮겨 넣은 날이라 싣지 않는다.
GOOGLE = [
    ("Kiya C.", "Amazing!! Didn't know it was a Korean boat experience and I wouldn't have had "
     "it any other way. The staff was so helpful with the dive! They took such good pictures "
     "and the ramen after was amazing 20/10 experience, Highly recommended."),
    ("Paul N.", "Oceanstar boat and crew were great! Troy and Zoey were great with "
     "instructions! We saw lots of fishes and the turtles were huge!"),
    ("지연 (Ji Yeon)", "가이드분이 너무 친절하셨고, 간식과 음료도 완벽하게 준비되어 있었어요. "
     "거북이와 물고기들을 원 없이 보고 난 뒤 다같이 본 하와이의 일몰은 정말 최고였습니다. "
     "다음에도 무조건 다시 탈 거예요!"),
    ("Daisy M.", "Having our guide was like having our very own mermaid! We saw a lot of "
     "turtles and tons of fish! We swam a good distance, too! It was AMAZING!"),
    ("Michael T.", "Super fun time! The crew went above and beyond and made sure we had an "
     "incredible time... We saw so many turtles! 바다 위에서 먹은 간식도 정말 꿀맛이었습니다. 최고!"),
]

GOOGLE_URL = "https://www.google.com/maps/search/?api=1&query=Ocean+Star+Hawaii"


def br(t):
    return t.replace("\n", "<br>")


# 카드 높이는 고정(데스크탑 532 · 폰 511). 글은 별점 줄 바로 아래 같은 자리에서 시작하고,
# 사진은 이름 줄 위 바닥에 붙인다. 넘치는 글은 줄 수를 자르고 '더보기'.
# (줄 수, 한 줄 글자 수) — 사진 있음 / 없음
CLAMP = {False: {True: 6, False: 12}, True: {True: 7, False: 13}}
CPL = {False: 17, True: 16}


def est_lines(body, mobile):
    import math
    return sum(max(1, math.ceil(len(x.strip()) / CPL[mobile])) for x in body.split("\n"))


# 실제로 줄 수를 넘는 카드(브라우저에서 잰 값). 없으면 글자 수 어림으로 대신한다.
try:
    import json as _json
    MORE_AT = _json.load(open(os.path.join(HERE, "_reviews_more.json")))
except OSError:
    MORE_AT = None


def site_card(r, mobile=False, i=None):
    name, date, body, photos = r
    if LANG == "en":
        date, body = _reviews_en.SITE_EN[name.strip()]
    ph = ""
    if photos:
        extra = (f'<span class="ph-n">+{len(photos) - 1}</span>' if len(photos) > 1 else "")
        ph = (f'<figure class="rc-ph"><img src="{photos[0]}" alt="{t("photo_alt", name=mask(name))}">'
              f'{extra}</figure>')
    n = CLAMP[mobile][bool(photos)]
    key = ("en_" if LANG == "en" else "") + ("m" if mobile else "d")
    over = (i in MORE_AT[key]) if (MORE_AT and key in MORE_AT and i is not None) else est_lines(body, mobile) > n
    more = f'<button class="more">{t("more")}</button>' if over else ""
    # 사진이 있든 없든 같은 순서: 별점 줄 → (사진) → 글 → 이름. 별점과 '예약 확인 후기'는
    # 모든 카드에서 같은 높이에 선다(운영자 요청).
    return (f'<article class="rc{"" if photos else " tx"}"><div class="rc-b">'
            f'<div class="rc-top">{stars()}<span class="ok">{I_SHIELD}{t("verified")}</span></div>'
            f'<div class="rc-m"><p class="rc-t{" clamp" if more else ""}" style="-webkit-line-clamp:{n}">{br(body)}</p>{more}</div>'
            f'{ph}'
            f'<div class="rc-by"><b>{mask(name)}</b><span class="n">{date}</span></div>'
            f'</div></article>')


def google_card(r):
    name, body = r
    return (f'<article class="gc"><div class="gc-h"><span class="av">{name[0]}</span>'
            f"<div><b>{name}</b>{stars()}</div>"
            f'<img src="plat_google.png" alt="" class="gc-g"></div>'
            f'<p>{body}</p></article>')


def hero(mobile):
    # 데스크탑과 같은 사진(운영자 요청). 폰은 세로가 모자라 두 사람을 가운데로 잘라낸 뒤
    # 위쪽 하늘만 늘렸다(GPT Image 2.5 편집). 하늘 아래는 원본 픽셀을 다시 얹어
    # 사람·배·바다는 원본과 같다(차이 0). 제목은 늘린 하늘 위에 앉는다.
    src, alt = (("hero_reviews_m.webp" if mobile else "act_photo.webp"),
                t("hero_alt"))
    return f"""<section class="hero rv-hero">
  <img src="{src}" alt="{alt}" class="hero-img">
  <span class="veil"></span>
  {nav(mobile)}
  <div class="hero-in">
    <h1>{t("h1")}</h1>
    <p class="rv-sub">{t("sub")}</p>
    <div class="loved"><span class="dots"><i><img src="plat_google.png" alt="{t("g_alt")}"></i>
      <i><img src="plat_gyg.png" alt="GetYourGuide"></i><i><img src="plat_mrt.png" alt="{t("mrt_alt")}"></i></span>
      <b>{t("loved")}</b></div>
  </div>
</section>"""


def nav(mobile):
    return D.nav(mobile, active=2)        # 메뉴에서 '고객후기' 를 켠다


def tabs():
    return (f'<nav class="tabs" aria-label="{t("tabs")}">'
            f'<a href="#site" class="on">{t("tab_site")} <span class="n">14</span></a>'
            f'<a href="#google">{t("tab_google")} <span class="n">5,000+</span></a>'
            '<a href="#gyg">GetYourGuide</a></nav>')


def carousel(cls, cards, mobile, what):
    """옆으로 넘기는 줄. 넘김 버튼은 줄의 왼쪽·오른쪽 끝, 세로 가운데(운영자 요청)."""
    if mobile:
        return f'<div class="{cls} rise">{cards}</div>'
    return (f'<div class="car rise"><button class="car-b l" aria-label="{t("prev", w=what)}">{I_LEFT}</button>'
            f'<div class="{cls}">{cards}</div>'
            f'<button class="car-b r" aria-label="{t("next", w=what)}">{I_RIGHT}</button></div>')


def site_sec(mobile):
    """홈페이지 후기. 구글 리뷰와 같이 옆으로 넘겨 보는 한 줄(운영자 요청).
    앞 9건을 싣고, 줄 끝 칸에서 나머지 후기로 넘어간다."""
    n = 9
    cards = "".join(site_card(r, mobile, i) for i, r in enumerate(SITE[:n]))
    rest = len(SITE) - n
    end = (f'<a href="#" class="rc-end"><b>{t("end_b", n=rest)}</b>'
           f'<span>{t("end_s")}</span>{I_ARROW}</a>')
    return (f'<section class="sect" id="site">'
            f'<div class="rv-h"><div class="sh"><h2>{t("site_h2")}</h2>'
            f'<p class="lede">{t("site_lede")}</p></div>'
            f'<div class="rv-act"><a href="#" class="book-pill write">{I_PEN}{t("write")}</a></div></div>'
            f'{carousel("rrow", cards + end, mobile, t("w_site"))}'
            f'</section>')


def google_sec(mobile):
    cards = "".join(google_card(r) for r in (_reviews_en.GOOGLE_EN if LANG == "en" else GOOGLE))
    return (f'<section class="sect" id="google">'
            f'<div class="src-h"><img src="plat_google.png" alt="Google" class="src-logo">'
            f'<div class="src-t"><h2>{t("google_h2")}</h2>'
            f'<p><b class="n">4.9</b>{stars()}<span>{t("google_line")}</span></p></div>'
            f'<a href="{GOOGLE_URL}" class="src-go">{t("google_go")} {I_ARROW}</a></div>'
            f'{carousel("grow", cards, mobile, t("w_google"))}</section>')


def gyg_sec(mobile):
    ghost = "".join('<div class="gy-sk"><span class="sk w40"></span><span class="sk w90"></span>'
                    '<span class="sk w80"></span><span class="sk w60"></span></div>'
                    for _ in range(2 if mobile else 3))
    return (f'<section class="sect" id="gyg">'
            f'<div class="src-h"><span class="src-logo gy"><img src="plat_gyg.png" alt="GetYourGuide"></span>'
            f'<div class="src-t"><h2>{t("gyg_h2")}</h2>'
            f'<p><span>{t("gyg_line")}</span></p></div>'
            f'<a href="#" class="src-go">{t("gyg_go")} {I_ARROW}</a></div>'
            f'<div class="gy-slot rise"><div class="gy-row">{ghost}</div>'
            f'<p class="gy-note">{t("gyg_note")}</p></div>'
            f'</section>')


def modal(mobile):
    fields = f"""
    <div class="fld">
      <label>{t("oid_label")}</label>
      <div class="oid"><input value="A4X9T2" maxlength="6" aria-label="{t("oid_aria")}">
        <button class="oid-go done" type="button">{I_CHECK}{t("checked")}</button></div>
      <p class="ok-line">{I_CHECK}{t("ok_line")}</p>
      <p class="help">{t("oid_help")}</p>
    </div>
    <div class="fld"><label>{t("name_label")}</label>
      <input placeholder="{t("name_ph")}" aria-label="{t("name_aria")}"></div>
    <div class="fld"><label>{t("rating")}</label>
      <div class="rate">{I_STAR_F * 5}<b>{t("pts")}</b></div></div>
    <div class="fld"><label>{t("content_label")}</label>
      <textarea rows="5" placeholder="{t("content_ph")}" aria-label="{t("content_label")}"></textarea></div>
    <div class="fld"><label>{t("photo_label")}</label>
      <div class="drop">{I_CAM}<span>{t("add_photo")}</span></div>
      <p class="help">{t("photo_help")}</p></div>
    <ul class="rules-s"><li>{t("rule1")}</li>
      <li>{t("rule2")}</li></ul>
    <div class="sub-w"><a href="#" class="submit">{t("submit")}</a></div>"""
    grab = '<span class="grab"></span>' if mobile else ""
    return (f'<div class="dim"></div><div class="modal{" sheet" if mobile else ""}" role="dialog" '
            f'aria-label="{t("m_aria")}">{grab}<div class="m-h"><h2>{t("m_h2")}</h2>'
            f'<button class="m-x" aria-label="{t("close")}">{I_X}</button></div>'
            f'<form class="m-b">{fields}</form></div>')


CSS_COMMON = """
.rv-hero .hero-in h1{margin-top:0}
.rv-sub{color:rgba(255,255,255,.88)}
.loved{display:flex;align-items:center}
.dots{display:flex}
.dots i{border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}
.dots i img{display:block;height:auto}
.loved b{font-weight:600;color:rgba(255,255,255,.92)}
.tabs{display:flex;background:#fff;border:1px solid var(--line);border-radius:999px;width:max-content}
.tabs a{display:inline-flex;align-items:center;gap:7px;border-radius:999px;font-weight:700;color:var(--text)}
.tabs a .n{font-weight:700;color:var(--muted)}
.tabs a.on{background:var(--ink);color:#fff}
.tabs a.on .n{color:var(--sky-2)}
.rstars{display:inline-flex;gap:1px;color:#F5B400}
.book-pill.write{gap:8px}
.book-pill.write svg{width:auto;height:auto;padding:0;background:none;color:#fff}
.rc{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:22px;
  overflow:hidden;scroll-snap-align:start}
.rc-b{flex:1;display:flex;flex-direction:column}
.rc-by{margin-top:auto!important}
.rc-t{margin-bottom:0}
.rc-m{margin-bottom:16px}
/* 사진은 이름 줄 바로 위 바닥에 붙인다 — 글은 모든 카드에서 같은 자리에서 시작한다. */
.rc-ph{margin-top:auto;border-radius:14px;overflow:hidden}
.rc-ph + .rc-by{margin-top:16px!important}
.rc-t{font-weight:500}
.rc-ph img{aspect-ratio:16 / 10;height:auto;max-height:none!important}
/* 줄 끝 칸 — 나머지 후기로 */
.rc-end{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:28px;border-radius:22px;
  background:var(--ink);color:#fff;scroll-snap-align:start}
.rc-end b{font-family:'SUIT',system-ui,sans-serif;font-size:22px;font-weight:800;letter-spacing:-.02em}
.rc-end span{font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.72)}
.rc-end svg{margin-top:10px;width:40px;height:40px;padding:11px;border-radius:50%;background:#fff;
  color:var(--ink);box-sizing:border-box}
.rv-act{display:flex;align-items:center;gap:14px}
.rc-ph{position:relative}
.rc-ph img{width:100%;object-fit:cover}
.ph-n{position:absolute;right:12px;bottom:12px;height:28px;padding:0 11px;border-radius:999px;
  display:inline-flex;align-items:center;background:rgba(16,20,24,.62);color:#fff;
  font-size:13px;font-weight:700}
.rc-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ok{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:700;color:var(--sea-d)}
.rc-t{color:var(--ink);word-break:keep-all;overflow-wrap:anywhere}
.rc-t.clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden}
.more{margin-top:6px;padding:0;border:0;background:none;font:inherit;font-size:14px;font-weight:700;
  color:var(--sea-d);cursor:pointer}
.rc-by{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line)}
.rc-by b{font-size:14.5px;color:var(--ink)}
.rc-by span{font-size:13.5px;color:var(--muted)}
.src-h{display:flex;align-items:center}
.src-logo{flex:none;background:#fff;border:1px solid var(--line);border-radius:18px;object-fit:contain}
.src-logo.gy{display:flex;align-items:center;justify-content:center}
.src-logo.gy img{width:62%;height:auto}
.src-t{flex:1;min-width:0}
.src-t h2{line-height:1.2}
.src-t p{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:8px;color:var(--text)}
.src-t p > b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:var(--ink)}
.src-t p span b{color:var(--ink)}
.src-go{display:inline-flex;align-items:center;gap:8px;font-weight:700;color:var(--ink);white-space:nowrap}
.src-go svg{width:30px;height:30px;padding:7px;border-radius:50%;background:var(--ink);color:#fff;box-sizing:border-box}
.gc{background:#fff;border:1px solid var(--line);border-radius:22px}
.gc-h{display:flex;align-items:center;gap:12px}
.gc-h > div{display:flex;flex-direction:column;gap:3px;flex:1}
.gc-h b{font-size:15px;color:var(--ink)}
.av{flex:none;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;
  border-radius:50%;background:var(--soft);font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:var(--deep)}
.gc-g{width:20px;height:20px}
.gc p{color:var(--ink);word-break:keep-all;overflow-wrap:anywhere}
.gy-slot{border:1.5px dashed #C9C6BE;border-radius:22px}
.gy-row{display:grid}
.gy-sk{background:#fff;border:1px solid var(--line);border-radius:18px;display:flex;flex-direction:column;gap:12px}
.sk{display:block;height:12px;border-radius:6px;background:var(--soft)}
.sk.w40{width:40%}.sk.w60{width:60%}.sk.w80{width:80%}.sk.w90{width:90%}
.gy-note{text-wrap:balance;text-align:center;font-size:14.5px;font-weight:600;color:var(--muted)}
/* 후기 작성 창 */
.board-modal{position:relative;overflow:hidden}
.dim{position:absolute;inset:0;background:rgba(16,20,24,.58);z-index:20}
.modal{position:absolute;z-index:21;background:#fff;overflow:hidden}
.m-h{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.m-h h2{font-size:22px}
.m-x{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:0;
  border-radius:50%;background:var(--soft);color:var(--ink)}
.m-b{display:flex;flex-direction:column}
.fld label{display:block;margin-bottom:8px;font-size:14.5px;font-weight:700;color:var(--ink)}
.fld label span{font-weight:600;color:var(--muted)}
.fld input,.fld textarea{width:100%;border:1px solid #CFCCC4;border-radius:14px;background:#fff;
  font:inherit;font-size:16px;color:var(--ink);padding:0 16px;height:52px}
.fld input::placeholder,.fld textarea::placeholder{color:#6B7076}
.fld textarea{height:auto;padding:14px 16px;line-height:1.7;resize:none}
.oid{display:flex;gap:8px}
.oid input{font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:.24em;
  text-transform:uppercase;border-color:var(--sea-d);box-shadow:0 0 0 3px rgba(30,157,196,.16)}
.oid-go{flex:none;height:52px;padding:0 22px;border:0;border-radius:14px;background:var(--ink);
  color:#fff;font:inherit;font-size:15px;font-weight:700}
/* 확인이 끝나면 버튼은 눌린 상태로 남는다(다시 누를 일이 없다). */
.oid-go.done{display:inline-flex;align-items:center;gap:5px;background:#E4F3F8;color:var(--sea-d)}
.ok-line{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:14px;font-weight:700;color:var(--sea-d)}
.help{margin-top:6px;font-size:13.5px;line-height:1.6;color:var(--muted)}
.rate{display:flex;align-items:center;gap:4px;color:#F5B400}
.rate svg{width:34px;height:34px}
.rate b{margin-left:8px;font-size:15px;color:var(--ink)}
.drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  width:96px;height:96px;border:1.5px dashed #C9C6BE;border-radius:16px;color:var(--muted);
  font-size:13px;font-weight:700}
.rules-s{padding:14px 16px;border-radius:14px;background:var(--paper)}
.rules-s li{position:relative;padding-left:14px;font-size:13.5px;line-height:1.7;color:var(--text)}
.rules-s li::before{content:"";position:absolute;left:2px;top:.72em;width:4px;height:4px;border-radius:50%;background:var(--muted)}
.submit{display:flex;align-items:center;justify-content:center;gap:8px;height:56px;border-radius:999px;
  background:var(--ink);color:#fff;font-size:16px;font-weight:700}
"""

CSS_RD = """
.rv-hero{height:470px}
/* 사진을 더 밝게(운영자). 글이 놓인 왼쪽만 덮고 사람이 있는 오른쪽은 걷는다. */
.rv-hero .veil{background:linear-gradient(100deg,rgba(9,16,22,.74) 0%,rgba(9,16,22,.5) 30%,rgba(9,16,22,.08) 56%,rgba(9,16,22,0) 76%,rgba(9,16,22,.16) 100%)}
.rv-hero .hero-in{top:168px;text-shadow:0 1px 14px rgba(9,16,22,.4)}
.rv-hero .hero-in h1{font-size:60px}
.rv-sub{margin-top:16px;font-size:19px;line-height:1.7}
.loved{gap:12px;margin-top:26px}
.dots{gap:8px}
.dots i{width:40px;height:40px}
.dots i img{width:22px}
.loved b{font-size:15px}
.tabs{position:relative;z-index:6;margin:-29px auto 0;padding:5px}
.tabs a{height:48px;padding:0 22px;font-size:15.5px}
.sect{padding-top:96px}
#site{padding-top:88px}
.rv-h{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
.book-pill.write{height:52px;padding:0 26px;font-size:16px}
.rrow{margin:44px calc(var(--pad) * -1) 0;padding:0 var(--pad);display:grid;grid-auto-flow:column;
  grid-auto-columns:344px;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;
  scroll-padding:0 var(--pad);scrollbar-width:none}
.rc{height:532px}
.rc-b{padding:22px 24px 20px}
.rc-t{margin-top:16px;font-size:17px;line-height:1.75}
/* 넘김 버튼 — 줄의 양쪽 가장자리, 세로 가운데. 페이지 여백 안에 반쯤 걸친다. */
.car{position:relative}
.car-b{position:absolute;top:50%;z-index:3;display:inline-flex;align-items:center;justify-content:center;
  width:52px;height:52px;margin-top:-26px;border-radius:50%;border:1px solid var(--line);background:#fff;
  color:var(--ink);box-shadow:0 6px 18px rgba(16,20,24,.12);cursor:pointer}
/* 페이지 양쪽 여백 안, 화면 가장자리에서 14px. 줄이 화면 끝까지 흐르므로 오른쪽은 걸친 카드 위에 선다. */
.car-b.l{left:calc(14px - var(--pad))}
.car-b.r{right:calc(14px - var(--pad))}
.rc-by{margin-top:18px;padding-top:14px}
.src-h{gap:22px}
.src-logo{width:72px;height:72px;padding:14px}
.src-t h2{font-size:36px}
.src-t p{font-size:16px}
.src-t p > b{font-size:22px}
.src-go{margin-left:auto;font-size:15.5px}
.grow{margin:36px calc(var(--pad) * -1) 0;padding:0 var(--pad);display:grid;
  grid-auto-flow:column;grid-auto-columns:388px;gap:20px;overflow-x:auto;scrollbar-width:none}
.gc{padding:24px 26px}
.gc p{margin-top:16px;font-size:16px;line-height:1.75}
.gy-slot{margin-top:36px;padding:22px 22px 20px}
.gy-row{grid-template-columns:repeat(3,1fr);gap:18px}
.gy-sk{padding:24px;height:170px}
.gy-note{margin-top:18px}
.board-modal{height:1090px}
.modal{left:50%;top:56px;width:560px;transform:translateX(-50%);border-radius:24px}
.m-h{padding:20px 24px 18px 28px}
.m-b{gap:22px;padding:24px 28px 28px}
"""

CSS_RM = """
.rv-hero{height:452px}
/* 글은 내비 바로 아래로 올리고(운영자 요청), 사진도 함께 올려 두 사람이 탭 줄에
   눌리지 않게 한다. 글 뒤가 흰 구름이라 글 자리만 덮개를 짙게 하고 그림자를 준다. */
.rv-hero .hero-img{object-position:50% 70%}
.rv-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.62) 0%,rgba(9,16,22,.58) 56%,
  rgba(9,16,22,.1) 70%,rgba(9,16,22,.02) 84%,rgba(9,16,22,.3) 100%)}   /* 사람 쪽은 거의 걷는다(운영자: 더 밝게) */
.rv-hero .hero-in{top:88px;text-align:center;text-shadow:0 1px 14px rgba(9,16,22,.45)}
.rv-hero .hero-in h1{font-size:40px}
.rv-sub{margin-top:12px;font-size:16.5px;line-height:1.7}
.loved{justify-content:center;flex-wrap:wrap;gap:8px 10px;margin-top:20px}
.dots{gap:6px}
.dots i{width:34px;height:34px}
.dots i img{width:19px}
.loved b{font-size:14px}
.tabs{position:relative;z-index:6;margin:-26px var(--pad) 0;width:auto;padding:4px;justify-content:space-between}
.tabs a{flex:1;justify-content:center;height:44px;padding:0 6px;font-size:13.5px;gap:5px}
.tabs a{white-space:nowrap}
.tabs a .n{display:none}   /* 폰은 칸이 좁아 숫자를 뺀다 */
.sect{padding-top:64px}
#site{padding-top:56px}
.rv-h{display:flex;flex-direction:column;align-items:center;gap:22px}
.rv-h .lede{text-wrap:balance}   /* 첫 문장 끝 "있어요." 가 혼자 떨어지지 않게 */
.book-pill.write{height:52px;padding:0 26px;font-size:16px}
.rrow{margin:28px calc(var(--pad) * -1) 0;padding:0 var(--pad);display:grid;grid-auto-flow:column;
  grid-auto-columns:292px;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;
  scroll-padding:0 var(--pad);scrollbar-width:none}
.rrow::after{content:"";width:10px}
.rc-end{padding:24px}
.rc{height:511px}
.rc-b{padding:18px 18px 16px}
.rc-t{margin-top:14px;font-size:16px;line-height:1.75}
.rc-by{margin-top:14px;padding-top:12px}
.src-h{flex-direction:column;text-align:center;gap:14px}
.src-logo{width:64px;height:64px;padding:12px}
.src-t h2{font-size:30px}
.src-t p{justify-content:center;font-size:15px}
.src-t p > b{font-size:20px}
.src-go{font-size:15px}
.grow{margin:26px calc(var(--pad) * -1) 0;padding:0 var(--pad);display:grid;grid-auto-flow:column;
  grid-auto-columns:300px;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
.grow::after{content:"";width:10px}
.gc{padding:20px;scroll-snap-align:start}
.gc p{margin-top:14px;font-size:15.5px;line-height:1.75}
.gy-slot{margin-top:26px;padding:14px 14px 16px}
.gy-row{gap:12px}
.gy-sk{padding:20px;height:140px}
.gy-note{margin-top:14px;font-size:14px;line-height:1.6;padding:0 8px}
.board-modal{height:812px}
.modal.sheet{left:0;right:0;bottom:0;top:52px;border-radius:24px 24px 0 0}
.grab{display:block;width:40px;height:5px;margin:10px auto 0;border-radius:3px;background:#D6D3CC}
.m-h{padding:8px 16px 14px 22px}
.m-h h2{font-size:20px}
.m-b{gap:20px;padding:20px 22px 110px}
/* 긴 창은 안에서 스크롤되고, 등록 버튼은 바닥에 붙여 둔다. */
.sheet .sub-w{position:absolute;left:0;right:0;bottom:0;padding:12px 22px 26px;background:#fff;
  border-top:1px solid var(--line)}
"""


def page(mobile, write=False):
    body = hero(mobile) + tabs() + site_sec(mobile) + google_sec(mobile) + gyg_sec(mobile)
    if write:
        body = f'<div class="board-modal">{body}{modal(mobile)}</div>'
    else:
        body += D.foot()
    return body


def build(mobile, write=False, lang="ko"):
    global LANG
    LANG = lang
    D.C = _detail_en if lang == "en" else _detail_ko     # 내비·푸터 문구도 같은 언어로
    css = (D.CSS_M if mobile else D.CSS_D) + CSS_COMMON + (CSS_RM if mobile else CSS_RD)
    kind = t("k_write") if write else t("k_page")
    title = f"{kind}{t('suffix')} — {'모바일' if mobile else '데스크탑'}"
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{title}</title>
  <style>{D.fonts()}{css}
  </style>
</helmet>
<div class="page reviews">
{D.bind_su(page(mobile, write))}
</div>
</x-dc>
</body>
</html>
"""
    stem = ("ReviewWrite" if write else "Reviews") + ("En" if lang == "en" else "Ko")
    name = f"{stem}{'_M' if mobile else ''}.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")
    return name


OUT = [build(m, w) for w in (False, True) for m in (False, True)]
D.embed_fonts_exact(OUT)
OUT_EN = [build(m, w, "en") for w in (False, True) for m in (False, True)]
D.embed_fonts_en(OUT_EN)
D.C = _detail_ko
