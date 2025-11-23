# Daily Puzzle Generation & Maintenance

## Overview
Daily puzzles use 8-cube solutions with weighted goal distribution to provide balanced difficulty over time.

---

## Natural Generation Bias

**Important:** The puzzle generation process has a natural bias toward lower-goal solutions.

### Why This Happens:
- Templates use complex restrictions (e.g., `U = red ∪ blue ∩ green`)
- More complex restrictions naturally filter out more cards
- This results in fewer matching cards → lower goals
- Goals 1-2 are over-represented, goals 4-7 are under-represented

### Solution:
**Manual rebalancing is required** to achieve the desired bell curve distribution.

---

## Target Goal Distribution (Bell Curve)

For 1461 puzzles (4 years of daily puzzles):

| Goal | Target % | Target Count | Description |
|------|----------|--------------|-------------|
| 1    | 5%       | 73           | Very rare   |
| 2    | 20%      | 292          | Uncommon    |
| 3    | 30%      | 438          | Common      |
| 4    | 30%      | 438          | Common      |
| 5    | 10%      | 146          | Uncommon    |
| 6    | 4%       | 58           | Rare        |
| 7    | 1%       | 15           | Very rare   |

**Total:** 1460 puzzles (1 variance acceptable)

---

## File Structure

### Production Files:
- **`data/daily-puzzles.json`** - Obfuscated production puzzles (1.4MB)
- **`data/daily-puzzles-test.json`** - Test puzzles, 454 unobfuscated (815KB)

### Temporary Files (created during regeneration):
- `data/daily-puzzles-decoded.json` - Decoded from production
- `data/daily-puzzles-decoded-with-counts.json` - After solution counting
- `data/daily-puzzles-decoded-with-counts-rebalanced.json` - After goal rebalancing
- `data/daily-puzzles-decoded-with-counts-rebalanced-obfuscated.json` - Ready for deployment

**Delete temp files after regeneration is complete.**

---

## Maintenance Scripts

### Core Scripts (Keep):
1. **`scripts/decode-puzzles.mjs`** - Decode obfuscated puzzles for editing
2. **`scripts/verify-goal-distribution.mjs`** - Check if rebalancing is needed
3. **`scripts/rebalance-puzzle-goals.mjs`** - Fix goal distribution bias
4. **`scripts/count-puzzle-solutions.mjs`** - Calculate solution metadata (count, shortest, longest)
5. **`scripts/obfuscate-puzzles.mjs`** - Prepare for production (minify + obfuscate)
6. **`scripts/validate-all-patterns.mjs`** - Verify pattern coverage

---

## When to Regenerate Puzzles

Regeneration is needed when:
1. **Pattern validation changes** (e.g., adding missing `RESTRICTION_PATTERNS`)
2. **Solution evaluation logic changes** in `js/setTheory.js`
3. **Bug fixes** in puzzle generation or validation
4. **Initial puzzle set creation** (one-time)

**Do NOT regenerate** for:
- UI changes
- Score display changes
- Non-puzzle game logic changes

---

## Regeneration Workflow

### Step 1: Decode
```bash
node scripts/decode-puzzles.mjs data/daily-puzzles.json
```
**Output:** `data/daily-puzzles-decoded.json`

---

### Step 2: Recalculate Solution Counts
```bash
node scripts/count-puzzle-solutions.mjs data/daily-puzzles-decoded.json
```
**Output:** `data/daily-puzzles-decoded-with-counts.json`  
**Time:** ~58 minutes for 1461 puzzles

**What This Does:**
- Exhaustively finds all valid solutions for each puzzle
- Calculates: `solutionCount`, `shortestSolution`, `longestSolution`
- Uses current pattern validation from `js/setTheory.js`

---

### Step 3: Verify Goal Distribution
```bash
node scripts/verify-goal-distribution.mjs data/daily-puzzles-decoded-with-counts.json
```

**If ✅ "Goal distribution looks good"** → Skip to Step 5  
**If ❌ "Rebalancing recommended"** → Continue to Step 4

