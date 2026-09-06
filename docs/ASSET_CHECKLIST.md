# Infinite Factory Thingy — Asset Checklist

This is the art production checklist for the side-view rebuild. The goal is to avoid placeholder soup: important gameplay objects should have actual reusable assets before their systems are considered visually finished.

## Art direction

- View: 2D side-view industrial diorama
- Mood: cozy sci-fi factory at night
- Base palette: deep navy, steel blue, cyan tech light, warm orange furnace light
- Shape language: chunky silhouettes, thick readable outlines, strong input/output markings
- Standard machine cell: 96 × 96 SVG viewBox unless a machine intentionally spans multiple cells
- Standard item icon: 48 × 48 or 64 × 64 SVG
- Important animated machines should be assembled from separable SVG layers or animation-friendly groups

## Folder target

```text
assets/
  ui/
  icons/
  items/
  buildings/
    mining/
    logistics/
    processing/
    power/
    research/
    selling/
    special/
  world/
    terrain/
    backgrounds/
    props/
  fx/
  audio/
```

---

# A. Branding / title

- [ ] `logo-main.svg` — full Infinite Factory Thingy logo
- [ ] `logo-small.svg` — compact HUD/menu logo
- [ ] `gear-mark.svg` — standalone logo gear
- [ ] `title-moon.svg` — title-screen moon/planet layer
- [ ] `title-factory-silhouette.svg` — parallax factory skyline
- [ ] `title-stars.svg` — subtle star field layer

# B. UI frame kit

## Panels
- [ ] `panel-large.svg`
- [ ] `panel-medium.svg`
- [ ] `panel-small.svg`
- [ ] `panel-tooltip.svg`
- [ ] `panel-contract.svg`
- [ ] `panel-machine-inspector.svg`
- [ ] `panel-research.svg`
- [ ] `panel-toast.svg`

## Buttons
- [ ] `button-primary.svg`
- [ ] `button-secondary.svg`
- [ ] `button-danger.svg`
- [ ] `button-tab.svg`
- [ ] `button-tab-active.svg`
- [ ] `button-icon.svg`
- [ ] `button-disabled.svg`

## Build-mode overlays
- [ ] `placement-valid.svg`
- [ ] `placement-invalid.svg`
- [ ] `placement-selected.svg`
- [ ] `grid-cell.svg`
- [ ] `input-arrow.svg`
- [ ] `output-arrow.svg`
- [ ] `power-connection.svg`
- [ ] `power-disconnected.svg`
- [ ] `recipe-slot.svg`

# C. HUD / system icons

- [ ] money
- [ ] power generated
- [ ] power consumed
- [ ] throughput / items per second
- [ ] research
- [ ] inventory
- [ ] contract
- [ ] build mode
- [ ] explore mode
- [ ] rotate
- [ ] demolish
- [ ] upgrade
- [ ] recipe
- [ ] efficiency
- [ ] warning
- [ ] locked
- [ ] unlocked
- [ ] settings
- [ ] stats
- [ ] map
- [ ] save

# D. Resource / material icons

## Raw resources
- [ ] Iron Ore
- [ ] Copper Ore
- [ ] Coal
- [ ] Stone
- [ ] Silicon Crystal
- [ ] Uranium Ore
- [ ] Oil / Chemical Feedstock (later tier)

## Basic processed materials
- [ ] Iron Ingot
- [ ] Copper Ingot
- [ ] Steel Ingot
- [ ] Stone Brick
- [ ] Silicon Wafer

## Manufactured parts
- [ ] Iron Plate
- [ ] Steel Plate
- [ ] Gear
- [ ] Copper Wire
- [ ] Pipe
- [ ] Basic Circuit
- [ ] Advanced Circuit
- [ ] Motor
- [ ] Battery
- [ ] Machine Frame
- [ ] Advanced Parts
- [ ] Research Data / Flask

## Contract / special cargo
- [ ] Export Crate
- [ ] Prototype Core
- [ ] Quantum Component

# E. Resource-node world assets

Each node needs small / medium / rich visual variants where appropriate.

- [ ] Iron vein — small
- [ ] Iron vein — medium
- [ ] Iron vein — rich
- [ ] Copper vein — small
- [ ] Copper vein — medium
- [ ] Copper vein — rich
- [ ] Coal seam — small
- [ ] Coal seam — medium
- [ ] Coal seam — rich
- [ ] Stone deposit
- [ ] Silicon crystal deposit
- [ ] Uranium deposit
- [ ] depleted-node state
- [ ] node highlight ring

# F. Mining buildings

## Starter
- [ ] Manual Miner
  - idle art
  - working/punch/drill animation layer
  - output indicator

- [ ] Auto Extractor Mk1
  - idle art
  - arm-up layer
  - arm-down layer
  - drill sparks
  - output chute

## Later mining
- [ ] Auto Extractor Mk2
- [ ] Deep Drill
- [ ] Resource Scanner

# G. Logistics buildings

## Core
- [ ] Conveyor straight
- [ ] Conveyor end-cap/input
- [ ] Conveyor end-cap/output
- [ ] Conveyor corner visual helper
- [ ] Splitter
- [ ] Merger
- [ ] Buffer / Storage Crate

