# Daily Puzzle Generation Method

## Overview
Generate daily puzzles by picking templates, instantiating with random values, and evaluating against random cards.

## Step-by-Step Process

### Step 1: Pick a Template
Templates are defined in `DailyPuzzleGenerator.js`. Choose from:

**No Restriction (8 tokens):**
- `color op color op color op color′` (8 tokens)
- `setName op color op color op color′` (8 tokens)

**Restriction + Set Name (8 tokens):**
- `color = color` / `color op color op color` (3+5)
- `color op color = color` / `color op color` (5+3)
- `color = color op color` / `color op color` (5+3)
- `color = color′` / `color op color′` (4+4)
- `color op color = color op color` / `color` (7+1)
- `color = color = color` / `color op color` (5+3 - two restrictions)

Where:
- `color` = red, blue, green, or gold
- `op` = ∪, ∩, or −
- `setName` = U or ∅
- `′` = complement (prime)

### Step 2: Instantiate Template
Replace abstract types with concrete values:
- Each `color` → pick random from [red, blue, green, gold]
- Each `setName` → pick random from [U, ∅]
- Each `op` → already specified in template

**Example:**
```
Template: color = color / color ∪ color ∪ color
Instantiate: red = blue / green ∪ gold ∪ red
```

### Step 3: Pick 8 Random Cards
Choose 8 cards from the 16 possible combinations:

```javascript
ALL_CARD_COMBINATIONS = [
    [],                              // 0: Empty
    ['red'],                         // 1
    ['blue'],                        // 2
    ['green'],                       // 3
    ['gold'],                        // 4
    ['red', 'blue'],                 // 5
    ['red', 'green'],                // 6
    ['red', 'gold'],                 // 7
    ['blue', 'green'],               // 8
    ['blue', 'gold'],                // 9
    ['green', 'gold'],               // 10
    ['red', 'blue', 'green'],        // 11
    ['red', 'blue', 'gold'],         // 12
    ['red', 'green', 'gold'],        // 13
    ['blue', 'green', 'gold'],       // 14
    ['red', 'blue', 'green', 'gold'] // 15
]
```

Pick 8 different indices randomly. For manual generation, pick a diverse spread.

### Step 4: Evaluate Restriction (if present)
A restriction is an expression containing `=` or `⊆`.

**Restriction Evaluation Rules:**
- `A = B`: Cards where A equals B (both sets match exactly)
- `A ⊆ B`: Cards where A is a subset of B (every element in A is also in B)

**Important:** Restrictions FLIP cards that DON'T match. Cards that match the restriction are excluded from set name evaluation.

**Example:** `red = blue`
- Card `['red']`: has red, no blue → Different → **FLIP**
- Card `['blue']`: no red, has blue → Different → **FLIP**
- Card `[]`: neither → Same → **FLIP**
- Card `['red','blue']`: both → Same → **KEEP** (active for set name)

### Step 5: Evaluate Set Name
The set name is evaluated against the **active cards** (cards not flipped by restriction).

**Set Name Evaluation Rules:**
- `color`: Cards containing that color
- `U`: All cards (universe)
- `∅`: No cards (empty set)
- `A ∪ B`: Cards in A OR B
- `A ∩ B`: Cards in A AND B
- `A − B`: Cards in A but NOT in B
- `A′`: Cards NOT in A (complement)

**Example:** `green ∪ gold` on cards `[['green'], ['gold'], ['red','green'], ['blue']]`
- Card `['green']`: has green → **MATCH**
- Card `['gold']`: has gold → **MATCH**
- Card `['red','green']`: has green → **MATCH**
- Card `['blue']`: has neither → no match

**Goal:** 3 matching cards

### Step 6: Count Matching Cards (Goal)
The number of cards that match the set name = Goal.

**Validation:** Goal must be 1-7.
- If 0: Impossible puzzle (reject)
- If 8: Too easy (reject)

### Step 7: Generate Dice
Extract all tokens from the solution:
- Colors → `{type: "color", value: "red"}`
- Operators (∪, ∩, −) → `{type: "operator", value: "∪"}`
- Postfix (′) → `{type: "operator", value: "′"}`
- Set constants (U, ∅) → `{type: "setConstant", value: "U"}`
- Restrictions (=, ⊆) → `{type: "restriction", value: "="}`

