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
        console.log('⏱️ [TimerManager] startFresh() called');
        console.log('   Game mode:', this.game.mode);
        console.log('   Current level:', this.game.level);
        
        // Don't start in daily mode
        if (this.game.mode === 'daily') {
            console.log('⏱️ [TimerManager] Skipping timer (daily mode)');
            return;
        }
        
        const config = getLevelConfig(this.game.level, this.storage.loadSettings().testMode);
        console.log('   Level config:', config);
        
        if (!config.timeLimit) {
            console.log('⏱️ [TimerManager] No time limit for this level');
            return;
        }
        
        console.log(`⏱️ [TimerManager] Starting fresh timer (${config.timeLimit}s)`);
        this._start(config.timeLimit, false);
        console.log('⏱️ [TimerManager] Timer started, timeRemaining:', this.timeRemaining);
    }
    
    /**
     * Restore timer from saved state (e.g., continue from home screen)
     */
    restoreFromSave(savedTimerData) {
        if (!savedTimerData || !savedTimerData.timeRemaining) {
            console.log('⏱️ [TimerManager] No timer data to restore');
            return;
        }
        
        const remaining = savedTimerData.timeRemaining;
        
        if (remaining <= 0) {
            console.log('⏱️ [TimerManager] Saved timer already expired');
            // Timer expired while away - trigger timeout
            if (this.onTimeout) {
                this.onTimeout();
            }
            return;
        }
        
        console.log(`⏱️ [TimerManager] Restoring timer with ${remaining}s remaining`);
        
        // Start a FRESH timer with the saved remaining time
        // This ensures time spent on home screen doesn't count against the timer
        this.timerDuration = savedTimerData.timerDuration || remaining; // Keep original duration for reference
        
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
            console.log('⏱️ [TimerManager] Pausing timer (NOT saving - will restore from saved data)');
            // Don't clear data AND don't save
            // Saved data is already in localStorage from last save
            // If we saved here, we'd overwrite good data with null
        }
    }
    
    /**
     * Internal: Start the timer interval
     */
    _start(seconds, isRestoration) {
        console.log(`⏱️ [TimerManager] _start() called with ${seconds}s, isRestoration: ${isRestoration}`);
        
        // Clear any existing interval
        if (this.timerInterval) {
            console.log('   Clearing existing interval');
            clearInterval(this.timerInterval);
        }
        
        this.timeRemaining = seconds;
        
        // Only set fresh start time if NOT restoring
        if (!isRestoration) {
            this.timerStartTime = Date.now();
            this.timerDuration = seconds;
            console.log('   Set fresh start time and duration');
        }
        
        // Tick immediately to update UI
        if (this.onTick) {
            console.log('   Calling onTick immediately');
            this.onTick(this.timeRemaining);
        }
        
        // Start ticking every second
        console.log('   Setting up setInterval');
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
        // Trigger game.saveState() to persist timer data
        console.log('⏱️ [TimerManager] Saving timer data:', {
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration,
            timeRemaining: this.timeRemaining
        });
        
        // Call game.saveState() which will call getStateData() to include timer
        if (this.game && this.game.saveState) {
            this.game.saveState();
        }
    }
    
    /**
     * Get current timer data for saving to game state
     */
    getStateData() {
        console.log(`⏱️ [TimerManager] getStateData() called:`, {
            timeRemaining: this.timeRemaining,
            timerDuration: this.timerDuration,
            timerInterval: this.timerInterval ? 'ACTIVE' : 'null'
        });
        
        return {
            timeRemaining: this.timeRemaining,  // Save actual remaining time (not wall-clock)
            timerDuration: this.timerDuration   // Keep for reference
        };
    }
    
    /**
     * Setup auto-save on page unload
     */
    setupAutoSave() {
        // Use beforeunload to save synchronously before page closes
        window.addEventListener('beforeunload', (e) => {
            // Only save if timer has been started (don't overwrite saved data with null)
            if (this.timeRemaining !== null || this.timerInterval !== null) {
                console.log('💾 [TimerManager] BEFOREUNLOAD - Saving timer synchronously');
                // Call game.saveState() synchronously
                if (this.game && this.game.saveState) {
                    this.game.saveState();
                }
            } else {
                console.log('⏸️ [TimerManager] Skipping beforeunload save - timer never started');
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Only save if timer has been started (don't overwrite saved data with null)
                if (this.timeRemaining !== null || this.timerInterval !== null) {
                    console.log('💾 [TimerManager] Auto-save on tab hidden');
                    this.save();
                } else {
                    console.log('⏸️ [TimerManager] Skipping auto-save - timer never started');
                }
            }
        });
        
        window.addEventListener('blur', () => {
            // Only save if timer has been started (don't overwrite saved data with null)
            if (this.timeRemaining !== null || this.timerInterval !== null) {
                console.log('💾 [TimerManager] Auto-save on window blur');
                this.save();
            } else {
                console.log('⏸️ [TimerManager] Skipping auto-save - timer never started');
            }
        });
    }
}

