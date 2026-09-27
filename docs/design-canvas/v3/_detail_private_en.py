# -*- coding: utf-8 -*-
"""English copy of _detail_private_ko.py (private cruise charter).

Same variable names, data shapes and image filenames as the Korean module.
Prices were already in USD and are kept as is.
"""
from _detail_en import (FEATURES, END_H2,
                        FOOT_ABOUT, FOOT_HOURS, FOOT_ADDR, FOOT_BIZ, FOOT_COPY)

STEM = "DetailPrivateEn"
BOARD_TITLE = "상세페이지 · 프라이빗 크루즈 · 영문"
LANG = "en"
THEME = "private"
SHOW_STARS = False
SECTIONS = ["perks", "combo", "features", "flow", "course", "days", "reco", "more"]
DOCK_SUB = "Option 1 · 1-10 guests / Team"

HERO_IMG = ("hero_private.webp", "Three people laughing on the bow with the Waikiki skyline behind")
HERO_IMG_M = ("hero_private_m.webp", "Three people laughing on the bow with the Waikiki skyline behind")
HERO = dict(
    eyebrow="Waikiki private cruise",
    h1='A private boat<br>for <span class="hl">your group</span>',
    badge="15,000+ reviews across platforms",
    price="$1,200",
    price_sub="Option 1 · 1-10 guests / Team · 2 hours, fully private",
    facts=[
        ("Private", "Private boarding for your group"),
        ("Duration", "About 2 hours"),
        ("Group size", "Groups of up to 30"),
        ("Included", "Hotel pickup · drop-off"),
    ],
    pure="The Saturday 15:30 sunset slot may sell out early.",
)

PERKS_H2 = "Your own private day in Waikiki"
PERKS_LEDE = ("Sea turtle snorkeling at Turtle Canyon · Diamond Head cruise · fully&nbsp;private.<br>"
              "Relaxed enough for families snorkeling for the first time and couples planning a special day.")
PERK_PHOTO = ("private_boat.webp",
              "The OCEAN STAR boat off Waikiki with guests on board")
PERKS_SUB_H = "What's included"
PERKS = [
    ("gear",  "Full snorkeling gear set", ""),
    ("sup",   "Kayak · paddleboard gear", ""),
    ("guide", "Safety gear · crew support", ""),
    ("van",   "Hotel pickup · drop-off",  ""),
    ("float", "Floating chairs · mats",   ""),
    ("sun",   "Reef-safe sunscreen tips", ""),
]
PERK_NOTES = []

COMBO_H2 = "Choose the way you like"
COMBO_LEDE = "3 private options based on group size"
_INCL = ["Snorkeling · ocean activities", "Waikiki coastal cruise", "Hotel pickup · drop-off"]
COMBOS = [
    ("Option 1", "1-10 guests", _INCL),
    ("Option 2", "11-20 guests", _INCL),
    ("Option 3", "21-30 guests", _INCL),
]
COMBO_PRICE = "Contact us"
COMBO_PRICES = {"Option 1": ("$1,200", "2 hours · fully private"),
                "Option 2": ("$1,800", "2 hours · fully private"),
                "Option 3": ("$2,400", "2 hours · fully private")}

FEAT_H2 = 'Why <span class="hl">OceanStar</span>?'
FEAT_LEDE = ("Waikiki's only wood rooftop boat, just for your group with no one else on board.<br>"
             "Snorkeling, relaxing and events can be arranged in any order&nbsp;you like.")

FLOW_H2 = "About 2 hours, all private"
FLOW_SUB = "From hotel pickup to hotel drop-off, everything runs in your group's own order."
JOURNEY = [
    ("Hotel pickup &amp; boarding", "van"),
    ("Turtle Canyon snorkeling", None),
    ("Free activities &amp; relaxing", None),
    ("Diamond Head coastal cruise", None),
    ("Hotel drop-off &amp; return", "hotel"),
]
FLOW_NOTE = "Final times can be adjusted after booking."

COURSE_H2 = "Tour course"
COURSE_HINT = "5 steps · swipe to see more"
COURSE = [
    ("Hotel pickup &amp; boarding", None,
     "Our crew helps you with gear setup and a safety briefing.", None, "van"),
    ("Turtle Canyon snorkeling", None,
     "Swim with wild sea turtles, tropical fish and coral reefs.", None, "turtle"),
    ("Free activities &amp; relaxing", None,
     "Enjoy kayaks, paddleboards, floating chairs and free swimming.", None, "pv_free"),
    ("Diamond Head coastal cruise", None,
     "Take in the Waikiki skyline, with a sunset time option.", None, "pv_cruise"),
    ("Hotel drop-off &amp; return", None,
     "Head back relaxed with great photos and memories.", None, "van"),
]

TIME_H2 = "Available times"
TIME_SUB = "We run on Mon, Fri and Sat."
DAY_SLOTS = [
    ("Mon", ["15:00 - 18:00"]),
    ("Fri", ["10:30 - 13:30", "13:00 - 16:00"]),
    ("Sat", ["10:30 - 13:30", "13:00 - 16:00", "15:30 - 19:30 sunset"]),
]
TIME_PURE = "Times include pickup and drop-off.<br>Final times can be adjusted after booking."

RECO_H2 = "Perfect for"
RECO = ["Families with kids", "Honeymoons · couples", "Birthdays · anniversaries",
        "Proposals", "Friends · small groups", "Groups · special events"]

MORE_H2 = "OceanStar exclusives"
MORE = [
    ("turtle.jpg", "100% turtle guarantee snorkeling", "Waikiki's most popular turtle snorkeling tour"),
    ("course_sup_sunset.webp", "Sunset &amp; wine turtle snorkeling",
     "4 hours that end with sunset and wine"),
]
END_SUB = "Booking questions, date planning or event setup, contact us anytime."
