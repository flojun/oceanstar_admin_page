/**
 * 맛집 추천 데이터. docs/design-canvas/v3/_restaurants.py 에서 파이썬으로 뽑았다(손으로 고치지 말고 다시 뽑는다).
 * 설명 속 이모지는 캔버스처럼 뺐고, 지도 링크는 캔버스 maps() 와 같은 구글 지도 검색 주소다.
 */
import type { Lang } from "../tours";

export type FoodKey = "sushi" | "local" | "waikiki" | "poke" | "dessert";
export type FoodCat = { key: FoodKey; title: string; items: { name: string; desc: string; map: string }[] };

export const FOOD: Record<Lang, FoodCat[]> = {
    ko: [
    {
        "key": "sushi",
        "title": "신선하고 맛있는 일식",
        "items": [
            {
                "name": "Mitch’s Fish Market & Sushi Bar",
                "desc": "로컬들이 좋아하는 스시 집",
                "map": "https://www.google.com/maps/search/?api=1&query=Mitch%27s+Fish+Market+%26+Sushi+Bar+Honolulu"
            },
            {
                "name": "Katsumidori Sushi Tokyo",
                "desc": "호텔 안 분위기 좋은 일식 집",
                "map": "https://www.google.com/maps/search/?api=1&query=Katsumidori+Sushi+Tokyo+Honolulu"
            },
            {
                "name": "Totoya",
                "desc": "카이센동, 네기토로 맛집",
                "map": "https://www.google.com/maps/search/?api=1&query=Totoya+Honolulu"
            },
            {
                "name": "Imanas Tei",
                "desc": "로컬들이 좋아하는 이자카야",
                "map": "https://www.google.com/maps/search/?api=1&query=Imanas+Tei+Honolulu"
            },
            {
                "name": "Shabuya",
                "desc": "간단하게 먹기 좋은 무한 리필 샤브샤브",
                "map": "https://www.google.com/maps/search/?api=1&query=Shabuya+Honolulu"
            }
        ]
    },
    {
        "key": "local",
        "title": "하와이스러운 로컬 음식",
        "items": [
            {
                "name": "Zippy’s",
                "desc": "하와이 로컬푸드/ 하와이의 김밥천국 (로코모코, 코리안 치킨 샐러드 추천!)",
                "map": "https://www.google.com/maps/search/?api=1&query=Zippy%27s+Honolulu"
            },
            {
                "name": "Bogart’s",
                "desc": "하와이식 브런치!",
                "map": "https://www.google.com/maps/search/?api=1&query=Bogart%27s+Honolulu"
            },
            {
                "name": "Haleiwa Joe’s",
                "desc": "로컬들이 좋아하는 로컬/ 미국 음식 분위기",
                "map": "https://www.google.com/maps/search/?api=1&query=Haleiwa+Joe%27s+Honolulu"
            },
            {
                "name": "Spero Spera",
                "desc": "로컬 샌드위치 맛집 (아보카도 스테이크 샌드위치 & 아사이볼 추천!)",
                "map": "https://www.google.com/maps/search/?api=1&query=Spero+Spera+Honolulu"
            },
            {
                "name": "Helena’s",
                "desc": "정통 하와이안 음식",
                "map": "https://www.google.com/maps/search/?api=1&query=Helena%27s+Honolulu"
            }
        ]
    },
    {
        "key": "waikiki",
        "title": "와이키키 맛집 추천",
        "items": [
            {
                "name": "Arancino di Mare",
                "desc": "이탈리안 맛집",
                "map": "https://www.google.com/maps/search/?api=1&query=Arancino+di+Mare+Honolulu"
            },
            {
                "name": "Herringbone",
                "desc": "분위기 좋은 저녁",
                "map": "https://www.google.com/maps/search/?api=1&query=Herringbone+Honolulu"
            },
            {
                "name": "Tsurutonton",
                "desc": "냉 명란우동 맛집, 마루카메 우동보다 맛있어요!",
                "map": "https://www.google.com/maps/search/?api=1&query=Tsurutonton+Honolulu"
            },
            {
                "name": "Maui Brewing Co.",
                "desc": "하와이 양조장 맥주, 가성비 안주도 굳!",
                "map": "https://www.google.com/maps/search/?api=1&query=Maui+Brewing+Co.+Honolulu"
            },
            {
                "name": "Island Vintage Wine Bar",
                "desc": "와인과 맛있는 로컬식 안주",
                "map": "https://www.google.com/maps/search/?api=1&query=Island+Vintage+Wine+Bar+Honolulu"
            }
        ]
    },
    {
        "key": "poke",
        "title": "포케 맛집",
        "items": [
            {
                "name": "Foodland Poke Bar",
                "desc": "Spicy Ahi 강추!",
                "map": "https://www.google.com/maps/search/?api=1&query=Foodland+Poke+Bar+Honolulu"
            },
            {
                "name": "Off The Hook",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Off+The+Hook+Honolulu"
            },
            {
                "name": "Fresh Catch",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Fresh+Catch+Honolulu"
            },
            {
                "name": "Nico’s Pier 38",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Nico%27s+Pier+38+Honolulu"
            }
        ]
    },
    {
        "key": "dessert",
        "title": "디저트",
        "items": [
            {
                "name": "Matcha Maiko",
                "desc": "진하고 쌉쌀한 마차 아이스크림",
                "map": "https://www.google.com/maps/search/?api=1&query=Matcha+Maiko+Honolulu"
            },
            {
                "name": "Nana’s Green Tea",
                "desc": "호지차 라떼/ 아이스크림 강추!!",
                "map": "https://www.google.com/maps/search/?api=1&query=Nana%27s+Green+Tea+Honolulu"
            },
            {
                "name": "Mosa Ice Cream",
                "desc": "모찌 & 견과류 아이스크림",
                "map": "https://www.google.com/maps/search/?api=1&query=Mosa+Ice+Cream+Honolulu"
            },
            {
                "name": "Coffee or Tea",
                "desc": "로컬들이 좋아하는 밀크티/ 빙수",
                "map": "https://www.google.com/maps/search/?api=1&query=Coffee+or+Tea+Honolulu"
            },
            {
                "name": "Leahi Health",
                "desc": "아사이볼",
                "map": "https://www.google.com/maps/search/?api=1&query=Leahi+Health+Honolulu"
            },
            {
                "name": "Lanikai Juice",
                "desc": "아사이볼",
                "map": "https://www.google.com/maps/search/?api=1&query=Lanikai+Juice+Honolulu"
            },
            {
                "name": "Da Cove Health Bar and Cafe",
                "desc": "아사이볼",
                "map": "https://www.google.com/maps/search/?api=1&query=Da+Cove+Health+Bar+and+Cafe+Honolulu"
            }
        ]
    }
],
    en: [
    {
        "key": "sushi",
        "title": "Fresh Japanese",
        "items": [
            {
                "name": "Mitch’s Fish Market & Sushi Bar",
                "desc": "A sushi spot the locals love",
                "map": "https://www.google.com/maps/search/?api=1&query=Mitch%27s+Fish+Market+%26+Sushi+Bar+Honolulu"
            },
            {
                "name": "Katsumidori Sushi Tokyo",
                "desc": "Japanese dining with a nice atmosphere, inside a hotel",
                "map": "https://www.google.com/maps/search/?api=1&query=Katsumidori+Sushi+Tokyo+Honolulu"
            },
            {
                "name": "Totoya",
                "desc": "Go-to for kaisendon and negitoro",
                "map": "https://www.google.com/maps/search/?api=1&query=Totoya+Honolulu"
            },
            {
                "name": "Imanas Tei",
                "desc": "An izakaya the locals love",
                "map": "https://www.google.com/maps/search/?api=1&query=Imanas+Tei+Honolulu"
            },
            {
                "name": "Shabuya",
                "desc": "All-you-can-eat shabu-shabu for an easy meal",
                "map": "https://www.google.com/maps/search/?api=1&query=Shabuya+Honolulu"
            }
        ]
    },
    {
        "key": "local",
        "title": "Hawaiian local food",
        "items": [
            {
                "name": "Zippy’s",
                "desc": "Hawaii’s favorite local diner (try the loco moco and Korean chicken salad!)",
                "map": "https://www.google.com/maps/search/?api=1&query=Zippy%27s+Honolulu"
            },
            {
                "name": "Bogart’s",
                "desc": "Hawaiian-style brunch!",
                "map": "https://www.google.com/maps/search/?api=1&query=Bogart%27s+Honolulu"
            },
            {
                "name": "Haleiwa Joe’s",
                "desc": "Local and American food with a laid-back vibe the locals love",
                "map": "https://www.google.com/maps/search/?api=1&query=Haleiwa+Joe%27s+Honolulu"
            },
            {
                "name": "Spero Spera",
                "desc": "Great local sandwiches (try the avocado steak sandwich and acai bowl!)",
                "map": "https://www.google.com/maps/search/?api=1&query=Spero+Spera+Honolulu"
            },
            {
                "name": "Helena’s",
                "desc": "Authentic Hawaiian food",
                "map": "https://www.google.com/maps/search/?api=1&query=Helena%27s+Honolulu"
            }
        ]
    },
    {
        "key": "waikiki",
        "title": "Waikiki favorites",
        "items": [
            {
                "name": "Arancino di Mare",
                "desc": "Great Italian",
                "map": "https://www.google.com/maps/search/?api=1&query=Arancino+di+Mare+Honolulu"
            },
            {
                "name": "Herringbone",
                "desc": "For a dinner with a view",
                "map": "https://www.google.com/maps/search/?api=1&query=Herringbone+Honolulu"
            },
            {
                "name": "Tsurutonton",
                "desc": "Cold mentaiko udon, even better than Marugame!",
                "map": "https://www.google.com/maps/search/?api=1&query=Tsurutonton+Honolulu"
            },
            {
                "name": "Maui Brewing Co.",
                "desc": "Hawaii-brewed beer and good-value bites",
                "map": "https://www.google.com/maps/search/?api=1&query=Maui+Brewing+Co.+Honolulu"
            },
            {
                "name": "Island Vintage Wine Bar",
                "desc": "Wine with tasty local-style small plates",
                "map": "https://www.google.com/maps/search/?api=1&query=Island+Vintage+Wine+Bar+Honolulu"
            }
        ]
    },
    {
        "key": "poke",
        "title": "Poke",
        "items": [
            {
                "name": "Foodland Poke Bar",
                "desc": "Get the Spicy Ahi!",
                "map": "https://www.google.com/maps/search/?api=1&query=Foodland+Poke+Bar+Honolulu"
            },
            {
                "name": "Off The Hook",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Off+The+Hook+Honolulu"
            },
            {
                "name": "Fresh Catch",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Fresh+Catch+Honolulu"
            },
            {
                "name": "Nico’s Pier 38",
                "desc": "",
                "map": "https://www.google.com/maps/search/?api=1&query=Nico%27s+Pier+38+Honolulu"
            }
        ]
    },
    {
        "key": "dessert",
        "title": "Dessert",
        "items": [
            {
                "name": "Matcha Maiko",
                "desc": "Rich, bittersweet matcha ice cream",
                "map": "https://www.google.com/maps/search/?api=1&query=Matcha+Maiko+Honolulu"
            },
            {
                "name": "Nana’s Green Tea",
                "desc": "Get the hojicha latte or ice cream!",
                "map": "https://www.google.com/maps/search/?api=1&query=Nana%27s+Green+Tea+Honolulu"
            },
            {
                "name": "Mosa Ice Cream",
                "desc": "Mochi and nut ice cream",
                "map": "https://www.google.com/maps/search/?api=1&query=Mosa+Ice+Cream+Honolulu"
            },
            {
                "name": "Coffee or Tea",
                "desc": "Milk tea and shave ice the locals love",
                "map": "https://www.google.com/maps/search/?api=1&query=Coffee+or+Tea+Honolulu"
            },
            {
                "name": "Leahi Health",
                "desc": "Acai bowls",
                "map": "https://www.google.com/maps/search/?api=1&query=Leahi+Health+Honolulu"
            },
            {
                "name": "Lanikai Juice",
                "desc": "Acai bowls",
                "map": "https://www.google.com/maps/search/?api=1&query=Lanikai+Juice+Honolulu"
            },
            {
                "name": "Da Cove Health Bar and Cafe",
                "desc": "Acai bowls",
                "map": "https://www.google.com/maps/search/?api=1&query=Da+Cove+Health+Bar+and+Cafe+Honolulu"
            }
        ]
    }
],
};

/** 포케 주문 팁: [머리말, 굵은 줄, 설명] */
export const POKE_TIP: Record<Lang, [string, string, string]> = {
    "ko": [
        "주문 팁",
        "Ahi: 참치 / Salmon: 연어 / Hamachi: 방어",
        "매콤마요 (Spicy Mayo) 와 간장 (Shoyu) 베이스 하나씩 추천!"
    ],
    "en": [
        "How to order",
        "Ahi: tuna / Salmon / Hamachi: yellowtail",
        "Get one Spicy Mayo and one Shoyu (soy sauce) bowl to share!"
    ]
};
