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
    constructor(game, uiController, settings = {}) {
        this.game = game;
        this.uiController = uiController;
        this.generator = new DailyPuzzleGenerator();
        
        // Test mode options
        this.testMode = 'systematic'; // 'systematic' | 'random' | false (date-based)
        this.reverseOrder = settings.reverseTestOrder || false; // When true, test from #261 backwards
        
        // Current puzzle
        this.currentPuzzle = null;
        
        // Puzzle bank (loaded from JSON)
        this.puzzleBank = null;
        
        // Testing progress (for systematic testing)
        this.testingProgress = this.loadTestingProgress();
        
        // Load puzzle bank
        this.loadPuzzleBank();
    }
    
    /**
     * Load puzzle bank from JSON file
     */
    async loadPuzzleBank() {
        try {
            // Load from test set if in systematic test mode
            const filename = this.testMode === 'systematic' 
                ? 'data/daily-puzzles-test.json' 
                : 'data/daily-puzzles.json';
            
            const response = await fetch(filename);
            const data = await response.json();
            
            // Handle both array format and {puzzles: []} format
            this.puzzleBank = Array.isArray(data) ? data : data.puzzles;
            
            console.log(`✅ Loaded ${this.puzzleBank.length} puzzles from ${filename}`);
            
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
        
        if (this.testMode === 'systematic') {
            // Systematic test mode: get next untested puzzle
            return this.getNextUntestedPuzzle();
        } else if (this.testMode === 'random' || this.testMode === true) {
            // Random test mode: pick a random puzzle from bank
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
     * Get next untested puzzle for systematic testing
     */
    getNextUntestedPuzzle() {
        if (!this.puzzleBank) return null;
        
        // Determine iteration direction
        const startIndex = this.reverseOrder ? this.puzzleBank.length - 1 : 0;
        const endIndex = this.reverseOrder ? -1 : this.puzzleBank.length;
        const step = this.reverseOrder ? -1 : 1;
        
        // Find first untested puzzle (forward or backward)
        for (let i = startIndex; this.reverseOrder ? i > endIndex : i < endIndex; i += step) {
            const puzzleId = this.puzzleBank[i].id;
            if (!this.testingProgress.tested.includes(puzzleId)) {
                const progress = this.testingProgress.tested.length;
                const total = this.puzzleBank.length;
                const direction = this.reverseOrder ? '(reverse order)' : '';
                console.log(`🧪 Test Mode: Loading puzzle #${puzzleId} ${direction} (Progress: ${progress}/${total} tested)`);
                return this.puzzleBank[i];
            }
        }
        
        // All puzzles tested!
        console.log('🎉 All puzzles tested!');
        return this.puzzleBank[this.reverseOrder ? this.puzzleBank.length - 1 : 0]; // Loop back
    }
    
    /**
     * Mark current puzzle as tested
     */
    markPuzzleAsTested(puzzleId) {
        if (!this.testingProgress.tested.includes(puzzleId)) {
            this.testingProgress.tested.push(puzzleId);
            this.saveTestingProgress();
            console.log(`✅ Puzzle #${puzzleId} marked as tested (${this.testingProgress.tested.length}/${this.puzzleBank.length})`);
        }
    }
    
    /**
     * Load next puzzle in test mode
     */
    loadNextTestPuzzle() {
        // Mark current puzzle as tested
        if (this.currentPuzzle && this.currentPuzzle.id) {
            this.markPuzzleAsTested(this.currentPuzzle.id);
        }
        
        // Load next puzzle
        this.startDailyPuzzle();
    }
    
    /**
     * Jump to a specific puzzle by ID (for testing)
     * Usage in console: dailyPuzzleManager.jumpToPuzzle(261)
     */
    jumpToPuzzle(id) {
        const puzzle = this.puzzleBank.find(p => p.id === id);
        if (!puzzle) {
            console.error(`❌ Puzzle #${id} not found`);
            return;
        }
        
        this.currentPuzzle = puzzle;
        
        // Log puzzle details for testing
        this.generator.logPuzzle(puzzle);
        
        // Load puzzle into game
        this.loadPuzzleIntoGame(puzzle);
        
        // Hide home screen if visible
        if (window.homeScreen) {
            window.homeScreen.hide();
        }
        
        // Render the puzzle
        this.uiController.render({ animate: true });
        
        console.log(`✅ Jumped to puzzle #${id}`);
    }
    
    /**
     * Load testing progress from localStorage
     */
    loadTestingProgress() {
        try {
            const saved = localStorage.getItem('rs2_testing_progress');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading testing progress:', error);
        }
        return { tested: [] };
    }
    
    /**
     * Save testing progress to localStorage
     */
    saveTestingProgress() {
        try {
            localStorage.setItem('rs2_testing_progress', JSON.stringify(this.testingProgress));
        } catch (error) {
            console.error('Error saving testing progress:', error);
        }
    }
    
    /**
     * Reset testing progress
     */
    resetTestingProgress() {
        this.testingProgress = { tested: [] };
        this.saveTestingProgress();
        console.log('🔄 Testing progress reset');
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
            puzzleId: puzzle.id,
            templatePattern: puzzle.templatePattern, // For debugging
            difficulty: puzzle.difficulty,
            solution: puzzle.solution || puzzle.generatedSolution,
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
