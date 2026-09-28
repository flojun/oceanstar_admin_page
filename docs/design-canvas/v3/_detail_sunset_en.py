# -*- coding: utf-8 -*-
"""English copy of the sunset turtle snorkeling detail page.

Mirrors _detail_sunset_ko.py one to one: same names, same data shapes, same
image files in the same places. Only the text is translated, following the
live site's English locale (src/locales/en.ts). Prices are USD. Shared brand
blocks come from _detail_en, the English twin of _detail_ko.
"""
from _detail_en import (FEAT_H2, FEATURES, DAYS, FLOW_NOTE,
                        STAR_H2, STAR_SUB, STAR_BADGE, STARS, STAR_TAG, END_H2,
                        FOOT_ABOUT, FOOT_HOURS, FOOT_ADDR, FOOT_BIZ, FOOT_COPY)

STEM = "DetailSunsetEn"
BOARD_TITLE = "상세페이지 · 선셋 거북이 스노클링 · 영문"
LANG = "en"
THEME = "sunset"

HERO_IMG = ("hero_sunset.webp", "Two hands clinking wine glasses against a sunset over the ocean")
HERO_IMG_M = ("hero_sunset_m.webp", "Two hands clinking wine glasses against a sunset over the ocean")
SHOW_STARS = False
HERO = dict(
    eyebrow="The original turtle snorkeling in Hawaii",
    h1='Sunset &amp; Wine<br>Turtle <span class="hl">Snorkeling</span>',
    badge="15,000+ reviews across platforms",
    price="$150",
    price_sub="Per adult · Under 24 months free",
    facts=[
        ("Duration", "4 hours (incl. pickup and drop-off)"),
        ("Days", "Mon · Tue · Wed · Thu"),
        ("Hours", "Winter 14:30 - 18:30<br>Summer 15:00 - 19:00<br>Summer 15:30 - 19:30"),
        ("Includes", "Gear · Wine and cheese board · Photos"),
    ],
    pure="Your exact winter or summer time will be listed on your voucher.",
)

PERKS_H2 = "About this tour"
PERKS_LEDE = ("Snorkel with sea turtles at Turtle Canyon in Waikiki.<br>Then, as the sun "
              "goes down, enjoy a romantic sunset cruise with wine and a cheese board.")
PERK_PHOTO = ("crew_briefing.webp",
              "A crew member in an OceanStar shirt briefing guests on the boat")
PERKS_SUB_H = "Highlights"
PERKS = [
    ("turtle", "Turtle snorkeling",  "Wild sea turtles at Turtle Canyon"),
    ("wine",   "Wine cruise",        "Unlimited wine and cheese at sunset"),
    ("sup",    "5 activities",       "Paddleboard, kayak and diving included"),
    ("van",    "Round-trip pickup",  "Free pickup from Waikiki hotels"),
    ("gear",   "Gear included",      "All snorkeling gear provided"),
    ("guide",  "Crew in the water",      "Friendly guides swim right beside you"),   # 영문 손님용 문구(운영자 선택)
]
PERK_NOTES = [
    "🌞 Snorkel worry-free on our covered boat, shaded from the sun's UV rays.",
    "🍷 Cheese board and wine provided to make your romantic sunset snorkeling even more special.",
]

TIME_H2 = "Tour times"
TIME_SUB = "Sunset snorkeling runs Monday through Thursday."
SLOTS = [
    ("Winter", ["14:30 - 18:30"], 4, "food"),
    ("Summer", ["15:00 - 19:00", "15:30 - 19:30"], 4, "deep"),
]
REST_LABEL = "Not offered"
TIME_PURE = "Your exact winter or summer time will be listed on your voucher."
TIME_NOTES = [
    "Once your booking is confirmed, we'll email you a voucher.",
]

FLOW_H2 = "Itinerary"
FLOW_SUB = "Four hours, starting with hotel pickup and ending with hotel drop-off."
JOURNEY = [
    ("Hotel pickup", "van"),
    ("Turtle snorkeling", None),
    ("Photo time", None),
    ("Paddleboard, kayak,<wbr> sea chair&nbsp;tube", None),
    ("Boat diving", None),
    ("Wine party", None),
    ("Hotel drop-off", "hotel"),
]

COURSE_H2 = "The course"
COURSE_HINT = "7 steps · Swipe to see more"
# (title, duration or None, body, note or None, photo key)
COURSE = [
    ("Hotel pickup", "20 min",
     "Aloha! Your guide will pick you up at the pickup spot closest to your hotel. "
     "We'll send you your pickup time individually.", None, "van"),
    ("Turtle snorkeling", "180 min",
     "Snorkel with wild sea turtles and all kinds of Pacific fish at Turtle Canyon "
     "in Waikiki.", None, "turtle"),
    ("Photo time", None,
     "Take photos you'll treasure forever on deck, with Diamond Head and the Pacific "
     "spread out behind you.", None, "photo"),
    ("Stand-up paddleboard + sea kayak + sea chair tube", None,
     "The top pick of Lee Hyori &amp; Yano Shiho! Try stand-up paddleboarding right off "
     "Waikiki. A core workout comes as a bonus!<br>"
     "Drift across the Pacific in a sea kayak and soak up the cool Waikiki waters.<br>"
     "Relax on a sea chair tube floating out on the ocean and watch the sunset.",
     None, "sup3"),
    ("Boat diving", None,
     "Only at OceanStar! The one and only boat diving at Turtle Canyon in Waikiki. Don't miss it!",
     None, "dive"),
    ("Wine party", None,
     "Watch a beautiful sunset from the deck and share a romantic moment over wine.", None, "wine"),
    ("Hotel drop-off", "20 min",
     "Sadly, the trip comes to an end! We'll take you safely back to your Waikiki hotel.<br>"
     "Keep the special experience, happy memories and amazing photos with you for years to come!",
     None, "van"),
]

MORE_H2 = "Only at OceanStar"
MORE = [
    ("turtle.jpg", "100% guaranteed turtle snorkeling",
     "Our most popular Waikiki turtle snorkeling tour"),
    ("boat_private.webp", "Private charter",
     "Waikiki turtle snorkeling &amp; cruise, just for your group"),
]
END_SUB = "Sunset snorkeling departs Monday through Thursday.<br>Pick the date that works for you."
