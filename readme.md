ROLE
You are a Phaser.js game developer implementing Phase 3 of the web game:

Zombie Killer Arena

This is a mobile-friendly 2D top-down zombie shooter built using Phaser.js.

Phase 1 and Phase 2 systems already exist:

* Player movement
* Shooting system
* Zombie AI
* Combo system
* Upgrade system
* Elite enemies
* Power drops
* UI HUD

Your task is to implement **Level-Based Arcade Progression (Levels 1–30)**.

All code must be modular and Phaser-compatible.

Do not redesign systems — implement them.

---

## IMPLEMENTATION OBJECTIVE

Convert the game from:
Wave survival mode

Into:
Level progression system (Contra-style structure)

Structure:
6 stages total
Each stage contains:
4 normal levels + 1 boss level

Total levels: 30

---

## SYSTEM 1 — LEVEL MANAGER

Create:
LevelManager.js

Responsibilities:

* Load LevelConfig
* Track current level
* Start and end levels
* Trigger boss levels
* Manage spawn timers
* Transition between levels

Use Phaser timer events for spawning.

LevelConfig example:

const LevelConfig = {
id: 3,
stage: "Outskirts",
duration: 80,
spawnInterval: 1600,
maxEnemies: 8,
enemyPool: ["walker","runner"],
modifier: "fog",
bossId: null
};

Spawn logic rule:
Never exceed maxEnemies on screen.

---

## SYSTEM 2 — SPAWN SYSTEM

Modify existing spawn system to use:

spawnInterval
maxEnemies
enemyPool

Example pattern:

time.addEvent({
delay: spawnInterval,
loop: true,
callback: spawnEnemyIfUnderCap
})

---

## SYSTEM 3 — BOSS SYSTEM

Create:
Boss.js (base class)

Boss state machine:

IDLE
SELECT_ATTACK
TELEGRAPH
EXECUTE
COOLDOWN

Boss Rage Mode:
Trigger when HP <= 40%.

Boss HP formula:

getBossHP(levelId){
return 600 + (levelId * 120);
}

Implement Level 5 boss:
"The Butcher"

Attacks:
Charge
Ground Slam
Hook Throw

Each attack must include:

* telegraph time
* damage value
* cooldown

---

## SYSTEM 4 — META UPGRADE SYSTEM

Create:
MetaUpgradeManager.js

Currency: Z-Coins

Coins earned formula:

getCoins(levelId, kills){
return Math.floor(levelId * 5 + kills * 0.8);
}

Upgrade cost scaling:

getUpgradeCost(baseCost, level){
return Math.floor(baseCost * Math.pow(1.35, level));
}

Persistent upgrades must save using LocalStorage.

Upgrades:
Damage Boost
Fire Rate
Move Speed
Max HP
Coin Magnet

---

## SYSTEM 5 — DIFFICULTY SCALING

Replace static enemy stats with scaling formulas.

Enemy HP:
25 + level * 3

Enemy speed:
40 + level * 1.5

Spawn rate:
max(600, 1800 − level * 40)

Player expected DPS:
18 + level * 2.2

XP curve:
40 * (1.18^playerLevel)

These formulas must be used globally.

---

## SYSTEM 6 — LEVEL TRANSITION FLOW

When level ends:

* Stop spawning
* Kill remaining enemies
* Show "STAGE CLEAR"
* Award coins
* Load next level

Boss levels:
Lock arena until boss defeated.

---

## SYSTEM 7 — LEADERBOARD

Use LocalStorage.

Store:
score
levelsCompleted
date

Display top 10 scores.

---

## PERFORMANCE RULES

Must support mobile browsers.

Limits:
Max enemies on screen: 25
Boss sprites: ≤3
Stable 60 FPS
Object pooling required

Avoid expensive physics operations.

---

## COMPLETION CRITERIA

Implementation is complete when:

* Levels 1–30 playable
* Boss fights occur at correct intervals
* Meta upgrades persist between runs
* Difficulty scales with level
* Leaderboard works
* Game runs smoothly on mobile

Do not redesign mechanics.
Implement systems exactly as defined.
