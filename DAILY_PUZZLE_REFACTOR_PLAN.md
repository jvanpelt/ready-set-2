# Daily Puzzle Feature - Comprehensive Refactor Plan

**Purpose:** Thorough review and testing of daily puzzle functionality, with focus on state management and mode transitions.

**Critical Issue:** State bleeding between game modes (e.g., level 7 timer appearing in daily puzzle)

---

## 1. State Management & Mode Transitions 🔴 HIGH PRIORITY

### A. Game State Reset on Mode Change

**Problem:** Game state from regular mode carries over to daily puzzle mode

**Files to Review:**
- `js/game.js` - `startDailyPuzzle()`, `startNewGame()`, `reset()`
- `js/DailyPuzzleManager.js` - `startDailyPuzzle()`
- `js/ui/UIController.js` - Mode transition handlers

**Check:**
- [ ] Timer cleared when entering daily puzzle
- [ ] Timer cleared when exiting daily puzzle
- [ ] Level-specific state reset (restrictions, rows, etc.)
- [ ] Score properly initialized/reset
- [ ] Previous dice/cards cleared
- [ ] Previous solutions cleared
- [ ] Animation states reset

**Test Cases:**
```
1. Regular game → Daily puzzle
   - Start at level 7
   - Click "Daily Puzzle"
   - Verify: No timer, both rows enabled, score starts at 0
   
2. Daily puzzle → Regular game
   - Complete daily puzzle
   - Return to home → Continue game
   - Verify: Timer present if level 6+, correct rows enabled, accumulated score preserved
   
3. Daily puzzle → Daily puzzle (same day)
   - Complete puzzle
   - Click "Done" → returns to home
   - Click "Daily Puzzle" again
   - Verify: Modal shows immediately, no game state loaded
```

---

### B. Solution Row Management

**Issue:** Daily puzzles need both rows, but regular game varies by level

**Files:**
- `js/game.js` - `restrictionsEnabled` logic
- `js/ui/UIRenderer.js` - Row rendering/disabling

**Check:**
- [ ] Daily puzzle: ALWAYS both rows enabled
- [ ] Regular game level 1-5: Top row disabled
- [ ] Regular game level 6+: Both rows enabled
- [ ] Transitions preserve correct row state
- [ ] No flickering/re-rendering on mode switch

---

### C. Timer Management

**Issue:** Timer from level 7+ appears in daily puzzle

**Files:**
- `js/game.js` - Timer start/stop/clear
- `js/ui/UIController.js` - Timer display

**Check:**
- [ ] Timer NEVER starts in daily puzzle mode
- [ ] Timer cleared when entering daily puzzle
- [ ] Timer properly restored when returning to regular game
- [ ] `clearInterval` called on mode change
- [ ] Timer state in `game` object properly managed

**Specific Code to Review:**
```javascript
// In game.js
this.timer = ...  // Where is this set?
this.startTimer() // When is this called?
this.stopTimer()  // Is this called on mode change?

// In UIController
this.updateTimer() // Is this checking mode?
```

---

## 2. Shared Functionality Review

### A. Solution Validation

**Both modes use:**
- `game.validateSolution()`
- `setTheory.evaluateExpression()`
- `setTheory.evaluateRestriction()`
- `setTheory.isValidSyntax()`
- `setTheory.isValidRestriction()`

**Check:**
- [ ] Validation works correctly in daily puzzle mode
- [ ] All 65 RESTRICTION_PATTERNS recognized
- [ ] All 25 SETNAME_PATTERNS recognized
- [ ] No mode-specific bugs in validation

**Test:** Run same solution in both modes, verify same result

---

### B. Dice/Card Interaction

**Shared:**
- Drag and drop
- Click to solution area
- Removal from solution area
- Solution helper (dimming/flipping)

**Check:**
- [ ] All interactions work in daily puzzle
- [ ] Solution helper works correctly
- [ ] `game.cardStates` properly updated
- [ ] No performance issues
- [ ] Touch interactions work on mobile

---

### C. Score Calculation

**Different behavior:**
- Regular: Accumulated across levels, target score
- Daily: Single puzzle score, no target

**Files:**
- `js/game.js` - `calculateScore()`, `getCurrentDailyScore()`
- `js/ui/UIRenderer.js` - `updateStatusBar()`

**Check:**
- [ ] Regular game: Shows "XXX/500" format
- [ ] Daily puzzle: Shows dynamic calculated score (no "/?" part)
- [ ] Score updates correctly as dice added/removed in daily
- [ ] Score calculation uses same base logic

---

## 3. UI/UX Flow Testing

### A. Navigation Paths

Test all possible navigation paths:

```
1. Home → Daily Puzzle → Complete → Done → Home ✓
2. Home → Daily Puzzle → Complete → Share → Done → Home ✓
3. Home → Daily Puzzle (already complete) → Modal → Share/Done ✓
4. Home → Play → Continue → Home → Daily Puzzle ✓
5. Level X → Menu → Daily Puzzle → Complete → Menu → Continue ✓
6. Daily Puzzle → Menu → Play → New Game ✓
```

**Check for each path:**
- [ ] No state bleeding
- [ ] Correct UI elements visible
- [ ] Animations smooth
- [ ] No console errors
- [ ] Mobile works correctly

---

### B. Modal Management

**Modals in daily puzzle flow:**
- Daily puzzle result modal
- Share toast
- Settings modal (from daily puzzle)

