# -*- coding: utf-8 -*-
"""English copy of _detail_combo_ko.py (turtle snorkeling + parasailing / jet ski combo).

Same variable names, data shapes and image filenames as the Korean module.
Prices are shown in USD on English pages, so the per-person prefix is empty
and "per person" moves into the sub line.
"""
from _detail_en import (FEATURES, DAYS, END_H2,
                        FOOT_ABOUT, FOOT_HOURS, FOOT_ADDR, FOOT_BIZ, FOOT_COPY)

STEM = "DetailComboEn"
BOARD_TITLE = "상세페이지 · 거북이 스노클링 + 패러 · 제트 · 영문"
LANG = "en"
THEME = "para"
SHOW_STARS = False
SECTIONS = ["perks", "acts", "features", "times", "combo", "more"]
DOCK_SUB = "Combo A · per person, all ages"

HERO_IMG = ("hero_para.webp",
            "Two people under a lime-green parasail towed by a boat, with Koko Head behind")
HERO_IMG_M = ("hero_para_m.webp",
              "Two people under a lime-green parasail towed by a boat, with Koko Head behind")
HERO = dict(
    eyebrow="Two of Hawaii's most popular activities",
    h1='Turtle snorkeling +<br><span class="hl">Parasail · Jet Ski</span>',
    badge="15,000+ reviews across platforms",
    price="$210",
    price_per="",
    price_sub="Combo A parasailing · per person · adults and children same price",
    facts=[
        ("Packages", "A: snorkeling + parasailing<br>B: snorkeling + jet ski"),
        ("Duration", "Snorkeling 4 hours<br>Parasail · jet ski about 2 hours"),
        ("Available", "Snorkeling Mon - Sat<br>Parasail · jet ski Mon - Fri (closed on public holidays)"),
        ("Included", "Round-trip hotel pickup for both activities"),
    ],
    pure="You can't do both activities on the same day. Please choose a date for each.",
)

PERKS_H2 = "About this tour"
PERKS_LEDE = ("A combo like no other.<br>Two of Hawaii's most popular activities together, "
              "with great value, fun and pickup service all in one. Enjoy the best activities "
              "in Hawaii's most beautiful waters, Waikiki and Maunalua Bay.")
PERK_PHOTO = ("intro_bay.webp",
              "Jet skis, a banana boat and a tour boat lined up at a platform on Maunalua Bay")
PERKS_SUB_H = "Best-value combo highlights"
PERKS = [
    ("van",    "Dedicated hotel pickup", "Round-trip hotel pickup for parasail and jet ski too"),
    ("para",   "Parasailing",            "Up to 600 ft high, 10-15 minute flight"),
    ("jet",    "Jet ski",                "30 minutes on Maunalua Bay, 2 per ski"),
    ("turtle", "Turtle snorkeling",      "3+ hours of snorkeling time"),
    ("cal",    "Separate dates",         "Book once, pick a date for each"),
    ("guide",  "Korean crew",            "Korean-owned boat, professional Korean crew"),
]
PERK_NOTES = [
    "Public transit is limited in Hawaii, so be sure to check for pickup service.<br>"
    "Most other companies do not offer pickup.",
    "It's a combo, but you don't have to do both at once.<br>Just book them together.",
]

ACTS_H2 = '<span class="hl">Parasail&nbsp;·&nbsp;jet&nbsp;ski</span> with pickup'
ACTS_LEDE = ("Departs from Maunalua Bay on Oahu's east shore.<br>Combo A is parasailing, "
             "Combo B is jet ski.")
