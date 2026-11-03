# Music and lyric video playbook (Route D)

For our own songs (for example Suno tracks made under a plan that grants commercial rights).

| Setting | Default |
|---|---|
| Length | full song; a 15–30 s hook clip for Shorts |
| Size | 1920×1080 full · 1080×1920 hook clip |
| Styles | `kinetic-swiss` (hype, rap, EDM), `anime-cel-80s` (love, nostalgia), `ink-river`, `wave-print`, `stained-window`, `one-stroke`, `riso-zine`, `deco-gold` |

## Procedure
1. **Inputs**: the final audio and the lyrics as text.
2. **Timing**: get each line's start and end. Best: forced alignment of lyrics to vocals
   (Whisper word times on the isolated vocal); fallback: tap times by hand into `lyrics.json`.
3. **Beat grid**: tempo and downbeats. `scripts/analyze.py` gives a tempo estimate; confirm by ear.
4. **Map sections**: intro, verse, pre-chorus, chorus, bridge, outro. Each section has its own
   colour or scene; the chorus is the biggest look and returns every time.
5. **Cut on the beat**: scene changes on downbeats, word pops on the syllable, bigger moves on bar 1 of a section.
6. **Lyrics on screen**: one line at a time, current word highlighted; keep 2 s minimum per line.
7. **Build** (Route A) with `renderFrame(t)` reading `lyrics.json` and the beat grid.
8. **Hook clip**: take the chorus, re-frame vertical, add the strongest lyric as on-screen hook text.
9. **Package**: title `<Song> · <Artist> (Lyric Video)`; description holds the lyrics and credits.
