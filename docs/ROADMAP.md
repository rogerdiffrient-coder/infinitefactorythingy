# Infinite Factory Thingy — Rebuild Roadmap

This roadmap is the order we should actually build the game in. The point is to prevent feature-creep from breaking the core loop before it becomes fun.

## Phase 0 — Lock the game

### Target identity
- 2D side-view automation sandbox
- cozy nighttime industrial sci-fi world
- manual play only as tutorial tier
- factory automation as the main fantasy
- polished enough that every screen feels intentional

### Core loop

**Explore → Extract → Transport → Process → Assemble → Power → Sell → Research → Expand → Optimize**

The game is not ready to grow until this loop works end-to-end.

---

# Phase 1 — Asset foundation

Do before rebuilding gameplay UI.

## Required art milestone
- branding/logo
- UI frame/button kit
- raw resource icons
- first manufactured-item icons
- Manual Miner
- Manual Seller
- Auto Extractor
- Conveyor
- Splitter
- Merger
- Buffer
- Furnace
- Press
- Auto Seller
- Coal Generator
- Research Lab
- starter terrain/platform kit
- starter FX

## Technical asset work
- organize `/assets`
- create one asset manifest
- define consistent machine footprint/grid rules
- define asset anchor points
- define input/output port positions in machine metadata
- preload assets cleanly before entering gameplay

**Exit condition:** we can assemble a fake factory scene entirely from near-final-direction assets.

---

# Phase 2 — Side-view world foundation

## World
- side-view terrain
- camera follow
- parallax background
- basic platform collision
- resource deposits embedded in terrain
- expansion areas designed as connected industrial terraces

## Player / Explore Mode
- movement
- interact prompt
- manual mining
- carrying inventory
- inspect resource nodes
- enter Build Mode without page/modal chaos

**Exit condition:** player can walk to an iron node, manually mine, and manually sell.

---

# Phase 3 — Build Mode

## Placement system
- grid snapping
- valid/invalid placement preview
- rotation
- building footprints
- terrain support checks
- resource-node placement rules
- demolition/refund
- selection/inspection

## Build UI
Categories:
- Mining
- Logistics
- Processing
- Power
- Storage
- Selling
- Research
- Special

The shop is not a separate old-style list. Building selection and purchasing happen through Build Mode.

**Exit condition:** player can place/remove real machines comfortably without fighting the UI.

---

# Phase 4 — Automation MVP

This is the most important milestone.

## Systems
- item entities/tokens
- machine input/output buffers
- belt transport
- extractor production
- furnace recipes
- auto seller
- money generation
- production statistics

## Required chain

**Iron Node → Auto Extractor → Conveyor → Furnace → Conveyor → Auto Seller**

That chain must:
- run forever without player interaction
- visibly move items
- visibly show machines working
- make money
- save/load correctly
- be satisfying to watch

**Exit condition:** player can stand still and watch money increase from a fully automated factory.

Do not start advanced systems until this feels good.

---

# Phase 5 — Real logistics

- Splitter
- Merger
- Buffer
- Press
- multiple item types on belts
- backpressure
- machine-full states
- stalled-belt feedback
- filters/sorters after basic logistics are proven

Add readable overlays:
- item flow
- machine status
- bottleneck indication

**Exit condition:** factory layout and routing decisions actually matter.

---

# Phase 6 — Power

- global power generation/consumption model
- Coal Generator
- fuel handling
- power HUD
- low-power slowdown
- power warning feedback
- Solar Panels
- Battery Banks later

No random machine failures.

**Exit condition:** increasing automation creates a clear reason to expand power generation.

---

# Phase 7 — Production chains

Add Press and Assembler chain recipes:

- Iron Ore → Iron Ingot → Iron Plate
- Iron Ingot → Gear
- Copper Ore → Copper Ingot → Wire
- Plates + Gear → Machine Frame
- Plate + Wire → Basic Circuit
- Frame + Circuits → Motor

Add recipe selector / machine inspector UI.

**Exit condition:** processed products are meaningfully more profitable and factories have branching resource needs.

---

# Phase 8 — Research

- Research Lab
- Research resource
- technology tree
- unlock animations
- locked shop/build entries