---

### Step 4: Rebalance Goals
```bash
node scripts/rebalance-puzzle-goals.mjs data/daily-puzzles-decoded-with-counts.json
```
**Output:** `data/daily-puzzles-decoded-with-counts-rebalanced.json`  
**Time:** ~20-30 minutes (generates new puzzles and counts their solutions)

**What This Does:**
- Identifies over/under-represented goals
- Generates new puzzles for deficit goals
- Removes excess puzzles from surplus goals
- Shuffles and re-IDs all puzzles
- Outputs perfectly balanced distribution

**Verify after rebalancing:**
```bash
node scripts/verify-goal-distribution.mjs data/daily-puzzles-decoded-with-counts-rebalanced.json
```

---

### Step 5: Obfuscate
```bash
# If rebalanced:
node scripts/obfuscate-puzzles.mjs data/daily-puzzles-decoded-with-counts-rebalanced.json

# If not rebalanced:
node scripts/obfuscate-puzzles.mjs data/daily-puzzles-decoded-with-counts.json
```
**Output:** `*-obfuscated.json` (43.9% size reduction)

**What This Does:**
- XOR cipher + Base64 encoding for `cards`, `dice`, `solution`
- Minifies JSON (no whitespace)
- Adds `"encoded": true` flag
- Makes puzzle data harder to inspect in browser

---

### Step 6: Deploy to Production
```bash
# Choose appropriate source based on whether you rebalanced
cp data/daily-puzzles-decoded-with-counts-rebalanced-obfuscated.json data/daily-puzzles.json
# OR
cp data/daily-puzzles-decoded-with-counts-obfuscated.json data/daily-puzzles.json
```

---

### Step 7: Clean Up Temporary Files
```bash
rm data/daily-puzzles-decoded.json
rm data/daily-puzzles-decoded-with-counts.json
rm data/daily-puzzles-decoded-with-counts-rebalanced.json
rm data/daily-puzzles-decoded-with-counts-rebalanced-obfuscated.json
# OR
rm data/daily-puzzles-decoded-with-counts-obfuscated.json
```

---

## Pattern Validation

### Current Pattern Counts:
- **`RESTRICTION_PATTERNS`**: 65 patterns (3-7 cubes)
- **`SETNAME_PATTERNS`**: 25 patterns (1-5 cubes)

### Physical Constraints:
- Max 4 color cubes
- Max 2 operator cubes (∪, ∩, −, ′ combined)
- Max 2 special cubes (U, ∅, =, ⊆ combined)

**Generated and validated by:** `scripts/validate-all-patterns.mjs`

---

## Solution Metadata

Each puzzle includes:

```json
{
  "solutionCount": 156,      // Total valid solutions
  "shortestSolution": 3,     // Minimum cubes needed
  "longestSolution": 8       // Maximum cubes possible
}
```

**Used for:**
- Difficulty estimation
- Player hints (potential future feature)
- Analytics on puzzle complexity

---

## Troubleshooting

### "Goals changed during solution counting"
**Should never happen.** If it does:
- Bug in `evaluateSolution()` or `evaluateRestriction()`
- Investigate changes to `js/setTheory.js`

### "Solution counts seem low"
- Check if `RESTRICTION_PATTERNS` or `SETNAME_PATTERNS` are missing patterns
- Run `scripts/validate-all-patterns.mjs` to verify coverage

### "Rebalancing produces too few puzzles"
- Increase `maxAttemptsPerTemplate` in rebalance script
- May indicate templates are struggling to generate specific goals

---

## Version History

- **v4.17.1** - Fixed RESTRICTION_PATTERNS (49 → 65 patterns), regenerated solution counts
- **v4.17.0** - Initial production puzzle set with obfuscation
- **v4.16.0** - Daily puzzle feature implementation

---

## Notes

- Daily puzzles are indexed by days since January 1, 2025
- Test mode allows random puzzle access for testing
- Players can find solutions different from the pre-generated template solution
- All solutions are validated using the same pattern logic as regular game mode