**Check:**
- [ ] Result modal shows correct data
- [ ] Result modal dismisses properly
- [ ] Cards/dice visible behind modal with blur
- [ ] Share button works (mobile & desktop)
- [ ] Toast appears and fades correctly
- [ ] Settings accessible from daily puzzle
- [ ] Test mode toggle works
- [ ] Clear puzzle button works

---

### C. Local Storage Management

**Daily puzzle uses localStorage for:**
- Completion status (key: `dailyPuzzle_YYYY-MM-DD`)
- Test mode preference
- Regular game uses localStorage for game state/settings

**Check:**
- [ ] Daily completion saved correctly
- [ ] Completion prevents replay (non-test mode)
- [ ] Test mode persists across sessions
- [ ] Clear button removes correct entry
- [ ] No conflicts with game save data
- [ ] Works in private/incognito mode

---

## 4. Edge Cases & Error Handling

### A. Missing/Invalid Data

**Scenarios:**
- [ ] Puzzle data fails to load
- [ ] Puzzle data is corrupted
- [ ] No puzzles available (empty bank)
- [ ] Decoding fails (encoded puzzle)

**Expected Behavior:**
- Graceful error messages
- Fallback to home screen
- Console logging for debugging
- No crashes

---

### B. Date/Time Edge Cases

**Scenarios:**
- [ ] Midnight rollover (11:59 PM → 12:00 AM)
- [ ] Timezone changes (travel, DST)
- [ ] System clock manipulation
- [ ] Leap day (Feb 29)

**Expected Behavior:**
- Puzzle changes at midnight local time
- Previous day's puzzle becomes inaccessible (non-test mode)
- Test mode unaffected by date

---

### C. Browser/Device Variations

**Test on:**
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Tablet (if available)

**Check:**
- Touch interactions
- Drag and drop
- Share API availability
- Clipboard API fallback
- LocalStorage access
- Modal display
- Backdrop blur support

---

## 5. Performance & Polish

### A. Render Frequency

**Already tracked but verify:**
- [ ] Cards only render on interaction
- [ ] Solution helper doesn't cause excessive renders
- [ ] No unnecessary re-renders on state changes
- [ ] Animation performance smooth (60fps)

---

### B. Memory Leaks

**Check:**
- [ ] Event listeners cleaned up on mode change
- [ ] `setInterval`/`setTimeout` cleared
- [ ] No zombie intervals from timer
- [ ] References properly released

---

### C. Console Logs

**Before merge:**
- [ ] Remove or comment noisy debug logs
- [ ] Keep critical warnings/errors
- [ ] Ensure no sensitive data logged
- [ ] Test with "verbose" logs off

---

## 6. Code Quality

### A. Linter Errors

**Files to check:**
- [ ] All JS files in daily puzzle feature
- [ ] No new linter errors introduced
- [ ] Consistent code style
- [ ] No unused variables/imports

---

### B. Code Comments

**Review:**
- [ ] Complex logic well-commented
- [ ] Why, not just what
- [ ] No outdated comments
- [ ] TODOs resolved or documented

---

### C. Function Naming & Organization

**Check:**
- [ ] Clear, descriptive names
- [ ] Single responsibility
- [ ] No duplicate code between modes
- [ ] Shared code properly abstracted

---

## 7. Data Integrity

### A. Puzzle Data

**Verify:**
- [ ] All 1461 puzzles have solution counts
- [ ] Distribution matches target (14.3%, 19%, 19%, 19%, 14.3%, 9.5%, 4.8%)
- [ ] No puzzles marked as "failed"
- [ ] Encoding/decoding works correctly
- [ ] File size reasonable (~1.2MB)

---

### B. Pattern Coverage

**Verify:**
- [ ] 65 RESTRICTION_PATTERNS in `setTheory.js`
- [ ] 25 SETNAME_PATTERNS in `setTheory.js`
- [ ] All patterns mathematically valid
- [ ] All patterns physically possible
- [ ] Test puzzles use covered patterns

---

## 8. Documentation

**Ensure complete:**
- [ ] CLEAN_GENERATION_WORKFLOW.md accurate
- [ ] DAILY_PUZZLE_GENERATION.md accurate
- [ ] Code comments up to date
- [ ] README mentions daily puzzle feature
- [ ] CLAUDE.md updated if needed

---

## 9. Git & Deployment

### Before Merge:

- [ ] All temp files deleted
- [ ] Commit history clean
- [ ] Version bumped to v4.18.0
- [ ] Comprehensive commit message
- [ ] No merge conflicts

### Merge Checklist:

- [ ] User approval obtained
- [ ] Branch up to date with main
- [ ] Merge `feature/daily-puzzle` → `main`
- [ ] Push to origin
- [ ] Test production
- [ ] Delete feature branch

---

## Priority Order

**Critical (must fix before merge):**
1. Timer bleeding into daily puzzle
2. State reset on mode transitions
3. Solution row management
4. Navigation flow testing

**High (should fix):**
1. All edge cases
2. Browser compatibility
3. Error handling
4. Performance issues

**Medium (nice to have):**
1. Code comments
2. Linter cleanup
3. Console log cleanup

**Low (can defer):**
1. Minor polish
2. Documentation tweaks

---

## Testing Protocol

For each critical issue:
1. **Reproduce** the bug
2. **Identify** root cause
3. **Fix** the code
4. **Test** the fix
5. **Test** related functionality (regression)
6. **Document** the fix

---

## Sign-off Criteria

✅ All critical issues resolved  
✅ No console errors in normal use  
✅ Works on desktop & mobile  
✅ State transitions clean  
✅ User can complete full flow without issues  
✅ Code quality acceptable  
✅ Documentation accurate  

**Only then:** Ready to merge to main.

