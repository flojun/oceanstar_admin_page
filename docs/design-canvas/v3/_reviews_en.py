# -*- coding: utf-8 -*-
"""고객후기 영문 보드용 후기 본문.

홈페이지 후기: 운영 DB reviews.content_en 그대로(사이트가 후기 등록 때 DeepL 로 만들어
두는 영문 번역). 원래 영어로 쓴 후기는 원문 그대로다. 이름과 사진은 한글 보드와 같다.
긴 후기는 한글 보드와 같은 자리까지만 싣는다(카드에서는 어차피 잘리고 '더보기').
구글 리뷰: google_reviews 원문 중 영어 부분만 싣는다. 운영자가 괄호 안에 덧붙인 한국어
번역은 뺐고, 한국어로만 쓴 한 건(지연)은 영문 번역이 DB 에 없어 싣지 않는다.
"""

# 이름 -> (영문 날짜, 영문 본문). 이름은 한글 SITE 목록과 같은 순서·같은 값.
SITE_EN = {
    "요미이잉": ("Jun 30, 2026",
             "Thanks to you, I had such a fun time, haha.\nThere’s a canopy overhead, and they even "
             "provide ramen and snacks 👍\nAll the crew members are so friendly!"),
    "김웅": ("Jun 11, 2026",
            "It was such a fun day. I saw so many turtles~~^^ The crew members were kind, cheerful, "
            "and fun to be around."),
    "은땡땡": ("May 25, 2026",
             "We saw lots of turtles, and the staff were all so friendly—it was a really fun tour!!\n"
             "On the way back, we even saw dolphins!! It was such a wonderful memory! Thank you so "
             "much—I highly recommend it!!"),
    "률루랄라": ("Apr 29, 2026",
              "Since none of us knew each other, things were a bit awkward at first, but you did such "
              "a great job of keeping things fun and lively, and we had a safe and wonderful time!!\n"
              "We took lots of cool and beautiful photos, and it was so much fun!!"),
    "김승호": ("Apr 29, 2026",
             "We booked the sunset cruise during our honeymoon, and it was such a wonderful experience "
             "that I truly feel it was the best decision we made on this trip ♥\nAt first, I was a "
             "little worried because the weather was cloudy, but those worries vanished the moment we "
             "set out to sea—the atmosphere was amazing. Best of all, we were lucky enough to spot a "
             "whale, which made the experience even more memorable."),
    "James Cole": ("Apr 29, 2026",
                   "We had an amazing snorkeling experience! Saw so many fish and turtles. Staff & "
                   "captain were kind and knowledgeable. We also appreciated the small group size, "
                   "snacks, and festive music. 10/10 would recommend!!"),
    "정지수": ("Apr 29, 2026",
             "As soon as the boat set sail, we were lucky enough to spot a humpback whale and a sea "
             "turtle right away, haha. The weather was absolutely perfect, and the staff were so "
             "helpful—they took lots of photos for us and made sure we had everything we needed! "
             "Thanks to them, I feel like I had so many once-in-a-lifetime experiences, haha. I’m so "
             "grateful and happy!"),
    "장하늘": ("Apr 29, 2026",
             "I absolutely loved it! It was so much fun that I’ve already booked it again for the day "
             "after tomorrow!! The crew was so friendly, and the activity itself was just the "
             "best...!!! The sunset tour was even more enjoyable because we were with Ocean Star—it’s "
             "a must-try travel experience I’d definitely recommend to friends! (But it has to be "
             "Ocean Star, no question.)"),
    "Sarah Rivers": ("Apr 29, 2026",
                     "Amazing! So fun and relaxing, boat crew was amazing and friendly! Highly "
                     "recommend this tour if you are visiting Hawaii!"),
    "박하림": ("Apr 28, 2026",
             "This was the tour I was most looking forward to in Hawaii, and it exceeded all my "
             "expectations. From the activities and the crew to the boat and the weather, it was a "
             "perfect day. We’re leaving with wonderful memories of our family time together~ We’ll "
             "be back again. Best of luck to you!"),
    "조인성": ("Apr 28, 2026",
             "A tour where you’re guaranteed to see turtles!! It was so romantic and wonderful to see "
             "not only turtles but also fish swimming right in front of me T_T There were lots of "
             "activities besides snorkeling, so it was a blast."),
    "김예진": ("Apr 28, 2026",
             "I signed up for this tour because it’s said to be the most famous one in Hawaii, and "
             "now I totally get why. The staff were so friendly, and with the great weather today, I "
             "think I saw over 10 sea turtles!!!"),
    "여행조하": ("Apr 28, 2026",
              "This was the most fun part of my trip to Hawaii so far!!\nI got to see the turtles up "
              "close! Now I understand why everyone recommends this place and why there are so many "
              "reviews!"),
    "Kristina Lua": ("Apr 17, 2026",
                     "Best experience ever they were very welcoming understanding and attentive to "
                     "your needs and everyone was very friendly and me and my family had a blast"),
}

GOOGLE_EN = [
    ("Kiya C.", "Amazing!! Didn't know it was a Korean boat experience and I wouldn't have had "
     "it any other way. The staff was so helpful with the dive! They took such good pictures "
     "and the ramen after was amazing 20/10 experience, Highly recommended."),
    ("Paul N.", "Oceanstar boat and crew were great! Troy and Zoey were great with "
     "instructions! We saw lots of fishes and the turtles were huge!"),
    ("Daisy M.", "Having our guide was like having our very own mermaid! We saw a lot of "
     "turtles and tons of fish! We swam a good distance, too! It was AMAZING!"),
    ("Michael T.", "Super fun time! The crew went above and beyond and made sure we had an "
     "incredible time... We saw so many turtles!"),
]