ACTS = [
    ("Combo A", "Parasailing", "Special parasailing with hotel pickup",
     ["Board a 6-passenger boat, put on a life jacket and listen to the safety briefing. "
      "Each flight group rises up to 600 feet (182 m) and flies for about 10-15 minutes.",
      "Soar high above the sparkling ocean for an unforgettable parasail ride. "
      "From Maunalua Bay you'll get vivid views of landmarks like Hanauma Bay and Koko Head."],
     [("Flight", "Up to 600 ft (182 m)<br>About 10-15 minute flight"),
      ("Total time", 'About 2 hours <span class="nw">(1-hour parasail tour)</span>'),
      ("Riders", "2-3 per flight · minimum 2 per booking"),
      ("Age", "Ages 3+ · under 12 fly as a group of 3 with a parent"),
      ("Schedule", 'Mon - Fri <span class="nw">(no Sat, Sun or holidays)</span>'),
      ("Pickup", "Pickup 09:00 - 10:00<br>Drop-off 12:00 - 12:30")],
     "act_para.webp", "Two people smiling in harnesses beneath a yellow parasail"),
    ("Combo B", "Jet ski", "Special jet ski ride with hotel pickup",
     ["Carve through the waves of Maunalua Bay while taking in the beautiful views of "
      "Oahu's east shore. It's the ultimate ocean activity for a refreshing, wide-open "
      "feeling and the thrill of speed.",
      "After a lesson from a professional coach, you can safely drive with two riders on board."],
     [("Ride", "About 30 minutes driving a jet ski on the ocean"),
      ("Total time", "About 2 hours"),
      ("Riders", "2 per ski · minimum 2 per booking"),
      ("Lesson", "Coach lesson, then drive with 2 riders"),
      ("Schedule", 'Mon - Fri <span class="nw">(no Sat, Sun or holidays)</span>'),
      ("Pickup", "Pickup 09:00 - 10:00<br>Drop-off 12:00 - 12:30")],
     "act_jet.webp", "Two people in life jackets speeding on a jet ski, kicking up spray"),
]
ACTS_NOTE = ("We pick you up right at your hotel for an easy ride.<br>Most other companies "
             "don't include pickup, and add-on pickup is usually shared with other groups.")

FEAT_H2 = 'Turtle snorkeling, <span class="hl">one&nbsp;full&nbsp;hour&nbsp;more</span>'
FEAT_LEDE = ("Our boat is run by a Korean owner and captain, so you get one full hour more "
             "of snorkeling!<br>Over 3 hours of snorkeling in total, with wild sea turtles "
             "guaranteed. No worries about swimming or English. OceanStar is a Korean-owned "
             "boat with a professional Korean crew on board.")

TIME_H2 = "Activity schedule"
TIME_SUB = "Choose your own dates for turtle snorkeling, parasailing and jet ski."
SLOTS = [
    ("Turtle snorkeling", ["07:30 - 11:30"], 6, "sea"),
    ("Parasailing · jet ski", ["09:30 - 12:30"], 5, "food"),
]
REST_LABEL = "Unavailable"
TIME_PURE = ("You can't do both activities on the same day.<br>Please enter a date for each "
             "when you book. (e.g. 5/5 turtle snorkeling, "
             "<span class=\"nw\">5/7 jet ski/parasailing</span>)")
TIME_NOTES = [
    "Turtle snorkeling is available Mon - Sat, every day except Sunday (public holidays included).",
    "Parasailing and jet ski are available Mon - Fri.<br>Not available on Sat, Sun or public holidays.",
    "Please check the times in the booking options.",
]

COMBO_H2 = "Combo packages"
COMBO_LEDE = "Don't miss this amazing combo, with top service at a fair price."
COMBOS = [
    ("Combo A", "Turtle snorkeling<br>+ parasailing",
     ["Turtle snorkeling · Mon - Sat 07:30 - 11:30",
      "Parasailing · Mon - Fri 09:30 - 12:30",
      "Round-trip hotel pickup for both"]),
    ("Combo B", "Turtle snorkeling<br>+ jet ski",
     ["Turtle snorkeling · Mon - Sat 07:30 - 11:30",
      "Jet ski · Mon - Fri 09:30 - 12:30",
      "Round-trip hotel pickup for both"]),
]
COMBO_PRICE = "Special combo price"
# A · B 두 패키지 가격이 같아 둘 다 COMBO_PRICE 로 적는다(운영자). 한쪽만 금액이 있으면 달라 보인다.
COMBO_PRICES = {}

MORE_H2 = "OceanStar exclusives"
MORE = [
    ("turtle.jpg", "100% turtle guarantee snorkeling", "Waikiki's most popular turtle snorkeling tour"),
    ("course_sup_sunset.webp", "Sunset &amp; wine turtle snorkeling",
     "4 hours that end with sunset and wine"),
]
END_SUB = "Combo A is parasailing, Combo B is jet ski.<br>Pick a date for each activity."
