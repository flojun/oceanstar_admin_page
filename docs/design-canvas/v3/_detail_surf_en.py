# -*- coding: utf-8 -*-
"""English copy of the turtle snorkeling + surf lesson combo detail page.

Mirrors _detail_surf_ko.py one to one: same names, same data shapes, same
image files in the same places. Only the text is translated, following the
live site's English locale (src/locales/en.ts). Prices are USD; the combo is
$160 per person, so price_per is left empty and the per-person wording sits in
price_sub. Shared brand blocks come from _detail_en, the English twin of
_detail_ko.
"""
from _detail_en import (END_H2, FOOT_ABOUT, FOOT_HOURS, FOOT_ADDR, FOOT_BIZ, FOOT_COPY)

STEM = "DetailSurfEn"
BOARD_TITLE = "상세페이지 · 서핑 레슨 · 영문"
LANG = "en"
THEME = "surf"
SHOW_STARS = False
SECTIONS = ["perks", "combo", "sessions", "meet", "rules", "more"]
DOCK_SUB = "Turtle snorkeling + surf combo"

HERO_IMG = ("hero_surf.webp",
            "A child and an instructor carrying a surfboard toward the ocean under palm fronds")
HERO_IMG_M = ("hero_surf_m.webp",
              "A child and an instructor carrying a surfboard toward the ocean under palm fronds")
HERO = dict(
    eyebrow="Ala Moana surf lesson",
    h1='Your first <span class="hl">surf</span> lesson<br>in Hawaii',
    badge="15,000+ reviews across platforms",
    price="$160",
    price_per="",
    price_sub="Turtle snorkeling + surf combo, per person",
    facts=[
        ("Lesson length", "90 min (group lesson)"),
        ("Lesson times", "5 a day · 07:30 - 14:30"),
        ("Meeting point", "Ala Moana Beach Park"),
        ("Pickup", "Waikiki · Ala Moana"),
    ],
    pure="Lesson times are based on the last pickup time.",
)

PERKS_H2 = "Your first 90 minutes on the waves"
PERKS_LEDE = ("Learn with an instructor in the calm waters of Ala Moana Beach Park.<br>"
              "The group surf lesson runs 90 minutes.")
PERK_PHOTO = ("surf_kid.webp",
              "A child standing on a board as an instructor holds it from behind, "
              "with Waikiki buildings in the background")
PERKS_SUB_H = "What to bring"
PERKS = [
    ("check", "Swimsuit",    "Not available to rent"),
    ("check", "Rash guard",  "Required · $10 rental"),
    ("check", "Leggings",    "Required · $10 rental"),
    ("check", "Water shoes", "Required · $10 rental"),
    ("check", "Sunscreen",   "Be sure to put on sunscreen so you don't get burned"),
    ("check", "Beach towel", "Just borrow one from your hotel"),
]
PERK_NOTES = [
    "Rash guards, leggings and water shoes are required for safety.",
    "If you don't have your own, you can rent them for $10 per person.",
    "Swimsuits and kids' gear are not available to rent.",
]

COMBO_H2 = "Turtle snorkeling + surf&nbsp;combo"
COMBO_LEDE = "Book turtle snorkeling and a group surf lesson together in one combo."
COMBOS = [
    ("Combo", "Turtle snorkeling<br>+ group surf lesson",
     ["Turtle snorkeling · Mon - Sat",
      "Group surf lesson, 90 min · 5 a day",
      "Waikiki · Ala Moana pickup"]),
]
COMBO_PRICE = "Contact us"
# (price, sub line, small label before the price)
COMBO_PRICES = {"Combo": ("$160", "Per person", "")}

SESS_H2 = "Surf lesson times"
SESS_SUB = "Based on the last pickup time."
SESSIONS = [("Session 1", "07:30"), ("Session 2", "09:15"), ("Session 3", "11:00"),
            ("Session 4", "12:45"), ("Session 5", "14:30")]
SESS_NOTE = "Group surf lessons run 90 minutes."

MEET_H2 = "Getting there and pickup"
MEET_PHOTO = ("surf_boards.webp", "Surfboards lined up on the sand at Ala Moana Beach Park")
MAP_URL = "https://maps.app.goo.gl/3jozBp7iqh3VPZSr8"
MEET = [
    ("On your own", "If you come on your own, we'll meet you at Ala Moana Beach Park.",
     "View on Google Maps"),
    ("Hotel pickup", "Pickup is available in the Waikiki and Ala Moana areas. Kahala pickup "
                     "has a $10 per person surcharge.", None),
]

RULES_H2 = "Age and participation notes"
RULES_PHOTO = ("surf_wave.webp",
               "A smiling child lying on a board on a wave as an instructor kneels behind to hold it")
# (label, sentence, emphasis)
RULES = [
    ("Ask first", "Children under 7, guests 65 and older, and guests weighing 95 kg (209 lb) "
                  "or more must contact us before booking.", False),
    ("Not permitted", "Pregnant guests and anyone with heart disease or a serious back condition "
                      "cannot take part in the lesson.", True),
    ("Guardian", "Minors must be accompanied by at least one parent or guardian.", False),
    ("Companions", "Each student may bring up to 2&nbsp;companions.", False),
]

MORE_H2 = "Only at OceanStar"
MORE = [
    ("turtle.jpg", "100% guaranteed turtle snorkeling", "Our most popular Waikiki turtle snorkeling tour"),
    ("private_boat.webp", "Private cruise", "The Waikiki ocean, just for your group"),
]
END_SUB = "Choose your date and lesson time."
