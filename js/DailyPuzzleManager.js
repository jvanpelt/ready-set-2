/**
 * DailyPuzzleManager - Manages daily puzzle mode state and UI
 * 
 * Features:
 * - Loads daily puzzles (date-based or test mode)
 * - Tracks completion status
 * - Coordinates with game engine
 * - Manages UI state transitions
 */

import DailyPuzzleGenerator from './DailyPuzzleGenerator.js';
import { decodePuzzle } from './puzzleCodec.js';

class DailyPuzzleManager {
    constructor(game, uiController, settings = {}) {
        this.game = game;
        this.uiController = uiController;
        this.generator = new DailyPuzzleGenerator();
        
        // Test mode: load from localStorage
        this.testMode = localStorage.getItem('rs2_dailyPuzzleTestMode') === 'true';
        
        // Current puzzle
        this.currentPuzzle = null;
        
        // Puzzle bank (loaded from JSON)
        this.puzzleBank = null;
        this.puzzleBankEncoded = false; // Whether puzzle data is encoded
        
        // Load puzzle bank
        this.loadPuzzleBank();
    }
    
    /**
     * Load puzzle bank from JSON file
     */
    async loadPuzzleBank() {
        try {
            // Load from test set if in any test mode
            const filename = this.testMode 
                ? 'data/daily-puzzles-test.json' 
                : 'data/daily-puzzles.json';
            
            // Add cache busting to ensure fresh puzzle data
            const cacheBust = window.cacheBust || Date.now();
            const response = await fetch(`${filename}?v=${cacheBust}`);
            const data = await response.json();
            
            // Handle both array format and {puzzles: []} format
            this.puzzleBank = Array.isArray(data) ? data : data.puzzles;
            
            // Check if puzzles are encoded
            this.puzzleBankEncoded = data.encoded === true;
            
            console.log(`✅ Loaded ${this.puzzleBank.length} puzzles from ${filename}`);
            if (this.puzzleBankEncoded) {
                console.log('🔒 Puzzle data is encoded');
            }
            
            if (this.testMode === 'systematic') {
                console.log(`📊 Testing Progress: ${this.testingProgress.tested.length}/${this.puzzleBank.length} puzzles tested`);
            }
        } catch (error) {
            console.error('❌ Failed to load puzzle bank:', error);
            // Fallback to runtime generation if file doesn't load
            this.puzzleBank = null;
        }
    }
    
    /**
     * Get today's puzzle (or random in test mode)
     */
    getTodaysPuzzle() {
        // If puzzle bank isn't loaded yet, generate one (fallback)
        if (!this.puzzleBank || this.puzzleBank.length === 0) {
            console.warn('⚠️ Puzzle bank not loaded, generating puzzle at runtime');
            return this.generator.generatePuzzle();
        }
        
        let puzzle;
        
        if (this.testMode) {
            // TEST MODE: Random puzzle each time
            const randomIndex = Math.floor(Math.random() * this.puzzleBank.length);
            console.log(`🎲 Test mode: Loading random puzzle #${this.puzzleBank[randomIndex].id}/${this.puzzleBank.length}`);
            puzzle = this.puzzleBank[randomIndex];
        } else {
            // PRODUCTION MODE: Date-based deterministic puzzle
            const puzzleIndex = this.getPuzzleIndexForToday();
            puzzle = this.puzzleBank[puzzleIndex];
            console.log(`📅 Production mode: Loading puzzle #${puzzle.id} for today (index ${puzzleIndex})`);
        }
        
        // Decode if encoded
        if (this.puzzleBankEncoded) {
            return decodePuzzle(puzzle);
        }
        
        return puzzle;
    }
    
