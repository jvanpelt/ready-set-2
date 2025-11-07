# Production Daily Puzzle Generation Workflow

Complete instructions for generating 1400+ production daily puzzles with solution counts.

## Overview

This workflow generates puzzles with:
- ✅ **Weighted goals** (bell curve favoring 2-4, like regular game)
- ✅ **Solution counts** (total solutions + shortest/longest)
- ✅ **4 years** of daily puzzles (1461 puzzles)
- ✅ Ready for obfuscation/minification

## Step 1: Generate Production Puzzles

Generate 1461 puzzles with weighted goal distribution:

```bash
node scripts/generate-production-puzzles.mjs
```

**Optional:** Specify a different count:
```bash
node scripts/generate-production-puzzles.mjs 2000
```

**Expected:**
- Time: ~5-10 minutes (varies by success rate)
- Output: `data/daily-puzzles-production.json`
- Shows goal distribution and generation statistics

**What it does:**
- Randomly selects templates and generates dice/cards
- Uses weighted goal selection (favoring 2-4)
- Only keeps puzzles that match weighted goal distribution
- Creates clean, production-ready puzzle data

## Step 2: Count All Solutions

Count solutions for each puzzle (adds metadata):

```bash
node scripts/count-puzzle-solutions.mjs data/daily-puzzles-production.json
```

**Expected:**
- Time: ~58 minutes for 1400 puzzles (~2.5 seconds per puzzle)
- Output: `data/daily-puzzles-production-with-counts.json`
- Shows progress every 10 puzzles

**What it adds:**
- `solutionCount`: Total number of valid solutions
- `shortestSolution`: Minimum cubes needed
- `longestSolution`: Maximum cubes used

**TIP:** Let this run in the background while you do other things! ☕

## Step 3: Review & Deploy

1. **Review the output:**
   ```bash
   # Check file size
   ls -lh data/daily-puzzles-production-with-counts.json
   
   # Quick stats check (first 50 lines)
   head -n 50 data/daily-puzzles-production-with-counts.json
   ```

2. **If satisfied, deploy to production:**
   ```bash
   # Backup current production file (if exists)
   mv data/daily-puzzles.json data/daily-puzzles-backup.json
   
   # Deploy new puzzles
   cp data/daily-puzzles-production-with-counts.json data/daily-puzzles.json
   ```

3. **Test in-game:**
   - Turn OFF "Daily Puzzle Test Mode" in Settings
   - Click "Daily Puzzle" from home screen
   - Verify puzzle loads correctly
   - Check that puzzle # matches expected date-based index

## Expected Results

### Goal Distribution (Weighted)
Should closely match this distribution:
- Goal 1: ~14% (3 out of 21 in weight array)
- Goal 2: ~19% (4 out of 21)
- Goal 3: ~19% (4 out of 21)
- Goal 4: ~19% (4 out of 21)
- Goal 5: ~14% (3 out of 21)
- Goal 6: ~10% (2 out of 21)
- Goal 7: ~5% (1 out of 21)

### Solution Counts
- Average: ~400-600 solutions per puzzle
- Min: 60-100 solutions
- Max: 800-1500 solutions

## Troubleshooting

### Generation stops before target count
- **Cause:** Hit max attempts limit (safety feature)
- **Fix:** Run the script again - it creates a new file, so you can merge or regenerate

### Solution counting is slow
- **Cause:** Some puzzles have 1000+ solutions requiring extensive permutation checks
- **Fix:** This is normal! Just let it run. Consider running overnight for large sets.

### Want different goal distribution
Edit `WEIGHTED_GOALS` array in `scripts/generate-production-puzzles.mjs`:
```javascript
// Current (bell curve 2-4)
const WEIGHTED_GOALS = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

// Example: Flat distribution
const WEIGHTED_GOALS = [1, 2, 3, 4, 5, 6, 7];

// Example: Harder puzzles (favor 5-7)
const WEIGHTED_GOALS = [3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7];
```

## File Reference

- **Generator:** `scripts/generate-production-puzzles.mjs`
- **Counter:** `scripts/count-puzzle-solutions.mjs`
- **Output:** `data/daily-puzzles-production.json` (generated)
- **With Counts:** `data/daily-puzzles-production-with-counts.json` (generated)
- **Production:** `data/daily-puzzles.json` (deployed)

## Next Steps (Future)

- [ ] Obfuscate puzzle data (hide solutions from inspection)
- [ ] Minify JSON (reduce file size)
- [ ] Add difficulty ratings (based on solution counts?)
- [ ] Display solution count to players ("400+ solutions possible!")

---

**Total Time:** ~60-70 minutes
**Output:** 1461 production-ready daily puzzles with solution metadata

