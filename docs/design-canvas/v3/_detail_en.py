# -*- coding: utf-8 -*-
"""Detail page (English) copy - the English version of _detail_ko.py.

Same variable names, data shapes and image filenames as the Korean module.
Prices are in USD. Terminology follows src/locales/en.ts.
"""

STEM = "DetailEn"
BOARD_TITLE = "상세페이지 · 거북이 스노클링 · 영문"
LANG = "en"

THEME = "turtle"
HERO = dict(
    eyebrow="The original turtle snorkeling in Hawaii",
    h1='Guaranteed turtle<br><span class="hl">snorkeling</span>',
    badge="15,000+ reviews across platforms",
    # Booking card
    price="$110",
    price_sub="Per adult · Under 24 months free",
    facts=[
        ("Duration", "4 hours (incl. pickup & drop-off)"),
        ("Departures", "Session 1 07:30 · Session 2 10:30"),
        ("Pickup", "Free shuttle from set Waikiki spots"),
        ("Includes", "Gear · Ramen & drinks · Photo shoot"),
    ],
    pure="The boat departs at 08:00 and returns to the harbor at 11:00. The 30 minutes before and after are for pickup and drop-off.",
)

PERKS_H2 = "Make your trip easier and more special"
PERKS = [
    ("van",    "Round-trip Waikiki shuttle",
     "OceanStar runs its own vehicles (3 in total).<br>Ride in comfort in a new 15-passenger Ford van."),
    ("gear",   "Free gear",
     "Snorkel gear, fins, life jackets and everything else you need for the activities, free of charge. All sizes available."),
    ("bowl",   "Ramen after the swim",
     "Ramen, snacks and drinks, a must after time in the water, all free of charge."),
    ("camera", "Photos of a lifetime",
     "We capture your best shots with sparkling Diamond Head and the Waikiki ocean as the backdrop."),
]

FEAT_H2 = 'OceanStar’s <span class="hl">6&nbsp;standout&nbsp;features</span>'
# (number, title, subtitle, body paragraphs, highlight line)
FEATURES = [
    ("01", "The Hawaii original", "The original Turtle Canyon tour",
     ["We have run turtle snorkeling off Waikiki since 2019 and know Turtle Canyon better than "
      "anyone.<br>Our professional, friendly crew looks after you, so you can experience the quality "
      "of a Hawaii best seller for yourself."],
     None),
    ("02", "Waikiki’s only wooden rooftop", "Blocks 100% of UV, rain & seasickness",
     ["The rooftop keeps out the hot sun and rain, and its stable roof structure minimizes rocking and seasickness."],
     "Unlike other companies, everyone sits under a comfortable roof. A truly considerate tour, relaxing and safe!"),
    ("03", "Designed & introduced by OceanStar", "5 ocean activities + photos of a lifetime",
     ["Stand-up paddleboards, kayaks, sea chairs, diving and more. Enjoy a variety of activities freely along with snorkeling!",
      "We’ll also take as many great photos as you like with Diamond Head and Waikiki in the background."],
     None),
    ("04", "100% turtle sighting guarantee", "One hour longer than others",
     ["We guarantee 100% an unforgettable snorkel with turtles. Relax and enjoy one hour longer than "
      "other companies.<br>When you choose OceanStar, we make sure your day is special and happy."],
     "On lucky days, you may even spot dolphins!"),
    ("05", "Latest genuine GoPro rental & filming", "$40 rental fee",
     ["Rent a GoPro and we’ll dive deep underwater to film turtles and all kinds of fish up close.<br>"
      "We capture your special day in photos and videos.",
      "The rental fee is paid on site in cash or by bank transfer."],
     None),
    ("06", "Safety & hygiene first", "5-step sanitizing every day",
     ["For a comfortable, special day, we provide a safety briefing, US Coast Guard-approved life jackets "
      "and accident insurance, and we sanitize all gear and the boat inside and out with a 5-step process every day.",
      "See our cleanliness for yourself during the tour. You are also welcome to bring your own gear."],
     None),
]

