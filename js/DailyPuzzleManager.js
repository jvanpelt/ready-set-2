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

class DailyPuzzleManager {
    constructor(game, uiController) {
        this.game = game;
        this.uiController = uiController;
        this.generator = new DailyPuzzleGenerator();
        
        // Test mode: allows random puzzle generation
        this.testMode = true; // TODO: Set to false for production
        
        // Current puzzle
        this.currentPuzzle = null;
    }
    
    /**
     * Get today's puzzle (or random in test mode)
     */
    getTodaysPuzzle() {
        if (this.testMode) {
            // Test mode: generate a fresh random puzzle each time
            return this.generator.generatePuzzle();
        }
        
        // Production mode: get puzzle for today's date
        const today = this.getTodayString();
        const puzzleIndex = this.getPuzzleIndexForDate(today);
        
        // TODO: Load from pre-generated puzzle bank
        return this.generator.generatePuzzle();
    }
    
    /**
     * Start daily puzzle mode
     */
    startDailyPuzzle() {
        console.log('🎯 Starting Daily Puzzle mode...');
        
        // Generate/load puzzle
        this.currentPuzzle = this.getTodaysPuzzle();
        
        // Log for debugging
        this.generator.logPuzzle(this.currentPuzzle);
        
        // Set game mode (don't change level - daily puzzles are level-independent)
        this.game.mode = 'daily';
        
        // Load puzzle into game
        this.loadPuzzleIntoGame(this.currentPuzzle);
        
        // Hide home screen and show game
        if (window.homeScreen) {
            window.homeScreen.hide();
        }
        
        // Render the game
        this.uiController.render({ animate: true });
        
        console.log('✅ Daily Puzzle loaded!');
    }
    
    /**
     * Load puzzle data into game state
     */
    loadPuzzleIntoGame(puzzle) {
        // Set cards
        this.game.cards = puzzle.cards;
        
        // Initialize card states
        this.game.cardStates = this.game.cards.map(() => ({
            dimmed: false,
            excluded: false,
            flipped: false
        }));
        
        // Set goal from the puzzle (number of cards that should match)
        this.game.goal = puzzle.goal;
        this.game.goalCards = puzzle.goal; // UI displays goalCards, not goal
        
        // Load pre-generated dice from puzzle (no need to regenerate)
        this.game.dice = puzzle.dice;
        
        // Clear solutions
        this.game.solutions = [[], []];
        
        // Set timer and score
        this.game.timer = null; // No timer for daily puzzle (or maybe we add one?)
        this.game.score = 0;
        
        // Daily puzzle specific settings
        this.game.dailyPuzzle = {
            difficulty: puzzle.difficulty,
            solution: puzzle.solution,
            matchingCards: puzzle.matchingCards,
            startTime: Date.now()
        };
    }
    
    /**
     * Get today's date as a string (YYYY-MM-DD)
     */
    getTodayString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }
    
    /**
     * Get puzzle index for a given date (deterministic)
     */
    getPuzzleIndexForDate(dateString) {
        // Simple hash function to get consistent puzzle for each date
        const epoch = new Date('2025-01-01');
        const current = new Date(dateString);
        const daysSinceEpoch = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
        
        // TODO: When we have a puzzle bank, use this to index into it
        return daysSinceEpoch % 1000; // Assuming 1000 puzzles in bank
    }
    
    /**
     * Check if today's puzzle is complete
     */
    isTodaysPuzzleComplete() {
        const today = this.getTodayString();
        const saved = localStorage.getItem(`rs2_daily_${today}`);
        return saved !== null;
    }
    
    /**
     * Mark today's puzzle as complete
     */
    markPuzzleComplete(score) {
        const today = this.getTodayString();
        const data = {
            completed: true,
            score: score,
            timestamp: Date.now()
        };
        localStorage.setItem(`rs2_daily_${today}`, JSON.stringify(data));
    }
    
    /**
     * Get today's puzzle score (if completed)
     */
    getTodayScore() {
        const today = this.getTodayString();
        const saved = localStorage.getItem(`rs2_daily_${today}`);
        if (saved) {
            const data = JSON.parse(saved);
            return data.score;
        }
        return null;
    }
}

// Export for ES6 module
export default DailyPuzzleManager;

// Also expose globally for backwards compatibility
if (typeof window !== 'undefined') {
    window.DailyPuzzleManager = DailyPuzzleManager;
}
