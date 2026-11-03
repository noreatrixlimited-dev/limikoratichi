# The first 10 seconds: curiosity format

Every script's first 10 seconds has one job: make the viewer **need** the rest. It opens a question they can't
answer yet, shows them the answer is worth waiting for, and gets out of the way. No greeting first, no channel
intro, no "in this video", no subscribe request. Those belong after the payoff, if anywhere.

Tool: `../scripts/hookcheck.py` scores the opening of any voice script (English or Telugu) and lists what to fix.

## The four beats (O-10)
| Time | Beat | What it does | Screen |
|---|---|---|---|
| 0.0–1.5 s | **Strike** | the most intriguing image or moment + a short line (EN ≤ 9 words, TE ≤ 7; spoken in ≤ 3 s, so long numbers go on screen and the voice says a short form) | the strongest visual of the whole video, moving |
| 1.5–4 s | **Gap** | opens a specific question the viewer can't answer yet | a hint of the answer, not the answer |
| 4–7 s | **Stakes or proof** | why it matters to *them*, or proof the payoff is real (a number, a glimpse) | the number, the result, the reaction |
| 7–10 s | **Promise + loop** | what they'll get by the end, plus one open loop that only closes later | cut straight into the first beat of the content |

Word budget for 10 s: English ≈ 22–26 words (≈ 150 wpm), Telugu ≈ 16–20 words (≈ 115 wpm). Kids: fewer, slower.
Mark the beats in the voice script with comment lines `# @strike`, `# @gap`, `# @stakes`, `# @promise`
(hookcheck reads them; without marks it uses time).

## Twelve hook types
| Type | Shape (fill with the real topic) | Best for |
|---|---|---|
| Unanswered question | "Why does <everyday thing> <strange behaviour>?" | facts, kids, nature |
| Surprising number | "<number> <thing> <unexpected fact>." | facts, documentary, business |
| Wrong belief | "You were taught <X>. It isn't true." | facts, history |
| Impossible fact | "<thing> shouldn't be possible. It happens every day." | facts, science, nature |
| Result first | show the end (the win, the explosion, the fallen fort), then "here's how it happened" | gaming, history, documentary |
| Countdown | "In <N> seconds you'll know <outcome>." | facts Shorts, gaming |
| Mystery object | an object or place shown without explanation: "What is this?" | history, mystery, kids |
| Comparison / scale | "<small thing> vs <huge thing>" on screen together | facts, science |
| Warning | "Don't <common action> until you know this." (never for kids) | facts, business, horror |
| Secret / insider | "Almost nobody knows why <X>." | history, mythology, facts |
| Story drop-in | start inside the moment: "The gates were already burning when…" | history, mythology, cinematic, horror |
| Challenge | "Only 1 in 10 can <do X>. Try it." | kids (gentle), gaming, facts |

## Per format
| Format | Strike | Rules |
|---|---|---|
| 01 Kids | wonder question or the hero in a small problem; greeting comes **after** the first line | no fear, no warnings, no clickbait; slower (EN ≤ 20 words in 10 s, TE ≤ 15) |
| 02 Facts | the strangest true detail, shown | every claim in the hook must be in `sources.md` |
| 03 History / mythology | story drop-in at the dramatic moment, or a mystery object | label legend vs history; no invented "secrets" about faith |
| 04 Gaming | result first (the kill, the win) or the impossible situation | full-highlight videos: no spoken hook needed, the action is the hook |
| 05 Horror | a wrong detail or a timestamp, quietly | build dread; no jump scare in the first 10 s |
| 06 Documentary | the human moment + place and year | facts only |
| 08 Nature | the decisive moment, slow motion | calm voice, still a question |
| 10 Business | the problem in one line, or the result number | real numbers only |

## Telugu notes
- Start with the strike, not with నమస్కారం or "ఈ వీడియోలో". A greeting, if wanted, comes after the gap (kids: right after the first line).
- Curiosity words that work: ఎందుకు, ఎలా, ఏమిటి, ఎవరికీ తెలియదు, నిజంగా?, కానీ, రహస్యం, చివరికి, ఊహించలేరు.
- Address the viewer: మీరు / మీకు / మీ (kids: పిల్లలూ, ఫ్రెండ్స్).
- Open loop words: చివర్లో, చివరికి, మూడోది, ఇంకా ఉంది.

## Never in the first 10 seconds
Greetings and channel names first · "in this video I will…" · "before we start" · subscribe/like requests ·
a long setup before the question · a promise the video doesn't keep · fake numbers or claims.

## Process (in G5 storyboard)
1. Write **three** openings using different hook types.
2. `hookcheck.py` scores them; keep the best two.
3. Show both to the user with their scores and the type each uses; they pick.
4. After the voice is rendered, run `hookcheck.py script.md --timeline audio/timeline.json`: the real 10-second
   boundary is checked, and the analyzer (`analyze.py`) confirms a cut or change of picture within the first 1.5 s.

## Examples
- `../voice-examples/volcano.en.md`: O-10 opening, scores 96 STRONG with the rendered voice (strike said in 2.8 s,
  promise ends at 8.8 s).
- `../voice-examples/rain.*.md` predate this format (they open with a greeting); rewrite them before reuse.
