# Cube Generation Rules

This document defines the exact cube generation rules for each level in Ready, Set 2.

## Core Constraint

**Every round has exactly 8 cubes total** (6 in Levels 1-4, 8 in Levels 5+):
- **4 color cubes** (red, blue, green, gold)
- **2 operator cubes** (from the operator pool)
- **2 special cubes** (Level 5+: from the special cube pool)

## Cube Pools by Level

### Operator Pool (Cubes 5-6)
Always generates **exactly 2 cubes** from these operators:
- **∪** (Union / OR)
- **∩** (Intersection / AND)
- **−** (Difference / MINUS)
- **′** (Complement / PRIME)

### Special Cube Pool (Cubes 7-8, Level 5+)
Generates **exactly 2 cubes** from:
- **Level 5**: {U, ∅}
- **Level 6+**: {U, ∅, =, ⊆}

## Level-by-Level Rules

### Level 1
- **6 cubes total**
- 4 color cubes
- 2 operator cubes from {∪, ∩}
- **No duplicates**: You get exactly one AND and one OR

### Level 2
- **6 cubes total**
- 4 color cubes
- 2 operator cubes from {∪, ∩, −}
- **No duplicates**: Two different operators chosen randomly

### Level 3
- **6 cubes total**
- 4 color cubes
- 2 operator cubes from {∪, ∩, −, ′}
- **No duplicates**: Two different operators chosen randomly

### Level 4
- **6 cubes total**
- 4 color cubes
- 2 operator cubes from {∪, ∩, −, ′}
- **Duplicates allowed**: Can get two of the same operator (e.g., ∪ ∪)

### Level 5
- **8 cubes total** ← First level with 8 cubes
- 4 color cubes
- 2 operator cubes from {∪, ∩, −, ′}
  - Duplicates allowed
- 2 special cubes from {U, ∅}
  - Duplicates allowed (e.g., U U or ∅ ∅)

### Levels 6-10
- **8 cubes total**
- 4 color cubes
- 2 operator cubes from {∪, ∩, −, ′}
  - Duplicates allowed
- 2 special cubes from {U, ∅, =, ⊆}
  - Duplicates allowed (e.g., = = or ⊆ U)

## Critical Design Implications

### Maximum Operators Per Round
**You can never have more than 2 operators (∪, ∩, −, ′) in a single round.**

This constraint limits solution complexity:
- **Without restriction**: Maximum 5 cubes in set name
  - Example: `red ∪ blue ∩ green` (3 colors + 2 operators)
- **With restriction**: Up to 8 cubes total
  - Example: `red = blue` (restriction, 3 cubes) + `green ∪ gold` (set name, 3 cubes) = 6 total

### Set Name Patterns
Due to the 2-operator maximum, valid set name patterns cap at:
- **1 cube**: `red` (only valid with restriction)
- **2 cubes**: `red′`
- **3 cubes**: `red ∪ blue`
- **4 cubes**: `red ∪ blue′`
- **5 cubes**: `red ∪ blue ∩ green` ← Maximum without restriction

### Restriction Patterns
Restrictions use the 2 special cube slots, enabling 8-cube solutions:
- 1 restriction cube: `red = blue` (3 cubes)
- 2 restriction cubes: `red = blue = green` (5 cubes) ← Maximum restriction

### Color Cube Rules
Each of the 4 colors (red, blue, green, gold):
- Appears **0, 1, or 2 times** per round
- **Never more than 2** of the same color

### Special Cube Mechanics

**Level 8+**: Special cube designations
- **Required Cube** (50% chance Level 8, 33% Level 9, 25% Level 10)
  - Any cube can be marked as required (green border)
  - Must be used in solution
  - Worth 50 bonus points
- **Wild Cube** (33% chance Level 9, 25% Level 10)
  - Replaces one of the 2 operator cubes
  - Player chooses which operator it represents (∪, ∩, −, or ′)
  - Worth 25 bonus points
- **Bonus Cube** (25% chance Level 10 only)
  - Any cube can be marked as bonus (gold star)
  - Worth 50 bonus points just for using it

Only **one special designation** per round (never multiple types together).

## Implementation Reference

See `js/levels.js`:
- `LEVEL_CONFIG` array defines available operators per level
- `generateDiceForLevel(level)` function implements these rules
- Lines 322-326: Separates operators from special cubes
- Lines 328-354: Generates 2 operator cubes (with duplicate logic)
- Lines 356-365: Generates 2 special cubes for Level 5+

## Historical Note

This design matches the original Flash game's cube generation rules. The 2-operator maximum is fundamental to the game's balance and puzzle difficulty progression.