First research branches:
- Logistics
- Fabrication
- Power
- Assembly
- Extraction
- Electronics
- Optimization

Research should consume actual factory products.

**Exit condition:** advancement depends on building a better factory, not waiting for XP.

---

# Phase 9 — Contracts

- 3 simultaneous contract slots
- early/simple contracts
- chain-production contracts
- stretch contracts
- money + research rewards
- contract progress HUD
- automatic production tracking

Contracts should encourage experiments, not interrupt factory building.

**Exit condition:** player always has an optional concrete short-term goal.

---

# Phase 10 — World expansion

Add new regions as progression rewards.

Possible world structure:

## Region 1 — Starter Cliffs
- iron
- copper
- coal
- stone

## Region 2 — Crystal Falls
- silicon
- vertical logistics emphasis
- waterfall scenery

## Region 3 — Industrial Badlands
- rich coal/iron
- larger factory terraces
- heavier power demand

## Region 4 — Irradiated Depths
- uranium
- late processing
- strange lighting

Expansion should create new factory-space and routing decisions, not just recolored maps.

---

# Phase 11 — Optimization / advanced automation

- Conveyor Mk2
- Smart Splitters
- Underground belts
- Conveyor lifts
- Auto Extractor Mk2
- Overclockers
- advanced storage
- Circuit Printer
- Refinery
- factory-wide statistics
- bottleneck tools

**Exit condition:** a player can spend a long session improving an already-working factory rather than merely buying the next machine.

---

# Phase 12 — Mythic polish pass

This is where the game becomes visually ridiculous.

## Factory juice
- animated belt rollers/lights
- furnace flame/light spill
- extractor impacts
- press shake
- assembler servo movement
- generator smoke
- seller coin burst
- sparks and steam
- ambient helper bots

## Environment
- parallax moon
- moving cloud layers
- distant factories
- waterfalls
- tiny lights
- passing cargo/ships
- funny handwritten factory signage

## Audio
- adaptive procedural/looped music layers
- positional machine sounds where practical
- soft factory ambience
- satisfying placement/sale/research sounds

## Camera
- small impact shake
- smooth zoom
- build overview zoom
- cinematic expansion reveals

## UI polish
- tiny animations
- tooltips
- production graphs
- hover states
- proper title screen
- readable settings

---

# Phase 13 — Endgame spectacle

Only after everything above works.

Potential content:
- Factory Core
- giant export rocket
- megacontracts
- Quantum Fabricator
- reactor/fusion power
- huge map sectors
- absurd throughput targets
- optional decorative monuments
- final research branches

The endgame should make the starter Manual Miner look hilariously primitive.

---

# Architecture rules

## Data-driven machines
Every building should be defined from metadata rather than hard-coded UI branches.

Example conceptual schema:

```js
{
  id: 'furnace',
  category: 'processing',
  cost: 300,
  powerUse: 10,
  footprint: [2, 2],
  asset: 'assets/buildings/processing/furnace.svg',
  inputs: [...],
  outputs: [...],
  recipes: [...]
}
```

## Simulation rules
- fixed/tick-based simulation separate from rendering
- belts and machines must survive FPS variation
- avoid DOM element per moving item if it becomes expensive
- save machine state in compact JSON
- version save files for future migration

## Art rules
- HTML/CSS may frame the UI
- actual world objects use reusable art assets
- no emoji as final gameplay art
- no giant pile of one-off inline SVG strings inside game logic

---

# First three commits from here

## Commit A — Asset system
- create asset directories
- add art bible
- add first SVG machine/item pack
- asset manifest/preloader

## Commit B — Side-view world shell
- replace current presentation with real world canvas/renderer
- terrain + camera + player movement
- Build/Explore mode shell

## Commit C — Automation MVP
- Auto Extractor
- Conveyor
- Furnace
- Auto Seller
- real item flow
- money output

After Commit C, stop and playtest before adding more systems.

# Success test

The first rebuild milestone succeeds if a player can:

1. walk around a good-looking side-view world,
2. find iron,
3. place an extractor,
4. route visible ore down conveyors,
5. smelt it,
6. route the ingot onward,
7. automatically sell it,
8. watch the factory keep working without touching anything,
9. immediately think of at least one way they want to improve it.

That is the game.