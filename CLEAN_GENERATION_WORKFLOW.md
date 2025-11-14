# Clean Daily Puzzle Generation Workflow (From Scratch)

**Purpose:** Generate a completely fresh set of 1461 daily puzzles with correct solution counts and balanced goal distribution.

---

## Prerequisites

✅ All pattern fixes in place (`RESTRICTION_PATTERNS`: 65, `SETNAME_PATTERNS`: 25)  
✅ Scripts verified and ready

---

## Step 1: Generate Fresh Puzzles (~10-15 minutes)

```bash
node scripts/generate-production-puzzles.mjs 1461
```

**What this does:**
- Generates 1461 puzzles using all available templates
- Uses weighted goal selection (natural bias toward lower goals)
- Does NOT count solutions yet
- Does NOT rebalance goals yet

**Output:** `data/daily-puzzles-production.json` (~2.4MB)

**Expected distribution:**
- Natural bias toward goals 1-2 (this is expected!)
- Will be corrected in Step 3

---

## Step 2: Rebalance Goal Distribution (~10-15 minutes)

```bash
node scripts/rebalance-puzzle-goals.mjs data/daily-puzzles-production.json
```

**What this does:**
- Analyzes current goal distribution
- Generates NEW puzzles for underrepresented goals (3, 4, 5, 6, 7)
- Removes excess puzzles from overrepresented goals (1, 2)
- Does NOT count solutions (will be done in Step 3)
- Shuffles and re-IDs all puzzles
- Achieves perfect bell curve: 5%, 20%, 30%, 30%, 10%, 4%, 1%

**Output:** `data/daily-puzzles-production-rebalanced.json` (~2.4MB)

**Why rebalance BEFORE solution counting?**
- More efficient: count solutions once on the final balanced set
- Rebalancing generates ~160 new puzzles and removes ~136 excess
- Net result: same 1461 total, but balanced distribution

---

## Step 3: Count ALL Solutions (~58-60 minutes) ☕

```bash
node scripts/count-puzzle-solutions.mjs data/daily-puzzles-production-rebalanced.json
```

**What this does:**
- Exhaustively counts ALL valid solutions for each puzzle
- Uses corrected 65 `RESTRICTION_PATTERNS` validation
- Adds metadata: `solutionCount`, `shortestSolution`, `longestSolution`
- Runs at ~2.5 seconds per puzzle

**Output:** `data/daily-puzzles-production-rebalanced-with-counts.json` (~2.6MB)

**Time:** 1461 puzzles × 2.5s = ~61 minutes

---

## Step 4: Verify Goal Distribution (~1 second)

```bash
node scripts/verify-goal-distribution.mjs data/daily-puzzles-production-rebalanced-with-counts.json
```

**Expected output:**
```
✅ Goal distribution looks good! No rebalancing needed.

Goal | Actual | Expected | Diff   | %Actual | %Expected
-----|--------|----------|--------|---------|----------
  1  |   73   |    73    |    0   |   5.0%  |    5.0%
  2  |  292   |   292    |    0   |  20.0%  |   20.0%
  3  |  438   |   438    |    0   |  30.0%  |   30.0%
  4  |  438   |   438    |    0   |  30.0%  |   30.0%
  5  |  146   |   146    |    0   |  10.0%  |   10.0%
  6  |   58   |    58    |    0   |   4.0%  |    4.0%
  7  |   15   |    15    |    0   |   1.0%  |    1.0%
```

**If not perfect:** Minor variance (±5 puzzles) is acceptable.  
**If major issues:** Contact support (something went wrong in Step 2).

---

## Step 5: Obfuscate (~5 seconds)

```bash
node scripts/obfuscate-puzzles.mjs data/daily-puzzles-production-rebalanced-with-counts.json
```

**What this does:**
- Removes metadata fields (`templatePattern`, `templateIndex`)
- Encodes ONLY the `solution` field (XOR + Base64)
- Keeps `cards`, `dice`, and metadata visible (debuggable)
- Formats each puzzle as one line
- Adds `"encoded": true` flag

**Why this approach:**
- Cards/dice are displayed in-game anyway (no point hiding them)
- Solution is the only spoiler that needs hiding
- One-line-per-puzzle format reduces file size
- Still allows debugging puzzle setup without decoding

**Output:** `data/daily-puzzles-production-rebalanced-with-counts-obfuscated.json` (~1.2MB)

---

## Step 6: Deploy to Production

```bash
cp data/daily-puzzles-production-rebalanced-with-counts-obfuscated.json data/daily-puzzles.json
```

**Verify:**
```bash
ls -lh data/daily-puzzles.json
# Should be ~1.4MB
```

---

## Step 7: Clean Up Intermediate Files

```bash
rm data/daily-puzzles-production.json
rm data/daily-puzzles-production-rebalanced.json
rm data/daily-puzzles-production-rebalanced-with-counts.json
rm data/daily-puzzles-production-rebalanced-with-counts-obfuscated.json
```

**Keep only:**
- `data/daily-puzzles.json` (production, obfuscated)
- `data/daily-puzzles-test.json` (test set, unobfuscated)

---

## Total Time Estimate

| Step | Time | Description |
|------|------|-------------|
| 1. Generate | 10-15 min | Create 1461 puzzles |
| 2. Rebalance | 10-15 min | Fix distribution |
| 3. Count All | 58-60 min | Full solution analysis ☕ |
| 4. Verify | <1 sec | Check distribution |
| 5. Obfuscate | <5 sec | Encode data |
| 6. Deploy | <1 sec | Copy to production |
| 7. Cleanup | <1 sec | Remove temp files |
| **TOTAL** | **~80-90 min** | Go grab lunch! 🍕 |

---

## Emergency: Decode Production Puzzles

If you need to edit production puzzles later:

```bash
node scripts/decode-puzzles.mjs data/daily-puzzles.json
```

**Output:** `data/daily-puzzles-decoded.json`

Then you can re-run Steps 3-7 as needed.

---

## Why This Order?

1. **Generate first** - Get raw puzzles with natural bias
2. **Rebalance second** - Fix distribution while counting only new puzzles (saves time)
3. **Count third** - Full solution analysis on final balanced set
4. **Obfuscate last** - Only encode the final, validated data

This order minimizes redundant computation and ensures data quality.

---

## Success Criteria

✅ 1461 puzzles total  
✅ Weighted bell curve distribution (14.3%, 19%, 19%, 19%, 14.3%, 9.5%, 4.8%)  
✅ All puzzles have solution counts  
✅ File size ~1.2MB (solution encoded, one per line)  
✅ No puzzles marked as "failed"  
✅ Cards/dice visible for debugging  

---

## Questions?

See `DAILY_PUZZLE_GENERATION.md` for detailed documentation on the system architecture and maintenance.

