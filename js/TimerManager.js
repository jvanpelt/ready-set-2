/**
 * TimerManager - Single source of truth for all timer logic
 * 
 * Responsibilities:
 * - Start/stop/restore timers
 * - Auto-save timer state
 * - Know when to start based on game context
 */

import { getLevelConfig } from './levels.js';

export class TimerManager {
    constructor(game, storage, onTick, onTimeout) {
        this.game = game;
        this.storage = storage;
        this.onTick = onTick;      // Callback to update UI
        this.onTimeout = onTimeout; // Callback when timer expires
        
        // Timer state
        this.timeRemaining = null;
        this.timerInterval = null;
        this.timerStartTime = null;  // Timestamp when timer started (for persistence)
        this.timerDuration = null;   // Original duration (for persistence)
        
        // Setup auto-save on page unload
        this.setupAutoSave();
    }
    
    /**
     * Start a fresh timer (e.g., new round, pass, submit)
     */
    startFresh() {
        // Don't start in daily mode
        if (this.game.mode === 'daily') {
            console.log('⏱️ [TimerManager] Skipping timer (daily mode)');
            return;
        }
        
        const config = getLevelConfig(this.game.level, this.storage.loadSettings().testMode);
        
        if (!config.timeLimit) {
            console.log('⏱️ [TimerManager] No time limit for this level');
            return;
        }
        
        console.log(`⏱️ [TimerManager] Starting fresh timer (${config.timeLimit}s)`);
        this._start(config.timeLimit, false);
    }
    
    /**
     * Restore timer from saved state (e.g., continue from home screen)
     */
    restoreFromSave(savedTimerData) {
        if (!savedTimerData || !savedTimerData.timerStartTime || !savedTimerData.timerDuration) {
            console.log('⏱️ [TimerManager] No timer data to restore');
            return;
        }
        
        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - savedTimerData.timerStartTime) / 1000);
        const remaining = savedTimerData.timerDuration - elapsed;
        
        if (remaining <= 0) {
            console.log('⏱️ [TimerManager] Saved timer already expired');
            // Timer expired while away - trigger timeout
            if (this.onTimeout) {
                this.onTimeout();
            }
            return;
        }
        
        console.log(`⏱️ [TimerManager] Restoring timer:`);
        console.log(`  - Original duration: ${savedTimerData.timerDuration}s`);
        console.log(`  - Elapsed: ${elapsed}s`);
        console.log(`  - Remaining: ${remaining}s`);
        
        // Restore original start time and duration (for future saves)
        this.timerStartTime = savedTimerData.timerStartTime;
        this.timerDuration = savedTimerData.timerDuration;
        
        this._start(remaining, true);
    }
    
    /**
     * Stop the timer (e.g., timeout, level change, mode switch)
     * @param {boolean} clearData - If true, wipes timer data. If false, keeps it for restoration.
     */
    stop(clearData = true) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (clearData) {
            console.log('⏱️ [TimerManager] Stopping and clearing timer data');
            this.timeRemaining = null;
            this.timerStartTime = null;
            this.timerDuration = null;
            this.save(); // Persist the cleared state
        } else {
            console.log('⏱️ [TimerManager] Pausing timer (keeping data for restoration)');
            // Don't clear data - keeps timerStartTime/timerDuration for restoration
            this.save();
        }
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
        
        // Only set fresh start time if NOT restoring
        if (!isRestoration) {
            this.timerStartTime = Date.now();
            this.timerDuration = seconds;
        }
        
        // Tick immediately to update UI
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
            
            if (this.timeRemaining <= 0) {
                this.stop(true);
                if (this.onTimeout) {
                    this.onTimeout();
                }
            }
        }, 1000);
        
        // Save immediately with timer data
        this.save();
    }
    
    /**
     * Save timer state to localStorage
     */
    save() {
        // Timer manager doesn't save full game state - just timer data
        // The game's saveState() will call this to get current timer data
        console.log('⏱️ [TimerManager] Timer data:', {
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration,
            timeRemaining: this.timeRemaining
        });
    }
    
    /**
     * Get current timer data for saving to game state
     */
    getStateData() {
        return {
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration
        };
    }
    
    /**
     * Setup auto-save on page unload
     */
    setupAutoSave() {
        window.addEventListener('beforeunload', () => {
            console.log('💾 [TimerManager] Auto-save on page unload');
            this.save();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('💾 [TimerManager] Auto-save on tab hidden');
                this.save();
            }
        });
        
        window.addEventListener('blur', () => {
            console.log('💾 [TimerManager] Auto-save on window blur');
            this.save();
        });
    }
}

