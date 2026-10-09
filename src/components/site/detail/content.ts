/**
 * 상세 페이지 문안 (한/영 × 5상품). docs/design-canvas/v3/_detail_*_{ko,en}.py 에서 그대로 옮겼다.
 * 문자열 안의 <br>, <span class="hl"> 는 캔버스 그대로라 dangerouslySetInnerHTML 로 그린다 (우리 코드 안의 고정 문안).
 * HERO.price 는 쓰지 않는다. 가격은 tour_settings 에서 계산한다 (tours.ts).
 */
/* eslint-disable */
export const DETAIL: Record<string, any> = {
 "turtle_ko": {
  "COURSE": [
   [
    "🚐 와이키키 호텔 픽업",
    "20분 소요",
    "🌺 알로하~ 고객님이 묵으시는 호텔에서 가장 가까운 와이키키 내 지정 픽업 장소에서 한국인 가이드가 15인승 밴으로 직접 픽업해 드립니다. 선착장까지 쾌적하고 편안하게 이동해보세요~! 픽업 시간은 개별 안내 드립니다. 카할라 호텔 픽업은 별도 비용이 있습니다. 직접 배로 오시는 경우는 주차 및 오시는길 안내드립니다😊",
    null,
    "van"
   ],
   [
    "⛵ 케왈로 하버 도착 및 승선",
    null,
    "와이키키에서 15분 거리에 위치한 아름다운 케왈로 하버에서 거북이 스노클링 투어를 위한 배에 탑승하세요~! 🏝 와이키키에서! 유일하게 나무 루프를 가진 가장 튼튼하고 해양 액티비티에 최적화된 유서깊은 배입니다! 루프탑으로 흔들림도 최소화 되어 멀미를 덜 유발합니다. 배에 탑승하시면 안전교육과 투어 안내를 받으시고 구명조끼 및 스노클링 장비를 지급해드립니다. 🐙",
    "*시즌과 날씨가 맞는 경우 오션스타 캡틴이 돌고래와 고래를 찾아드립니다 🐬🐋",
    "boat"
   ],
   [
    "🐢 바닷속 거북이와 함께하는 스노클링",
    "180분 소요",
    "와이키키 터틀 캐니언에서 하와이 바다 거북이와 다양한 태평양 물고기들을 만나보세요~! 크루들이 거북이 스팟으로 인솔해드리며 수중 사진·영상 촬영도 도와드려요! 여유롭게 스노클링을 하시는 동안 크루들이 옆에서 함께하니 걱정없이 태평양 바다를 즐겨보세요! 혹시 수영을 못하셔도 걱정마세요🏊 수영이 어려우시거나 조금 겁나시는 분들은 익숙해지실때까지 (혹은 끝까지) 크루들이 보드로 끌어드립니다.",
    "*고프로 대여시 수중 다이빙으로 거북이 초!근접 사진과 동영상도 촬영 가능합니다 🐢",
    "turtle"
   ],
   [
    "스탠드업 패들보드+바다 카약+ 바다의자 튜브",
    null,
    "스노클링만 하고 떠나기엔 아쉽죠~! 마치 와이키키 바다를 전세 낸 듯한 특별한 시간✨ 바다 카약을 타고 태평양 위를 여유롭게 떠다니고, 스탠드업 패들보드로 밸런스 챌린지까지 경험해보세요! 코어 운동은 보너스랍니다~ 💪 바다 한가운데 앉아 쉴 수 있는 바다 의자 튜브까지 준비 완료되어 있으니 자유롭게 즐겨주세요!",
    "*안전을위해 묶어둔 끈은 요청시 모두 풀어드립니다 😄",
    "sup2"
   ],
   [
    "🌊 선상 보트 다이빙",
    null,
    "🌺 ONLY 오션스타에서만 누릴 수 있는 보트 위 다이빙 스팟! 해양액티비티에 최적화 된 보트위에서 바닷 속 다이빙을 안전하게 즐겨보세요🏄 와이키키 터틀 캐니언의 유일한 보트 다이빙✨ 다이아몬드 헤드와 끝없이 펼쳐진 수평선을 뒤로 하는 시원한 태평양 다이빙! 사진과 동영상도 놓치면 안되는거 아시죠?!",
    null,
    "dive"
   ],
   [
    "🍜 물놀이후 빠질수 없는 간식 타임",
    null,
    "한국인이라면 물놀이 후 무조건 생각나는 그것!❤️ 태평양 한가운데서 뜨끈한 김치사발면과 새우탕면을 제공해드립니다🍜 미국 국민간식 팝타르트🍪, 믹스커피와 따뜻한 차까지 자유롭게 즐겨보세요! 당 & 에너지 충전 제대로 하고 남은시간도 알차게 액티비티로 채워보세요~!",
    null,
    "bowl"
   ],
   [
    "다이아몬드헤드 배경 인생샷 타임",
    null,
    "하와이에서의 행복하고 아름다운 추억을 찍어드립니다📷🖼 사진작가 저리가라하는 오션스타 크루들의 사진 실력으로 평생 남을 추억, 인생샷을 남겨보세요🧡 다이아몬드헤드, 와이키키 해변가, 태평양 바다를 배경으로 마음껏 누리는 포토타임!",
    null,
    "photo"
   ],
   [
    "🚐 와이키키 호텔 귀가",
    "20분 소요",
    "🌺 아쉽지만 트립이 끝나셨습니다😢 다시 와이키키 호텔로 안전하게 모셔드립니다. 오션스타와 거북이와 함께한 특별한 경험, 행복한 추억, 인생샷 모두 오래오래 간직하세요! 하와이에서의 남은 시간도 좋은 여행 되세요~! 마할로🤙",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "코스 소개",
  "COURSE_HINT": "8단계 · 옆으로 넘겨 보세요",
  "DAYS": [
   "월",
   "화",
   "수",
   "목",
   "금",
   "토",
   "일"
  ],
  "END_H2": "지금 바다로 나가 볼까요",
  "END_SUB": "일요일을 제외하고 매일 출항합니다.<br>원하시는 날짜를 골라 주세요.",
  "FEATURES": [
   [
    "01",
    "하와이 원조",
    "한국인 대상 거북이 스노클링 업체",
    [
     "와이키키에서 처음으로 한국인 거북이 스노클링을 시작한 업체입니다.<br>전문적이고 친절한 한국인 직원들과 편하게 소통하며, 하와이 베스트셀러의 퀄리티를 직접 경험해보세요."
    ],
    null
   ],
   [
    "02",
    "와이키키 유일 나무 루프탑",
    "자외선, 비, 멀미 100% 차단",
    [
     "루프탑으로 뜨거운 햇빛과 비를 차단하고, 안정적인 지붕 구조로 흔들림과 멀미를 최소화합니다."
    ],
    "타업체와 달리 전원이 쾌적한 지붕 아래 앉아 편안하고 안전하게 즐기는 진짜 배려있는 투어!"
   ],
   [
    "03",
    "오션스타 자체 기획 & 도입",
    "해양 4종 액티비티 + 인생샷",
    [
     "스탠드업 패들보드, 카약, 씨체어, 다이빙 등 스노클링과 함께 자유롭게 즐기는 다양한 액티비티!",
     "다이아몬드헤드와 와이키키를 배경으로 인생샷도 마음껏 찍어드립니다."
    ],
    null
   ],
   [
    "04",
    "거북이 100% 보장제",
    "타업체보다 한 시간 더",
    [
     "거북이와 함께하는 인생 스노클링을 100% 보장합니다. 타업체보다 한 시간 더, 여유롭게 즐겨보세요.<br>오션스타를 선택하신 고객님의 특별하고 행복한 하루를 책임집니다."
    ],
    "운좋은 날은 돌고래 와칭 가능!"
   ],
   [
    "05",
    "최신형 정품 고프로 대여 & 촬영",
    "대여비 $40",
    [
     "고프로 대여 시, 바닷속 깊이까지 다이빙해 거북이와 다양한 물고기를 초근접 촬영해드립니다.<br>특별한 하루를 사진과 영상으로 담아드립니다.",
     "대여비는 현장에서 현금 또는 계좌이체로 결제합니다."
    ],
    null
   ],
   [
    "06",
    "안전과 위생 최우선",
    "매일 5단계 소독",
    [
     "고객님의 쾌적하고 특별한 하루를 위해 안전교육과 미 해양경비대 승인 구명조끼, 상해보험은 물론 장비와 선내외를 매일 5단계 소독하여 관리합니다.",
     "투어 중 청결 관리도 직접 확인해보세요. 개인 장비도 지참하실 수 있습니다."
    ],
    null
   ]
  ],
  "FEAT_H2": "‘오션스타’만의 <span class=\"hl\">6가지 특장점</span>",
  "FLOW_H2": "일정 안내",
  "FLOW_NOTE": "기사님이 성함을 호명하시면 오션스타 확인 후 탑승해주세요.",
  "FLOW_SUB": "호텔 픽업으로 시작해 호텔 복귀로 끝나는 4시간입니다.",
  "HERO": {
   "eyebrow": "하와이 거북이 스노클링의 원조, 오션스타",
   "h1": "와이키키 거북이 스노클링<br><span class=\"hl\">100% 보장</span>",
   "badge": "압도적 업계 통합 누적 리뷰 15,000개",
   "price": "₩151,570",
   "price_sub": "성인 1인 · 24개월 미만 무료",
   "facts": [
    [
     "소요 시간",
     "4시간 (픽업·드롭 포함)"
    ],
    [
     "출발 시간",
     "1부 07:30 · 2부 10:30"
    ],
    [
     "픽업",
     "와이키키 내 지정 장소 무료 셔틀"
    ],
    [
     "포함",
     "장비 · 라면과 음료 · 인생샷 촬영"
    ]
   ],
   "pure": "배는 08:00 출항해 11:00 항구로 돌아옵니다. 앞뒤 30분은 픽업과 드롭 시간입니다."
  },
  "JOURNEY": [
   [
    "호텔 픽업",
    "van"
   ],
   [
    "출항",
    null
   ],
   [
    "다이아몬드헤드 크루즈",
    null
   ],
   [
    "거북이 스노클링",
    null
   ],
   [
    "해양 4종",
    null
   ],
   [
    "간식 & 인생샷",
    null
   ],
   [
    "와이키키 크루즈",
    null
   ],
   [
    "도착",
    null
   ],
   [
    "호텔 복귀",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "boat_private.webp",
    "단독 프라이빗 대관",
    "우리끼리만 즐기는 와이키키 거북이 스노클링 & 크루즈"
   ],
   [
    "sunset.jpg",
    "로맨틱 선셋 크루즈",
    "선셋 거북이 스노클링 + 해양 4종 + 와인 크루즈"
   ]
  ],
  "MORE_H2": "오션스타만의 특별상품",
  "PERKS": [
   [
    "van",
    "와이키키 왕복 셔틀 제공",
    "오션스타 전용 차량(총 3대) 운영.<br>신형 포드 15인승 밴으로 편안하고 쾌적하게 모십니다."
   ],
   [
    "gear",
    "장비 무료 제공",
    "스노클링 장비, 오리발, 구명조끼 등 액티비티에 필요한 장비를 무료로 드립니다. 사이즈별로 갖췄습니다."
   ],
   [
    "bowl",
    "물놀이에는 역시 라면",
    "물놀이 후 빠질 수 없는 라면과 스낵, 음료까지 무료로 제공합니다."
   ],
   [
    "camera",
    "인생샷 촬영",
    "빛나는 다이아몬드헤드와 와이키키 바다를 배경으로 최고의 인생샷을 남겨 드립니다."
   ]
  ],
  "PERKS_H2": "여행을 더 간편하고 특별하게",
  "SLOTS": [
   [
    "1부",
    [
     "07:30 - 11:30"
    ],
    6,
    "sea"
   ],
   [
    "2부",
    [
     "10:30 - 14:30"
    ],
    6,
    "deep"
   ],
   [
    "선셋 스노클링",
    [
     "14:30 - 18:30",
     "15:30 - 19:30"
    ],
    4,
    "food"
   ]
  ],
  "STARS": [
   "배우 박보영님",
   "야노시호님",
   "추사랑님",
   "배우 이선빈님",
   "배우 조유리님",
   "댄서 가비님",
   "배우 이시영님",
   "방송인 김대호님",
   "유튜버 이말년(침착맨)님",
   "배우 장원영님",
   "수영 국가대표 황선우님",
   "가수 겸 배우 이승기님",
   "유튜버 엔조이커플",
   "우리 WON 여자 프로 농구단",
   "(전)티르티르 이유빈 대표님"
  ],
  "STAR_BADGE": "협찬 X · 광고 X · 100% 내돈내산",
  "STAR_H2": "스타들의 <span class=\"hl\">찐방문 인증샷</span>",
  "STAR_SUB": "수많은 스타들이 직접 찾아온 하와이 대표 스노클링, 오션스타",
  "STAR_TAG": "@oceanstar_turtlesnorkelling",
  "THEME": "turtle",
  "TIME_H2": "투어 시간 안내",
  "TIME_NOTES": [
   "일요일은 안전점검으로 휴무입니다.",
   "선셋 스노클링은 동절기·하절기에 따라 시간이 변동될 수 있습니다.",
   "예약이 확정되면 바우처를 이메일로 보내드립니다."
  ],
  "TIME_PURE": "표에 적힌 시간은 픽업부터 드롭까지입니다.<br>1부 기준 배는 08:00 출항해 11:00 항구로 돌아오고, 앞뒤 30분이 픽업과 드롭 시간입니다.",
  "TIME_SUB": "예약할 때 1부와 2부 중에서 고르실 수 있습니다."
 },
 "turtle_en": {
  "COURSE": [
   [
    "🚐 Waikiki hotel pickup",
    "20 min",
    "🌺 Aloha! Our guide will pick you up in a 15-passenger van at the designated Waikiki pickup spot closest to your hotel. Ride to the harbor in comfort! Pickup times are sent to each guest individually. Pickup from the Kahala Hotel costs extra. If you’re coming to the boat on your own, we’ll send you parking info and directions😊",
    null,
    "van"
   ],
   [
    "⛵ Arrive at Kewalo Harbor & board",
    null,
    "Board the turtle snorkeling boat at beautiful Kewalo Harbor, just 15 minutes from Waikiki! 🏝 The only boat in Waikiki with a wooden roof, it’s a sturdy, historic vessel built for ocean activities! The rooftop minimizes rocking, so you’re less likely to get seasick. Once aboard, you’ll get a safety briefing and tour overview, plus life jackets and snorkel gear. 🐙",
    "*When the season and weather allow, the OceanStar captain will look for dolphins and whales 🐬🐋",
    "boat"
   ],
   [
    "🐢 Snorkeling with sea turtles",
    "180 min",
    "Meet Hawaiian sea turtles and all kinds of Pacific fish at Waikiki’s Turtle Canyon! Our crew lead you to the turtle spots and help with underwater photos and videos. The crew stay right beside you while you snorkel at your own pace, so enjoy the Pacific worry-free! Can’t swim? Don’t worry🏊 If swimming is hard for you or you feel a little nervous, our crew will tow you on a board until you’re comfortable (or the whole time).",
    "*Rent a GoPro and we can dive down for super close-up turtle photos and videos 🐢",
    "turtle"
   ],
   [
    "Stand-up paddleboard + sea kayak + sea chair tube",
    null,
    "Leaving after just snorkeling would be a shame! A special time that feels like you have the Waikiki ocean all to yourself✨ Float across the Pacific in a sea kayak and take on a balance challenge on a stand-up paddleboard! The core workout is a bonus 💪 There’s even a sea chair tube for relaxing in the middle of the ocean, so enjoy it all as you like!",
    "*Lines tied on for safety can all be untied on request 😄",
    "sup2"
   ],
   [
    "🌊 Diving from the boat",
    null,
    "🌺 A dive spot right off the boat, ONLY at OceanStar! Dive safely into the ocean from a boat built for water activities🏄 The only boat diving at Waikiki’s Turtle Canyon✨ A refreshing Pacific dive with Diamond Head and the endless horizon behind you! You know you can’t miss the photos and videos, right?!",
    null,
    "dive"
   ],
   [
    "🍜 Snack time after the swim",
    null,
    "The perfect treat after a swim!❤️ We serve hot kimchi and shrimp cup ramen right in the middle of the Pacific🍜 Help yourself to America’s favorite snack, Pop-Tarts🍪, plus instant coffee mix and hot tea! Recharge your sugar & energy and fill the rest of your time with activities!",
    null,
    "bowl"
   ],
   [
    "Photo time with Diamond Head",
    null,
    "We capture your happy, beautiful memories of Hawaii📷🖼 With OceanStar crew photo skills that rival the pros, take home photos of a lifetime you’ll treasure forever🧡 Enjoy all the photo time you want with Diamond Head, Waikiki Beach and the Pacific as your backdrop!",
    null,
    "photo"
   ],
   [
    "🚐 Back to your Waikiki hotel",
    "20 min",
    "🌺 Sadly, your trip has come to an end😢 We’ll take you safely back to your Waikiki hotel. Treasure the special experience, happy memories and amazing photos with OceanStar and the turtles for a long time! Enjoy the rest of your time in Hawaii! Mahalo🤙",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "Tour course",
  "COURSE_HINT": "8 steps · Swipe to see more",
  "DAYS": [
   "Mon",
   "Tue",
   "Wed",
   "Thu",
   "Fri",
   "Sat",
   "Sun"
  ],
  "END_H2": "Ready to head out to sea?",
  "END_SUB": "We sail every day except Sunday.<br>Pick the date that works for you.",
  "FEATURES": [
   [
    "01",
    "The Hawaii original",
    "The original Turtle Canyon tour",
    [
     "We have run turtle snorkeling off Waikiki since 2019 and know Turtle Canyon better than anyone.<br>Our professional, friendly crew looks after you, so you can experience the quality of a Hawaii best seller for yourself."
    ],
    null
   ],
   [
    "02",
    "Waikiki’s only wooden rooftop",
    "Blocks 100% of UV, rain & seasickness",
    [
     "The rooftop keeps out the hot sun and rain, and its stable roof structure minimizes rocking and seasickness."
    ],
    "Unlike other companies, everyone sits under a comfortable roof. A truly considerate tour, relaxing and safe!"
   ],
   [
    "03",
    "Designed & introduced by OceanStar",
    "5 ocean activities + photos of a lifetime",
    [
     "Stand-up paddleboards, kayaks, sea chairs, diving and more. Enjoy a variety of activities freely along with snorkeling!",
     "We’ll also take as many great photos as you like with Diamond Head and Waikiki in the background."
    ],
    null
   ],
   [
    "04",
    "100% turtle sighting guarantee",
    "One hour longer than others",
    [
     "We guarantee 100% an unforgettable snorkel with turtles. Relax and enjoy one hour longer than other companies.<br>When you choose OceanStar, we make sure your day is special and happy."
    ],
    "On lucky days, you may even spot dolphins!"
   ],
   [
    "05",
    "Latest genuine GoPro rental & filming",
    "$40 rental fee",
    [
     "Rent a GoPro and we’ll dive deep underwater to film turtles and all kinds of fish up close.<br>We capture your special day in photos and videos.",
     "The rental fee is paid on site in cash or by bank transfer."
    ],
    null
   ],
   [
    "06",
    "Safety & hygiene first",
    "5-step sanitizing every day",
    [
     "For a comfortable, special day, we provide a safety briefing, US Coast Guard-approved life jackets and accident insurance, and we sanitize all gear and the boat inside and out with a 5-step process every day.",
     "See our cleanliness for yourself during the tour. You are also welcome to bring your own gear."
    ],
    null
   ]
  ],
  "FEAT_H2": "OceanStar’s <span class=\"hl\">6 standout features</span>",
  "FLOW_H2": "Itinerary",
  "FLOW_NOTE": "When the driver calls your name, please confirm it’s OceanStar before boarding.",
  "FLOW_SUB": "4 hours, starting with hotel pickup and ending back at your hotel.",
  "HERO": {
   "eyebrow": "The original turtle snorkeling in Hawaii",
   "h1": "Waikiki turtle snorkeling,<br><span class=\"hl\">guaranteed</span>",
   "badge": "15,000+ reviews across platforms",
   "price": "$110",
   "price_sub": "Per adult · Under 24 months free",
   "facts": [
    [
     "Duration",
     "4 hours (incl. pickup & drop-off)"
    ],
    [
     "Departures",
     "Session 1 07:30 · Session 2 10:30"
    ],
    [
     "Pickup",
     "Free shuttle from set Waikiki spots"
    ],
    [
     "Includes",
     "Gear · Ramen & drinks · Photo shoot"
    ]
   ],
   "pure": "The boat departs at 08:00 and returns to the harbor at 11:00. The 30 minutes before and after are for pickup and drop-off."
  },
  "JOURNEY": [
   [
    "Hotel pickup",
    "van"
   ],
   [
    "Departure",
    null
   ],
   [
    "Diamond Head cruise",
    null
   ],
   [
    "Turtle snorkeling",
    null
   ],
   [
    "5 ocean activities",
    null
   ],
   [
    "Snacks & photos",
    null
   ],
   [
    "Waikiki cruise",
    null
   ],
   [
    "Arrival",
    null
   ],
   [
    "Hotel drop-off",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "boat_private.webp",
    "Private charter",
    "Waikiki turtle snorkeling & cruise, just for your group"
   ],
   [
    "sunset.jpg",
    "Romantic sunset cruise",
    "Sunset turtle snorkeling + 5 ocean activities + wine cruise"
   ]
  ],
  "MORE_H2": "Special tours only at OceanStar",
  "PERKS": [
   [
    "van",
    "Round-trip Waikiki shuttle",
    "OceanStar runs its own vehicles (3 in total).<br>Ride in comfort in a new 15-passenger Ford van."
   ],
   [
    "gear",
    "Free gear",
    "Snorkel gear, fins, life jackets and everything else you need for the activities, free of charge. All sizes available."
   ],
   [
    "bowl",
    "Ramen after the swim",
    "Ramen, snacks and drinks, a must after time in the water, all free of charge."
   ],
   [
    "camera",
    "Photos of a lifetime",
    "We capture your best shots with sparkling Diamond Head and the Waikiki ocean as the backdrop."
   ]
  ],
  "PERKS_H2": "Make your trip easier and more special",
  "SLOTS": [
   [
    "Session 1",
    [
     "07:30 - 11:30"
    ],
    6,
    "sea"
   ],
   [
    "Session 2",
    [
     "10:30 - 14:30"
    ],
    6,
    "deep"
   ],
   [
    "Sunset snorkeling",
    [
     "14:30 - 18:30",
     "15:30 - 19:30"
    ],
    4,
    "food"
   ]
  ],
  "STARS": [
   "Actress Park Bo-young",
   "Shiho Yano",
   "Choo Sarang",
   "Actress Lee Sun-bin",
   "Actress Jo Yu-ri",
   "Dancer Gabee",
   "Actress Lee Si-young",
   "TV personality Kim Dae-ho",
   "YouTuber Lee Mal-nyeon (Chimchakman)",
   "Actor Jang Won-young",
   "National swimmer Hwang Sun-woo",
   "Singer & actor Lee Seung-gi",
   "YouTubers Enjoy Couple",
   "Woori WON women’s pro basketball team",
   "Former TIRTIR CEO Lee Yu-bin"
  ],
  "STAR_BADGE": "Not sponsored · Not an ad · 100% paid their own way",
  "STAR_H2": "The stars’ <span class=\"hl\">real visit photos</span>",
  "STAR_SUB": "OceanStar, Hawaii’s signature snorkeling tour, visited in person by countless stars",
  "STAR_TAG": "@oceanstar_turtlesnorkelling",
  "THEME": "turtle",
  "TIME_H2": "Tour times",
  "TIME_NOTES": [
   "Closed on Sundays for safety inspections.",
   "Sunset snorkeling times may change between the winter and summer seasons.",
   "Once your booking is confirmed, we’ll email you a voucher."
  ],
  "TIME_PURE": "Times shown run from pickup to drop-off.<br>For Session 1, the boat departs at 08:00 and returns to the harbor at 11:00, with 30 minutes before and after for pickup and drop-off.",
  "TIME_SUB": "Choose Session 1 or Session 2 when you book."
 },
 "sunset_ko": {
  "COURSE": [
   [
    "호텔픽업",
    "20분 소요",
    "알로하~ 호텔에서 가장 가까운 픽업 장소에서 한국인 가이드가 픽업해 드리며 픽업 시간은 개별 안내해 드립니다.",
    null,
    "van"
   ],
   [
    "거북이 스노클링",
    "180분 소요",
    "와이키키 터틀 캐니언의 자연산 바다 거북이와 다양한 태평양 속 물고기와 함께 스노클링을 즐겨 보세요.",
    null,
    "turtle"
   ],
   [
    "인생샷 촬영",
    null,
    "다이아몬드 헤드와 태평양이 펼쳐진 아름다운 선상에서 평생 기억될 인생샷을 남겨보세요.",
    null,
    "photo"
   ],
   [
    "스탠드업 패들보드+바다 카약+ 바다의자 튜브",
    null,
    "이효리씨 &amp; 야노시호씨의 !원픽! 와이키키 앞 바다에서 즐기는 스탠드업 패들 보드에 도전하세요. 복근 코어 운동은 보너스~!<br>태평양에 둥실둥실~ 씨카약을 타고 와이키키 바다의 시원함을 만끽해보세요.<br>바다 한가운데 둥둥 떠 있는 바다의자 튜브에 앉아 노을을 바라보며 쉬어가세요.",
    null,
    "sup3"
   ],
   [
    "선상 보트 다이빙",
    null,
    "ONLY 오션스타에서만 즐기는 와이키키 터틀 캐니언의 유일한 보트 다이빙, 놓치지 마세요!",
    null,
    "dive"
   ],
   [
    "와인 파티",
    null,
    "선상에서 아름다운 선셋을 바라보며, 와인으로 로맨틱한 시간을 가져보세요.",
    null,
    "wine"
   ],
   [
    "호텔 드랍오프",
    "20분 소요",
    "아쉽지만 트립 마무리! 와이키키 호텔로 안전하게 모셔다 드립니다.<br>특별한 경험, 행복한 추억, 인생샷 모두 오래오래 간직하세요~",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "코스 소개",
  "COURSE_HINT": "7단계 · 옆으로 넘겨 보세요",
  "DAYS": [
   "월",
   "화",
   "수",
   "목",
   "금",
   "토",
   "일"
  ],
  "END_H2": "지금 바다로 나가 볼까요",
  "END_SUB": "선셋 스노클링은 월·화·수·목 출항합니다.<br>원하시는 날짜를 골라 주세요.",
  "FEATURES": [
   [
    "01",
    "하와이 원조",
    "한국인 대상 거북이 스노클링 업체",
    [
     "와이키키에서 처음으로 한국인 거북이 스노클링을 시작한 업체입니다.<br>전문적이고 친절한 한국인 직원들과 편하게 소통하며, 하와이 베스트셀러의 퀄리티를 직접 경험해보세요."
    ],
    null
   ],
   [
    "02",
    "와이키키 유일 나무 루프탑",
    "자외선, 비, 멀미 100% 차단",
    [
     "루프탑으로 뜨거운 햇빛과 비를 차단하고, 안정적인 지붕 구조로 흔들림과 멀미를 최소화합니다."
    ],
    "타업체와 달리 전원이 쾌적한 지붕 아래 앉아 편안하고 안전하게 즐기는 진짜 배려있는 투어!"
   ],
   [
    "03",
    "오션스타 자체 기획 & 도입",
    "해양 4종 액티비티 + 인생샷",
    [
     "스탠드업 패들보드, 카약, 씨체어, 다이빙 등 스노클링과 함께 자유롭게 즐기는 다양한 액티비티!",
     "다이아몬드헤드와 와이키키를 배경으로 인생샷도 마음껏 찍어드립니다."
    ],
    null
   ],
   [
    "04",
    "거북이 100% 보장제",
    "타업체보다 한 시간 더",
    [
     "거북이와 함께하는 인생 스노클링을 100% 보장합니다. 타업체보다 한 시간 더, 여유롭게 즐겨보세요.<br>오션스타를 선택하신 고객님의 특별하고 행복한 하루를 책임집니다."
    ],
    "운좋은 날은 돌고래 와칭 가능!"
   ],
   [
    "05",
    "최신형 정품 고프로 대여 & 촬영",
    "대여비 $40",
    [
     "고프로 대여 시, 바닷속 깊이까지 다이빙해 거북이와 다양한 물고기를 초근접 촬영해드립니다.<br>특별한 하루를 사진과 영상으로 담아드립니다.",
     "대여비는 현장에서 현금 또는 계좌이체로 결제합니다."
    ],
    null
   ],
   [
    "06",
    "안전과 위생 최우선",
    "매일 5단계 소독",
    [
     "고객님의 쾌적하고 특별한 하루를 위해 안전교육과 미 해양경비대 승인 구명조끼, 상해보험은 물론 장비와 선내외를 매일 5단계 소독하여 관리합니다.",
     "투어 중 청결 관리도 직접 확인해보세요. 개인 장비도 지참하실 수 있습니다."
    ],
    null
   ]
  ],
  "FEAT_H2": "‘오션스타’만의 <span class=\"hl\">6가지 특장점</span>",
  "FLOW_H2": "일정 안내",
  "FLOW_NOTE": "기사님이 성함을 호명하시면 오션스타 확인 후 탑승해주세요.",
  "FLOW_SUB": "호텔 픽업으로 시작해 호텔 드랍오프로 끝나는 4시간입니다.",
  "HERO": {
   "eyebrow": "하와이 거북이 스노클링의 원조, 오션스타",
   "h1": "선셋·와인 &amp;<br>거북이 <span class=\"hl\">스노클링</span>",
   "badge": "압도적 업계 통합 누적 리뷰 15,000개",
   "price": "₩206,690",
   "price_sub": "성인 1인 · 24개월 미만 무료",
   "facts": [
    [
     "소요 시간",
     "4시간 (픽업·드롭 포함)"
    ],
    [
     "운영 요일",
     "월 · 화 · 수 · 목"
    ],
    [
     "운영 시간",
     "동절기 14:30 - 18:30<br>하절기 15:00 - 19:00<br>하절기 15:30 - 19:30"
    ],
    [
     "포함",
     "장비 · 와인과 치즈보드 · 인생샷"
    ]
   ],
   "pure": "동절기와 하절기에 따른 시간은 바우처를 통해 안내드립니다."
  },
  "HERO_IMG": [
   "hero_sunset.webp",
   "노을 지는 바다를 배경으로 와인 잔을 부딪치는 두 손"
  ],
  "HERO_IMG_M": [
   "hero_sunset_m.webp",
   "노을 지는 바다를 배경으로 와인 잔을 부딪치는 두 손"
  ],
  "JOURNEY": [
   [
    "호텔픽업",
    "van"
   ],
   [
    "거북이 스노클링",
    null
   ],
   [
    "인생샷 촬영",
    null
   ],
   [
    "패들보드·카약·<wbr>바다의자 튜브",
    null
   ],
   [
    "선상 보트 다이빙",
    null
   ],
   [
    "와인 파티",
    null
   ],
   [
    "호텔 드랍오프",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "turtle.jpg",
    "거북이 100% 보장 스노클링",
    "가장 많이 찾는 와이키키 거북이 스노클링"
   ],
   [
    "boat_private.webp",
    "단독 프라이빗 대관",
    "우리끼리만 즐기는 와이키키 거북이 스노클링 &amp; 크루즈"
   ]
  ],
  "MORE_H2": "오션스타만의 특별상품",
  "PERKS": [
   [
    "turtle",
    "거북이 스노클링",
    "터틀캐니언에서 자연산 거북이"
   ],
   [
    "wine",
    "와인 크루즈",
    "선셋 보며 와인과 치즈 무제한"
   ],
   [
    "sup",
    "4종 액티비티",
    "패들보드·카약·다이빙 모두 포함"
   ],
   [
    "van",
    "왕복 픽업",
    "와이키키 호텔 무료 픽업서비스"
   ],
   [
    "gear",
    "장비 포함",
    "스노클링 장비 전부 대여 제공"
   ],
   [
    "guide",
    "한국인 가이드",
    "안전하게 진행하는 한국어 투어"
   ]
  ],
  "PERKS_H2": "상품 소개",
  "PERKS_LEDE": "와이키키 터틀캐니언에서 바다거북이와 함께 스노클링을 즐겨요.<br>이후 저녁에는 노을과 함께 선셋 크루즈에서 와인과 치즈보드로 로맨틱한 시간을 만들어요.",
  "PERKS_SUB_H": "하이라이트",
  "PERK_NOTES": [
   "🌞 지붕이 있는 배에서 자외선을 피해 마음놓고 스노클링을 즐기세요.",
   "🍷 와인과 치즈보드가 제공되어 여러분의 로맨틱한 선셋 스노클링을 더욱 풍성하게 합니다."
  ],
  "PERK_PHOTO": [
   "crew_briefing.webp",
   "오션스타 셔츠를 입은 크루가 선상에서 손님들에게 안내하는 모습"
  ],
  "REST_LABEL": "미운영",
  "SHOW_STARS": false,
  "SLOTS": [
   [
    "동절기",
    [
     "14:30 - 18:30"
    ],
    4,
    "food"
   ],
   [
    "하절기",
    [
     "15:00 - 19:00",
     "15:30 - 19:30"
    ],
    4,
    "deep"
   ]
  ],
  "STARS": [
   "배우 박보영님",
   "야노시호님",
   "추사랑님",
   "배우 이선빈님",
   "배우 조유리님",
   "댄서 가비님",
   "배우 이시영님",
   "방송인 김대호님",
   "유튜버 이말년(침착맨)님",
   "배우 장원영님",
   "수영 국가대표 황선우님",
   "가수 겸 배우 이승기님",
   "유튜버 엔조이커플",
   "우리 WON 여자 프로 농구단",
   "(전)티르티르 이유빈 대표님"
  ],
  "STAR_BADGE": "협찬 X · 광고 X · 100% 내돈내산",
  "STAR_H2": "스타들의 <span class=\"hl\">찐방문 인증샷</span>",
  "STAR_SUB": "수많은 스타들이 직접 찾아온 하와이 대표 스노클링, 오션스타",
  "STAR_TAG": "@oceanstar_turtlesnorkelling",
  "THEME": "sunset",
  "TIME_H2": "투어 시간 안내",
  "TIME_NOTES": [
   "예약이 확정되면 바우처를 이메일로 보내드립니다."
  ],
  "TIME_PURE": "동절기와 하절기에 따른 시간은 바우처를 통해 안내드립니다.",
  "TIME_SUB": "선셋 스노클링은 월·화·수·목에 운영합니다."
 },
 "sunset_en": {
  "COURSE": [
   [
    "Hotel pickup",
    "20 min",
    "Aloha! Your guide will pick you up at the pickup spot closest to your hotel. We'll send you your pickup time individually.",
    null,
    "van"
   ],
   [
    "Turtle snorkeling",
    "180 min",
    "Snorkel with wild sea turtles and all kinds of Pacific fish at Turtle Canyon in Waikiki.",
    null,
    "turtle"
   ],
   [
    "Photo time",
    null,
    "Take photos you'll treasure forever on deck, with Diamond Head and the Pacific spread out behind you.",
    null,
    "photo"
   ],
   [
    "Stand-up paddleboard + sea kayak + sea chair tube",
    null,
    "The top pick of Lee Hyori &amp; Yano Shiho! Try stand-up paddleboarding right off Waikiki. A core workout comes as a bonus!<br>Drift across the Pacific in a sea kayak and soak up the cool Waikiki waters.<br>Relax on a sea chair tube floating out on the ocean and watch the sunset.",
    null,
    "sup3"
   ],
   [
    "Boat diving",
    null,
    "Only at OceanStar! The one and only boat diving at Turtle Canyon in Waikiki. Don't miss it!",
    null,
    "dive"
   ],
   [
    "Wine party",
    null,
    "Watch a beautiful sunset from the deck and share a romantic moment over wine.",
    null,
    "wine"
   ],
   [
    "Hotel drop-off",
    "20 min",
    "Sadly, the trip comes to an end! We'll take you safely back to your Waikiki hotel.<br>Keep the special experience, happy memories and amazing photos with you for years to come!",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "The course",
  "COURSE_HINT": "7 steps · Swipe to see more",
  "DAYS": [
   "Mon",
   "Tue",
   "Wed",
   "Thu",
   "Fri",
   "Sat",
   "Sun"
  ],
  "END_H2": "Ready to head out to sea?",
  "END_SUB": "Sunset snorkeling departs Monday through Thursday.<br>Pick the date that works for you.",
  "FEATURES": [
   [
    "01",
    "The Hawaii original",
    "The original Turtle Canyon tour",
    [
     "We have run turtle snorkeling off Waikiki since 2019 and know Turtle Canyon better than anyone.<br>Our professional, friendly crew looks after you, so you can experience the quality of a Hawaii best seller for yourself."
    ],
    null
   ],
   [
    "02",
    "Waikiki’s only wooden rooftop",
    "Blocks 100% of UV, rain & seasickness",
    [
     "The rooftop keeps out the hot sun and rain, and its stable roof structure minimizes rocking and seasickness."
    ],
    "Unlike other companies, everyone sits under a comfortable roof. A truly considerate tour, relaxing and safe!"
   ],
   [
    "03",
    "Designed & introduced by OceanStar",
    "5 ocean activities + photos of a lifetime",
    [
     "Stand-up paddleboards, kayaks, sea chairs, diving and more. Enjoy a variety of activities freely along with snorkeling!",
     "We’ll also take as many great photos as you like with Diamond Head and Waikiki in the background."
    ],
    null
   ],
   [
    "04",
    "100% turtle sighting guarantee",
    "One hour longer than others",
    [
     "We guarantee 100% an unforgettable snorkel with turtles. Relax and enjoy one hour longer than other companies.<br>When you choose OceanStar, we make sure your day is special and happy."
    ],
    "On lucky days, you may even spot dolphins!"
   ],
   [
    "05",
    "Latest genuine GoPro rental & filming",
    "$40 rental fee",
    [
     "Rent a GoPro and we’ll dive deep underwater to film turtles and all kinds of fish up close.<br>We capture your special day in photos and videos.",
     "The rental fee is paid on site in cash or by bank transfer."
    ],
    null
   ],
   [
    "06",
    "Safety & hygiene first",
    "5-step sanitizing every day",
    [
     "For a comfortable, special day, we provide a safety briefing, US Coast Guard-approved life jackets and accident insurance, and we sanitize all gear and the boat inside and out with a 5-step process every day.",
     "See our cleanliness for yourself during the tour. You are also welcome to bring your own gear."
    ],
    null
   ]
  ],
  "FEAT_H2": "OceanStar’s <span class=\"hl\">6 standout features</span>",
  "FLOW_H2": "Itinerary",
  "FLOW_NOTE": "When the driver calls your name, please confirm it’s OceanStar before boarding.",
  "FLOW_SUB": "Four hours, starting with hotel pickup and ending with hotel drop-off.",
  "HERO": {
   "eyebrow": "The original turtle snorkeling in Hawaii",
   "h1": "Sunset &amp; Wine<br>Turtle <span class=\"hl\">Snorkeling</span>",
   "badge": "15,000+ reviews across platforms",
   "price": "$150",
   "price_sub": "Per adult · Under 24 months free",
   "facts": [
    [
     "Duration",
     "4 hours (incl. pickup and drop-off)"
    ],
    [
     "Days",
     "Mon · Tue · Wed · Thu"
    ],
    [
     "Hours",
     "Winter 14:30 - 18:30<br>Summer 15:00 - 19:00<br>Summer 15:30 - 19:30"
    ],
    [
     "Includes",
     "Gear · Wine and cheese board · Photos"
    ]
   ],
   "pure": "Your exact winter or summer time will be listed on your voucher."
  },
  "HERO_IMG": [
   "hero_sunset.webp",
   "Two hands clinking wine glasses against a sunset over the ocean"
  ],
  "HERO_IMG_M": [
   "hero_sunset_m.webp",
   "Two hands clinking wine glasses against a sunset over the ocean"
  ],
  "JOURNEY": [
   [
    "Hotel pickup",
    "van"
   ],
   [
    "Turtle snorkeling",
    null
   ],
   [
    "Photo time",
    null
   ],
   [
    "Paddleboard, kayak,<wbr> sea chair tube",
    null
   ],
   [
    "Boat diving",
    null
   ],
   [
    "Wine party",
    null
   ],
   [
    "Hotel drop-off",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "turtle.jpg",
    "100% guaranteed turtle snorkeling",
    "Our most popular Waikiki turtle snorkeling tour"
   ],
   [
    "boat_private.webp",
    "Private charter",
    "Waikiki turtle snorkeling &amp; cruise, just for your group"
   ]
  ],
  "MORE_H2": "Only at OceanStar",
  "PERKS": [
   [
    "turtle",
    "Turtle snorkeling",
    "Wild sea turtles at Turtle Canyon"
   ],
   [
    "wine",
    "Wine cruise",
    "Unlimited wine and cheese at sunset"
   ],
   [
    "sup",
    "4 activities",
    "Paddleboard, kayak and diving included"
   ],
   [
    "van",
    "Round-trip pickup",
    "Free pickup from Waikiki hotels"
   ],
   [
    "gear",
    "Gear included",
    "All snorkeling gear provided"
   ],
   [
    "guide",
    "Crew in the water",
    "Friendly guides swim right beside you"
   ]
  ],
  "PERKS_H2": "About this tour",
  "PERKS_LEDE": "Snorkel with sea turtles at Turtle Canyon in Waikiki.<br>Then, as the sun goes down, enjoy a romantic sunset cruise with wine and a cheese board.",
  "PERKS_SUB_H": "Highlights",
  "PERK_NOTES": [
   "🌞 Snorkel worry-free on our covered boat, shaded from the sun's UV rays.",
   "🍷 Cheese board and wine provided to make your romantic sunset snorkeling even more special."
  ],
  "PERK_PHOTO": [
   "crew_briefing.webp",
   "A crew member in an OceanStar shirt briefing guests on the boat"
  ],
  "REST_LABEL": "Not offered",
  "SHOW_STARS": false,
  "SLOTS": [
   [
    "Winter",
    [
     "14:30 - 18:30"
    ],
    4,
    "food"
   ],
   [
    "Summer",
    [
     "15:00 - 19:00",
     "15:30 - 19:30"
    ],
    4,
    "deep"
   ]
  ],
  "STARS": [
   "Actress Park Bo-young",
   "Shiho Yano",
   "Choo Sarang",
   "Actress Lee Sun-bin",
   "Actress Jo Yu-ri",
   "Dancer Gabee",
   "Actress Lee Si-young",
   "TV personality Kim Dae-ho",
   "YouTuber Lee Mal-nyeon (Chimchakman)",
   "Actor Jang Won-young",
   "National swimmer Hwang Sun-woo",
   "Singer & actor Lee Seung-gi",
   "YouTubers Enjoy Couple",
   "Woori WON women’s pro basketball team",
   "Former TIRTIR CEO Lee Yu-bin"
  ],
  "STAR_BADGE": "Not sponsored · Not an ad · 100% paid their own way",
  "STAR_H2": "The stars’ <span class=\"hl\">real visit photos</span>",
  "STAR_SUB": "OceanStar, Hawaii’s signature snorkeling tour, visited in person by countless stars",
  "STAR_TAG": "@oceanstar_turtlesnorkelling",
  "THEME": "sunset",
  "TIME_H2": "Tour times",
  "TIME_NOTES": [
   "Once your booking is confirmed, we'll email you a voucher."
  ],
  "TIME_PURE": "Your exact winter or summer time will be listed on your voucher.",
  "TIME_SUB": "Sunset snorkeling runs Monday through Thursday."
 },
 "combo_ko": {
  "ACTS": [
   [
    "콤보 A",
    "패러세일링",
    "픽업이 제공되는 특별한 패러세일링",
    [
     "6인승 보트에 탑승한 후, 구명조끼를 입고 안전 브리핑을 듣습니다. 각 비행 그룹 별로 고도 최대높이 600피트(182m)까지 올라가서, 약 10~15분간 비행을 하게 됩니다.",
     "하늘 위로 높이 올라, 반짝이는 바다 상공을 패러세일링으로 환상적인 시간을 즐겨보세요. 마우날루아 베이에서 하나우마 베이와 코코헤드 등 명소를 생생하게 보실 수 있어요."
    ],
    [
     [
      "비행",
      "최대 600피트(182m)<br>약 10~15분 비행"
     ],
     [
      "총 소요",
      "약 2시간 <span class=\"nw\">(패러세일링 투어 1시간)</span>"
     ],
     [
      "탑승",
      "2~3인 1조 · 최소 2명 이상 예약"
     ],
     [
      "나이",
      "만 3세 이상 · 12세 미만은 부모와 함께 3인 탑승"
     ],
     [
      "운영",
      "월 - 금 <span class=\"nw\">(토 · 일 · 공휴일 제외)</span>"
     ],
     [
      "픽업",
      "픽업 09:00 - 10:00<br>드롭 12:00 - 12:30"
     ]
    ],
    "act_para.webp",
    "노란 패러세일 아래 하네스에 앉아 활짝 웃는 두 사람"
   ],
   [
    "콤보 B",
    "제트스키",
    "픽업이 제공되는 특별한 제트스키",
    [
     "오아후 동부 해안의 아름다운 전경을 바라보며, 마우날루아 베이의 파도를 가르며 달려 보세요. 가슴이 탁 트이는 시원한 경험과 스피드의 짜릿한 쾌감을 느낄 수 있는 최고의 해양 액티비티입니다.",
     "전문 코치의 교육을 받으면 안전하게 2인 탑승 운전이 가능합니다."
    ],
    [
     [
      "운전",
      "바다 위 제트스키 운전 약 30분"
     ],
     [
      "총 소요",
      "약 2시간"
     ],
     [
      "탑승",
      "2인 1조 · 최소 2명 이상 예약"
     ],
     [
      "교육",
      "전문 코치 교육 후 2인 탑승 운전"
     ],
     [
      "운영",
      "월 - 금 <span class=\"nw\">(토 · 일 · 공휴일 제외)</span>"
     ],
     [
      "픽업",
      "픽업 09:00 - 10:00<br>드롭 12:00 - 12:30"
     ]
    ],
    "act_jet.webp",
    "구명조끼를 입은 두 사람이 물보라를 일으키며 달리는 제트스키"
   ]
  ],
  "ACTS_H2": "픽업이 제공되는 <span class=\"hl\">패러 · 제트</span>",
  "ACTS_LEDE": "오아후 동쪽 해안 마우날루아 베이에서 출발합니다.<br>콤보 A는 패러세일링, 콤보 B는 제트스키입니다.",
  "ACTS_NOTE": "호텔에서 직접 픽업하여 편하게 이동하실 수 있습니다.<br>대부분의 타 업체는 픽업 서비스가 불포함이며, 별도 추가시 혼합 픽업을 합니다.",
  "COMBOS": [
   [
    "콤보 A",
    "거북이 스노클링<br>+ 패러세일링",
    [
     "거북이 스노클링 · 월 - 토 07:30 - 11:30",
     "패러세일링 · 월 - 금 09:30 - 12:30",
     "두 액티비티 모두 호텔 왕복 픽업"
    ]
   ],
   [
    "콤보 B",
    "거북이 스노클링<br>+ 제트스키",
    [
     "거북이 스노클링 · 월 - 토 07:30 - 11:30",
     "제트스키 · 월 - 금 09:30 - 12:30",
     "두 액티비티 모두 호텔 왕복 픽업"
    ]
   ]
  ],
  "COMBO_H2": "콤보 패키지",
  "COMBO_LEDE": "최고의 서비스와 합리적인 가격을 제공하는 환상의 콤보 상품을 놓치지 마세요.",
  "COMBO_PRICE": "콤보 특별 할인가",
  "COMBO_PRICES": {},
  "DAYS": [
   "월",
   "화",
   "수",
   "목",
   "금",
   "토",
   "일"
  ],
  "DOCK_SUB": "콤보 A · 성인 · 아동 동일",
  "END_H2": "지금 바다로 나가 볼까요",
  "END_SUB": "콤보 A는 패러세일링, 콤보 B는 제트스키.<br>원하시는 날짜를 각각 골라 주세요.",
  "FEATURES": [
   [
    "01",
    "하와이 원조",
    "한국인 대상 거북이 스노클링 업체",
    [
     "와이키키에서 처음으로 한국인 거북이 스노클링을 시작한 업체입니다.<br>전문적이고 친절한 한국인 직원들과 편하게 소통하며, 하와이 베스트셀러의 퀄리티를 직접 경험해보세요."
    ],
    null
   ],
   [
    "02",
    "와이키키 유일 나무 루프탑",
    "자외선, 비, 멀미 100% 차단",
    [
     "루프탑으로 뜨거운 햇빛과 비를 차단하고, 안정적인 지붕 구조로 흔들림과 멀미를 최소화합니다."
    ],
    "타업체와 달리 전원이 쾌적한 지붕 아래 앉아 편안하고 안전하게 즐기는 진짜 배려있는 투어!"
   ],
   [
    "03",
    "오션스타 자체 기획 & 도입",
    "해양 4종 액티비티 + 인생샷",
    [
     "스탠드업 패들보드, 카약, 씨체어, 다이빙 등 스노클링과 함께 자유롭게 즐기는 다양한 액티비티!",
     "다이아몬드헤드와 와이키키를 배경으로 인생샷도 마음껏 찍어드립니다."
    ],
    null
   ],
   [
    "04",
    "거북이 100% 보장제",
    "타업체보다 한 시간 더",
    [
     "거북이와 함께하는 인생 스노클링을 100% 보장합니다. 타업체보다 한 시간 더, 여유롭게 즐겨보세요.<br>오션스타를 선택하신 고객님의 특별하고 행복한 하루를 책임집니다."
    ],
    "운좋은 날은 돌고래 와칭 가능!"
   ],
   [
    "05",
    "최신형 정품 고프로 대여 & 촬영",
    "대여비 $40",
    [
     "고프로 대여 시, 바닷속 깊이까지 다이빙해 거북이와 다양한 물고기를 초근접 촬영해드립니다.<br>특별한 하루를 사진과 영상으로 담아드립니다.",
     "대여비는 현장에서 현금 또는 계좌이체로 결제합니다."
    ],
    null
   ],
   [
    "06",
    "안전과 위생 최우선",
    "매일 5단계 소독",
    [
     "고객님의 쾌적하고 특별한 하루를 위해 안전교육과 미 해양경비대 승인 구명조끼, 상해보험은 물론 장비와 선내외를 매일 5단계 소독하여 관리합니다.",
     "투어 중 청결 관리도 직접 확인해보세요. 개인 장비도 지참하실 수 있습니다."
    ],
    null
   ]
  ],
  "FEAT_H2": "거북이 스노클링, <span class=\"hl\">무려 한 시간 더</span>",
  "FEAT_LEDE": "한국인 선주와 선장이 운영하는 배이기에 스노클링을 무려 한 시간 더!<br>스노클링만 총 3시간 이상, 자연산 거북이를 보장합니다. 수영 걱정도, 영어 걱정도 없어요. 오션스타는 한국인 소유의 배에서 한국인 전문 크루가 상주합니다.",
  "HERO": {
   "eyebrow": "하와이 최고 인기 액티비티의 만남",
   "h1": "거북이 스노클링 +<br><span class=\"hl\">패러 · 제트</span>",
   "badge": "압도적 업계 통합 누적 리뷰 15,000개",
   "price": "₩291,220",
   "price_per": "1인",
   "price_sub": "콤보 A 패러세일링 · 성인 · 아동 동일",
   "facts": [
    [
     "구성",
     "A 스노클링 + 패러세일링<br>B 스노클링 + 제트스키"
    ],
    [
     "소요 시간",
     "스노클링 4시간<br>패러 · 제트 약 2시간"
    ],
    [
     "예약 가능",
     "스노클링 월 - 토<br>패러 · 제트 월 - 금 (공휴일 휴무)"
    ],
    [
     "포함",
     "두 액티비티 모두 호텔 왕복 픽업"
    ]
   ],
   "pure": "하루에 두 가지 액티비티는 불가능합니다. 날짜를 각각 선택해 주세요."
  },
  "HERO_IMG": [
   "hero_para.webp",
   "코코헤드를 배경으로 보트가 끄는 연두색 패러세일과 두 사람"
  ],
  "HERO_IMG_M": [
   "hero_para_m.webp",
   "코코헤드를 배경으로 보트가 끄는 연두색 패러세일과 두 사람"
  ],
  "MORE": [
   [
    "turtle.jpg",
    "거북이 100% 보장 스노클링",
    "가장 많이 찾는 와이키키 거북이 스노클링"
   ],
   [
    "course_sup_sunset.webp",
    "선셋 · 와인 거북이 스노클링",
    "노을과 와인으로 마무리하는 4시간"
   ]
  ],
  "MORE_H2": "오션스타만의 특별상품",
  "PERKS": [
   [
    "van",
    "단독 왕복 픽업",
    "패러 · 제트도 호텔 픽업 · 드롭 포함"
   ],
   [
    "para",
    "패러세일링",
    "최대 600피트 상공, 10~15분 비행"
   ],
   [
    "jet",
    "제트스키",
    "마우날루아 베이를 2인 1조로 30분"
   ],
   [
    "turtle",
    "거북이 스노클링",
    "스노클링만 총 3시간 이상"
   ],
   [
    "cal",
    "날짜는 따로",
    "구입은 한 번, 날짜는 각각 선택"
   ],
   [
    "guide",
    "한국인 크루",
    "한국인 소유의 배, 한국인 전문 크루"
   ]
  ],
  "PERKS_H2": "상품 소개",
  "PERKS_LEDE": "지금까지 이런 콤비는 없었다.<br>하와이 최고 인기의 액티비티의 만남으로 가격, 재미, 픽업 서비스를 모두 갖췄습니다. 하와이의 가장 아름다운 바다 와이키키와 마우날루아 베이에서 최고의 액티비티를 모두 경험하세요.",
  "PERKS_SUB_H": "최고의 가성비 콤보 특징",
  "PERK_NOTES": [
   "대중교통이 취약한 하와이에서는 픽업 서비스를 꼭 확인하세요.<br>타사 상품은 대부분 픽업 서비스가 불가합니다.",
   "콤보 상품이지만 동시에 하실 필요 없어요.<br>구입만 한 번에 하세요."
  ],
  "PERK_PHOTO": [
   "intro_bay.webp",
   "마우날루아 베이 위 플랫폼에 줄지어 선 제트스키와 바나나보트, 투어 보트"
  ],
  "REST_LABEL": "예약 불가",
  "SECTIONS": [
   "perks",
   "acts",
   "features",
   "times",
   "combo",
   "more"
  ],
  "SHOW_STARS": false,
  "SLOTS": [
   [
    "거북이 스노클링",
    [
     "07:30 - 11:30"
    ],
    6,
    "sea"
   ],
   [
    "패러세일링 · 제트스키",
    [
     "09:30 - 12:30"
    ],
    5,
    "food"
   ]
  ],
  "THEME": "para",
  "TIME_H2": "액티비티 시간 안내",
  "TIME_NOTES": [
   "거북이 스노클링은 일요일을 제외하고 월~토까지 예약 가능합니다(공휴일 포함).",
   "패러세일링 · 제트스키는 월~금까지 예약 가능합니다.<br>토, 일, 공휴일은 예약 불가입니다.",
   "구매옵션에서 시간을 확인해 주세요."
  ],
  "TIME_PURE": "하루에 두 가지 액티비티는 불가능합니다.<br>예약하실 때 날짜를 각각 기입해 주세요. (예: 5/5 거북이 스노클링, <span class=\"nw\">5/7 제트스키/패러세일링</span>)",
  "TIME_SUB": "원하시는 날짜에 거북이 스노클링, 패러세일링, 제트스키 날짜를 선택할 수 있습니다."
 },
 "combo_en": {
  "ACTS": [
   [
    "Combo A",
    "Parasailing",
    "Special parasailing with hotel pickup",
    [
     "Board a 6-passenger boat, put on a life jacket and listen to the safety briefing. Each flight group rises up to 600 feet (182 m) and flies for about 10-15 minutes.",
     "Soar high above the sparkling ocean for an unforgettable parasail ride. From Maunalua Bay you'll get vivid views of landmarks like Hanauma Bay and Koko Head."
    ],
    [
     [
      "Flight",
      "Up to 600 ft (182 m)<br>About 10-15 minute flight"
     ],
     [
      "Total time",
      "About 2 hours <span class=\"nw\">(1-hour parasail tour)</span>"
     ],
     [
      "Riders",
      "2-3 per flight · minimum 2 per booking"
     ],
     [
      "Age",
      "Ages 3+ · under 12 fly as a group of 3 with a parent"
     ],
     [
      "Schedule",
      "Mon - Fri <span class=\"nw\">(no Sat, Sun or holidays)</span>"
     ],
     [
      "Pickup",
      "Pickup 09:00 - 10:00<br>Drop-off 12:00 - 12:30"
     ]
    ],
    "act_para.webp",
    "Two people smiling in harnesses beneath a yellow parasail"
   ],
   [
    "Combo B",
    "Jet ski",
    "Special jet ski ride with hotel pickup",
    [
     "Carve through the waves of Maunalua Bay while taking in the beautiful views of Oahu's east shore. It's the ultimate ocean activity for a refreshing, wide-open feeling and the thrill of speed.",
     "After a lesson from a professional coach, you can safely drive with two riders on board."
    ],
    [
     [
      "Ride",
      "About 30 minutes driving a jet ski on the ocean"
     ],
     [
      "Total time",
      "About 2 hours"
     ],
     [
      "Riders",
      "2 per ski · minimum 2 per booking"
     ],
     [
      "Lesson",
      "Coach lesson, then drive with 2 riders"
     ],
     [
      "Schedule",
      "Mon - Fri <span class=\"nw\">(no Sat, Sun or holidays)</span>"
     ],
     [
      "Pickup",
      "Pickup 09:00 - 10:00<br>Drop-off 12:00 - 12:30"
     ]
    ],
    "act_jet.webp",
    "Two people in life jackets speeding on a jet ski, kicking up spray"
   ]
  ],
  "ACTS_H2": "<span class=\"hl\">Parasail · jet ski</span> with pickup",
  "ACTS_LEDE": "Departs from Maunalua Bay on Oahu's east shore.<br>Combo A is parasailing, Combo B is jet ski.",
  "ACTS_NOTE": "We pick you up right at your hotel for an easy ride.<br>Most other companies don't include pickup, and add-on pickup is usually shared with other groups.",
  "COMBOS": [
   [
    "Combo A",
    "Turtle snorkeling<br>+ parasailing",
    [
     "Turtle snorkeling · Mon - Sat 07:30 - 11:30",
     "Parasailing · Mon - Fri 09:30 - 12:30",
     "Round-trip hotel pickup for both"
    ]
   ],
   [
    "Combo B",
    "Turtle snorkeling<br>+ jet ski",
    [
     "Turtle snorkeling · Mon - Sat 07:30 - 11:30",
     "Jet ski · Mon - Fri 09:30 - 12:30",
     "Round-trip hotel pickup for both"
    ]
   ]
  ],
  "COMBO_H2": "Combo packages",
  "COMBO_LEDE": "Don't miss this amazing combo, with top service at a fair price.",
  "COMBO_PRICE": "Special combo price",
  "COMBO_PRICES": {},
  "DAYS": [
   "Mon",
   "Tue",
   "Wed",
   "Thu",
   "Fri",
   "Sat",
   "Sun"
  ],
  "DOCK_SUB": "Combo A · per person, all ages",
  "END_H2": "Ready to head out to sea?",
  "END_SUB": "Combo A is parasailing, Combo B is jet ski.<br>Pick a date for each activity.",
  "FEATURES": [
   [
    "01",
    "The Hawaii original",
    "The original Turtle Canyon tour",
    [
     "We have run turtle snorkeling off Waikiki since 2019 and know Turtle Canyon better than anyone.<br>Our professional, friendly crew looks after you, so you can experience the quality of a Hawaii best seller for yourself."
    ],
    null
   ],
   [
    "02",
    "Waikiki’s only wooden rooftop",
    "Blocks 100% of UV, rain & seasickness",
    [
     "The rooftop keeps out the hot sun and rain, and its stable roof structure minimizes rocking and seasickness."
    ],
    "Unlike other companies, everyone sits under a comfortable roof. A truly considerate tour, relaxing and safe!"
   ],
   [
    "03",
    "Designed & introduced by OceanStar",
    "5 ocean activities + photos of a lifetime",
    [
     "Stand-up paddleboards, kayaks, sea chairs, diving and more. Enjoy a variety of activities freely along with snorkeling!",
     "We’ll also take as many great photos as you like with Diamond Head and Waikiki in the background."
    ],
    null
   ],
   [
    "04",
    "100% turtle sighting guarantee",
    "One hour longer than others",
    [
     "We guarantee 100% an unforgettable snorkel with turtles. Relax and enjoy one hour longer than other companies.<br>When you choose OceanStar, we make sure your day is special and happy."
    ],
    "On lucky days, you may even spot dolphins!"
   ],
   [
    "05",
    "Latest genuine GoPro rental & filming",
    "$40 rental fee",
    [
     "Rent a GoPro and we’ll dive deep underwater to film turtles and all kinds of fish up close.<br>We capture your special day in photos and videos.",
     "The rental fee is paid on site in cash or by bank transfer."
    ],
    null
   ],
   [
    "06",
    "Safety & hygiene first",
    "5-step sanitizing every day",
    [
     "For a comfortable, special day, we provide a safety briefing, US Coast Guard-approved life jackets and accident insurance, and we sanitize all gear and the boat inside and out with a 5-step process every day.",
     "See our cleanliness for yourself during the tour. You are also welcome to bring your own gear."
    ],
    null
   ]
  ],
  "FEAT_H2": "Turtle snorkeling, <span class=\"hl\">one full hour more</span>",
  "FEAT_LEDE": "We run our own boat, so you get one full hour more of snorkeling!<br>Over 3 hours of snorkeling in total, with wild sea turtles guaranteed. No worries if you're not a strong swimmer: our friendly crew swims right beside you.",
  "HERO": {
   "eyebrow": "Two of Hawaii's most popular activities",
   "h1": "Turtle snorkeling +<br><span class=\"hl\">Parasail · Jet Ski</span>",
   "badge": "15,000+ reviews across platforms",
   "price": "$210",
   "price_per": "",
   "price_sub": "Combo A parasailing · per person · adults and children same price",
   "facts": [
    [
     "Packages",
     "A: snorkeling + parasailing<br>B: snorkeling + jet ski"
    ],
    [
     "Duration",
     "Snorkeling 4 hours<br>Parasail · jet ski about 2 hours"
    ],
    [
     "Available",
     "Snorkeling Mon - Sat<br>Parasail · jet ski Mon - Fri (closed on public holidays)"
    ],
    [
     "Included",
     "Round-trip hotel pickup for both activities"
    ]
   ],
   "pure": "You can't do both activities on the same day. Please choose a date for each."
  },
  "HERO_IMG": [
   "hero_para.webp",
   "Two people under a lime-green parasail towed by a boat, with Koko Head behind"
  ],
  "HERO_IMG_M": [
   "hero_para_m.webp",
   "Two people under a lime-green parasail towed by a boat, with Koko Head behind"
  ],
  "MORE": [
   [
    "turtle.jpg",
    "100% turtle guarantee snorkeling",
    "Waikiki's most popular turtle snorkeling tour"
   ],
   [
    "course_sup_sunset.webp",
    "Sunset &amp; wine turtle snorkeling",
    "4 hours that end with sunset and wine"
   ]
  ],
  "MORE_H2": "OceanStar exclusives",
  "PERKS": [
   [
    "van",
    "Dedicated hotel pickup",
    "Round-trip hotel pickup for parasail and jet ski too"
   ],
   [
    "para",
    "Parasailing",
    "Up to 600 ft high, 10-15 minute flight"
   ],
   [
    "jet",
    "Jet ski",
    "30 minutes on Maunalua Bay, 2 per ski"
   ],
   [
    "turtle",
    "Turtle snorkeling",
    "3+ hours of snorkeling time"
   ],
   [
    "cal",
    "Separate dates",
    "Book once, pick a date for each"
   ],
   [
    "guide",
    "Crew in the water",
    "Friendly guides swim right beside you"
   ]
  ],
  "PERKS_H2": "About this tour",
  "PERKS_LEDE": "A combo like no other.<br>Two of Hawaii's most popular activities together, with great value, fun and pickup service all in one. Enjoy the best activities in Hawaii's most beautiful waters, Waikiki and Maunalua Bay.",
  "PERKS_SUB_H": "Best-value combo highlights",
  "PERK_NOTES": [
   "Public transit is limited in Hawaii, so be sure to check for pickup service.<br>Most other companies do not offer pickup.",
   "It's a combo, but you don't have to do both at once.<br>Just book them together."
  ],
  "PERK_PHOTO": [
   "intro_bay.webp",
   "Jet skis, a banana boat and a tour boat lined up at a platform on Maunalua Bay"
  ],
  "REST_LABEL": "Unavailable",
  "SECTIONS": [
   "perks",
   "acts",
   "features",
   "times",
   "combo",
   "more"
  ],
  "SHOW_STARS": false,
  "SLOTS": [
   [
    "Turtle snorkeling",
    [
     "07:30 - 11:30"
    ],
    6,
    "sea"
   ],
   [
    "Parasailing · jet ski",
    [
     "09:30 - 12:30"
    ],
    5,
    "food"
   ]
  ],
  "THEME": "para",
  "TIME_H2": "Activity schedule",
  "TIME_NOTES": [
   "Turtle snorkeling is available Mon - Sat, every day except Sunday (public holidays included).",
   "Parasailing and jet ski are available Mon - Fri.<br>Not available on Sat, Sun or public holidays.",
   "Please check the times in the booking options."
  ],
  "TIME_PURE": "You can't do both activities on the same day.<br>Please enter a date for each when you book. (e.g. 5/5 turtle snorkeling, <span class=\"nw\">5/7 jet ski/parasailing</span>)",
  "TIME_SUB": "Choose your own dates for turtle snorkeling, parasailing and jet ski."
 },
 "private_ko": {
  "COMBOS": [
   [
    "옵션 1",
    "1-10명",
    [
     "스노클링 · 해양 액티비티",
     "와이키키 해안 크루즈",
     "호텔 픽업 · 드롭"
    ]
   ],
   [
    "옵션 2",
    "11-20명",
    [
     "스노클링 · 해양 액티비티",
     "와이키키 해안 크루즈",
     "호텔 픽업 · 드롭"
    ]
   ],
   [
    "옵션 3",
    "21-30명",
    [
     "스노클링 · 해양 액티비티",
     "와이키키 해안 크루즈",
     "호텔 픽업 · 드롭"
    ]
   ]
  ],
  "COMBO_H2": "원하는 방식으로 선택하세요",
  "COMBO_LEDE": "인원에 따라 선택하는 3가지 프라이빗 옵션",
  "COMBO_PRICE": "문의",
  "COMBO_PRICES": {
   "옵션 1": [
    "$1,200",
    "2시간 · 완전 단독"
   ],
   "옵션 2": [
    "$1,800",
    "2시간 · 완전 단독"
   ],
   "옵션 3": [
    "$2,400",
    "2시간 · 완전 단독"
   ]
  },
  "COURSE": [
   [
    "호텔 픽업 &amp; 탑승",
    null,
    "크루가 장비 세팅 및 안전 브리핑을 도와드립니다.",
    null,
    "van"
   ],
   [
    "터틀 캐니언 스노클링",
    null,
    "야생 바다거북 · 열대어 · 산호초와 함께합니다.",
    null,
    "turtle"
   ],
   [
    "자유 액티비티 &amp; 휴식",
    null,
    "카약 · 패들보드 · 플로팅 체어 · 자유수영을 즐깁니다.",
    null,
    "pv_free"
   ],
   [
    "다이아몬드 헤드 해안 크루즈",
    null,
    "와이키키 스카이라인과 선셋 타임을 선택할 수 있습니다.",
    null,
    "pv_cruise"
   ],
   [
    "호텔 드롭 &amp; 귀환",
    null,
    "인생 사진과 추억을 담아 편안하게 돌아갑니다.",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "코스 소개",
  "COURSE_HINT": "5단계 · 옆으로 넘겨 보세요",
  "DAY_SLOTS": [
   [
    "월요일",
    [
     "15:00 - 18:00"
    ]
   ],
   [
    "금요일",
    [
     "10:30 - 13:30",
     "13:00 - 16:00"
    ]
   ],
   [
    "토요일",
    [
     "10:30 - 13:30",
     "13:00 - 16:00",
     "15:30 - 19:30 선셋"
    ]
   ]
  ],
  "DOCK_SUB": "옵션 1 · 1-10명 팀 요금",
  "END_H2": "지금 바다로 나가 볼까요",
  "END_SUB": "예약 문의 · 날짜 조율 · 이벤트 구성, 언제든지 연락 주세요.",
  "FEATURES": [
   [
    "01",
    "하와이 원조",
    "한국인 대상 거북이 스노클링 업체",
    [
     "와이키키에서 처음으로 한국인 거북이 스노클링을 시작한 업체입니다.<br>전문적이고 친절한 한국인 직원들과 편하게 소통하며, 하와이 베스트셀러의 퀄리티를 직접 경험해보세요."
    ],
    null
   ],
   [
    "02",
    "와이키키 유일 나무 루프탑",
    "자외선, 비, 멀미 100% 차단",
    [
     "루프탑으로 뜨거운 햇빛과 비를 차단하고, 안정적인 지붕 구조로 흔들림과 멀미를 최소화합니다."
    ],
    "타업체와 달리 전원이 쾌적한 지붕 아래 앉아 편안하고 안전하게 즐기는 진짜 배려있는 투어!"
   ],
   [
    "03",
    "오션스타 자체 기획 & 도입",
    "해양 4종 액티비티 + 인생샷",
    [
     "스탠드업 패들보드, 카약, 씨체어, 다이빙 등 스노클링과 함께 자유롭게 즐기는 다양한 액티비티!",
     "다이아몬드헤드와 와이키키를 배경으로 인생샷도 마음껏 찍어드립니다."
    ],
    null
   ],
   [
    "04",
    "거북이 100% 보장제",
    "타업체보다 한 시간 더",
    [
     "거북이와 함께하는 인생 스노클링을 100% 보장합니다. 타업체보다 한 시간 더, 여유롭게 즐겨보세요.<br>오션스타를 선택하신 고객님의 특별하고 행복한 하루를 책임집니다."
    ],
    "운좋은 날은 돌고래 와칭 가능!"
   ],
   [
    "05",
    "최신형 정품 고프로 대여 & 촬영",
    "대여비 $40",
    [
     "고프로 대여 시, 바닷속 깊이까지 다이빙해 거북이와 다양한 물고기를 초근접 촬영해드립니다.<br>특별한 하루를 사진과 영상으로 담아드립니다.",
     "대여비는 현장에서 현금 또는 계좌이체로 결제합니다."
    ],
    null
   ],
   [
    "06",
    "안전과 위생 최우선",
    "매일 5단계 소독",
    [
     "고객님의 쾌적하고 특별한 하루를 위해 안전교육과 미 해양경비대 승인 구명조끼, 상해보험은 물론 장비와 선내외를 매일 5단계 소독하여 관리합니다.",
     "투어 중 청결 관리도 직접 확인해보세요. 개인 장비도 지참하실 수 있습니다."
    ],
    null
   ]
  ],
  "FEAT_H2": "왜 <span class=\"hl\">오션스타</span>인가요?",
  "FEAT_LEDE": "와이키키 유일 우드 루프탑 보트를 다른 팀 없이 우리만 이용합니다.<br>스노클링 · 휴식 · 이벤트 순서도 자유롭게 조정할 수 있어요.",
  "FLOW_H2": "약 2시간의 프라이빗 투어",
  "FLOW_NOTE": "예약 후 최종 시간은 조율할 수 있습니다.",
  "FLOW_SUB": "호텔 픽업부터 호텔 드롭까지, 우리 팀만의 순서로 진행합니다.",
  "HERO": {
   "eyebrow": "와이키키 프라이빗 크루즈",
   "h1": "하와이 바다를,<br>오직 <span class=\"hl\">우리 팀</span>만을 위해",
   "badge": "압도적 업계 통합 누적 리뷰 15,000개",
   "price": "$1,200",
   "price_sub": "옵션 1 · 1-10명 팀 요금 · 2시간 완전 단독",
   "facts": [
    [
     "단독",
     "100% 우리 팀 단독"
    ],
    [
     "투어 시간",
     "약 2시간"
    ],
    [
     "인원",
     "최대 30명 단체 가능"
    ],
    [
     "포함",
     "호텔 픽업 · 드롭"
    ]
   ],
   "pure": "토요일 15:30 선셋 타임은 조기 마감될 수 있습니다."
  },
  "HERO_IMG": [
   "hero_private.webp",
   "와이키키 스카이라인을 배경으로 뱃머리에 앉아 웃는 세 사람"
  ],
  "HERO_IMG_M": [
   "hero_private_m.webp",
   "와이키키 스카이라인을 배경으로 뱃머리에 앉아 웃는 세 사람"
  ],
  "JOURNEY": [
   [
    "호텔 픽업 &amp; 탑승",
    "van"
   ],
   [
    "터틀 캐니언 스노클링",
    null
   ],
   [
    "자유 액티비티 &amp; 휴식",
    null
   ],
   [
    "다이아몬드 헤드 해안 크루즈",
    null
   ],
   [
    "호텔 드롭 &amp; 귀환",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "turtle.jpg",
    "거북이 100% 보장 스노클링",
    "가장 많이 찾는 와이키키 거북이 스노클링"
   ],
   [
    "course_sup_sunset.webp",
    "선셋 · 와인 거북이 스노클링",
    "노을과 와인으로 마무리하는 4시간"
   ]
  ],
  "MORE_H2": "오션스타만의 특별상품",
  "PERKS": [
   [
    "gear",
    "스노클링 장비 풀세트",
    ""
   ],
   [
    "sup",
    "카약 · 패들보드 장비",
    ""
   ],
   [
    "guide",
    "안전 장비 · 크루 지원",
    ""
   ],
   [
    "van",
    "호텔 픽업 · 드롭",
    ""
   ],
   [
    "float",
    "플로팅 체어 · 매트",
    ""
   ],
   [
    "sun",
    "리프세이프 선크림 안내",
    ""
   ]
  ],
  "PERKS_H2": "우리끼리 누리는 와이키키 프라이빗 데이",
  "PERKS_LEDE": "터틀 캐니언 바다거북 스노클링 · 다이아몬드 헤드 크루즈 · 완전 단독 프라이빗.<br>처음 스노클링하는 가족도, 특별한 날을 준비하는 커플도 편안하게 즐길 수 있습니다.",
  "PERKS_SUB_H": "포함 사항",
  "PERK_NOTES": [],
  "PERK_PHOTO": [
   "private_boat.webp",
   "와이키키 앞바다에 떠 있는 OCEAN STAR 보트"
  ],
  "RECO": [
   "아이 동반 가족",
   "허니문 · 커플",
   "생일 · 기념일",
   "프로포즈 이벤트",
   "친구 · 소규모 그룹",
   "단체 · 특별 이벤트"
  ],
  "RECO_H2": "이런 분께 추천드립니다",
  "SECTIONS": [
   "perks",
   "combo",
   "features",
   "flow",
   "course",
   "days",
   "reco",
   "more"
  ],
  "SHOW_STARS": false,
  "THEME": "private",
  "TIME_H2": "예약 가능 시간",
  "TIME_PURE": "픽업 · 드롭 포함 시간 기준입니다.<br>예약 후 최종 시간은 조율할 수 있습니다.",
  "TIME_SUB": "월요일 · 금요일 · 토요일에 운영합니다."
 },
 "private_en": {
  "COMBOS": [
   [
    "Option 1",
    "1-10 guests",
    [
     "Snorkeling · ocean activities",
     "Waikiki coastal cruise",
     "Hotel pickup · drop-off"
    ]
   ],
   [
    "Option 2",
    "11-20 guests",
    [
     "Snorkeling · ocean activities",
     "Waikiki coastal cruise",
     "Hotel pickup · drop-off"
    ]
   ],
   [
    "Option 3",
    "21-30 guests",
    [
     "Snorkeling · ocean activities",
     "Waikiki coastal cruise",
     "Hotel pickup · drop-off"
    ]
   ]
  ],
  "COMBO_H2": "Choose the way you like",
  "COMBO_LEDE": "3 private options based on group size",
  "COMBO_PRICE": "Contact us",
  "COMBO_PRICES": {
   "Option 1": [
    "$1,200",
    "2 hours · fully private"
   ],
   "Option 2": [
    "$1,800",
    "2 hours · fully private"
   ],
   "Option 3": [
    "$2,400",
    "2 hours · fully private"
   ]
  },
  "COURSE": [
   [
    "Hotel pickup &amp; boarding",
    null,
    "Our crew helps you with gear setup and a safety briefing.",
    null,
    "van"
   ],
   [
    "Turtle Canyon snorkeling",
    null,
    "Swim with wild sea turtles, tropical fish and coral reefs.",
    null,
    "turtle"
   ],
   [
    "Free activities &amp; relaxing",
    null,
    "Enjoy kayaks, paddleboards, floating chairs and free swimming.",
    null,
    "pv_free"
   ],
   [
    "Diamond Head coastal cruise",
    null,
    "Take in the Waikiki skyline, with a sunset time option.",
    null,
    "pv_cruise"
   ],
   [
    "Hotel drop-off &amp; return",
    null,
    "Head back relaxed with great photos and memories.",
    null,
    "van"
   ]
  ],
  "COURSE_H2": "Tour course",
  "COURSE_HINT": "5 steps · swipe to see more",
  "DAY_SLOTS": [
   [
    "Mon",
    [
     "15:00 - 18:00"
    ]
   ],
   [
    "Fri",
    [
     "10:30 - 13:30",
     "13:00 - 16:00"
    ]
   ],
   [
    "Sat",
    [
     "10:30 - 13:30",
     "13:00 - 16:00",
     "15:30 - 19:30 sunset"
    ]
   ]
  ],
  "DOCK_SUB": "Option 1 · 1-10 guests / Team",
  "END_H2": "Ready to head out to sea?",
  "END_SUB": "Booking questions, date planning or event setup, contact us anytime.",
  "FEATURES": [
   [
    "01",
    "The Hawaii original",
    "The original Turtle Canyon tour",
    [
     "We have run turtle snorkeling off Waikiki since 2019 and know Turtle Canyon better than anyone.<br>Our professional, friendly crew looks after you, so you can experience the quality of a Hawaii best seller for yourself."
    ],
    null
   ],
   [
    "02",
    "Waikiki’s only wooden rooftop",
    "Blocks 100% of UV, rain & seasickness",
    [
     "The rooftop keeps out the hot sun and rain, and its stable roof structure minimizes rocking and seasickness."
    ],
    "Unlike other companies, everyone sits under a comfortable roof. A truly considerate tour, relaxing and safe!"
   ],
   [
    "03",
    "Designed & introduced by OceanStar",
    "5 ocean activities + photos of a lifetime",
    [
     "Stand-up paddleboards, kayaks, sea chairs, diving and more. Enjoy a variety of activities freely along with snorkeling!",
     "We’ll also take as many great photos as you like with Diamond Head and Waikiki in the background."
    ],
    null
   ],
   [
    "04",
    "100% turtle sighting guarantee",
    "One hour longer than others",
    [
     "We guarantee 100% an unforgettable snorkel with turtles. Relax and enjoy one hour longer than other companies.<br>When you choose OceanStar, we make sure your day is special and happy."
    ],
    "On lucky days, you may even spot dolphins!"
   ],
   [
    "05",
    "Latest genuine GoPro rental & filming",
    "$40 rental fee",
    [
     "Rent a GoPro and we’ll dive deep underwater to film turtles and all kinds of fish up close.<br>We capture your special day in photos and videos.",
     "The rental fee is paid on site in cash or by bank transfer."
    ],
    null
   ],
   [
    "06",
    "Safety & hygiene first",
    "5-step sanitizing every day",
    [
     "For a comfortable, special day, we provide a safety briefing, US Coast Guard-approved life jackets and accident insurance, and we sanitize all gear and the boat inside and out with a 5-step process every day.",
     "See our cleanliness for yourself during the tour. You are also welcome to bring your own gear."
    ],
    null
   ]
  ],
  "FEAT_H2": "Why <span class=\"hl\">OceanStar</span>?",
  "FEAT_LEDE": "Waikiki's only wood rooftop boat, just for your group with no one else on board.<br>Snorkeling, relaxing and events can be arranged in any order you like.",
  "FLOW_H2": "About 2 hours, all private",
  "FLOW_NOTE": "Final times can be adjusted after booking.",
  "FLOW_SUB": "From hotel pickup to hotel drop-off, everything runs in your group's own order.",
  "HERO": {
   "eyebrow": "Waikiki private cruise",
   "h1": "A private boat<br>for <span class=\"hl\">your group</span>",
   "badge": "15,000+ reviews across platforms",
   "price": "$1,200",
   "price_sub": "Option 1 · 1-10 guests / Team · 2 hours, fully private",
   "facts": [
    [
     "Private",
     "Private boarding for your group"
    ],
    [
     "Duration",
     "About 2 hours"
    ],
    [
     "Group size",
     "Groups of up to 30"
    ],
    [
     "Included",
     "Hotel pickup · drop-off"
    ]
   ],
   "pure": "The Saturday 15:30 sunset slot may sell out early."
  },
  "HERO_IMG": [
   "hero_private.webp",
   "Three people laughing on the bow with the Waikiki skyline behind"
  ],
  "HERO_IMG_M": [
   "hero_private_m.webp",
   "Three people laughing on the bow with the Waikiki skyline behind"
  ],
  "JOURNEY": [
   [
    "Hotel pickup &amp; boarding",
    "van"
   ],
   [
    "Turtle Canyon snorkeling",
    null
   ],
   [
    "Free activities &amp; relaxing",
    null
   ],
   [
    "Diamond Head coastal cruise",
    null
   ],
   [
    "Hotel drop-off &amp; return",
    "hotel"
   ]
  ],
  "MORE": [
   [
    "turtle.jpg",
    "100% turtle guarantee snorkeling",
    "Waikiki's most popular turtle snorkeling tour"
   ],
   [
    "course_sup_sunset.webp",
    "Sunset &amp; wine turtle snorkeling",
    "4 hours that end with sunset and wine"
   ]
  ],
  "MORE_H2": "OceanStar exclusives",
  "PERKS": [
   [
    "gear",
    "Full snorkeling gear set",
    ""
   ],
   [
    "sup",
    "Kayak · paddleboard gear",
    ""
   ],
   [
    "guide",
    "Safety gear · crew support",
    ""
   ],
   [
    "van",
    "Hotel pickup · drop-off",
    ""
   ],
   [
    "float",
    "Floating chairs · mats",
    ""
   ],
   [
    "sun",
    "Reef-safe sunscreen tips",
    ""
   ]
  ],
  "PERKS_H2": "Your own private day in Waikiki",
  "PERKS_LEDE": "Sea turtle snorkeling at Turtle Canyon · Diamond Head cruise · fully private.<br>Relaxed enough for families snorkeling for the first time and couples planning a special day.",
  "PERKS_SUB_H": "What's included",
  "PERK_NOTES": [],
  "PERK_PHOTO": [
   "private_boat.webp",
   "The OCEAN STAR boat off Waikiki"
  ],
  "RECO": [
   "Families with kids",
   "Honeymoons · couples",
   "Birthdays · anniversaries",
   "Proposals",
   "Friends · small groups",
   "Groups · special events"
  ],
  "RECO_H2": "Perfect for",
  "SECTIONS": [
   "perks",
   "combo",
   "features",
   "flow",
   "course",
   "days",
   "reco",
   "more"
  ],
  "SHOW_STARS": false,
  "THEME": "private",
  "TIME_H2": "Available times",
  "TIME_PURE": "Times include pickup and drop-off.<br>Final times can be adjusted after booking.",
  "TIME_SUB": "We run on Mon, Fri and Sat."
 },
 "surf_ko": {
  "COMBOS": [
   [
    "콤보",
    "거북이 스노클링<br>+ 서핑 그룹 레슨",
    [
     "거북이 스노클링 · 월 - 토",
     "서핑 그룹 레슨 90분 · 하루 5회",
     "와이키키 · 알라모아나 픽업"
    ]
   ]
  ],
  "COMBO_H2": "거북이 스노클링 + 서핑 콤보",
  "COMBO_LEDE": "거북이 스노클링과 서핑 그룹 레슨을 한 번에 예약하는 콤보 상품입니다.",
  "COMBO_PRICE": "문의",
  "COMBO_PRICES": {
   "콤보": [
    "₩221,880",
    "",
    "1인"
   ]
  },
  "DOCK_SUB": "거북이 스노클링 + 서핑 콤보",
  "END_H2": "지금 바다로 나가 볼까요",
  "END_SUB": "원하시는 날짜와 레슨 시간을 골라 주세요.",
  "HERO": {
   "eyebrow": "알라모아나 서핑 레슨",
   "h1": "하와이에서 만나는<br>첫 <span class=\"hl\">서핑</span> 레슨",
   "badge": "압도적 업계 통합 누적 리뷰 15,000개",
   "price": "₩221,880",
   "price_per": "1인",
   "price_sub": "거북이 스노클링 + 서핑 콤보",
   "facts": [
    [
     "레슨 소요시간",
     "90분 (그룹 레슨)"
    ],
    [
     "레슨 시간",
     "하루 5회 · 07:30 - 14:30"
    ],
    [
     "미팅 장소",
     "알라모아나 비치파크"
    ],
    [
     "픽업",
     "와이키키 · 알라모아나"
    ]
   ],
   "pure": "레슨 시간은 마지막 픽업 시간 기준입니다."
  },
  "HERO_IMG": [
   "hero_surf.webp",
   "야자수 잎 아래 서핑보드를 들고 바다로 걸어가는 아이와 강사"
  ],
  "HERO_IMG_M": [
   "hero_surf_m.webp",
   "야자수 잎 아래 서핑보드를 들고 바다로 걸어가는 아이와 강사"
  ],
  "MAP_URL": "https://maps.app.goo.gl/3jozBp7iqh3VPZSr8",
  "MEET": [
   [
    "직접 이동",
    "직접 이동 시 알라모아나 비치파크에서 미팅합니다.",
    "구글 지도로 보기"
   ],
   [
    "호텔 픽업",
    "와이키키/알라모아나 지역 픽업이 가능하며, 카할라 지역은 1인당 $10의 추가요금이 적용됩니다.",
    null
   ]
  ],
  "MEET_H2": "이동 및 픽업",
  "MEET_PHOTO": [
   "surf_boards.webp",
   "알라모아나 비치파크 모래사장에 줄지어 놓인 서핑보드"
  ],
  "MORE": [
   [
    "turtle.jpg",
    "거북이 100% 보장 스노클링",
    "가장 많이 찾는 와이키키 거북이 스노클링"
   ],
   [
    "private_boat.webp",
    "단독 프라이빗 크루즈",
    "오직 우리 팀만을 위한 와이키키 바다"
   ]
  ],
  "MORE_H2": "오션스타만의 특별상품",
  "PERKS": [
   [
    "check",
    "수영복",
    "대여 불가"
   ],
   [
    "check",
    "래쉬가드",
    "필수 착용 · 대여 $10"
   ],
   [
    "check",
    "레깅스",
    "필수 착용 · 대여 $10"
   ],
   [
    "check",
    "아쿠아슈즈",
    "필수 착용 · 대여 $10"
   ],
   [
    "check",
    "선크림",
    "화상 입지 않게 꼭 선크림을 바르고 오세요"
   ],
   [
    "check",
    "비치타월",
    "호텔에서 대여해 오시면 됩니다"
   ]
  ],
  "PERKS_H2": "파도 위에 처음 서는 90분",
  "PERKS_LEDE": "알라모아나 비치파크의 잔잔한 바다에서 강사와 함께 배웁니다.<br>서핑 그룹 레슨은 90분입니다.",
  "PERKS_SUB_H": "준비물",
  "PERK_NOTES": [
   "래쉬가드, 레깅스, 아쿠아슈즈는 안전을 위해 필수 착용입니다.",
   "개인 장비가 없는 경우 1인당 $10에 대여 가능합니다.",
   "수영복과 어린이 장비는 대여가 불가능합니다."
  ],
  "PERK_PHOTO": [
   "surf_kid.webp",
   "와이키키 빌딩을 배경으로 보드 위에 선 아이와 뒤에서 잡아 주는 강사"
  ],
  "RULES": [
   [
    "사전 문의",
    "7세 미만 어린이, 65세 이상, 체중 95kg 이상 참가자는 예약 전 사전 문의가 필요합니다.",
    false
   ],
   [
    "참여 불가",
    "임산부 및 심장질환, 심각한 허리 질환이 있으신 분은 레슨 참여가 불가능합니다.",
    true
   ],
   [
    "보호자",
    "미성년자 참가자의 경우 보호자 최소 한 분 동행해주셔야 합니다.",
    false
   ],
   [
    "동행 인원",
    "강습 인원 1 인당 최대 동행 가능 인원은 2 명 입니다.",
    false
   ]
  ],
  "RULES_H2": "연령 및 참가 유의사항",
  "RULES_PHOTO": [
   "surf_wave.webp",
   "파도 위 보드에 엎드려 웃는 아이와 뒤에서 무릎 꿇고 잡아 주는 강사"
  ],
  "SECTIONS": [
   "perks",
   "combo",
   "sessions",
   "meet",
   "rules",
   "more"
  ],
  "SESSIONS": [
   [
    "1부",
    "07:30"
   ],
   [
    "2부",
    "09:15"
   ],
   [
    "3부",
    "11:00"
   ],
   [
    "4부",
    "12:45"
   ],
   [
    "5부",
    "14:30"
   ]
  ],
  "SESS_H2": "서핑 레슨 시간",
  "SESS_NOTE": "서핑 그룹 레슨은 90분 진행합니다.",
  "SESS_SUB": "마지막 픽업 시간 기준입니다.",
  "SHOW_STARS": false,
  "THEME": "surf"
 },
 "surf_en": {
  "COMBOS": [
   [
    "Combo",
    "Turtle snorkeling<br>+ group surf lesson",
    [
     "Turtle snorkeling · Mon - Sat",
     "Group surf lesson, 90 min · 5 a day",
     "Waikiki · Ala Moana pickup"
    ]
   ]
  ],
  "COMBO_H2": "Turtle snorkeling + surf combo",
  "COMBO_LEDE": "Book turtle snorkeling and a group surf lesson together in one combo.",
  "COMBO_PRICE": "Contact us",
  "COMBO_PRICES": {
   "Combo": [
    "$160",
    "Per person",
    ""
   ]
  },
  "DOCK_SUB": "Turtle snorkeling + surf combo",
  "END_H2": "Ready to head out to sea?",
  "END_SUB": "Choose your date and lesson time.",
  "HERO": {
   "eyebrow": "Ala Moana surf lesson",
   "h1": "Your first <span class=\"hl\">surf</span> lesson<br>in Hawaii",
   "badge": "15,000+ reviews across platforms",
   "price": "$160",
   "price_per": "",
   "price_sub": "Turtle snorkeling + surf combo, per person",
   "facts": [
    [
     "Lesson length",
     "90 min (group lesson)"
    ],
    [
     "Lesson times",
     "5 a day · 07:30 - 14:30"
    ],
    [
     "Meeting point",
     "Ala Moana Beach Park"
    ],
    [
     "Pickup",
     "Waikiki · Ala Moana"
    ]
   ],
   "pure": "Lesson times are based on the last pickup time."
  },
  "HERO_IMG": [
   "hero_surf.webp",
   "A child and an instructor carrying a surfboard toward the ocean under palm fronds"
  ],
  "HERO_IMG_M": [
   "hero_surf_m.webp",
   "A child and an instructor carrying a surfboard toward the ocean under palm fronds"
  ],
  "MAP_URL": "https://maps.app.goo.gl/3jozBp7iqh3VPZSr8",
  "MEET": [
   [
    "On your own",
    "If you come on your own, we'll meet you at Ala Moana Beach Park.",
    "View on Google Maps"
   ],
   [
    "Hotel pickup",
    "Pickup is available in the Waikiki and Ala Moana areas. Kahala pickup has a $10 per person surcharge.",
    null
   ]
  ],
  "MEET_H2": "Getting there and pickup",
  "MEET_PHOTO": [
   "surf_boards.webp",
   "Surfboards lined up on the sand at Ala Moana Beach Park"
  ],
  "MORE": [
   [
    "turtle.jpg",
    "100% guaranteed turtle snorkeling",
    "Our most popular Waikiki turtle snorkeling tour"
   ],
   [
    "private_boat.webp",
    "Private cruise",
    "The Waikiki ocean, just for your group"
   ]
  ],
  "MORE_H2": "Only at OceanStar",
  "PERKS": [
   [
    "check",
    "Swimsuit",
    "Not available to rent"
   ],
   [
    "check",
    "Rash guard",
    "Required · $10 rental"
   ],
   [
    "check",
    "Leggings",
    "Required · $10 rental"
   ],
   [
    "check",
    "Water shoes",
    "Required · $10 rental"
   ],
   [
    "check",
    "Sunscreen",
    "Be sure to put on sunscreen so you don't get burned"
   ],
   [
    "check",
    "Beach towel",
    "Just borrow one from your hotel"
   ]
  ],
  "PERKS_H2": "Your first 90 minutes on the waves",
  "PERKS_LEDE": "Learn with an instructor in the calm waters of Ala Moana Beach Park.<br>The group surf lesson runs 90 minutes.",
  "PERKS_SUB_H": "What to bring",
  "PERK_NOTES": [
   "Rash guards, leggings and water shoes are required for safety.",
   "If you don't have your own, you can rent them for $10 per person.",
   "Swimsuits and kids' gear are not available to rent."
  ],
  "PERK_PHOTO": [
   "surf_kid.webp",
   "A child standing on a board as an instructor holds it from behind, with Waikiki buildings in the background"
  ],
  "RULES": [
   [
    "Ask first",
    "Children under 7, guests 65 and older, and guests weighing 95 kg (209 lb) or more must contact us before booking.",
    false
   ],
   [
    "Not permitted",
    "Pregnant guests and anyone with heart disease or a serious back condition cannot take part in the lesson.",
    true
   ],
   [
    "Guardian",
    "Minors must be accompanied by at least one parent or guardian.",
    false
   ],
   [
    "Companions",
    "Each student may bring up to 2 companions.",
    false
   ]
  ],
  "RULES_H2": "Age and participation notes",
  "RULES_PHOTO": [
   "surf_wave.webp",
   "A smiling child lying on a board on a wave as an instructor kneels behind to hold it"
  ],
  "SECTIONS": [
   "perks",
   "combo",
   "sessions",
   "meet",
   "rules",
   "more"
  ],
  "SESSIONS": [
   [
    "Session 1",
    "07:30"
   ],
   [
    "Session 2",
    "09:15"
   ],
   [
    "Session 3",
    "11:00"
   ],
   [
    "Session 4",
    "12:45"
   ],
   [
    "Session 5",
    "14:30"
   ]
  ],
  "SESS_H2": "Surf lesson times",
  "SESS_NOTE": "Group surf lessons run 90 minutes.",
  "SESS_SUB": "Based on the last pickup time.",
  "SHOW_STARS": false,
  "THEME": "surf"
 }
};
