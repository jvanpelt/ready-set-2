# Timer Flow Analysis - v4.22.37

## PROBLEM: Timer starts on page load (before clicking Continue)

## Current Code Flow

### 1. Page Load → Game.init()
- Loads saved state
- Sets `this.timeRemaining = 27` (from saved data)
- Does NOT start timer interval
- ✅ CORRECT

### 2. UIController.init() (lines 55-65)
```javascript
// Wire up timer callbacks
this.game.onTimerTick = (timeRemaining) => {
    this.updateTimer(timeRemaining);
};

// If timer was paused (restored from saved state), start it now
if (this.game.timeRemaining !== null && this.game.timerInterval === null) {
    this.game.startTimer(this.game.timeRemaining, true);
}
```
- ❌ BUG: Starts timer IMMEDIATELY on page load
- User is still on HOME SCREEN
- Timer ticks in background

### 3. User Clicks "Continue" → HomeScreenManager → game.enterRegularMode()
```javascript
enterRegularMode() {
    // ... load saved state ...
    this.restoreFromSavedState(savedState);
    
    // Start timer if timeRemaining was set
    if (this.timeRemaining !== null && this.timerInterval === null && this.onTimerTick) {
        this.startTimer(this.timeRemaining, true);
    }
}
```
- ⚠️ REDUNDANT: Timer already started in step 2
- But this is where it SHOULD start

### 4. User Clicks "Pass" → game.pass() → game.resetRound() → game.generateNewRound()
```javascript
generateNewRound() {
    // ... generate cards/dice ...
    
    const tutorialViewed = this.storage.hasTutorialBeenViewed(this.level);
    const hasInterstitial = this.level >= 7 && !tutorialViewed;
    
    if (config.timeLimit && !hasInterstitial) {
        this.startTimer(config.timeLimit); // ❌ BUG: tutorialViewed is FALSE
    }
}
```
- ❌ BUG: `hasTutorialBeenViewed(7)` returns FALSE
- Because tutorial marking is now working (v4.22.35)
- But user already completed tutorial on first round
- So timer SHOULD start, but doesn't because hasInterstitial=true

## ROOT CAUSES

1. **UIController auto-starts timer on page load** (before Continue clicked)
2. **Tutorial viewed status is per-session, not per-puzzle**
   - First round after completing tutorial: marked as viewed ✅
   - Refresh page: marked as viewed ✅
   - Pass/Submit new round: STILL marked as viewed ✅
   - BUT generateNewRound() rechecks `hasTutorialBeenViewed(7)` and it's TRUE
   - So hasInterstitial should be FALSE
   - So timer SHOULD start

Wait... let me check if tutorial marking persists...

## HYPOTHESIS

The tutorial marking IS persisting (we uncommented it in v4.22.35).
So `hasTutorialBeenViewed(7)` should return TRUE after first completion.
So `hasInterstitial` should be FALSE.
So timer SHOULD start in generateNewRound().

The user says timer doesn't tick after Pass/Submit.
Let me ask for those specific logs.

