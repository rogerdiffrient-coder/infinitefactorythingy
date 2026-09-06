# Infinite Factory Thingy — Balance Sheet v1

This is deliberately a **first-pass playable balance**, not sacred math. The goal is to make automation arrive quickly, make each new machine feel meaningful, and avoid the early game becoming a clicker.

## Balance rules

- Manual play should teach the loop, then become obsolete quickly.
- First Auto Extractor target: **about 2–4 minutes** for a new player.
- First fully automated ore → processed material → sale line target: **about 8–15 minutes**.
- New machine unlocks should usually create a new decision, not just +10% output.
- Power shortages should slow/stop machines clearly, never feel random.
- Belts are cheap enough that routing is fun, not financially painful.
- Selling raw ore is viable early but intentionally much worse than processing.
- Contracts are bonuses and direction, not mandatory gates.

---

# Currency / progression resources

| Resource | Purpose |
|---|---|
| Money | Buy buildings, expansion, upgrades |
| Research | Unlock technology tree |
| Power | Shared factory capacity; generated and consumed continuously |

Starting state:

- Money: **$150**
- Research: **0**
- Player inventory capacity: **30 items** initially
- Starting unlocks: Manual Miner, Manual Seller, Conveyor

---

# Raw resource base values

These are the values if directly sold without processing.

| Resource | Raw sell value | Base rarity |
|---|---:|---|
| Stone | $1 | Very common |
| Iron Ore | $2 | Common |
| Copper Ore | $3 | Common |
| Coal | $2 | Common |
| Silicon Crystal | $8 | Midgame |
| Uranium Ore | $25 | Late |

Resource deposits are **effectively infinite for v1**. Richness changes extraction speed rather than depleting forever.

Suggested deposit multipliers:

- Small: ×0.75 extraction speed
- Normal: ×1.00
- Rich: ×1.50

---

# Starter manual machines

## Manual Miner

- Cost: **$40**
- Power: **0**
- Operation: player interacts repeatedly
- Base output: **1 raw resource per 0.75 sec while actively used**
- Requires placement on/adjacent to a resource node
- Purpose: tutorial bridge only

## Manual Seller

- Cost: **$50**
- Power: **0**
- Operation: player deposits carried items
- Sale speed: **4 items/sec**
- Sale multiplier: **1.0×**

The player can afford both immediately, with $60 remaining for early conveyors or saving toward automation.

---

# Logistics

## Conveyor Mk1

- Cost: **$10 per cell**
- Power: **0**
- Throughput: **2 items/sec**
- Capacity: 1 moving item per belt segment slot

## Splitter

- Cost: **$50**
- Power: **1 MW**
- Throughput: **2 items/sec total input**
- Alternates valid outputs 50/50

## Merger

- Cost: **$50**
- Power: **1 MW**
- Throughput: **2 items/sec output**
- Input priority: round-robin

## Buffer

- Cost: **$120**
- Power: **1 MW**
- Capacity: **60 items**
- Input/output throughput: **2 items/sec** each

## Sorter / Filter

- Unlock: Logistics II
- Cost: **$180**
- Power: **2 MW**
- Throughput: **2 items/sec**
- Sends selected resource/product to one output, everything else to another

## Conveyor Mk2

- Unlock: Logistics II
- Cost: **$25 per cell**
- Power: **0**
- Throughput: **5 items/sec**

## Underground Conveyor pair

- Unlock: Logistics II
- Cost: **$120 per entrance/exit pair**
- Power: **1 MW**
- Throughput: same as connected belt tier
- Max underground distance: **6 cells** initially

## Conveyor Lift

- Unlock: Logistics II
- Cost: **$80 + $25 per vertical cell**
- Power: **2 MW**
- Throughput: **3 items/sec**

---

# Mining automation

## Auto Extractor Mk1

- Unlock: Basic Automation
- Cost: **$350**
- Power: **8 MW**
- Output: **0.50 raw items/sec** on normal deposit
- Small node: 0.375/sec
- Rich node: 0.75/sec
- Internal output buffer: 5

This is intentionally affordable very early.

## Auto Extractor Mk2

- Unlock: Extraction II
- Cost: **$1,800**
- Power: **25 MW**
- Output: **1.5 raw items/sec**
- Internal buffer: 10

