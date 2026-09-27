# -*- coding: utf-8 -*-
"""맛집 추천 페이지 문안(한/영). 운영 중인 사이트 src/app/(ko)/kr/restaurants/page.tsx 를
옮겼다(영문 경로 /restaurants 도 지금은 같은 한국어 페이지라, 영문 설명은 새로 옮겼다).

원문에서 바꾼 곳:
  - 가게 이름 오타: 'Maui Breweing Co.' → 'Maui Brewing Co.', 'Match Maiko’s' → 'Matcha Maiko',
    'Imana’s Tei' → 'Imanas Tei' (실제 상호 표기)
  - 분류 제목의 이모지는 뺐다(아이콘이 대신한다). 가게 설명 문장은 원문 그대로.
"""

# (분류 키, 제목, 가게 목록[(이름, 설명)])
KO = [
    ("sushi", "신선하고 맛있는 일식", [
        ("Mitch’s Fish Market & Sushi Bar", "로컬들이 좋아하는 스시 집"),
        ("Katsumidori Sushi Tokyo", "호텔 안 분위기 좋은 일식 집"),
        ("Totoya", "카이센동, 네기토로 맛집👍🏻"),
        ("Imanas Tei", "로컬들이 좋아하는 이자카야"),
        ("Shabuya", "간단하게 먹기 좋은 무한 리필 샤브샤브"),
    ]),
    ("local", "하와이스러운 로컬 음식", [
        ("Zippy’s", "하와이 로컬푸드/ 하와이의 김밥천국 (로코모코, 코리안 치킨 샐러드 추천!)"),
        ("Bogart’s", "하와이식 브런치!"),
        ("Haleiwa Joe’s", "로컬들이 좋아하는 로컬/ 미국 음식 분위기👍🏻"),
        ("Spero Spera", "로컬 샌드위치 맛집 (아보카도 스테이크 샌드위치 & 아사이볼 추천!)"),
        ("Helena’s", "정통 하와이안 음식"),
    ]),
    ("waikiki", "와이키키 맛집 추천", [
        ("Arancino di Mare", "이탈리안 맛집"),
        ("Herringbone", "분위기 좋은 저녁🌆"),
        ("Tsurutonton", "냉 명란우동 맛집, 마루카메 우동보다 맛있어요!"),
        ("Maui Brewing Co.", "하와이 양조장 맥주, 가성비 안주도 굳!"),
        ("Island Vintage Wine Bar", "와인과 맛있는 로컬식 안주"),
    ]),
    ("poke", "포케 맛집", [
        ("Foodland Poke Bar", "Spicy Ahi 강추!"),
        ("Off The Hook", ""),
        ("Fresh Catch", ""),
        ("Nico’s Pier 38", ""),
    ]),
    ("dessert", "디저트", [
        ("Matcha Maiko", "진하고 쌉쌀한 마차 아이스크림"),
        ("Nana’s Green Tea", "호지차 라떼/ 아이스크림 강추!!"),
        ("Mosa Ice Cream", "모찌 & 견과류 아이스크림🤍"),
        ("Coffee or Tea", "로컬들이 좋아하는 밀크티/ 빙수"),
        ("Leahi Health", "아사이볼💜"),
        ("Lanikai Juice", "아사이볼💜"),
        ("Da Cove Health Bar and Cafe", "아사이볼💜"),
    ]),
]

EN = [
    ("sushi", "Fresh Japanese", [
        ("Mitch’s Fish Market & Sushi Bar", "A sushi spot the locals love"),
        ("Katsumidori Sushi Tokyo", "Japanese dining with a nice atmosphere, inside a hotel"),
        ("Totoya", "Go-to for kaisendon and negitoro"),
        ("Imanas Tei", "An izakaya the locals love"),
        ("Shabuya", "All-you-can-eat shabu-shabu for an easy meal"),
    ]),
    ("local", "Hawaiian local food", [
        ("Zippy’s", "Hawaii’s favorite local diner (try the loco moco and Korean chicken salad!)"),
        ("Bogart’s", "Hawaiian-style brunch!"),
        ("Haleiwa Joe’s", "Local and American food with a laid-back vibe the locals love"),
        ("Spero Spera", "Great local sandwiches (try the avocado steak sandwich and acai bowl!)"),
        ("Helena’s", "Authentic Hawaiian food"),
    ]),
    ("waikiki", "Waikiki favorites", [
        ("Arancino di Mare", "Great Italian"),
        ("Herringbone", "For a dinner with a view"),
        ("Tsurutonton", "Cold mentaiko udon, even better than Marugame!"),
        ("Maui Brewing Co.", "Hawaii-brewed beer and good-value bites"),
        ("Island Vintage Wine Bar", "Wine with tasty local-style small plates"),
    ]),
    ("poke", "Poke", [
        ("Foodland Poke Bar", "Get the Spicy Ahi!"),
        ("Off The Hook", ""),
        ("Fresh Catch", ""),
        ("Nico’s Pier 38", ""),
    ]),
    ("dessert", "Dessert", [
        ("Matcha Maiko", "Rich, bittersweet matcha ice cream"),
        ("Nana’s Green Tea", "Get the hojicha latte or ice cream!"),
        ("Mosa Ice Cream", "Mochi and nut ice cream"),
        ("Coffee or Tea", "Milk tea and shave ice the locals love"),
        ("Leahi Health", "Acai bowls"),
        ("Lanikai Juice", "Acai bowls"),
        ("Da Cove Health Bar and Cafe", "Acai bowls"),
    ]),
]

# 포케 주문 팁(원문 그대로)
POKE_TIP = {
    "ko": ("주문 팁", "Ahi: 참치 / Salmon: 연어 / Hamachi: 방어",
           "매콤마요 (Spicy Mayo) 와 간장 (Shoyu) 베이스 하나씩 추천!"),
    "en": ("How to order", "Ahi: tuna / Salmon / Hamachi: yellowtail",
           "Get one Spicy Mayo and one Shoyu (soy sauce) bowl to share!"),
}
