# Zombie Killer Arena — Phase 5 README

## Enhanced Systems & Strategic Depth

Phase 5 focuses on deepening the strategic elements of the gameplay, adding more sophisticated enemy AI, and polishing the overall experience. The goal is to move beyond simple "shoot and run" mechanics to require more thoughtful play.

---

## Phase 5 Goals

The AI agent must implement:
*   **Advanced Enemy Behaviors**: Flanking, ambushing, and shielding.
*   **Interactive Environment**: Destructible obstacles, traps, and hazards.
*   **Weapon Mods System**: Temporary power-ups that alter weapon behavior.
*   **Mini-Map**: A radar system to track enemies and objectives.
*   **Achievement System**: Long-term goals for replayability.
*   **Boss Mechanics**: Multi-stage boss fights.

---

## Advanced Enemy AI

### Shield Bearer
*   **Behavior**: Moves slowly towards the player with a forward-facing shield.
*   **Defense**: Blocks all frontal attacks.
*   **Weakness**: Vulnerable from the back or to explosive damage.

### Stalker
*   **Behavior**: Turns invisible periodically.
*   **Attack**: Approaches while invisible, then decloaks to strike.
*   **Counter**: Takes extra damage while decloaking.

### Swarmer
*   **Behavior**: Moves in tight packs.
*   **Tactic**: Attempts to surround the player.

---

## Interactive Environment

### Explosive Barrels
*   **Interaction**: Explode when shot, damaging nearby enemies.
*   **Types**: Fire (Burn), Ice (Freeze), Acid (Corrosion).

### Spikes & Traps
*   **Hazard**: Floor spikes that activate periodically.
*   **Strategy**: Lure enemies into traps.

### Destructible Cover
*   **Concept**: Crates and barriers that can be destroyed by heavy weapons or enemies.

---

## Weapon Mods (Temporary Power-ups)

Spawn as rare drops:
*   **Ricochet Rounds**: Bullets bounce off walls and enemies.
*   **Vampiric Touch**: Heal 1 HP per kill for 10 seconds.
*   **Frostbite**: Slows enemies on hit.
*   **Double Tap**: Fires an immediate second shot for free.

---

## Mini-Map System

*   **UI Element**: Small radar in the corner.
*   **Indicators**:
    *   Red dots: Enemies.
    *   Yellow Star: Objective / Boss.
    *   Green Cross: Health pack.
*   **Fog of War**: Only show nearby area (optional complexity).

---

## Boss Mechanics: Multi-Stage Fights

Bosses should now have health thresholds (e.g., 50% HP) that trigger:
*   **Phase Shift**: Change in color/appearance.
*   **New Attack**: Unlocks a more dangerous move.
*   **Minion Spawn**: Summons a wave of elite enemies.

---

## Achievement System

Track and reward player milestones:
*   "Zombie Hunter": Kill 1000 zombies.
*   "Survivor": Reach Level 10 without taking damage.
*   "Pyromaniac": Kill 50 enemies to fire.

---

## Performance Considerations

*   **AI**: Keep AI checks efficient (don't run complex pathfinding every frame).
*   **Physics**: Use simple bounding boxes for environment interactions.
*   **Rendering**: Ensure the mini-map doesn't cause a massive FPS drop (update less frequently than the game loop).

---

## Completion Criteria

Phase 5 is complete when:
1.  Shield Bearer and Stalker enemies are functional.
2.  Explosive barrels are placed in levels.
3.  At least 2 weapon mods are implemented.
4.  The Mini-Map is visible and accurate.
5.  Bosses have distinct phases.
