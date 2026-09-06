# Infinite Factory Thingy

A deep browser-game evolution of the original Scratch prototype.

## What changed

The original idea's DNA is still here: walk around a tiled world, manually mine, manually sell, place builds, and grow cash. The rebuild turns that into a real automation/factory game.

### Core systems
- Separate Explore and Build modes
- Actual categorized shop instead of the old shop UI
- Grid placement, rotation, deletion, refunds, build ghost, zoomable camera
- Manual Miner and Manual Seller remain as the starter tier
- Auto Extractors and Auto Sellers
- Conveyor belts, Smart Splitters, Mergers, and Buffer Chests
- Arc Furnaces, Hydraulic Presses, Assemblers
- Coal Generators, Solar Arrays, and a live power grid
- Research Labs and a technology tree
- Overclockers and late-game upgrades
- Multi-stage resource processing and Factory Cores
- Contracts that guide progression without turning the game into a tutorial wall
- Production telemetry / factory statistics
- Resource-rich procedural terrain
- Procedural machine/player art, glow, particles, and ambient effects
- Procedural WebAudio music and SFX
- LocalStorage autosaving

## Automation

Automation is the point, not an optional side feature. The intended progression is roughly:

`manual mining → extractors → belts → processing → routing → automated selling → power → research → advanced manufacturing`

A successful factory can run and earn money without the player touching anything.

## Controls
- **WASD / arrows** — move
- **Click / Space** — interact with Manual Miner / Manual Seller
- **B** — toggle Build Mode
- **E** — shop
- **R** — research
- **Q** — rotate selected building
- **X / right-click** — delete hovered machine in Build Mode
- **Mouse wheel** — zoom
- **Esc** — close menus / leave Build Mode

Everything is contained in `index.html`; there are no external dependencies or assets.