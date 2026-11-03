# Characters: one spec, the same character in every shot

A character is a JSON file. The rig (`../frames/character.js`) draws it from that file in any view,
expression and pose, so scenes can't drift. Approve the reference sheet before any scene (G3).

## Files
```
films/_characters/<id>.json                 the spec (channel-wide recurring characters)
films/<slug>/characters/<id>.json           film-only characters
…/<id>-v<version>-sheet.png                 the approved reference sheet
```
Examples to copy: `../characters/examples/` (`pip.json` kids hero, `krishna.json` mythological figure,
`warrior-king.json` historical figure).

## Make a reference sheet
```
cd .claude/skills/limiko-studio/frames && npm install          # once per machine (three.js + uses the preinstalled Playwright)
node character-sheet.cjs <spec.json…> [--out DIR]
```
The sheet shows: front / ¾ / side / back on a head-height grid, 6 expressions, 4 poses, exact palette, notes.

## Spec schema
```jsonc
{
  "id": "pip", "version": 1, "name": "Pip the Fox", "role": "…", "age": "…",
  "build":  { "heads": 3,            // height in head-heights: 2.5–3.5 kids/chibi, 5–6 youth, 7–8 adult/heroic
              "width": 1.1,          // body width multiplier
              "belly": 0.3,          // 0 slim … 1 round
              "head": "fox" },       // round | oval | square | fox
  "colors": { "skin", "hair", "eyes", "top", "bottom", "shoes", "accent", "line", "blush", "second" },  // exact hex
  "face":   { "eyes": "round|almond|dot", "eyeSize": 1, "brows": "soft|bold|none",
              "nose": "small|animal|none", "marks": ["tilak","bindi","third-eye","mustache","beard","freckles"] },
  "hair":   { "style": "short|long|bun|topknot|braid|curly|bald|none", "volume": 1 },
  "ears":   "human|fox|cat|none",
  "muzzle": "#hex",                   // animals
  "tail":   { "color": "#hex", "tip": "#hex" },
  "outfit": { "top": "tunic|kurta|robe|armor|none|sash", "sleeves": "short|long",
              "bottom": "pants|dhoti|skirt|robe", "sash": "#hex|true", "cape": "#hex", "belt": true },
  "accessories": ["crown","tall-crown","peacock-feather","crescent","helmet","turban","halo","glasses",
                  "necklace","garland","earrings",
                  "flute","mace","trident","sword","staff","book","lotus",   // right hand
                  "bow","shield"],                                           // left hand
  "personality": "…", "voice": "…", "signature": "…", "source": "…"
}
```

## Drawing a character in a scene
```js
import { drawCharacter } from '<skill>/frames/character.js';
const pip = await (await fetch('films/_characters/pip.json')).json();
drawCharacter(ctx, pip, { x: 640, y: 600, h: 360, view: '34', expr: 'happy', pose: 'wave' });
```
- `x, y`: feet on the ground line · `h`: full height in px (keep the same `h` for the same distance to camera)
- `view`: `front | 34 | side | back` (mirror with `ctx.scale(-1, 1)` for facing left)
- `expr`: `neutral | happy | sad | angry | surprised | thinking`
- `pose`: `stand | wave | walk | point | hero`
For animation, interpolate between poses over frames and draw on twos for hand-made styles.

## Style-matching
The rig draws clean flat shapes. For a scene in a painted style, draw the character on its own layer,
then apply the style's treatment (crayon texture, watercolour edge, halftone, grain) to that layer.
The silhouette, proportions and colours stay identical; only the surface changes.

## Rules
- Locked after approval. A change makes a new version (`"version": 2`) and a new sheet to approve.
- One version per film. Record it in `plan/continuity.md`.
- Mythological and historical figures: attributes from the texts or sources, with dignity (`../formats/03-history-mythology/storytelling.md`).
- Original designs only; nothing resembling existing franchise characters.

## When the rig isn't enough
For painterly hero shots or 3D films, the spec still governs: build the 3D model or the painting from
the sheet (same proportions, colours and accessories), and check each shot against the sheet.
