# Cross-Game Mode Code Analysis

**Purpose:** Identify code duplication, shared functionality, and potential destructive alterations between regular game and daily puzzle modes.

**Date:** 2025-11-08

---

## Executive Summary

### Critical Issue Found: 🔴
**Mode is never cleared when exiting daily puzzle!** `this.game.mode = 'daily'` is set but never reset to `undefined`.

### Findings:
- ✅ Good separation of mode-specific logic
- ✅ Shared validation code works correctly
- ⚠️ **Missing state cleanup on mode exit**
- ⚠️ Timer management relies on mode check but mode persists
- ✅ No destructive alterations to core game
- ⚠️ Some state is not properly reset between modes

---

## 1. Mode Detection & State Management

### Where Mode is Checked

**5 locations check `this.game.mode === 'daily'`:**

| File | Line | Purpose | Status |
|------|------|---------|--------|
| `game.js:127` | Timer management | ✅ Working |
| `game.js:654` | Restrictions enabled | ✅ Working |
| `UIController.js:278` | Success handling | ✅ Working |
| `UIController.js:841` | Timer display | ✅ Working |
| `UIController.js:857` | Puzzle ID display | ✅ Working |

### Where Mode is Set

**Only 1 location sets mode:**
```javascript
// DailyPuzzleManager.js:152
this.game.mode = 'daily';
```

### Where Mode is Cleared

**❌ NOWHERE!** Mode is never reset to `undefined`.

---

## 2. Critical Bug: Mode Never Cleared

### The Problem

```javascript
// When entering daily puzzle:
DailyPuzzleManager.js:152
  this.game.mode = 'daily'; // ✓ Set

// When exiting daily puzzle:
UIController.js:315
  window.homeScreen.show(); // ✗ Mode still 'daily'!
```

**Result:** When user clicks "Continue" from home screen, they resume regular game **but `this.game.mode` is still `'daily'`**!

### Impact

1. **Timer won't start** in level 7+ (checks mode first)
2. **Wrong restrictions enabled** logic
3. **Score display** might be wrong
4. **State confusion** throughout game

### Fix Required

Add mode cleanup in multiple places:

```javascript
// Option 1: Clear in HomeScreenManager when showing home
show() {
    this.element.classList.remove('hidden');
    this.game.mode = undefined; // Clear daily mode
}

// Option 2: Clear in Game.init() when resuming
init() {
    // ... existing code ...
    this.mode = undefined; // Reset mode on init
}

// Option 3: Clear in both Continue and New Game
continueBtn.addEventListener('click', () => {
    this.game.mode = undefined;
    this.hide();
});
```

---

## 3. Shared Code Analysis

### A. Validation Logic ✅ GOOD

**Shared correctly between both modes:**

| Function | Location | Used By | Status |
|----------|----------|---------|--------|
| `evaluateExpression()` | `setTheory.js` | Both | ✅ Shared |
| `evaluateRestriction()` | `setTheory.js` | Both | ✅ Shared |
| `isValidSyntax()` | `setTheory.js` | Both | ✅ Shared |
| `isValidRestriction()` | `setTheory.js` | Both | ✅ Shared |
| `validateSolution()` | `game.js` | Both | ✅ Shared |
| `submitSolution()` | `game.js` | Both | ✅ Shared |

**No duplication. Clean architecture.**

---

### B. Score Calculation ⚠️ DIVERGENT

**Regular Game:**
```javascript
// game.js - Uses accumulated score
this.score += result.points;
```

**Daily Puzzle:**
```javascript
// UIController.js:287 - Uses single puzzle score
score: result.points  // Not accumulated
```

**Status:** ✅ Correctly different - no issues.

---

### C. UI Rendering ✅ SHARED

**Shared renderer:**
- `UIRenderer.renderCards()`
- `UIRenderer.renderDice()`
- `UIRenderer.renderSolutions()`

**Mode-specific display:**
- `UIRenderer.updateStatusBar()` - Checks mode for score display
- Timer display - Hidden in daily mode

**Status:** ✅ Good separation, no duplication.

---

### D. Dice/Card Interaction ✅ SHARED

**All interaction code is shared:**
- Drag and drop
- Click handlers
- Solution area management
- Solution helper (dimming/flipping)

**Status:** ✅ No duplication, works in both modes.

---

## 4. Timer Management ⚠️ PARTIAL

### Current Implementation

```javascript
// game.js:125-137
generateNewRound() {
    // ...
    
    // Start timer if level has time limit (Level 7+)
    // Never start timer for daily puzzles
    if (this.mode === 'daily') {
        this.stopTimer();  // ✓ Good
    } else {
        // ... start timer logic
    }
}
```