TIME_H2 = "Tour times"
TIME_SUB = "Choose Session 1 or Session 2 when you book."
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
# (name, time lines, days operated, color)
SLOTS = [
    ("Session 1", ["07:30 - 11:30"], 6, "sea"),
    ("Session 2", ["10:30 - 14:30"], 6, "deep"),
    ("Sunset snorkeling", ["14:30 - 18:30", "15:30 - 19:30"], 4, "food"),
]
TIME_PURE = ("Times shown run from pickup to drop-off.<br>For Session 1, the boat departs at 08:00 and "
             "returns to the harbor at 11:00, with 30 minutes before and after for pickup and drop-off.")
TIME_NOTES = [
    "Closed on Sundays for safety inspections.",
    "Sunset snorkeling times may change between the winter and summer seasons.",
    "Once your booking is confirmed, we’ll email you a voucher.",
]

FLOW_H2 = "Itinerary"
FLOW_SUB = "4 hours, starting with hotel pickup and ending back at your hotel."
# (step name, end marker)
JOURNEY = [
    ("Hotel pickup", "van"),
    ("Departure", None),
    ("Diamond Head cruise", None),
    ("Turtle snorkeling", None),
    ("5 ocean activities", None),
    ("Snacks & photos", None),
    ("Waikiki cruise", None),
    ("Arrival", None),
    ("Hotel drop-off", "hotel"),
]
FLOW_NOTE = "When the driver calls your name, please confirm it’s OceanStar before boarding."

STAR_H2 = 'The stars’ <span class="hl">real visit photos</span>'
STAR_SUB = "OceanStar, Hawaii’s signature snorkeling tour, visited in person by countless stars"
STAR_BADGE = "Not sponsored · Not an ad · 100% paid their own way"
STARS = [
    "Actress Park Bo-young", "Shiho Yano", "Choo Sarang",
    "Actress Lee Sun-bin", "Actress Jo Yu-ri", "Dancer Gabee",
    "Actress Lee Si-young", "TV personality Kim Dae-ho", "YouTuber Lee Mal-nyeon (Chimchakman)",
    "Actor Jang Won-young", "National swimmer Hwang Sun-woo", "Singer & actor Lee Seung-gi",
    "YouTubers Enjoy Couple", "Woori WON women’s pro basketball team", "Former TIRTIR CEO Lee Yu-bin",
]
STAR_TAG = "@oceanstar_turtlesnorkelling"

MORE_H2 = "Special tours only at OceanStar"
MORE = [
    ("boat_private.webp", "Private charter",
     "Waikiki turtle snorkeling & cruise, just for your group"),
    ("sunset.jpg", "Romantic sunset cruise",
     "Sunset turtle snorkeling + 5 ocean activities + wine cruise"),
]
END_H2 = "Ready to head out to sea?"
END_SUB = "We sail every day except Sunday.<br>Pick the date that works for you."

# Footer - same values as the English landing footer (src/locales/en.ts).
FOOT_ABOUT = "The original Turtle Canyon snorkeling tour.<br>Travel Platform 8,000+ Reviews · Google 5,000+ Reviews."
FOOT_HOURS = ["Hawaii Time: Mon - Sat 09:00 - 17:00", "hioceanstar@gmail.com", "8083081792"]
FOOT_ADDR = "1125 Kewalo Basin Harbor,<br>Gate D #110, Honolulu, HI 96814"
FOOT_BIZ = ["Company: Oceanview Activity LLC",
            "Address: 615 PIKOI ST. STE 811",
            "Phone: 8083081792"]
FOOT_COPY = "© 2026 Ocean Star. All Rights Reserved."

