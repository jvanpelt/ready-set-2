/**
 * DailyPuzzleManager - Manages daily puzzle mode state and UI
 * 
 * Features:
 * - Loads daily puzzles (date-based or test mode)
 * - Tracks completion status
 * - Coordinates with game engine
 * - Manages UI state transitions
 */

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
        
        // Set game mode
        this.game.mode = 'daily';
        this.game.level = 0; // Daily puzzles don't have levels
        
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
        
        // Set goal (count of cards - this will be the target)
        this.game.goal = puzzle.cards.length;
        
        // Generate dice pool (all 8 cubes for daily puzzle)
        // TODO: This needs to be derived from the solution
        this.game.dice = this.generateDiceFromSolution(puzzle.solution);
        
        // Clear solutions
        this.game.solutions = [[], []];
        
        // Set timer and score
        this.game.timer = null; // No timer for daily puzzle (or maybe we add one?)
        this.game.score = 0;
        
        // Daily puzzle specific settings
        this.game.dailyPuzzle = {
            difficulty: puzzle.difficulty,
            solution: puzzle.solution,
            startTime: Date.now()
        };
    }
    
    /**
     * Generate dice from a solution template
     * This creates the 8 dice that the player can use
     */
    generateDiceFromSolution(solution) {
        const dice = [];
        
        // Parse the full expression to extract needed cubes
        // For now, create a basic set of cubes based on colors mentioned
        const expr = solution.fullExpression;
        
        // Extract colors
        const colors = ['red', 'blue', 'green', 'gold'];
        colors.forEach(color => {
            if (expr.includes(color)) {
                dice.push({ value: color, type: 'color' });
            }
        });
        
        // Add operators mentioned in the solution
        if (expr.includes('∪')) dice.push({ value: '∪', type: 'operator' });
        if (expr.includes('∩')) dice.push({ value: '∩', type: 'operator' });
        if (expr.includes('−')) dice.push({ value: '−', type: 'operator' });
        if (expr.includes('′')) dice.push({ value: '′', type: 'operator' });
        
        // Add restriction operators
        if (expr.includes('=')) dice.push({ value: '=', type: 'restriction' });
        if (expr.includes('⊆')) dice.push({ value: '⊆', type: 'restriction' });
        
        // Add Universe/Null if mentioned
        if (expr.includes('U')) dice.push({ value: 'U', type: 'set-constant' });
        if (expr.includes('∅')) dice.push({ value: '∅', type: 'set-constant' });
        
        // Fill to 8 dice if needed (should already be 8 from template)
        // Add extras if we're short
        while (dice.length < 8) {
            dice.push({ value: '∪', type: 'operator' });
        }
        
        // Trim if we have too many
        if (dice.length > 8) {
            dice.length = 8;
        }
        
        return dice;
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

