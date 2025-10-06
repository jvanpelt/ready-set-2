/**
 * ScenarioManager - Handles custom puzzle scenarios for debug mode and tutorials
 * 
 * A "scenario" is a predefined puzzle setup with specific cards, dice, and goal.
 * Used for:
 * - Debug/testing (build and test custom puzzles)
 * - Tutorials (first puzzle of each level uses a predefined scenario)
 */

export class ScenarioManager {
    constructor(game) {
        this.game = game;
        this.currentScenario = null;
    }
    
    /**
     * Get all 16 possible cards (every combination of 4 colors)
     * Cards are indexed 0-15, representing binary combinations:
     * 0 = 0000 (no colors)
     * 1 = 0001 (gold only)
     * 2 = 0010 (green only)
     * ...
     * 15 = 1111 (all colors)
     */
    getAllPossibleCards() {
        const cards = [];
        for (let i = 0; i < 16; i++) {
            cards.push({
                index: i,
                red: !!(i & 8),    // Bit 3
                blue: !!(i & 4),   // Bit 2
                green: !!(i & 2),  // Bit 1
                gold: !!(i & 1)    // Bit 0
            });
        }
        return cards;
    }
    
    /**
     * Convert card indices to card objects
     */
    cardsFromIndices(indices) {
        const allCards = this.getAllPossibleCards();
        return indices.map(i => {
            const card = allCards[i];
            // Build colors array from boolean properties
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
                colors: colors  // Renderer needs this array format
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