# ── Tour course ─────────────────────────────────────────────────────
COURSE_H2 = "Tour course"
# Mobile horizontal swipe hint.
COURSE_HINT = "8 steps · Swipe to see more"
# (title, duration or None, body, note or None, photo key)
COURSE = [
    ("🚐 Waikiki hotel pickup", "20 min",
     "🌺 Aloha! Our guide will pick you up in a 15-passenger van at the designated Waikiki "
     "pickup spot closest to your hotel. Ride to the harbor in comfort! Pickup times are sent to "
     "each guest individually. Pickup from the Kahala Hotel costs extra. If you’re coming to the "
     "boat on your own, we’ll send you parking info and directions😊",
     None, "van"),
    ("⛵ Arrive at Kewalo Harbor & board", None,
     "Board the turtle snorkeling boat at beautiful Kewalo Harbor, just 15 minutes from Waikiki! "
     "🏝 The only boat in Waikiki with a wooden roof, it’s a sturdy, historic vessel built for "
     "ocean activities! The rooftop minimizes rocking, so you’re less likely to get seasick. Once "
     "aboard, you’ll get a safety briefing and tour overview, plus life jackets and snorkel "
     "gear. 🐙",
     "*When the season and weather allow, the OceanStar captain will look for dolphins and whales&nbsp;🐬🐋",
     "boat"),
    ("🐢 Snorkeling with sea turtles", "180 min",
     "Meet Hawaiian sea turtles and all kinds of Pacific fish at Waikiki’s Turtle Canyon! Our crew "
     "lead you to the turtle spots and help with underwater photos and videos. The crew stay right "
     "beside you while you snorkel at your own pace, so enjoy the Pacific worry-free! Can’t swim? "
     "Don’t worry🏊 If swimming is hard for you or you feel a little nervous, our crew will tow "
     "you on a board until you’re comfortable (or the whole time).",
     "*Rent a GoPro and we can dive down for super close-up turtle photos and videos 🐢",
     "turtle"),
    ("Stand-up paddleboard + sea kayak + sea chair tube", None,
     "Leaving after just snorkeling would be a shame! A special time that feels like you have the "
     "Waikiki ocean all to yourself✨ Float across the Pacific in a sea kayak and take on a balance "
     "challenge on a stand-up paddleboard! The core workout is a bonus 💪 There’s even a sea chair "
     "tube for relaxing in the middle of the ocean, so enjoy it all as you like!",
     "*Lines tied on for safety can all be untied on request 😄",
     "sup2"),
    ("🌊 Diving from the boat", None,
     "🌺 A dive spot right off the boat, ONLY at OceanStar! Dive safely into the ocean from a boat "
     "built for water activities🏄 The only boat diving at Waikiki’s Turtle Canyon✨ A refreshing "
     "Pacific dive with Diamond Head and the endless horizon behind you! You know you can’t miss "
     "the photos and videos, right?!",
     None, "dive"),
    ("🍜 Snack time after the swim", None,
     "The perfect treat after a swim!❤️ We serve hot kimchi and shrimp cup ramen "
     "right in the middle of the Pacific🍜 Help yourself to America’s favorite snack, Pop-Tarts🍪, "
     "plus instant coffee mix and hot tea! Recharge your sugar & energy and fill the rest of "
     "your time with activities!",
     None, "bowl"),
    ("Photo time with Diamond Head", None,
     "We capture your happy, beautiful memories of Hawaii📷🖼 With OceanStar crew photo skills that "
     "rival the pros, take home photos of a lifetime you’ll treasure forever🧡 Enjoy all the photo "
     "time you want with Diamond Head, Waikiki Beach and the Pacific as your backdrop!",
     None, "photo"),
    ("🚐 Back to your Waikiki hotel", "20 min",
     "🌺 Sadly, your trip has come to an end😢 We’ll take you safely back to your Waikiki hotel. "
     "Treasure the special experience, happy memories and amazing photos with OceanStar and the "
     "turtles for a long time! Enjoy the rest of your time in Hawaii!&nbsp;Mahalo🤙",
     None, "van"),
]