Must total exactly 8 dice.

### Step 8: Calculate Difficulty
Based on shortest possible solution (not the 8-cube solution):
- **Beginner:** 2-5 cubes
- **Intermediate:** 6-7 cubes
- **Advanced:** 8 cubes

(For manual generation, estimate based on solution complexity)

---

## Example: Complete Puzzle Generation

### Template
`color = color` / `color ∪ color ∪ color` (3+5)

### Instantiate
`red = blue` / `green ∪ gold ∪ red`

### Random Cards
Indices: [1, 2, 3, 4, 5, 10, 8, 7]
```
0: ['red']
1: ['blue']
2: ['green']
3: ['gold']
4: ['red','blue']
5: ['green','gold']
6: ['blue','green']
7: ['red','gold']
```

### Evaluate Restriction: `red = blue`
| Card | Red? | Blue? | Same? | Result |
|------|------|-------|-------|--------|
| 0 ['red'] | Yes | No | No | FLIP |
| 1 ['blue'] | No | Yes | No | FLIP |
| 2 ['green'] | No | No | Yes | KEEP |
| 3 ['gold'] | No | No | Yes | KEEP |
| 4 ['red','blue'] | Yes | Yes | Yes | KEEP |
| 5 ['green','gold'] | No | No | Yes | KEEP |
| 6 ['blue','green'] | No | Yes | No | FLIP |
| 7 ['red','gold'] | Yes | No | No | FLIP |

**Active cards:** [2, 3, 4, 5]

### Evaluate Set Name: `green ∪ gold ∪ red`
| Card | Has green/gold/red? | Match? |
|------|---------------------|--------|
| 2 ['green'] | green | YES |
| 3 ['gold'] | gold | YES |
| 4 ['red','blue'] | red | YES |
| 5 ['green','gold'] | green, gold | YES |

**Goal:** 4 ✓ (valid: 1-7)

### Generate Dice
`red`, `=`, `blue`, `green`, `∪`, `gold`, `∪`, `red` = **8 dice ✓**

### Puzzle Complete!
```json
{
  "id": 1,
  "cards": [
    {"colors": ["red"]},
    {"colors": ["blue"]},
    {"colors": ["green"]},
    {"colors": ["gold"]},
    {"colors": ["red", "blue"]},
    {"colors": ["green", "gold"]},
    {"colors": ["blue", "green"]},
    {"colors": ["red", "gold"]}
  ],
  "dice": [
    {"type": "color", "value": "red"},
    {"type": "restriction", "value": "="},
    {"type": "color", "value": "blue"},
    {"type": "color", "value": "green"},
    {"type": "operator", "value": "∪"},
    {"type": "color", "value": "gold"},
    {"type": "operator", "value": "∪"},
    {"type": "color", "value": "red"}
  ],
  "goal": 4,
  "difficulty": {"rating": "intermediate", "cubeCount": 5},
  "generatedSolution": {
    "topRow": "red = blue",
    "bottomRow": "green ∪ gold ∪ red"
  },
  "shortestSolution": {"cubeCount": 3, "hasRestriction": false}
}
```

---

## Tips for Manual Generation

1. **Diversify templates** - Use different patterns for variety
2. **Vary colors** - Don't reuse same colors too much
3. **Pick diverse cards** - Include empty, single, double, triple color cards
4. **Verify goal range** - Must be 1-7
5. **Test complex restrictions** - `=` and `⊆` can be tricky
6. **Double-check dice count** - Must be exactly 8

## Common Mistakes

❌ **Wrong:** Restriction keeps matching cards (opposite of actual behavior)
✓ **Right:** Restriction FLIPS matching cards, keeps non-matching

❌ **Wrong:** Evaluating set name against all 8 cards
✓ **Right:** Evaluate set name against active cards (after restriction)

❌ **Wrong:** Creating 7 or 9 dice
✓ **Right:** Must be exactly 8 dice

❌ **Wrong:** Goal of 0 or 8
✓ **Right:** Goal must be 1-7

