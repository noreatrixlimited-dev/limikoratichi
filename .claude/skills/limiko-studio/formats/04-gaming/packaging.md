# Games packaging

General rules: `../../shared/packaging.md`.

## Hooks (first 1 s)
| Pattern | Example shape |
|---|---|
| Result first | the winning kill / final scoreboard, then "here's how" |
| Wait for it | freeze on the setup + "WAIT FOR IT…" |
| Impossible flex | "I won with <0 / 1 HP / no weapon>" |
| Challenge | "Only 1% can hit this shot" |
| Fail bait | the moment right before a fail, sound cuts out |
| Versus | "<noob> vs <pro> doing <thing>" on split screen |
| Secret | "You've been playing <game> wrong" |

## Titles
- `I <did impossible thing> in <Game>` · `<Game> but <twist>` · `<N> <Game> Tricks Pros Use`
- `The Best <Game> <Weapon/Character> (Tier List)` · `<Game>: Things You Missed`
- Game name early (search), 40–60 characters, emotion word optional (insane, clutch, unreal).

## Thumbnail
Game frame with the subject large and bright, a face or character reaction, 1–3 words ("1 HP?!"),
arrow or circle on the key detail.

## Making the thumbnail (`scripts/thumbnail.py`, venv-vision)
```
thumbnail.py make --video raw.mp4 --t <best moment> --title "QUADRA|TAKEDOWN!" --tag "CLUTCH BOOYAH" --out thumb.jpg
thumbnail.py variants --video raw.mp4 --t 37.2 --titles "QUADRA|TAKEDOWN!;1 VS 4|CLUTCH!;NO WAY|I WON!" --out thumb.jpg   # A/B set
thumbnail.py make … --lang te --title "4 కిల్స్!|క్లచ్ విజయం!" --tag "క్లచ్"                                        # Telugu
```
What it does: cuts the player's character out with SAM 2 (the identified player; `--anchor` from charglow), enlarges it
in front of the scene with the sticker outline (white stroke + warm glow), grades the background with the light leak
(stronger than in the video), and sets 3D text: line 1 white, other lines in the accent colour, with a skewed tag
banner. Mixed scripts work (Telugu + digits/English in one line).
Choosing the frame: the player large, clear pose, facing or side-on, action visible (muzzle flash, knocked enemy);
avoid frames where effects cover the character. If the player isn't identified with confidence, ask the user.
Options: `--layout right|left|center`, `--style sticker|neon|aura`, `--glow`, `--accent`, `--pop` (character size),
`--grade-strength`, `--size 1280x720` (YouTube) or `1080x1920` (Shorts cover).
Rules: 0–4 words; no game logos or other creators' art; never a fake claim (only what happens in the video).

## Description template
```
<What happens in one line> in <Game>. <Second line with a search phrase: mode, character, patch>.

⏱ 00:00 <best moment> · 00:12 <next> …
🎮 Game: <Game> (<platform>)   🎵 Music: <title> (<licence>)
#<game> #<game>clips #gaming #shorts
```

## Tag set (8–12)
`<game>, <game> clips, <game> funny moments, <game> highlights, <game> tips, <mode>, <character/weapon>,
gaming, gaming shorts, <game> montage, <season/patch>`