## Deep Drill

- Unlock: Advanced Extraction
- Cost: **$7,500**
- Power: **80 MW**
- Output: **4 items/sec**
- Can exploit deep/high-tier deposits

---

# Processing recipes

All recipes are written as input → output per machine cycle.

## Furnace

- Cost: **$300**
- Power: **10 MW**
- Internal input buffer: 10
- Internal output buffer: 10

Recipes:

| Input | Time | Output |
|---|---:|---|
| 2 Iron Ore | 2 sec | 1 Iron Ingot |
| 2 Copper Ore | 2 sec | 1 Copper Ingot |
| 2 Stone | 2 sec | 1 Stone Brick |
| 2 Iron Ore + 1 Coal | 3 sec | 1 Steel Ingot |

Sell values:

- Iron Ingot: **$7**
- Copper Ingot: **$10**
- Stone Brick: **$4**
- Steel Ingot: **$18**

Processing should clearly beat raw selling even after material loss.

## Press

- Unlock: Fabrication I
- Cost: **$650**
- Power: **14 MW**

Recipes:

| Input | Time | Output | Sell value |
|---|---:|---|---:|
| 1 Iron Ingot | 1.5 sec | 2 Iron Plates | $5 each |
| 1 Steel Ingot | 2 sec | 2 Steel Plates | $14 each |
| 1 Iron Ingot | 2 sec | 1 Gear | $12 |
| 1 Copper Ingot | 1.5 sec | 3 Copper Wire | $5 each |

## Assembler Mk1

- Unlock: Assembly I
- Cost: **$1,200**
- Power: **22 MW**
- Two input channels / buffers

Recipes:

| Inputs | Time | Output | Sell value |
|---|---:|---|---:|
| 2 Iron Plates + 1 Gear | 4 sec | 1 Machine Frame | $45 |
| 2 Copper Wire + 1 Iron Plate | 3 sec | 1 Basic Circuit | $35 |
| 1 Machine Frame + 2 Basic Circuits | 7 sec | 1 Motor | $140 |

## Circuit Printer

- Unlock: Electronics
- Cost: **$2,500**
- Power: **35 MW**

Recipes:

| Inputs | Time | Output | Sell value |
|---|---:|---|---:|
| 1 Silicon Wafer + 2 Copper Wire | 4 sec | 1 Basic Circuit | $40 |
| 2 Basic Circuits + 1 Silicon Wafer | 7 sec | 1 Advanced Circuit | $130 |

## Refinery

- Unlock: Advanced Processing
- Cost: **$3,500**
- Power: **45 MW**

Initial purpose:
- Process oil/chemical feedstock later
- Refine uranium later
- Produce high-tier ingredients

Exact chemical recipes can wait until the basic factory loop is proven fun.

---

# Selling

## Auto Seller Mk1

- Unlock: Basic Automation
- Cost: **$450**
- Power: **5 MW**
- Intake: **2 items/sec**
- Sale multiplier: **1.00×**
- Internal buffer: 20

## Export Depot

- Unlock: Commerce II
- Cost: **$2,500**
- Power: **12 MW**
- Intake: **6 items/sec**
- Sale multiplier: **1.10×**
- Can reserve items for contracts before selling excess

---

# Power

Power is global in v1 to avoid wiring busywork. Visual power lines can still exist as decoration/feedback.

If consumption exceeds generation:

- 90–100% available: full speed
- 70–89% available: machines run proportionally slower
- below 70%: warning state, proportional slowdown
- 0 available: powered machines stop

No random failures.

## Coal Generator

- Cost: **$500**
- Startup buffer: can hold 20 Coal
- Consumes: **1 Coal / 8 sec**
- Generates: **60 MW**

This powers roughly:
- 5–7 early machines, or
- a small complete automated line

## Solar Panel

- Unlock: Clean Power
- Cost: **$900**
- Generates: **20 MW average**
- No fuel
- For v1, output can remain constant rather than simulating a frustrating day/night cycle

## Battery Bank

- Unlock: Energy Storage
- Cost: **$1,200**
- Capacity: **500 MW-seconds**
- Charge/discharge cap: **50 MW**

---

# Research

## Research Lab

- Unlock: after first contract or $2,000 lifetime earned
- Cost: **$1,500**
- Power: **20 MW**
- Consumes manufactured materials to create Research

