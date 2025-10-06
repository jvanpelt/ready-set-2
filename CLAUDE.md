# Ready, Set 2 - AI Context Guide

**Last Updated:** October 2025  
**Version:** 2.9.0  
**Purpose:** This document provides comprehensive context for AI assistants working on this codebase.

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Set Theory Mechanics](#set-theory-mechanics)
3. [Level Progression](#level-progression)
4. [Code Architecture](#code-architecture)
5. [Key Algorithms](#key-algorithms)
6. [Design Decisions](#design-decisions)
7. [Common Tasks](#common-tasks)
8. [Edge Cases & Gotchas](#edge-cases--gotchas)

---

## Game Overview

### What is Ready, Set 2?

A puzzle game based on **set theory** and inspired by the educational game "On-Sets" from Academic Games. Players use dice representing colors and set theory operators to create expressions that describe sets of cards.

### Core Concept

- **8 cards** displayed in a 4×2 grid, each with 0-4 colored dots (red, blue, green, gold/yellow)
- **6-8 dice** available to build expressions
- **Goal:** Create a set theory expression that describes exactly N cards (typically 3-5)

### Game Flow

1. Player reviews the 8 cards on the board
2. Drags dice to solution area(s) to build an expression
3. Can tap cards to dim them (note-taking) or flip them (excluded from universe)
4. Clicks "GO!" to submit solution
5. Earns points for correct solutions based on complexity
6. Advances levels by reaching score thresholds

---

## Set Theory Mechanics

### Cards

Each card has 0-4 colored dots in **fixed positions**:
- **Red:** Top-left
- **Blue:** Top-right
- **Green:** Bottom-left
- **Gold/Yellow:** Bottom-right

**Total 16 unique card combinations** (from empty to all 4 colors). Each round uses 8 random cards.

### Colors (Base Sets)

- `red` - Set of all cards with red dots
- `blue` - Set of all cards with blue dots
- `green` - Set of all cards with green dots
- `gold` - Set of all cards with gold/yellow dots

### Regular Operators

**Union (∪)** - OR operation
- `red ∪ blue` = cards with red OR blue (or both)
- Worth: 10 points
- Unlocked: Level 1

**Intersection (∩)** - AND operation
- `red ∩ blue` = cards with red AND blue
- Worth: 10 points
- Unlocked: Level 1

**Difference (−)** - Set subtraction
- `red − blue` = cards with red but NOT blue
- Worth: 10 points
- Unlocked: Level 2

**Complement (′)** - NOT operation
- `red′` = cards WITHOUT red
- Worth: 15 points
- Unlocked: Level 3
- **Special:** Postfix operator (comes after the color)

### Set Constants

**Universe (U)** - All 8 cards
- Worth: 15 points
- Unlocked: Level 5
- Used for "padding" or as base set for restrictions

**Null Set (∅)** - Empty set (no cards)
- Worth: 15 points
- Unlocked: Level 5
- Often used to eliminate sets via restrictions

### Restrictions (Level 6+)

Restrictions **modify the universe** by flipping cards out before evaluating the set name.

**Subset (⊆)**
- `A ⊆ B` means "A must be contained in B"
- Flips cards in A that are NOT in B
- Worth: 20 points
- Example: `red ⊆ blue` flips red cards without blue

**Equals (=)**
- `A = B` means "A and B must be identical"
- Flips cards in A but not B, AND cards in B but not A
- Worth: 20 points
- Example: `red = blue` flips cards with only red OR only blue

**Important:** The ⊆ symbol points to the LARGER set (like Pac-Man eating it).

### Two-Row Solution System (Level 6+)

- **Row 0 (Top):** Restrictions (disabled until Level 6)
- **Row 1 (Bottom):** Set Name (always enabled)

**Evaluation order:**
1. Apply restriction (if present) → flip violating cards
2. Evaluate set name against remaining (non-flipped) cards

**Valid configurations:**
- Set name only (bottom row)
- Restriction (top) + Set name (bottom)
- Set name (top) + Restriction (bottom) - restriction applies first regardless

**Invalid:**
- Two restrictions
- Two set names
- Restriction without set name
- Single cube solutions (except with restriction: 3+ restriction cubes + 1 set name cube = valid)

### Special Dice (Level 8+)

**Required Cube**
- Bright lime green (#00ff00) glowing border with pulse animation
- MUST be used in solution or it's invalid
- Worth: 50 bonus points
- Chance: 50% at Level 8, 33% at Level 9, 25% at Level 10
- **Anti-cheat:** Prevents spam-passing strategies

**Wild Cube** (Level 9+)
- Not yet implemented
- Will allow player to choose which operator it represents
- Worth: 25 points

**Bonus Cube** (Level 10)
- Not yet implemented
- Worth: 50 points just for using it

---

## Level Progression

### Level Structure

Each level requires reaching a **goal score** to advance. Score resets on new level.

| Level | Goal Score | Dice Count | Time Limit | Special Features |
|-------|-----------|------------|------------|------------------|
| 1 | 500 | 6 | None | ∪, ∩ only |
| 2 | 750 | 6 | None | + Difference (−) |
| 3 | 1000 | 6 | None | + Complement (′) |
| 4 | 1500 | 6 | None | Duplicate operators allowed |
| 5 | 2500 | 8 | None | + Universe (U), Null (∅) |
| 6 | 5000 | 8 | None | + Subset (⊆), Equals (=), Restrictions |
| 7 | 5000 | 8 | 180s | Timer introduced |
| 8 | 5000 | 8 | 180s | Required cubes (50% chance) |
| 9 | 7500 | 8 | 150s | Wild cubes, Required (33% each) |
| 10 | 10000 | 8 | 120s | Bonus cubes, Wild, Required |

### Dice Generation Rules

**Always:**
- Exactly 4 color dice
- Max 2 of any single color
- Colors distributed randomly

**Levels 1-3:**
- 2 operator dice (no duplicates)

**Level 4+:**
- 2 operator dice (duplicates allowed)

**Level 5+:**
- 4 color + 2 operator + 2 special (U/∅)

**Level 8+:**
- One random die may be marked "required"

### Scoring

**Base formula:** `Σ(dice point values) × (total dice count)`

**Examples:**
- `red ∪ blue` = (10 + 10) × 2 = 40 points
- `red ∩ blue ∩ green` = (10 + 10 + 10) × 3 = 90 points
- `U ⊆ red` + `green` = (15 + 20 + 10) × 4 = 180 points
- Required cube bonus: +50 points

**Pass system:**
- Passing awards **0 points** (even if no solution exists)
- Escape valve for stuck players
- Smart detection tells player if solution exists

---

## Code Architecture

### File Structure

```
/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # All styling (responsive, animations)
├── js/
│   ├── main.js            # Entry point, initialization
│   ├── game.js            # Game state & logic (Game class)
│   ├── levels.js          # Level configs, card/dice generation
│   ├── setTheory.js       # Expression evaluation engine
│   ├── storage.js         # localStorage persistence
│   ├── solutionFinder.js  # Algorithm to find possible solutions
│   ├── svgSymbols.js      # SVG generation for operators
│   └── ui/
│       ├── UIController.js    # Main UI orchestrator
│       ├── UIRenderer.js      # Rendering logic
│       ├── DragDropHandler.js # Drag & drop + touch events
│       └── ModalManager.js    # Tutorial, menu, result modals
└── old game files/        # Reference files from original game
```

### Module Responsibilities

**`game.js` (Game class)**
- Game state management
- Round generation
- Solution validation
- Timer management
- Score tracking
- Level advancement

**`levels.js`**
- Level configurations
- Card generation (16 unique combinations)
- Dice generation with constraints
- Goal number generation (weighted random)

**`setTheory.js`**
- Expression evaluation (the heart of the game)
- Grouping detection (physically touching dice)
- Pattern validation (SETNAME_PATTERNS, RESTRICTION_PATTERNS)
- Restriction evaluation
- Order of operations handling

**`storage.js` (GameStorage class)**
- localStorage wrapper
- Save/load game state
- Timer persistence
- Settings management

**`solutionFinder.js`**
- Checks if valid solution exists
- Used for Smart Pass system
- Brute force: tries all combinations & permutations
- Respects required cube constraints

**`ui/UIController.js`**
- Coordinates all UI modules
- Event handling
- Solution Helper (auto-dim/flip preview)
- Pass system flow

**`ui/UIRenderer.js`**
- Renders cards, dice, solutions
- Applies visual states (dimmed, excluded, required)
- Grouping indicators
- Status bar updates

**`ui/DragDropHandler.js`**
- Native drag & drop for desktop
- Custom touch handlers for mobile
- Smart Snap (20% max overlap)
- Position tracking

**`ui/ModalManager.js`**
- Tutorial modal
- Menu/settings modal
- Result modal (success/error)
- Pass modal (checking/warning)
- Timeout modal (Level 7+)

### Data Flow

```
User Action
    ↓
UIController (handles event)
    ↓
Game (updates state)
    ↓
GameStorage (persists to localStorage)
    ↓
UIController.render()
    ↓
UIRenderer (updates DOM)
```

**For Solution Submission:**
```
Click GO → UIController.handleGo()
    ↓
Game.validateSolution()
    ↓
  - Sort dice by X position (left-to-right)
  - Validate patterns
  - Evaluate restriction (if present)
  - Evaluate set name against active cards
  - Check required cube usage
  - Calculate score
    ↓
Game.submitSolution() (if valid)
    ↓
UIController shows result modal
    ↓
Game.generateNewRound() (if score < goal)
OR Game.startNewLevel() (if score >= goal)
```

---

## Key Algorithms

### 1. Expression Evaluation (`setTheory.js`)

**High-level flow:**

```javascript
evaluateExpression(dice, cards)
  ↓
detectGroups(dice)  // Find physically touching dice
  ↓
evaluateWithGroups(dice, groups, cards)
  ↓
  - Evaluate each valid group as sub-expression
  - Treat group result as single token
  - Evaluate final expression left-to-right
  ↓
evaluate(tokens, cards)  // Actual set operations
```

**Grouping detection:**
- Uses hit-testing based on dice positions (x, y)
- Dice are "touching" if within `dieSize + 15px` threshold
- Recursive algorithm to find connected components
- Groups must form valid patterns (checked against SETNAME_PATTERNS)

**Order of operations:**
- Groups evaluate first (highest precedence)
- Then left-to-right evaluation
- No PEMDAS - explicit grouping required

### 2. Pattern Validation

**Why patterns?**
Set theory has strict syntax rules. Not all dice arrangements are valid.

**Valid set name patterns (examples):**
```
color
color,operator,color
color,operator,color,operator,color
color,prime
setName,operator,color
```

**Valid restriction patterns (examples):**
```
color,restriction,color
setName,restriction,setName
color,restriction,setName,prime
```

**Pattern types:**
- `color` - Red, blue, green, gold dice
- `operator` - ∪, ∩, −
- `prime` - ′ (complement, postfix)
- `setName` - U, ∅, or complex expressions
- `restriction` - =, ⊆

### 3. Restriction Evaluation

**Subset (A ⊆ B):**
```javascript
leftCards = evaluate(A, cards)   // e.g., all red cards
rightCards = evaluate(B, cards)  // e.g., all blue cards
cardsToFlip = leftCards NOT IN rightCards
```

**Equals (A = B):**
```javascript
leftCards = evaluate(A, cards)
rightCards = evaluate(B, cards)
leftOnly = leftCards NOT IN rightCards
rightOnly = rightCards NOT IN leftCards
cardsToFlip = [...leftOnly, ...rightOnly]
```

**Then:**
```javascript
activeCards = allCards EXCEPT cardsToFlip
result = evaluateSetName(setName, activeCards)
```

### 4. Smart Snap (Dice Positioning)

When dropping a die into solution area:
```javascript
1. Place die at mouse/touch position
2. Find all dice within 120% horizontal distance
3. For each overlapping die:
   - Calculate overlap percentage
   - If > 20%, shift new die horizontally
4. Ensure new die stays within bounds
5. Only adjust NEW die (never move existing)
```

### 5. Solution Finder

```javascript
hasPossibleSolution(cards, dice, goal)
  ↓
For size = 2 to dice.length:
  For each combination of 'size' dice:
    - Skip if missing required cube
    For each permutation of combination:
      - Add dummy positions
      - Check if valid syntax
      - Evaluate expression
      - If result.size === goal → return true
  ↓
return false  // No solution found
```

**Performance:** Can be slow (seconds) for 8 dice with many operators. We show "Checking puzzle..." modal during execution.

---

## Design Decisions

### Why Vanilla JavaScript?

**Decision:** Use vanilla ES6+ modules, no frameworks (React, Vue, etc.)

**Reasons:**
- Lightweight, fast loading
- No build step complexity
- Easy to understand for future maintainers
- Sufficient for game's complexity level
- Player wanted to avoid external dependencies

### Why Module-Based UI Architecture?

**Decision:** Split `ui.js` into UIController, UIRenderer, DragDropHandler, ModalManager

**Reasons:**
- Original `ui.js` became too large (1000+ lines)
- Separation of concerns (rendering vs event handling vs modals)
- Easier to test and debug
- Better code reusability

### Why Physical Grouping Instead of Parentheses?

**Decision:** Dice that touch physically form groups (sub-expressions)

**Reasons:**
- More tactile, intuitive for visual learners
- Matches physical game feel (On-Sets uses cubes on a board)
- No need for parentheses symbols
- Creates interesting spatial puzzle element

### Why Two Solution Rows?

**Decision:** Separate rows for restrictions vs set names

**Reasons:**
- Clear visual separation of concepts
- Matches logical evaluation order (restriction → set name)
- Prevents confusion about which is which
- Top row disabled until Level 6 (teaches progression)

### Why No Points for Passing?

**Decision:** Passing awards 0 points, even if puzzle is unsolvable

**Reasons:**
- Prevents point farming exploit (spam Pass until correct)
- Passing is an escape valve, not a strategy
- Time lost is penalty enough
- Still tells player if solution exists (educational)

### Why Timer Persistence?

**Decision:** Timer continues across browser refresh

**Reasons:**
- Prevents refresh-to-reset exploit
- More challenging for advanced levels
- Fair difficulty progression
- Maintains game integrity

### Why Bright Green for Required Cubes?

**Decision:** Lime green (#00ff00) with glow and pulse animation

**Reasons:**
- Original dark green (#2b8103) was nearly invisible
- Required cubes are crucial game mechanic
- Failure to use them invalidates solution
- Needed to be UNMISSABLE

---

## Common Tasks

### Adding a New Operator

1. **Define in `levels.js`:**
   ```javascript
   export const OPERATORS = {
       NEWOP: { symbol: '⊕', name: 'New Operator', points: 15 }
   };
   ```

2. **Add to level configs:**
   ```javascript
   operators: ['UNION', 'INTERSECTION', 'NEWOP']
   ```

3. **Update `setTheory.js`:**
   - Add to `dicesToPatternString()` if new type
   - Add evaluation logic in `evaluate()`
   - Add to valid patterns if needed

4. **Update `svgSymbols.js`:**
   - Add SVG generation if custom symbol needed
   - Add to `getOperatorClass()` for styling

5. **Update `styles.css`:**
   - Add specific styling if needed

6. **Update tutorial in `levels.js`:**
   - Explain new operator to players

### Adding a New Level

1. **Add config to `LEVEL_CONFIG` in `levels.js`:**
   ```javascript
   {
       level: 11,
       goalScore: 15000,
       numDice: 8,
       timeLimit: 90,
       operators: [...],
       tutorial: { title: '...', text: '...' }
   }
   ```

2. **Update `hasNextLevel()` check**

3. **Test progression from previous level**

### Debugging Solution Validation

**Enable console logs in `game.js` - already present:**
- Validation summary
- Active/matching card indices
- Required cube check
- Pattern validation results

**Enable console logs in `setTheory.js` - already present:**
- Expression evaluation steps
- Group detection
- Pattern matching
- Restriction evaluation

**Check:**
1. Are dice sorted by X position?
2. Do dice form valid pattern?
3. Is restriction evaluated first?
4. Are flipped cards excluded from set name?
5. Is required cube used?

### Adding Mobile Touch Support

**Pattern (already used in `DragDropHandler.js`):**
```javascript
element.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Prevent page scroll
    // Store touch info
});

element.addEventListener('touchmove', (e) => {
    e.preventDefault();
    // Update position
});

element.addEventListener('touchend', (e) => {
    e.preventDefault();
    // Finalize action
});
```

**Important:**
- Always `preventDefault()` to avoid page scroll
- Use `e.touches[0]` for coordinates
- Create visual clone for drag feedback
- Use `elementFromPoint()` to detect drop target

---

## Edge Cases & Gotchas

### 1. Dice Order Matters!

**Problem:** Dice are stored in array by drag order, NOT visual left-to-right position.

**Solution:** ALWAYS sort by X position before evaluation:
```javascript
const sorted = dice.sort((a, b) => a.x - b.x);
```

**Where:** 
- `game.js` `validateSolution()`
- `ui/UIController.js` `evaluateSolutionHelper()`

### 2. Single-Cube Solutions

**Rule:** Solutions must have ≥2 cubes TOTAL.

**BUT:** Set name can be 1 cube if restriction present (e.g., 3 restriction + 1 set name = 4 total).

**Check location:** `game.js` `validateSolution()` after determining restriction/setName:
```javascript
const totalCubes = restrictionRow.length + setNameRow.length;
if (totalCubes < 2) return { valid: false, ... };
```

### 3. Universe and Null Are Not Restrictions

**Confusion:** U and ∅ were originally called "restrictions" but are actually **Set Constants**.

**Why it matters:**
- U and ∅ can be in set name OR restriction row
- True restrictions (=, ⊆) can ONLY be in restriction pattern
- Different point values and styling

**Code classification:**
- `svgSymbols.js` → `getOperatorClass()` returns `'set-constant'` for U/∅
- `levels.js` → Comments clarify "Set constants" vs "Restrictions"

### 4. Required Cube Must Be Exact ID Match

**Problem:** Can't just check `die.value` - multiple dice might have same value.

**Solution:** Each die has unique `id` generated at creation:
```javascript
id: `die-${index}-${Date.now()}`
```

**Check:** `allDice.some(die => die.id === requiredDie.id)`

### 5. Timer Must Use Original Start Time

**Problem:** Refreshing resets timer if using `Date.now()` as new start.

**Solution:**
1. Save `timerStartTime` (original timestamp) to localStorage
2. On restore, calculate: `elapsed = Date.now() - timerStartTime`
3. Set `timerStartTime` BEFORE calling `startTimer(remaining)`
4. `startTimer()` checks `if (!this.timerStartTime)` before creating new timestamp

### 6. Complement is Postfix

**Unique:** All other operators are infix (between operands), but ′ is postfix (after operand).

**Valid:** `red′` → cards without red  
**Invalid:** `′red`

**Pattern string:** `color,prime` NOT `prime,color`

### 7. Solution Helper Overrides Manual States

**Behavior:** When enabled, Solution Helper takes control of card dimming/flipping.

**Implementation:**
- Store original user states in `data-` attributes
- Apply helper states
- Restore user states when helper disabled

**When cleared:**
- Solution reset
- Pass
- New round/level
- Helper toggle off

### 8. Mobile Dice Grid Must Match Count

**Problem:** Using `auto-fit` made 7-1 or 5-3 layouts.

**Solution:** Set `data-dice-count` attribute and use specific grid:
```css
.dice-container[data-dice-count="6"] {
    grid-template-columns: repeat(3, 1fr);  /* 3x2 */
}
.dice-container[data-dice-count="8"] {
    grid-template-columns: repeat(4, 1fr);  /* 4x2 */
}
```

### 9. Script Tag Must Be Closed

**Gotcha:** 
```html
<!-- WRONG (breaks everything) -->
<script type="module" src="js/main.js?v=2.9.0">

<!-- RIGHT -->
<script type="module" src="js/main.js?v=2.9.0"></script>
```

**Why:** Self-closing script tags are not valid HTML. Browser won't execute JS.

### 10. Grouping Only Works for Valid Patterns

**Important:** Just because dice are touching doesn't mean they form a group.

**Check:** `isValidGroup()` validates against SETNAME_PATTERNS.

**Example:**
- `[red][∪][blue]` touching → VALID group (color,operator,color)
- `[red][∪]` touching → INVALID (incomplete pattern)
- `[∪][∩]` touching → INVALID (two operators)

**Impact:** Invalid "groups" are ignored, dice evaluated left-to-right instead.

---

## Testing Checklist

### Before Committing Major Changes

- [ ] Test on desktop (Chrome, Safari)
- [ ] Test on mobile (touch events, responsive layout)
- [ ] Test solution validation with restrictions
- [ ] Test timer persistence (refresh mid-game)
- [ ] Test pass system (solution exists vs doesn't)
- [ ] Test required cube enforcement
- [ ] Test level advancement
- [ ] Test localStorage save/load
- [ ] Check console for errors
- [ ] Increment cache version in `index.html`

### Common Test Scenarios

1. **Basic solution:** `red ∪ blue` targeting 5 cards
2. **Complement:** `red′` targeting non-red cards
3. **Grouping:** `[red ∩ blue] ∪ green` 
4. **Restriction:** `U ⊆ red` + `green` (only red cards, then find green)
5. **Single cube with restriction:** Valid if ≥2 cubes total
6. **Required cube:** Must use it or fail
7. **Pass when solvable:** Warns user
8. **Pass when unsolvable:** Acknowledges correctness
9. **Timer expiry:** Forces new round
10. **Refresh mid-puzzle:** Restores state correctly

---

## Future Improvements / TODOs

### Planned Features (Level 9-10)

- [ ] **Wild Cubes (Level 9):** Click to choose operator
- [ ] **Bonus Cubes (Level 10):** Free points for using
- [ ] Percentage chances for special cubes at each level

### Possible Enhancements

- [ ] **Better tutorials:** Interactive overlays vs scroll-based
- [ ] **Hint system:** Show one possible solution (cost: points?)
- [ ] **Statistics:** Track solve times, favorite operators
- [ ] **Achievements:** "Used all 8 dice", "Never passed", etc.
- [ ] **Sound effects:** Success chime, error bonk, timer warning
- [ ] **Animations:** Card flipping, dice rolling, particles on success
- [ ] **Difficulty modes:** Casual (no timer), Expert (harder goals)
- [ ] **Daily challenge:** Same puzzle for all players

### Technical Debt

- [ ] Remove/reduce debug console logs before final release
- [ ] Add automated tests (especially for setTheory evaluation)
- [ ] Optimize solution finder (currently brute force)
- [ ] Consider Web Workers for solution finding (prevent UI freeze)
- [ ] Add error boundary for graceful failure handling
- [ ] Minify/bundle for production

---

## Glossary

**Active Cards** - Cards that have not been flipped out (still in universe)

**Excluded Cards** - Cards marked as "not in my set" by user (blue background)

**Flipped Cards** - Cards removed from universe by restriction (blue background)

**Dimmed Cards** - Cards marked as "probably not in my set" by user (note-taking)

**Grouping** - Physical proximity of dice forming sub-expressions

**Pattern** - Allowed sequence of dice types (color, operator, etc.)

**Required Cube** - Die with bright green border that MUST be used

**Restriction** - Expression using = or ⊆ that modifies universe

**Set Constants** - Universe (U) and Null (∅)

**Set Name** - Expression describing target set of cards

**Smart Pass** - Pass system that checks if solution exists

**Smart Snap** - Auto-positioning to prevent excessive dice overlap

**Solution Helper** - Auto-dim/flip preview feature

**Wild Cube** - Die that can be any operator (Level 9+, not yet implemented)

---

## Contact & Maintenance

**Original Developer:** Jason Van Pelt  
**AI Development Partner:** Claude (Anthropic)  
**Development Period:** October 2025  
**GitHub:** https://github.com/jvanpelt/ready-set-2  
**Hosted:** GitHub Pages (https://jvanpelt.github.io/ready-set-2)

**For AI Assistants:**
- Read this file first before making changes
- Consult `old game files/` for original game reference
- Test thoroughly, especially cross-browser and mobile
- Update this file when making architectural changes
- Increment cache version in `index.html` for each deployment

---

*This file is maintained for AI assistant context. For user-facing documentation, see README.md.*
