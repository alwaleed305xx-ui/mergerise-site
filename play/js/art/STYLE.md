# MergeRise art contract (read fully before drawing anything)

One cohesive "sticker vector" style for EVERY asset: flat base colour, darker outline (3.5px), a soft shadow
overlay on the right/bottom (`SH`, black 12–16 %), a soft highlight on the top-left (`HL`, white 25–35 %).
No gradients, no filters, no external images, no emoji. Rounded, chunky, friendly shapes (think Toca Boca /
casual mobile game). Light comes from the top-left. Everything is an SVG string built with `js/art/_kit.js`.

```js
import { P, F, SH, HL, C, E, R, L, T, G, MIRROR, STAR, SPARK, heartPath, starPath, COLORS, HAIR_COLORS, variants, single, dark, light, shade } from './_kit.js';
// P(d, fill, {sw, stroke, op})  outlined path      F(d, fill)  plain fill       SH(d, op) shadow   HL(d, op) highlight
// C(cx,cy,r,fill,o) circle   E(cx,cy,rx,ry,fill,o) ellipse   R(x,y,w,h,rx,fill,o) rect   L(d, stroke, sw, {dash}) stroke only
// T(x,y,text,size,fill,{stroke,sw}) text   G(inner,{attrs}) group   MIRROR(svgString) mirrors across x=160 (320-wide avatar)
// STAR(cx,cy,r,fill)   SPARK(cx,cy,r)   dark(hex, .42)/light(hex, .35) derive tones from the base colour
```

## The avatar rig (viewBox 0 0 320 520) — all clothing must sit on these shapes

```
HEAD   M82,128 C82,62 112,38 160,38 C208,38 238,62 238,128 C238,182 210,224 160,224 C110,224 82,182 82,128 Z
       (face centre ≈ 160,140; top of head y=38; chin y=224; widest x 82..238 at y≈128)
EARS   circles r=13 at (84,146) and (236,146)
EYES   centres (130,152) and (190,152), eye whites rx13 ry16 → glasses lenses sit on y≈136..168
BROWS  y≈118..124
NECK   rect x=146 y=212 w=28 h=34 (neck meets shoulders at y≈240)
TORSO  M106,240 C124,230 196,230 214,240 L222,362 C200,374 120,374 98,362 Z   (shoulders y=240, hips y=362)
ARM_L  M106,242 C84,258 76,300 78,350 L104,352 C104,306 110,270 122,250 Z     (right arm = MIRROR of left)
HAND_L circle r=14 at (90,360)   (right hand at (230,360))
LEG_L  rounded rect x=118 y=350 w=40 h=118 rx=16  → legs span y 350..468, left leg x 118..158, right leg x 162..202
FOOT_L bare-foot ellipse at (138,474) rx25 ry14 (right foot (182,474)). Shoes replace the bare feet.
```
Left/right always refers to the viewer's left (x<160). Draw the left piece then `MIRROR(...)` it for the right side.

## Reference silhouettes (copy these, then add detail)
```
T-shirt body      M100,240 C120,229 200,229 220,240 L226,366 C200,380 120,380 94,366 Z   (top edge 2px above the torso so no skin outline peeks)
Short sleeve L    M104,242 C88,252 80,270 80,296 L112,300 C110,276 114,258 124,246 Z
Long sleeve L     M104,240 C82,256 72,300 74,352 L108,354 C106,306 112,268 122,248 Z   (add a cuff band at y≈340..352)
Neckline          L('M140,242 Q160,258 180,242', dark(colour), 3.5)  — or a collar
Long robe / coat  M100,240 C120,229 200,229 220,240 L240,486 C200,500 120,500 80,486 Z   (+ long sleeves)
Dress             M102,240 C120,229 200,229 218,240 L222,350 L246,472 C200,488 120,488 74,472 L98,350 Z
Pants             M114,352 L110,470 L154,470 L158,392 L162,392 L166,470 L210,470 L206,352 Z  + waistband M112,352 L208,352 L208,366 L112,366 Z
Shorts            same as pants but legs end at y=418
Skirt             M108,352 L96,432 C120,446 200,446 224,432 L212,352 Z
Sneaker L         M114,462 L112,490 C112,498 120,500 128,500 L160,500 L160,478 C146,484 128,476 118,462 Z ; sole M112,490 L160,490 L160,500 L128,500 C118,500 112,498 112,490 Z
Boot L            same as sneaker but the shaft starts at y=436 (M116,436 L112,490 … L162,500 L162,478 C150,470 130,466 118,440 Z)
Hair cap (front)  M84,128 C84,62 110,40 160,40 C210,40 236,62 236,128 C230,104 206,90 184,92 C176,84 150,82 140,94 C120,88 96,104 84,128 Z
Long hair (back)  M80,130 C80,56 108,36 160,36 C212,36 240,56 240,130 L252,310 C230,322 90,322 68,310 Z
Cap crown         M88,118 C92,62 122,46 160,46 C198,46 228,62 232,118 Z ; brim M70,118 L250,118 C258,128 250,140 236,140 C200,146 120,146 84,140 C70,140 62,128 70,118 Z
Beanie            M86,124 C88,60 120,40 160,40 C200,40 232,60 234,124 Z + band R(84,106,152,26,10) + pom C(160,40,16)
Ghutra back       M74,120 C74,50 110,30 160,30 C210,30 246,50 246,120 L262,290 C240,306 80,306 58,290 Z
Ghutra front      M82,126 C84,58 112,36 160,36 C208,36 236,58 238,126 C222,100 196,92 160,92 C124,92 98,100 82,126 Z ; agal = two black ellipse rings rx78 ry13 at cy 72 and 86 (stroke 9, fill none)
Hijab back        M76,124 C76,54 110,34 160,34 C210,34 244,54 244,124 L254,300 C230,318 90,318 66,300 Z
Hijab front       outer M72,126 C72,52 108,30 160,30 C212,30 248,52 248,126 C248,190 230,232 206,248 L114,248 C90,232 72,190 72,126 Z  minus the HEAD path (fill-rule evenodd) + a drape under the chin M110,224 C122,252 198,252 210,224 L236,292 C200,306 120,306 84,292 Z
Glasses lens L    R(112,136,38,30,11,...) ; bridge L('M150,150 L170,150') ; temple L('M112,150 L86,146')
Necklace          L('M134,250 Q160,292 186,250', gold, 4) + pendant at (160,290)
```