### Issues

1. ✅ **Timer is stopped** when entering daily puzzle
2. ❌ **Mode persists** after exiting, so timer won't start properly
3. ⚠️ **Timer state** might carry over if not properly cleared

### stopTimer() Analysis

```javascript
// game.js:263-272
stopTimer() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval); // ✓ Clears interval
        this.timerInterval = null;
    }
    this.timerRemainingSeconds = 0;
    this.timerStartTime = null;  // ✓ Clears state
    this.timerDuration = null;   // ✓ Clears state
    this.saveState(); // ✓ Saves
}
```

**Status:** ✅ Timer cleanup is good. Problem is **mode not cleared**.

---

## 5. Solution Row Management ✅ GOOD

### Implementation

```javascript
// game.js:654
restrictionsEnabled: this.mode === 'daily' ? true : this.level >= 6
```

```javascript
// UIRenderer.js
const rowDisabled = rowIndex === 0 && !state.restrictionsEnabled;
```

### Behavior

| Mode | Level | Top Row | Bottom Row |
|------|-------|---------|------------|
| Daily | Any | ✅ Enabled | ✅ Enabled |
| Regular | 1-5 | ❌ Disabled | ✅ Enabled |
| Regular | 6+ | ✅ Enabled | ✅ Enabled |

**Status:** ✅ Works correctly. But **mode persistence bug** will affect this after returning from daily puzzle.

---

## 6. State Cleanup on Mode Transitions

### What Happens Now

**Regular → Daily:**
```javascript
// DailyPuzzleManager.js:115-165
startDailyPuzzle() {
    this.game.mode = 'daily';  // ✓ Set mode
    // Load puzzle into game
    this.loadPuzzleIntoGame(puzzle);  // Sets cards, dice, goal
    // ✗ Doesn't call stopTimer() explicitly
    // ✗ Doesn't clear solutions
    // ✗ Doesn't reset score
}
```

**Daily → Regular (Continue):**
```javascript
// HomeScreenManager.js:19-22
continueBtn.addEventListener('click', () => {
    this.hide();  // ✗ That's it!
});

// Game.init() is called on page load, not on Continue
// So game resumes with:
//   ✗ mode still 'daily'
//   ✗ No state reset
```

**Daily → Regular (New Game):**
```javascript
// HomeScreenManager.js:43-59
newGameBtn.addEventListener('click', () => {
    this.hide();
    this.game.newGame();  // ✓ Resets everything
});
```

### Required Cleanup

**When ENTERING daily puzzle:**
```javascript
startDailyPuzzle() {
    // Current:
    this.game.mode = 'daily';
    
    // Should add:
    this.game.stopTimer();  // Ensure timer stopped
    this.game.solutions = [[], []];  // Clear solutions
    // Score stays as-is (daily doesn't use accumulated score)
}
```

**When EXITING daily puzzle:**
```javascript
// In Continue button handler:
continueBtn.addEventListener('click', () => {
    this.game.mode = undefined;  // Clear daily mode
    this.game.generateNewRound();  // Fresh regular game round
    this.hide();
});
```

---

## 7. localStorage Management ✅ ISOLATED

### Regular Game Storage

```javascript
// storage.js
KEY = 'rs2_gameState'
- level
- score
- cards
- dice
- solutions
- timerStartTime
- timerDuration
```

### Daily Puzzle Storage

```javascript
// DailyPuzzleManager.js
KEY = 'dailyPuzzle_YYYY-MM-DD'
- puzzleId
- score
- cubes
- solution

KEY = 'rs2_dailyPuzzleTestMode'
- true/false
```

**Status:** ✅ No conflicts. Separate keys.

---

## 8. Potential Code Duplication

### Checked for Duplication

| Functionality | Finding |
|---------------|---------|
| Validation logic | ✅ Fully shared, no duplication |
| Rendering | ✅ Fully shared, no duplication |
| Scoring | ✅ Different by design |
| Success handling | ✅ Properly divergent (modal vs interstitial) |
| State management | ⚠️ Could be better abstracted |

### No Significant Duplication Found

The codebase has good separation. Daily puzzle uses core game engine without duplicating logic.

---

## 9. Destructive Alterations Check

### Changes to Core Game Files

**`game.js`:**
- ✅ Added `this.mode` property (non-destructive)
- ✅ Added mode checks in timer logic (non-destructive, safe fallback)
- ✅ Added mode to `getState()` (non-destructive)
- ✅ No existing functionality broken