    /**
     * Set test mode on/off
     */
    async setTestMode(enabled) {
        this.testMode = enabled;
        localStorage.setItem('rs2_dailyPuzzleTestMode', enabled.toString());
        console.log(`🎲 Daily Puzzle Test Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        
        // Reload puzzle bank for correct file
        await this.loadPuzzleBank();
    }
    
    
    /**
     * Start daily puzzle mode
     */
    async startDailyPuzzle() {
        console.log('🎯 Starting Daily Puzzle mode...');
        
        // Ensure puzzle bank is loaded before proceeding
        if (!this.puzzleBank) {
            console.log('⏳ Waiting for puzzle bank to load...');
            await this.loadPuzzleBank();
        }
        
        // In non-test mode, check if today's puzzle is already complete
        if (!this.testMode && this.isTodaysPuzzleComplete()) {
            const completion = this.getTodayCompletion();
            console.log('✅ Today\'s puzzle already completed!');
            
            // Show the result modal again (so they can re-share)
            this.uiController.modals.showDailyPuzzleResult({
                puzzleId: completion.puzzleId,
                score: completion.score,
                cubes: completion.cubes,
                solution: completion.solution
            }, () => {
                // Return to home (will let user choose what to do next)
                if (window.homeScreen) {
                    window.homeScreen.show();
                }
            });
            
            return; // Don't load the puzzle
        }
        
        // Generate/load puzzle
        const puzzle = this.getTodaysPuzzle();
        this.currentPuzzle = puzzle;
        
        // Log for debugging
        this.generator.logPuzzle(puzzle);
        
        // Enter daily mode (handles all state setup)
        this.game.enterDailyMode(puzzle);
        
        // Hide home screen and show game
        if (window.homeScreen) {
            window.homeScreen.hide();
        }
        
        // Render the game
        this.uiController.render({ animate: true });
        
        console.log('✅ Daily Puzzle loaded!');
    }
    
    /**
     * Get puzzle index for today (deterministic based on date)
     */
    getPuzzleIndexForToday() {
        // Epoch: 2025-01-01 00:00:00 UTC (obscured as Unix timestamp in ms)
        const epoch = 1735689600000; // new Date('2025-01-01T00:00:00Z').getTime()
        
        // Get today at midnight local time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate days since epoch
        const msPerDay = 86400000; // 1000 * 60 * 60 * 24
        const daysSinceEpoch = Math.floor((today.getTime() - epoch) / msPerDay);
        
        // Handle negative days (before epoch) - use modulo that wraps properly
        // JavaScript's % returns negative for negative numbers, so we normalize it
        const index = ((daysSinceEpoch % this.puzzleBank.length) + this.puzzleBank.length) % this.puzzleBank.length;
        
        return index;
    }
    
    /**
     * Get today's date key for localStorage (obscured format)
     */
    getTodayKey() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Use Unix timestamp in seconds (obscured but deterministic)
        return Math.floor(today.getTime() / 1000);
    }
    
    /**
     * Check if today's puzzle is complete (non-test mode only)
     */
    isTodaysPuzzleComplete() {
        if (this.testMode) return false; // Test mode never shows as complete
        
        const todayKey = this.getTodayKey();
        const saved = localStorage.getItem(`rs2_dp_${todayKey}`);
        return saved !== null;
    }
    
    /**
     * Get today's completion data (if completed)
     */
    getTodayCompletion() {
        if (this.testMode) return null;
        
        const todayKey = this.getTodayKey();
        const saved = localStorage.getItem(`rs2_dp_${todayKey}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error parsing completion data:', error);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Mark today's puzzle as complete
     */
    markPuzzleComplete(result) {
        if (this.testMode) return; // Don't save in test mode
        
        const todayKey = this.getTodayKey();
        const data = {
            puzzleId: this.currentPuzzle.id,
            score: result.score,
            cubes: result.cubes,
            solution: result.solution,
            completed: Date.now()
        };
        localStorage.setItem(`rs2_dp_${todayKey}`, JSON.stringify(data));
        console.log(`✅ Daily puzzle marked complete! Score: ${result.score}`);
    }
    
    /**
     * Clear today's puzzle completion (for testing)
     */
    clearTodayCompletion() {
        if (this.testMode) {
            console.log('ℹ️ Test mode - no completion data to clear');
            return;
        }
        
        const todayKey = this.getTodayKey();
        localStorage.removeItem(`rs2_dp_${todayKey}`);
        console.log('✅ Today\'s daily puzzle cleared!');
    }
}

// Export for ES6 module
export default DailyPuzzleManager;

// Also expose globally for backwards compatibility
if (typeof window !== 'undefined') {
    window.DailyPuzzleManager = DailyPuzzleManager;
}