Default recipe:

- 2 Iron Plates + 2 Copper Wire → **5 Research** in 6 sec

Research is intentionally made from factory output so technological progress rewards automation.

---

# Research tree first pass

## Starter — free
- Manual Miner
- Manual Seller
- Conveyor Mk1

## Basic Automation — $200 or tutorial unlock
- Auto Extractor Mk1
- Auto Seller Mk1
- Furnace
- Cost: **0 Research** after tutorial milestone

## Logistics I — 30 Research
- Splitter
- Merger
- Buffer

## Fabrication I — 50 Research
- Press
- Iron Plate
- Gear
- Copper Wire

## Power I — 40 Research
- Coal Generator
- factory power HUD

## Assembly I — 90 Research
- Assembler Mk1
- Machine Frame
- Basic Circuit

## Logistics II — 120 Research
- Conveyor Mk2
- Sorter
- Underground Conveyor
- Conveyor Lift

## Clean Power — 100 Research
- Solar Panel
- Battery Bank

## Extraction II — 140 Research
- Auto Extractor Mk2

## Electronics — 180 Research
- Silicon deposits
- Circuit Printer
- Advanced Circuit

## Optimization — 220 Research
- Overclocker
- machine efficiency upgrades

## Advanced Processing — 300 Research
- Refinery
- new resource region

## Factory Core — 500 Research
- Factory Core structure
- late-game factory-wide upgrades

---

# Overclocker

- Cost: **$2,000**
- Power draw: **15 MW base**
- Affects nearby machines in radius
- +25% production speed
- Affected machines consume +35% power

Later research can increase speed/radius.

---

# Contracts

The game should offer 3 contracts at a time:

1. Easy / quick
2. Production-chain contract
3. Stretch contract

Contracts accept automatically produced goods through sellers/export depots rather than requiring tedious menu depositing.

Example early contracts:

| Contract | Requirement | Reward |
|---|---|---:|
| Iron Rush | Produce/sell 50 Iron Ore | $250 |
| Getting Toasty | Produce 30 Iron Ingots | $600 + 10 Research |
| Plates Please | Produce 60 Iron Plates | $1,200 + 20 Research |
| Copper Fever | Produce 100 Copper Wire | $1,700 + 25 Research |
| Machinery | Produce 20 Machine Frames | $3,000 + 45 Research |
| Circuit City | Produce 30 Basic Circuits | $4,500 + 60 Research |

Contracts should track production, not delete goods unless specifically marked as delivery contracts.

---

# Upgrade philosophy

Machines should have **few, meaningful upgrades** rather than 50 tiny percentage buttons.

Suggested per-machine upgrade branches:

## Extractor
- Speed
- Lower power use
- Larger internal buffer

## Furnace / Press / Assembler
- Speed
- Efficiency / better recipe yield
- Buffer size

## Belts
- Mostly replaced by higher belt tiers rather than individual upgrades

## Seller
- Intake speed
- Sale bonus (small, capped)

Max upgrade level for v1: **3 per branch**.

---

# Early-game pacing example

A reasonable new-game path:

1. Start with $150.
2. Place Manual Miner ($40) + Manual Seller ($50).
3. Mine/sell enough raw iron/copper to reach ~$350.
4. Unlock/buy Auto Extractor Mk1.
5. Route extractor through a few $10 belts.
6. Add Furnace at $300.
7. Add Auto Seller at $450.
8. Factory now earns money without active clicking.
9. Coal Generator becomes necessary as automation expands.
10. Research Lab introduces the first real branching progression decisions.

The emotional milestone we care about most is step 8:

> **“wait, I don't have to do anything anymore.”**

Then the player immediately realizes they can make it faster, bigger, cleaner, and more complicated.

---

# Numbers to test first

When implementation begins, these are the first values to tune from playtesting:

1. Time to first Auto Extractor
2. Time to first fully automated sell loop
3. Belt throughput relative to extractor output
4. Coal consumption annoyance level
5. Processing profit advantage over raw selling
6. Research production speed
7. How quickly contracts become repetitive
8. Whether factory expansion is limited by money, power, or logistics in interesting proportions

The balance sheet should be changed aggressively if any of those feel bad.