## Tier 2
- [ ] Sorter / Filter
- [ ] Conveyor Lift bottom
- [ ] Conveyor Lift middle
- [ ] Conveyor Lift top
- [ ] Underground Belt entrance
- [ ] Underground Belt exit
- [ ] Fast Conveyor

## Later
- [ ] Smart Splitter
- [ ] Large Storage
- [ ] Loader / Unloader
- [ ] Drone Port
- [ ] Logistics Drone

# H. Processing buildings

## Tier 1
- [ ] Furnace
  - shell
  - glowing fire chamber
  - chimney/steam layer
  - active indicator

- [ ] Press
  - body
  - moving press head
  - output tray

## Tier 2
- [ ] Assembler
  - shell
  - internal gear/robot arm layer
  - recipe indicators

- [ ] Refinery
- [ ] Circuit Printer

## Tier 3+
- [ ] Chemical Mixer
- [ ] Advanced Assembler
- [ ] Quantum Fabricator

# I. Selling / export buildings

- [ ] Manual Seller
- [ ] Auto Seller
  - item intake
  - cash/coin display
  - sale flash

- [ ] Export Depot
- [ ] Cargo Loader
- [ ] Cargo Ship / train visual
- [ ] Rocket Export Pad (endgame spectacle)

# J. Power buildings

## Tier 1
- [ ] Coal Generator
  - body
  - chimney
  - smoke layer
  - power-light layer

## Tier 2
- [ ] Solar Panel
- [ ] Battery Bank
- [ ] Power Pole / Junction

## Tier 3+
- [ ] Turbine
- [ ] Reactor
- [ ] Fusion / sci-fi generator

# K. Research / progression buildings

- [ ] Research Lab
- [ ] Data Terminal
- [ ] Upgrade Station
- [ ] Overclocker
- [ ] Factory Core

# L. Player / helper characters

- [ ] Player idle
- [ ] Player walk cycle
- [ ] Player jump/fall
- [ ] Player interact pose
- [ ] Build-tool pose
- [ ] Small helper robot idle
- [ ] Helper robot walk
- [ ] Helper robot happy / alert expressions

# M. World tiles and platforms

## Ground / cliffs
- [ ] top soil tile
- [ ] stone cliff fill
- [ ] cliff left edge
- [ ] cliff right edge
- [ ] inner corner
- [ ] outer corner
- [ ] cave dark fill
- [ ] ore-embedded cliff tiles

## Factory platforms
- [ ] steel platform straight
- [ ] steel platform edge
- [ ] support column
- [ ] support diagonal
- [ ] hanging platform
- [ ] bridge segment

# N. Background layers

- [ ] distant mountain silhouette
- [ ] near mountain silhouette
- [ ] forest silhouette
- [ ] industrial skyline far
- [ ] industrial skyline near
- [ ] night gradient sky
- [ ] moon / planet
- [ ] clouds
- [ ] stars
- [ ] waterfall / river background

# O. World props / flavor

- [ ] lamp post
- [ ] cable bundle
- [ ] wall pipe straight
- [ ] wall pipe corner
- [ ] vent
- [ ] warning sign
- [ ] handwritten funny sign
- [ ] tiny robot sign
- [ ] crate
- [ ] barrel
- [ ] maintenance hatch
- [ ] antenna
- [ ] ladder
- [ ] railing
- [ ] grass tuft
- [ ] bush
- [ ] small tree

# P. FX assets

- [ ] furnace flame particles
- [ ] sparks
- [ ] smoke puff
- [ ] steam puff
- [ ] ore-chip particles
- [ ] coin/sale burst
- [ ] research sparkle
- [ ] power arc
- [ ] placement puff
- [ ] demolition debris
- [ ] machine-level-up flash
- [ ] overclock glow
- [ ] rare-item glow

# Q. Audio checklist

## UI
- [ ] hover
- [ ] click
- [ ] confirm
- [ ] cancel
- [ ] purchase
- [ ] error
- [ ] research unlock
- [ ] contract complete

## Factory
- [ ] conveyor loop
- [ ] extractor thunk/drill
- [ ] furnace rumble
- [ ] press slam
- [ ] assembler tick/servo
- [ ] seller cha-ching
- [ ] generator hum
- [ ] solar subtle electric hum

## World
- [ ] ambient wind
- [ ] distant machinery
- [ ] waterfall
- [ ] cave ambience

## Music
- [ ] title BGM
- [ ] explore BGM
- [ ] factory BGM layer
- [ ] high-throughput/intensity layer

---

# First art milestone

The first genuinely playable visual build should not begin until these are present:

- [ ] logo
- [ ] core UI panel/button kit
- [ ] money / power / throughput icons
- [ ] Iron Ore
- [ ] Copper Ore
- [ ] Coal
- [ ] Iron Ingot
- [ ] Copper Ingot
- [ ] Iron Plate
- [ ] Gear
- [ ] Wire
- [ ] Manual Miner
- [ ] Manual Seller
- [ ] Auto Extractor
- [ ] Conveyor
- [ ] Splitter
- [ ] Merger
- [ ] Buffer
- [ ] Furnace
- [ ] Press
- [ ] Auto Seller
- [ ] Coal Generator
- [ ] Research Lab
- [ ] basic terrain/platform kit
- [ ] sparks / smoke / sale FX

Once that pack exists, gameplay implementation can use final-direction assets instead of temporary boxes.