# Infinite Factory Thingy — Pixel Art Rules

This file exists because the first asset batch drifted into clean vector placeholders. That is not the target anymore.

## Locked visual direction

- **Actual pixel art.** Chunky, hand-pixeled-looking shapes with readable clusters and intentional shading.
- **2D side-view** factory world.
- Cozy nighttime sci-fi industrial mood.
- Deep navy / steel-blue base, cyan tech light, warm orange furnace light, green success accents, purple late-game accents.
- Strong silhouettes and obvious input/output sides.
- Machinery should feel dense and mechanical, not like a few rectangles with lights.

## Asset format policy

Use separate reusable files for important gameplay art.

### Standalone PNGs
Use separate transparent PNGs for:
- machines
- player/NPC sprites
- large props
- important UI artwork
- logo/title art

### Sprite sheets only when they are genuinely useful
Use a sheet for:
- animation frames belonging to one object
- tiny item/icon atlases when there are many same-size icons
- effects such as sparks/smoke/steam
- terrain tilesets

A sheet must have an accompanying manifest and predictable cell layout. Do **not** dump unrelated machines into one mystery image and call that the final asset pipeline.

## Pixel scale

- Base small item icon: **16×16 or 24×24 logical pixels**, displayed at 2×–4× nearest-neighbor scale.
- Standard simple machine: **32×32 or 48×48 logical pixels**.
- Large machine: **64×64+ logical pixels** or multiple world tiles.
- UI icon: usually **16×16 or 24×24 logical pixels**.
- Rendering must use nearest-neighbor / `image-rendering: pixelated`.

## Quality bar

Every important machine needs:
- a readable silhouette at a glance
- 3+ material/value clusters, not flat fills
- highlight and shadow pixels
- visible ports/chutes/belts where relevant
- at least one bright operational detail
- no accidental anti-aliasing
- no glossy vector gradients
- no rounded CSS-looking shapes as final world art

## Animation strategy

Animated machines should use small frame strips or layered animation assets.

Examples:
- Extractor: arm up / arm down / impact frame
- Conveyor: 3–4 belt-light/roller frames
- Furnace: 3 flame frames + smoke puff sheet
- Press: idle / lowered / impact
- Assembler: idle / arm-left / arm-right / spark
- Auto Seller: idle / intake / sale flash
- Coal Generator: idle + smoke frames

## Folder structure

```text
assets/
  pixel/
    buildings/
      mining/
      logistics/
      processing/
      power/
      research/
      selling/
    items/
      raw/
      processed/
      components/
      special/
    player/
    bots/
    ui/
    world/
      terrain/
      props/
      backgrounds/
    fx/
    reference/
```

## Reference sheets

Large generated reference sheets may live only under `assets/pixel/reference/` or outside the shipped asset tree. They are style guides, **not** the runtime source of truth.

## First corrected asset milestone

Before rebuilding more gameplay, produce separate high-quality pixel assets for:

1. Auto Extractor
2. Conveyor straight
3. Conveyor vertical / lift pieces
4. Splitter
5. Merger
6. Buffer
7. Furnace
8. Press
9. Assembler
10. Auto Seller
11. Coal Generator
12. Research Lab
13. Iron / Copper / Coal / Stone icons
14. Iron Ingot / Copper Ingot / Plate / Gear / Wire / Circuit
15. Starter terrain tiles
16. Sparks / smoke / sale FX

Once these look good together in a fake factory scene, gameplay integration resumes.