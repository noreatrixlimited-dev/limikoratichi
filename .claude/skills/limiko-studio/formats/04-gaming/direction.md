# 04 · Gaming: direction profile

**Identity:** high-energy professional gaming edit. The main character or key action is always the
visual centre. The viewer feels part of the action. Intensity follows the gameplay: smooth in
exploration, sharp in combat.

## Two modes
| | Exploration | Combat / key moment |
|---|---|---|
| Median shot | 2 s | 0.8 s (0.3–1.5 s) |
| Camera | smooth tracking, slow reframe, gentle zoom | tracking lock on hero, dynamic zooms, crash zoom on hits |
| Effects max | level 2 | level 4; peak hits level 5 for ≤ 1 s |
| Transitions | cut, whip | cut on beat, flash, speed-ramp transition |
| Music | lower energy section | drop / chorus, cuts on the beat |

## Effects toolkit (use with purpose)
Camera tracking (keep hero on a third line, crop follows them) · dynamic zoom on attack and impact ·
cinematic slow motion (0.25–0.5×) on the decisive hit · impact frames and flashes · screen shake on
explosions (decaying) · glowing outline on hero or target (hero colour vs enemy red) · motion trails
on fast moves · particles (sparks, debris, energy) layered *behind* the subject where possible ·
environmental light pulses matched to hits · damage numbers and highlight circles on enemies.

## Never
- Cover the crosshair, hero, health bar or the enemy being hit with effects or text.
- Shake or flash continuously; effects are punctuation, not wallpaper.
- Copyrighted music; other creators' clips.

## Camera rules (gaming)
Gameplay footage has a fixed in-game camera, so the edit adds a **virtual camera** on top. It never stops.
| Situation | Camera move | Numbers (gameedit.py defaults) |
|---|---|---|
| Every moment (always on) | breathing zoom + slow drift | zoom 1.015–1.065, period 7 s; drift ≤ 1.2% |
| Before a kill | ease in towards the player | +10% (big: +16%) over 0.8 s |
| The hit | punch-in | +7% (big: +12%), decays in ~0.4 s |
| After the kill | ease back out | over 0.9 s |
| Big moment (multi-kill, clutch) | shake + flash + slow motion | shake ≤ 9 px; slow motion 0.5× |
| Between highlights | transition (glow-zoom by default) | 0.3 s out + 0.3 s in, whoosh |
| Exploration | drift only, smoother and slower | no punches |
| Always | zoom centres on the player, so they never leave the frame | |

## Special planning (G4): moment map
Run `../../scripts/analyze.py` on raw recordings to find loud and high-motion seconds, then fill the
moment map in `../../shared/preproduction.md` G4: time, moment type, intensity 1–5, camera plan,
effects, beat. Order moments by intensity curve: hook (5) → build (2–3) → peaks (4–5) → finale (5).

## Camera tracking in practice (vertical)
Crop a 9:16 window that follows the hero: track the crosshair or player position per frame,
smooth with a 6–10 frame moving average, lead 10% in the direction of motion.

## Checklist
- [ ] Hook is the best moment, inside 1 s
- [ ] Hero / key action visible and centred in every combat shot
- [ ] Effects never hide gameplay; peaks ≤ 1 s at level 5
- [ ] Cuts land on beats in combat (`cuts_on_beat_ratio` > 0.5 in `analyze.py`)
- [ ] Music licensed or our own

Edit formats and effect settings: `edits.md`. Graphics styles, playbook, packaging: `styles.md`, `README.md`, `packaging.md`.