## Template contract

```js
export const TEMPLATES = {
  tshirt: (c, ctx, item) => ({ front: '<svg fragments…>', back: '' }),
};
```
* `c` = the item's colours `{ a, b?, c? }` (`a` is always the base colour; use `b` for accents, default it: `const b = c.b || '#fff'`).
* `ctx` = `{ gender: 'boy'|'girl', skin: '#hex' }` (skin is useful for open shoes).
* Return `{ front, back?, top?, hidesHair?, hidesHairFront?, hidesFeet?, showBottom? }`.
  `back` is drawn BEHIND the whole body (long hair, hoods, capes, wings, backpacks). `front` at the category layer.
  `top` (accessories only) is drawn above hair/hat (halo, headphones, earrings). Hats set `hidesHair: true` when they
  cover all hair (hijab, ghutra, beanie covers back hair? no: beanie sets `hidesHairFront: true` only).
  Outfits (`cat: 'outfit'`) replace top+bottom; set `showBottom: true` if pants should still show (e.g. a jacket set).
  Shoes / long robes / dresses that cover feet set `hidesFeet: true` (the bare-foot ellipses are then not drawn).
* Draw order inside the SVG: acc.back → hat.back → hair.back → outfit.back/top.back → body skin → shoes → bottom → top/outfit → acc.front → head → face → hair.front → glasses → hat.front → acc.top.
  So pants are drawn OVER shoes (shoe tops hidden by hems) and tops are drawn OVER pants (hem overlaps waistband).

## Catalog contract

```js
export const ITEMS = [
  ...variants('top', 'tshirt', { en: 'Tee', ar: 'تيشيرت' }, [
    ['white', { a: '#f8fafc' }, COLORS.white[1], 'common'],
    ['red', { a: COLORS.red[0] }, COLORS.red[1], 'common'],
  ], { tier: 1 }),
  single('top', 'hoodie', 'galaxy', { a: '#312e81', b: '#f472b6' }, { en: 'Galaxy Hoodie', ar: 'هودي المجرة' }, 'epic', { tier: 6 }),
];
```
* ids are `${cat}_${tpl}_${key}` and MUST be unique across the whole game.
* `rarity`: `rags` (starting junk, never gifted) | `common` | `rare` | `epic` | `legendary`. `tier` = the first stage at which the gift roll may give it (common 1–3, rare 3–8, epic 6–15, legendary 5+ via golden gifts).
* `gender`: `'any'` (default) | `'boy'` | `'girl'`.
* Names are bilingual `{ en, ar }` — English first, short and fun.
* Required ids that other code references: `top_rags`, `bottom_rags`, `hair_messy_dull` (boy, hair tpl `messy`), `hair_messyg_dull` (girl, tpl `messyg`), `top_tshirt_white`, `top_tshirt_sky`, `bottom_jeans_blue`, `shoes_sneaker_white`, `hat_cap_red`, `hat_cap_blue`.

## Quality bar
* Every piece has: base fill with outline, at least one `SH` shadow shape and one `HL` highlight shape, and a detail (seam, stitch line, button, logo, stripe, texture dots) so it does not read as a flat blob.
* Clothes must fully cover the skin region they replace (no skin peeking through gaps between a sleeve and the body). Overlap shapes by 2–4px rather than butting them edge to edge.
* Keep each template under ~40 lines; build colour variants from one template.
* Validate your module: `python tools/check_art.py js/art/<file>.js` must print OK (it parses the module in a tiny JS-less way: it imports it through the browser-free checker described in the tool). Then open `gallery.html?cat=<cat>` in the browser — the harness renders every item on both genders.

## Art direction v2 — MODERN AMERICAN (applies to every module from now on)
The hero's story runs from a New York City sidewalk to a Beverly Hills mansion. Everything should feel
**contemporary and American**: streetwear (oversized hoodies, varsity/letterman jackets, cargo pants, chunky
sneakers, snapbacks, bucket hats), sports (football, basketball, baseball, cheer), West-coast (surf, skate,
Hollywood red carpet), tech (AirPods, smartwatch, phone, VR headset, drone), food trucks, dollars, yellow cabs,
glass skyscrapers, neon signs, LED strips, EVs. Palette: vibrant and clean (electric blue, hot pink, violet,
lime, gold on deep navy/black), like a modern mobile game UI — never dusty or old-fashioned.
Do NOT draw Gulf/Middle-Eastern garments (thobe, bisht, abaya, ghutra, shemagh, hijab) — those were removed.
