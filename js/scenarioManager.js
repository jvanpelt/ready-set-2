/**
 * ScenarioManager - Handles custom puzzle scenarios for debug mode and tutorials
 * 
 * A "scenario" is a predefined puzzle setup with specific cards, dice, and goal.
 * Used for:
 * - Debug/testing (build and test custom puzzles)
 * - Tutorials (first puzzle of each level uses a predefined scenario)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CARD ENCODING SYSTEM (BITWISE)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This file uses BITWISE ENCODING for cards (integers 0-15).
 * This is compact for JSON storage in tutorial scenarios.
 * 
 * Each card is represented as a 4-bit integer where each bit = one color:
 * 
 *   Bit 3 (8)  = Red    (0000 1000)
 *   Bit 2 (4)  = Blue   (0000 0100)
 *   Bit 1 (2)  = Green  (0000 0010)
 *   Bit 0 (1)  = Gold   (0000 0001)
 * 
 * EXAMPLES:
 *   0  = 0000 = No colors (empty card)
 *   1  = 0001 = Gold only
 *   3  = 0011 = Green + Gold
 *   5  = 0101 = Green + Red
 *   10 = 1010 = Green + Blue
 *   15 = 1111 = All four colors
 * 
 * To check if a card has a color, use bitwise AND (&):
 *   if (card & 8) → has Red
 *   if (card & 4) → has Blue
 *   if (card & 2) → has Green
 *   if (card & 1) → has Gold
 * 
 * WHY BITWISE?
 * - Compact: 8 cards = [0,5,10,3,8,12,7,15] vs [{colors:[...]},{colors:[...]},...]
 * - Fast: Bitwise operations are very efficient
 * - Perfect for pre-defined scenarios
 * 
 * CONTRAST WITH levels.js:
 * - levels.js uses {colors: ['red', 'blue']} format
 * - Human-readable, better for game logic
 * - See levels.js for that system's documentation
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class ScenarioManager {
    constructor(game) {
        this.game = game;
        this.currentScenario = null;
    }
    
    /**
     * Get all 16 possible cards (every combination of 4 colors)
     * 
     * Converts bitwise indices (0-15) to card objects with color booleans.
     * This bridges the bitwise encoding to the game's internal format.
     * 
     * BITWISE DECODING EXPLAINED:
     * - Each index (i) is a 4-bit number
     * - We use bitwise AND (&) to check if each bit is set
     * - The !! converts truthy/falsy to strict boolean
     * 
     * Example: i = 10 (binary: 1010)
     *   i & 8 = 1010 & 1000 = 1000 (8) → !!8 = true  → Red
     *   i & 4 = 1010 & 0100 = 0000 (0) → !!0 = false → No Blue
     *   i & 2 = 1010 & 0010 = 0010 (2) → !!2 = true  → Green
     *   i & 1 = 1010 & 0001 = 0000 (0) → !!0 = false → No Gold
     * Result: Card 10 = Red + Green
     */
    getAllPossibleCards() {
        const cards = [];
        for (let i = 0; i < 16; i++) {
            cards.push({
                index: i,
                red: !!(i & 8),    // Bit 3 (8 = 1000): Check for Red
                blue: !!(i & 4),   // Bit 2 (4 = 0100): Check for Blue
                green: !!(i & 2),  // Bit 1 (2 = 0010): Check for Green
                gold: !!(i & 1)    // Bit 0 (1 = 0001): Check for Gold
            });
        }
        return cards;
    }
    
    /**
     * Convert card indices (bitwise) to card objects (game format)
     * 
     * THIS IS WHERE THE TWO SYSTEMS MEET!
     * 
     * INPUT:  Bitwise indices [10, 5, 3, ...] (from tutorial scenarios)
     * OUTPUT: Card objects {red, blue, green, gold, colors: [...]} (for game)
     * 
     * The game engine and renderer need cards in this format:
     * - Boolean properties (red, blue, green, gold) for logic
     * - colors array (['red', 'green']) for rendering
     * 
     * This function bridges the compact bitwise storage to the verbose game format.
     */
    cardsFromIndices(indices) {
        const allCards = this.getAllPossibleCards();
        return indices.map(i => {
            const card = allCards[i];
            // Build colors array from boolean properties (for renderer)
            const colors = [];
            if (card.red) colors.push('red');
            if (card.blue) colors.push('blue');
            if (card.green) colors.push('green');
            if (card.gold) colors.push('gold');
            
            return {
                red: card.red,
                blue: card.blue,
                green: card.green,
                gold: card.gold,
                colors: colors  // UIRenderer.js needs this array
            };
        });
    }
    
    /**
     * Create a scenario object
     */
    createScenario(cardIndices, dice, goal, metadata = {}) {
        return {
            cards: cardIndices,    // Array of 8 card indices (0-15)
            dice: dice,            // Array of dice objects
            goal: goal,            // Target number of cards
            metadata: {
                name: metadata.name || 'Untitled Scenario',
                description: metadata.description || '',
                tutorialText: metadata.tutorialText || null,
                level: metadata.level || null
            }
        };
    }
    
    /**
     * Load a scenario into the current game
     */
    loadScenario(scenario) {
        const scenarioName = scenario.metadata?.name || 'Tutorial Scenario';
        console.log('📋 Loading scenario:', scenarioName);
        
        this.currentScenario = scenario;
        
        // Convert card indices to card objects
        const cards = this.cardsFromIndices(scenario.cards);
        
        console.log('   Scenario goal:', scenario.goal);
        console.log('   Game goalCards before:', this.game.goalCards);
        
        // Apply to game state
        this.game.cards = cards;
        this.game.dice = scenario.dice;
        this.game.goalCards = scenario.goal;  // Use goalCards, not goal!
        
        console.log('   Game goalCards after:', this.game.goalCards);
        
        // Reset card states
        this.game.cardStates = new Array(8).fill('normal');
        
        // Clear solutions
        this.game.solutions = [[], []];
        
        // Save state
        this.game.saveState();
        
        console.log('   Cards:', cards.length);
        console.log('   Dice:', scenario.dice.length);
        console.log('   Goal (final check):', this.game.goalCards);
    }
    
    /**
     * Export current game state as a scenario
     */
    exportCurrentAsScenario(name = 'Custom Scenario') {
        // Convert current cards to indices
        const cardIndices = this.game.cards.map(card => {
            let index = 0;
            if (card.red) index |= 8;
            if (card.blue) index |= 4;
            if (card.green) index |= 2;
            if (card.gold) index |= 1;
            return index;
        });
        
        return this.createScenario(
            cardIndices,
            this.game.dice,
            this.game.goal,
            { name }
        );
    }
    
    /**
     * Save scenario to localStorage
     */
    saveScenarioToStorage(scenario, key) {
        const scenarios = this.loadScenariosFromStorage();
        scenarios[key] = scenario;
        localStorage.setItem('debugScenarios', JSON.stringify(scenarios));
        console.log('💾 Saved scenario:', key);
    }
    
    /**
     * Load scenarios from localStorage
     */
    loadScenariosFromStorage() {
        const stored = localStorage.getItem('debugScenarios');
        return stored ? JSON.parse(stored) : {};
    }
    
    /**
     * Get scenario as JSON string (for exporting to tutorial files)
     */
    exportToJSON(scenario) {
        return JSON.stringify(scenario, null, 2);
    }
}
