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
        
        // Test mode: picks random puzzle from bank (true) vs date-based (false)
        this.testMode = true; // TODO: Set to false for production
        
        // Current puzzle
        this.currentPuzzle = null;
        
        // Puzzle bank (loaded from JSON)
        this.puzzleBank = null;
        
        // Load puzzle bank
        this.loadPuzzleBank();
    }
    
    /**
     * Load puzzle bank from JSON file
     */
    async loadPuzzleBank() {
        try {
            const response = await fetch('data/daily-puzzles.json');
            const data = await response.json();
            this.puzzleBank = data.puzzles;
            console.log(`✅ Loaded ${this.puzzleBank.length} daily puzzles from bank`);
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
        
        if (this.testMode) {
            // Test mode: pick a random puzzle from bank
            const randomIndex = Math.floor(Math.random() * this.puzzleBank.length);
            console.log(`🎲 Test mode: Loading random puzzle #${randomIndex + 1}/${this.puzzleBank.length}`);
            return this.puzzleBank[randomIndex];
        }
        
        // Production mode: get puzzle for today's date
        const today = this.getTodayString();
        const puzzleIndex = this.getPuzzleIndexForDate(today);
        
        console.log(`📅 Loading puzzle #${puzzleIndex + 1} for ${today}`);
        return this.puzzleBank[puzzleIndex % this.puzzleBank.length];
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
        
        // Load pre-generated dice and add runtime properties (id, x, y)
        const timestamp = Date.now();
        this.game.dice = puzzle.dice.map((die, i) => ({
            ...die,
            id: `die-${i}-${timestamp}`,
            x: 0,
            y: 0
        }));
        
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
