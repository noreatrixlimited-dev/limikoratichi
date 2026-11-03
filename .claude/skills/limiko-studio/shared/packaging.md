# Packaging: hook, title, thumbnail, description, tags

Write packaging **before** the edit is final. Each category has its own `packaging.md` with hooks, title shapes and tag sets; this page is the shared method. The hook decides the first shot.
The account skills `yt-package`, `yt-seo` and `yt-shorts` can lint the result; this guide is the method.

## 1. Hook (first 1–2 seconds)

The hook works with the sound off: picture + on-screen text say it together.

| # | Pattern | Shape (fill with our topic) |
|---|---|---|
| 1 | Result first | Show the end state, then "here's how it got there" |
| 2 | Impossible claim | "This <thing> shouldn't exist, but it does" |
| 3 | Direct question | "Why does <everyday thing> <surprising behaviour>?" |
| 4 | Number promise | "<N> <things> that <benefit> in <time>" |
| 5 | Wrong belief | "You've been <doing X> wrong your whole life" |
| 6 | Countdown | "In 30 seconds you'll know <outcome>" |
| 7 | Pattern break | A sudden sound/visual that doesn't fit, then explain it |
| 8 | POV | "POV: you're a <character> and <situation>" |
| 9 | Stakes | "If <X> happens, <big consequence>" |
| 10 | Secret | "Nobody tells you this about <topic>" |
| 11 | Comparison | "<Small thing> vs <huge thing>" with both on screen |
| 12 | Challenge | "Only 1% can <do X>. Try it." |
| 13 | Story drop-in | Start mid-action: "And that's when the <thing> broke" |
| 14 | Kids wonder | "What if <animal/toy> could <magic action>?" |
| 15 | Gaming flex | "I <did impossible thing> in <game> and this happened" |

Rules: one idea, under 10 words on screen, no logo or intro before it, motion in the first frame.

## 2. Title
- 40–60 characters; the key idea in the first 40 (mobile truncation).
- Says what the thumbnail doesn't: the two are a pair, never repeat the same words.
- Shapes: `How <X> <surprising verb> <Y>` · `<N> <things> <benefit>` · `Why <X> <does Y>` ·
  `I tried <X> for <time>` · `The <adjective> truth about <X>` · `<X> vs <Y>: <question>`
- Shorts: the title is also search text. Lead with the searchable noun.
- Kids: plain words a parent searches ("Learn colours with…", "Bedtime story about…").

## 3. Thumbnail text
- 0–4 words, readable at phone size, high contrast, one face or one object large.
- Adds emotion or tension to the title; never repeats it.

Gaming thumbnails can be made automatically from the footage: `../formats/04-gaming/packaging.md` → `scripts/thumbnail.py`.

## 4. Description (template)
```
<Line 1: the promise in one sentence, with the main search phrase.>
<Line 2: what they'll learn or feel, second search phrase.>

⏱ Chapters
00:00 <hook topic>
00:15 <beat 1>
…

🎵 Music: <title> by <artist> (<licence>)    ← only what the licence requires
🎨 Assets: <source> (CC0)                     ← optional for CC0

#<maintag> #<secondtag> #<shorts if Short>
```
- First 150 characters show in search: make them count.
- Category pages add specific patterns: `../formats/<NN>/packaging.md`.

## 5. Tags
1. 1 exact main phrase (what someone types).
2. 3–5 variations (plural, synonym, question form).
3. 3–5 broader topic tags.
4. 2–3 channel/series tags.
Stay under 400 characters total. Tags help with misspellings and series grouping; the title and
description matter more.

## 6. Output format to give the user
```
HOOK (on screen): …
HOOK (voice): …
TITLE: …            (alt: …)
THUMBNAIL TEXT: …
DESCRIPTION: …
TAGS: a, b, c, …
HASHTAGS: #a #b #c
```
