# Daily Puzzle System - Generation Guide

## Phase 1: Bulk Puzzle Generation ✅ (Current)

### How Puzzles Are Generated

Puzzles are generated during development by the AI code agent using the `DailyPuzzleGenerator.js` logic:

1. **AI generates puzzles** using template instantiation
2. **AI validates** puzzle quality and difficulty distribution
3. **AI writes** directly to `data/daily-puzzles.json`
4. **Developer reviews and commits** the generated file

### What Gets Generated

**Current Status**: 50 puzzles generated and saved to `data/daily-puzzles.json`

### What Gets Generated

Each puzzle contains:
- **`id`**: Sequential puzzle number
- **`cards`**: Array of 8 card configurations
- **`dice`**: Array of 8 dice (pre-generated, with positions and IDs)
- **`goal`**: Number of matching cards (1-8)
- **`difficulty`**: Rating (beginner/intermediate/advanced/expert) + cube count
- **`generatedSolution`**: The 8-cube solution (topRow + bottomRow)
- **`shortestSolution`**: Shortest possible solution data (cubeCount, hasRestriction)

### Template System

Puzzles are generated from **abstract type templates**:

```javascript
{ topRow: "color ∪ color = color", bottomRow: "color ∪ color" }
```

- `color` → red, blue, green, or gold (randomly chosen each time)
- `setName` → U or ∅ (randomly chosen each time)
- Operators (∪, ∩, −) are systematically varied

This allows **natural color reuse** for padding (e.g., `red ∪ red = blue`).

**~300+ templates** are generated from base structures with operator permutations.

---

## Phase 2: Storage & Obfuscation 🔜 (Next)

### Goals:
- Compress puzzle data for smaller file size
- Obfuscate solutions (so players can't peek)
- Finalize JSON structure
- Create production puzzle file

### Open Questions:
- Obfuscation method: Base64? Simple encryption? XOR cipher?
- Should we split into multiple files or one large file?
- How much compression can we achieve?

---

## Phase 3: Date Association & Runtime Loading 🔜 (Future)

### Goals:
- Associate each puzzle with a specific date
- Day-of-year indexing (1-365, with leap year handling)
- Multi-year support (year 1, year 2, etc. when puzzles run out)
- Timezone handling (UTC? Local?)
- Runtime loader picks puzzle based on today's date

### Open Questions:
- How to handle timezones? (midnight UTC vs local midnight)
- Multi-year strategy: cycle through puzzles? generate new ones?
- Should puzzles be locked to specific calendar dates or just sequential days?

---

## Testing Checklist

Before finalizing a puzzle batch:

- [ ] Generate at least 50-100 puzzles for review
- [ ] Check difficulty distribution (good spread across all levels)
- [ ] Verify all puzzles are solvable (goal > 0)
- [ ] Test a few puzzles manually in the game
- [ ] Look for interesting/creative solutions
- [ ] Ensure variety in operators, colors, and restrictions

---

## Current Status

✅ **Phase 1 Complete**: Bulk generation working  
🔜 **Phase 2 Next**: Storage format and obfuscation  
🔜 **Phase 3 Future**: Date association and loading


