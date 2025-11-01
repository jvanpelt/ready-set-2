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
        
        // Generate dice pool (all 8 cubes for daily puzzle)
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
            matchingCards: puzzle.matchingCards,
            startTime: Date.now()
        };
    }
    
    /**
     * Generate dice from a solution template
     * This creates the 8 dice that the player can use
     * Parses the full expression token by token to extract exactly what's needed
     */
    generateDiceFromSolution(solution) {
        const dice = [];
        const expr = solution.fullExpression;
        
        // Parse the expression into tokens
        // Split by spaces, remove parentheses, and separate prime (′) from adjacent tokens
        let tokens = expr.split(/\s+/).map(t => t.replace(/[()]/g, ''));
        
        // Further split tokens that have prime attached (e.g., "gold′" → ["gold", "′"])
        const finalTokens = [];
        tokens.forEach(token => {
            if (token.includes('′')) {
                // Split the prime off
                const parts = token.split('′');
                parts.forEach((part, i) => {
                    if (part) finalTokens.push(part);
                    if (i < parts.length - 1) finalTokens.push('′'); // Add prime between parts
                });
            } else if (token) {
                finalTokens.push(token);
            }
        });
        
        // Count how many of each token we need
        const tokenCounts = {};
        finalTokens.forEach(token => {
            if (token) {
                tokenCounts[token] = (tokenCounts[token] || 0) + 1;
            }
        });
        
        // Convert tokens to dice objects
        for (const [token, count] of Object.entries(tokenCounts)) {
            for (let i = 0; i < count; i++) {
                let dieType = 'operator';
                
                // Determine die type
                if (['red', 'blue', 'green', 'gold'].includes(token)) {
                    dieType = 'color';
                } else if (['=', '⊆'].includes(token)) {
                    dieType = 'restriction';
                } else if (['U', '∅'].includes(token)) {
                    dieType = 'set-constant';
                } else if (['∪', '∩', '−', '′'].includes(token)) {
                    dieType = 'operator';
                }
                
                dice.push({ 
                    value: token, 
                    type: dieType 
                });
            }
        }
        
        // Validate we have exactly 8 dice (our templates should ensure this)
        if (dice.length !== 8) {
            console.warn(`⚠️ Generated ${dice.length} dice, expected 8!`);
            console.warn('Expression:', expr);
            console.warn('Final tokens:', finalTokens);
            console.warn('Token counts:', tokenCounts);
            
            // Fill or trim to 8
            while (dice.length < 8) {
                dice.push({ value: '∪', type: 'operator' });
            }
            if (dice.length > 8) {
                dice.length = 8;
            }
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

