# TimerManager Integration Plan

## Status: IN PROGRESS (Commits: 317a335, a4abcd9)

## What's Done ✅

1. **Created `js/TimerManager.js`** - Complete, clean timer management class
   - `startFresh()` - Start new timer (Pass/Submit/Tutorial)
   - `restoreFromSave()` - Restore from savedState (Continue)
   - `stop(clearData)` - Stop timer (clearData=true wipes, false preserves)
   - `getStateData()` - Returns {timerStartTime, timerDuration} for saving
   - Auto-save listeners built-in

2. **Cleaned up `game.js`** - Removed ALL timer code
   - Removed: `startTimer()`, `stopTimer()`, `handleTimeout()`, `setupAutoSaveListeners()`
   - Removed: `timeRemaining`, `timerInterval`, `timerStartTime`, `timerDuration`, `onTimerTick`, `onTimeout`
   - Added: `this.timer` (will be set by main.js)
   - Updated: `pass()`, `correctPass()`, `enterRegularMode()`, `enterDailyMode()` to use `this.timer`
   - Updated: `saveState()` and `getState()` to use `this.timer.getStateData()`

## What's Left TODO

### Step 1: Wire up TimerManager in main.js

```javascript
// In main.js, after creating game instance:

import { TimerManager } from './TimerManager.js';

const game = new Game();

// Create TimerManager with callbacks
game.timer = new TimerManager(
    game,
    game.storage,
    (timeRemaining) => {
        // Update UI
        if (window.uiController) {
            window.uiController.updateTimer(timeRemaining);
        }
    },
    () => {
        // Handle timeout
        if (window.uiController) {
            window.uiController.handleTimeout();
        }
    }
);
```

### Step 2: Update UIController to use TimerManager

**Remove these methods:**
- `startTimerIfNeeded()` - replaced by `game.timer.startFresh()`
- `startRestoredTimer()` - replaced by `game.timer.restoreFromSave(savedState)`
- All the callback handlers (`handleContinueFromHome`, etc) - replaced by direct calls

**Update these methods:**
- `handleContinueFromHome()` → call `game.timer.restoreFromSave(savedState)`
- `handleConfirmedPass()` → call `game.timer.startFresh()` at end
- `handleCorrectPass()` → call `game.timer.startFresh()` at end
- `handleTutorialComplete()` → call `game.timer.startFresh()`
- `handleLevelAdvanced()` → call `game.timer.startFresh()`
- `handleNewRoundAfterSubmit()` → call `game.timer.startFresh()`

**Keep these:**
- `updateTimer(timeRemaining)` - still updates UI
- `handleTimeout()` - still handles timeout

**Remove:**
- Wire-up of `onTimerTick` and `onTimeout` (now in main.js)

### Step 3: Update HomeScreenManager

```javascript
// In Continue button click handler:
handleContinueFromHome() {
    // Get saved state
    const savedState = this.game.storage.loadGameState();
    
    // Restore timer if data exists
    if (savedState && savedState.timerStartTime && savedState.timerDuration) {
        this.game.timer.restoreFromSave({
            timerStartTime: savedState.timerStartTime,
            timerDuration: savedState.timerDuration
        });
    }
}
```

### Step 4: Test Plan

1. **Fresh Start (Level 7)**
   - Jump to Level 7
   - Skip tutorial
   - Timer should start at 30s and tick ✓
   
2. **Pass Button**
   - Click Pass
   - New round loads
   - Timer should start at 30s and tick ✓

3. **Submit Button**
   - Solve puzzle
   - New round loads
   - Timer should start at 30s and tick ✓

4. **Refresh (Active Timer)**
   - Let timer tick down to ~15s
   - Refresh page
   - Click Continue Level 7
   - Timer should restore at ~14-15s and continue ticking ✓

5. **Timeout**
   - Let timer hit 0
   - Timeout modal should show ✓
   - New round after timeout
   - Timer should start fresh at 30s ✓

6. **Tutorial Completion**
   - Complete Level 7 tutorial
   - Timer should start at 30s and tick ✓

7. **Daily Puzzle**
   - Switch to daily puzzle
   - No timer should be visible ✓
   - Return to regular game
   - Timer should resume if Level 7+ ✓

## Benefits of TimerManager

1. **Single Source of Truth** - All timer state in one place
2. **No Callbacks** - TimerManager owns the callbacks
3. **Clean Separation** - Game logic knows nothing about timers
4. **Auto-save Built-in** - No manual save() calls needed
5. **Easier Testing** - Can test TimerManager independently
6. **No More Bugs** - No conflicting timer starts/stops

## File Changes Required

- [x] `js/TimerManager.js` - Created
- [x] `js/game.js` - Cleaned up
- [ ] `js/main.js` - Wire up TimerManager
- [ ] `js/ui/UIController.js` - Use TimerManager methods
- [ ] `js/ui/HomeScreenManager.js` - Call timer.restoreFromSave()
- [ ] `js/ui/ModalManager.js` - Remove timer logic
- [ ] `js/ui/TutorialManager.js` - Remove timer logic
- [ ] `index.html` - Bump version to v4.23.0
- [ ] `js/main.js` - Bump version to v4.23.0

