# 02 · Facts, science and education: direction profile

**Identity:** the explanation itself is animated. Interactive-feeling infographics, real
demonstrations, 2D and 3D visualisation, cinematic camera. Every visual explains something.

## Numbers
| | |
|---|---|
| Median shot | 2.5 s (1.5–5 s); one new visual per sentence |
| Camera | tracking along a process, zoom-ins into detail, orbits around 3D models, cutaway reveals |
| Animation | on ones; labels draw on in 6–10 frames; numbers count up; arrows grow along the path |
| Effects max | level 3 (highlights, animated labels, zoom punch-ins, depth blur, motion trails on moving parts) |
| Transitions | straight cut, match cut, zoom-through (into the object), whip for "meanwhile", map/timeline |
| Sound | ding or click on each label, whoosh on zoom-through, riser before the reveal, music 90–110 bpm |

## The explanation rule
For each concept, show **the mechanism**, not a picture of the result:
| Concept | Not this | This |
|---|---|---|
| Volcano erupting | photo of an eruption | cutaway of the crust: mantle → magma chamber → magma rising (density arrows) → pressure gauge climbing → vent opens → eruption, with layers labelled |
| Heart pumping | heart icon | 3D heart cutaway, chambers fill and squeeze in sequence, blood colour changes red/blue, valves flap |
| Why the sky is blue | blue sky | sunlight beam split into colours, blue waves scatter off molecules, short vs long wave comparison |
| Size of the sun | "it's big" | Earth in frame, pull out continuously past Jupiter to the sun, labels and counters |

## Visual toolkit
2D: animated diagrams, flow arrows, counters, charts, cutaways, step-by-step build-ups.
3D (Three.js / Blender): exploded views, cutaways (clipping planes), orbiting models, particle flows,
size-comparison lineups. Choose 3D when depth, inside/outside or scale matters.

## Camera rules (facts and science)
The camera explains: every move goes towards the thing being explained, or shows how it connects.
| Situation | Camera move | Numbers |
|---|---|---|
| Every shot (default) | steady drift or slow push | 3–6% per shot; never fully static |
| Introducing a concept | push-in to the detail that matters | 100 → 115% over 1.5–2.5 s |
| Inside an object (cutaway, body, machine) | zoom-through into it, or a slow orbit | orbit 15–30° over the shot |
| Scale or comparison | continuous pull-out (or push-in) across the sizes | constant speed, labels follow |
| Process (step 1 → 2 → 3) | tracking move along the flow | the camera follows the moving part |
| Number or reveal | quick ease-in punch, then settle | 100 → 108% in 6 frames |
| Maps | aerial zoom from wide to the place | ease in-out, 2–3 s |
| Never | random shake, moves that hide the label being read | |

## Special planning (G4): concept plan
Fill the concept table in `../../shared/preproduction.md` G4. Every row needs a **visual mechanism**;
a row without motion gets redesigned.

## Checklist
- [ ] Every claim sourced (`sources.md`); estimates marked
- [ ] Every concept has a moving visual mechanism
- [ ] Labels readable on a phone (≥ 4% of height) and on screen while spoken
- [ ] The hook works with sound off

Video types, styles and packaging: `README.md`, `styles.md`, `packaging.md`.

## Shorts
Vertical facts Shorts use the firm-narrator format in `shorts.md` (structure, delivery targets, voice recipe, `frames/shortkit.js`).
