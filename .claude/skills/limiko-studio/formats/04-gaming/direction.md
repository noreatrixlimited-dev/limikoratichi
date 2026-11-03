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