**`UIController.js`:**
- ✅ Added daily puzzle success handling (doesn't affect regular path)
- ✅ Added mode checks for timer display (safe)
- ✅ No existing functionality broken

**`setTheory.js`:**
- ✅ No changes for daily puzzle mode
- ✅ Pattern additions benefit both modes

### Verdict: ✅ No Destructive Changes

All daily puzzle code is additive. Regular game functionality preserved.

---

## 10. Edge Cases to Test

### Mode Transition Sequences

1. **Regular (L7) → Daily → Continue**
   - Expected: Timer starts again in L7
   - Actual: ❌ Timer won't start (mode still 'daily')

2. **Daily → Menu → Continue**
   - Expected: Resume regular game
   - Actual: ⚠️ Resumes but mode is 'daily'

3. **Daily (test) → Daily (test) → ...**
   - Expected: Multiple puzzles work
   - Actual: ✅ Should work (mode stays 'daily')

4. **Regular → Daily → Menu → New Game**
   - Expected: Fresh game
   - Actual: ✅ Works (newGame() resets everything)

---

## 11. Recommendations

### Priority 1: Critical Fixes

1. **Clear mode when exiting daily puzzle**
   ```javascript
   // Add to multiple exit points:
   this.game.mode = undefined;
   ```

2. **Add explicit state reset in startDailyPuzzle()**
   ```javascript
   this.game.stopTimer();
   this.game.solutions = [[], []];
   ```

3. **Add mode reset in Continue button**
   ```javascript
   this.game.mode = undefined;
   this.game.generateNewRound();
   ```

### Priority 2: Improvements

4. **Create `exitDailyPuzzle()` method**
   - Centralize cleanup logic
   - Call from all exit points

5. **Add mode validation in critical paths**
   - Assert mode is correct where expected
   - Log warnings if mode is unexpected

6. **Add integration tests for mode transitions**
   - Test all navigation paths
   - Verify state is clean

---

## 12. Proposed New Methods

### DailyPuzzleManager.exitDailyPuzzle()

```javascript
/**
 * Clean up daily puzzle state and return to regular game
 */
exitDailyPuzzle() {
    console.log('🏁 Exiting daily puzzle mode...');
    
    // Clear mode
    this.game.mode = undefined;
    
    // Clear timer (should already be stopped, but be safe)
    this.game.stopTimer();
    
    // Don't clear solutions - let them see what they did
    
    // Generate fresh round for regular game
    // (only if returning to Continue, not New Game)
    // this.game.generateNewRound();
    
    console.log('✅ Daily puzzle mode exited');
}
```

### Call from all exit points:

```javascript
// UIController.js:315 (after Done in production)
window.dailyPuzzleManager.exitDailyPuzzle();
window.homeScreen.show();

// UIController.js:137 (after Done in already-complete modal)
window.dailyPuzzleManager.exitDailyPuzzle();
window.homeScreen.show();

// Menu button during daily puzzle
window.dailyPuzzleManager.exitDailyPuzzle();
// ... then show menu
```

---

## 13. Testing Checklist

### Mode Transition Tests

- [ ] Regular L1 → Daily → Continue → Verify level 1, mode undefined
- [ ] Regular L7 (timer) → Daily → Continue → Verify timer starts
- [ ] Daily → Done → Continue → Verify regular game resumes correctly
- [ ] Daily → Menu → New Game → Verify fresh start
- [ ] Daily → Menu → Continue → Verify mode cleared
- [ ] Daily (test) → Complete → Next puzzle → Verify stays in daily mode
- [ ] Daily → Menu → Settings → Daily Test Mode toggle → Verify works

### State Validation Tests

- [ ] Mode is undefined after Continue from daily
- [ ] Timer interval is cleared when entering daily
- [ ] Solutions are cleared when starting new mode
- [ ] Score is correct for each mode
- [ ] LocalStorage doesn't conflict

---

## Summary

### What's Good ✅

- Clean separation of validation logic
- No code duplication
- No destructive changes to core game
- localStorage properly isolated
- UI rendering properly shared

### What Needs Fixing 🔴

1. **Mode is never cleared** after daily puzzle (CRITICAL)
2. **State cleanup** is incomplete on mode transitions
3. **Timer won't restart** after daily puzzle due to mode persistence

### Recommendation

**Before merge:** Fix the mode clearing bug in all exit paths. This is the root cause of the timer issue you observed.

---

## Next Steps

1. ✅ Complete this analysis
2. ⏭️ Implement `exitDailyPuzzle()` method
3. ⏭️ Add mode clearing to all exit points
4. ⏭️ Test all mode transition paths
5. ⏭️ Verify timer works after daily puzzle
6. ⏭️ Ready for merge

