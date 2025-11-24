/**
 * TimerManager - Centralized timer logic
 * 
 * Architecture:
 * - TimerManager handles all timer state and operations (start/stop/save/restore)
 * - UIController orchestrates WHEN timers should start (knows game flow + UI state)
 * - Game.js is timer-agnostic (no timer logic)
 * 
 * Timer Start Flow:
 * 1. User action triggers game event (submit, pass, level up, tutorial complete)
 * 2. UIController checkpoint method called (handleNewRoundAfterSubmit, etc.)
 * 3. Checkpoint calls timer.startFresh() if appropriate
 * 
 * Timer Persistence:
 * - Saves timeRemaining (not wall-clock) on blur/visibility/beforeunload
 * - Restores from timeRemaining on Continue
 * - Timer pauses when home screen visible (doesn't count that time)
 * - Tutorial timer state is never saved (temporary)
 */

import { getLevelConfig } from './levels.js';

export class TimerManager {
    constructor(game, storage, onTick, onTimeout) {
        this.game = game;
        this.storage = storage;
        this.onTick = onTick;      // Callback to update UI display
        this.onTimeout = onTimeout; // Callback when timer expires
        
        // Timer state
        this.timeRemaining = null;
        this.timerInterval = null;
        this.timerStartTime = null;  // For calculating fresh timeRemaining
        this.timerDuration = null;   // Original duration for reference
        
        this.setupAutoSave();
    }
    
    /**
     * Start a fresh timer for a new round
     */
    startFresh() {
        // Don't start timer in daily puzzle mode
        if (this.game.mode === 'daily') {
            return;
        }
        
        const config = getLevelConfig(this.game.level, this.storage.loadSettings().testMode);
        
        if (!config.timeLimit) {
            return; // This level doesn't have a timer
        }
        
        this._start(config.timeLimit, false);
    }
    
    /**
     * Restore timer from saved state (used when continuing from home screen)
     */
    restoreFromSave(savedTimerData) {
        if (!savedTimerData || !savedTimerData.timeRemaining) {
            return;
        }
        
        const remaining = savedTimerData.timeRemaining;
        
        if (remaining <= 0) {
            // Timer expired while player was away
            if (this.onTimeout) {
                this.onTimeout();
            }
            return;
        }
        
        // Start timer with saved remaining time
        this.timerDuration = savedTimerData.timerDuration || remaining;
        this._start(remaining, true);
    }
    
    /**
     * Stop the timer
     * @param {boolean} clearData - If true, clears timer data and saves. If false, pauses without saving.
     */
    stop(clearData = true) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (clearData) {
            this.timeRemaining = null;
            this.timerStartTime = null;
            this.timerDuration = null;
            this.save(); // Persist cleared state
        }
        // If clearData is false, we're pausing for state restoration
        // Don't save here - saved data is already in localStorage
    }
    
    /**
     * Internal: Start the timer interval
     */
    _start(seconds, isRestoration) {
        // Clear any existing interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timeRemaining = seconds;
        
        // Set start time and duration (for calculating fresh timeRemaining on save)
        if (!isRestoration) {
            this.timerStartTime = Date.now();
            this.timerDuration = seconds;
        }
        
        // Update UI immediately
        if (this.onTick) {
            this.onTick(this.timeRemaining);
        }
        
        // Start ticking every second
        this.timerInterval = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
            }
            
            if (this.onTick) {
                this.onTick(this.timeRemaining);
            }
            
            // Timer expired
            if (this.timeRemaining <= 0) {
                this.stop(true);
                if (this.onTimeout) {
                    this.onTimeout();
                }
            }
        }, 1000);
        
        // Save immediately with new timer data
        this.save();
    }
    
    /**
     * Save timer state to localStorage
     */
    save() {
        if (this.game && this.game.saveState) {
            this.game.saveState();
        }
    }
    
    /**
     * Get current timer data for saving
     */
    getStateData() {
        // Don't save tutorial timer state (tutorials are temporary)
        if (this.game.isTutorialActive) {
            return {
                timeRemaining: null,
                timerDuration: null
            };
        }
        
        return {
            timeRemaining: this.timeRemaining,
            timerDuration: this.timerDuration
        };
    }
    
    /**
     * Check if timer has been started and should be saved
     */
    _shouldSave() {
        return this.timeRemaining !== null || this.timerInterval !== null;
    }
    
    /**
     * Setup auto-save listeners for page unload/blur
     */
    setupAutoSave() {
        // Save before page closes
        window.addEventListener('beforeunload', () => {
            if (this._shouldSave() && this.game && this.game.saveState) {
                this.game.saveState();
            }
        });
        
        // Save when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this._shouldSave()) {
                this.save();
            }
        });
        
        // Save when window loses focus
        window.addEventListener('blur', () => {
            if (this._shouldSave()) {
                this.save();
            }
        });
    }
}
