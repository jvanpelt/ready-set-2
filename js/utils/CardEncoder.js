/**
 * CardEncoder - Unified card representation utility
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BRIDGING THE TWO CARD ENCODING SYSTEMS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This utility provides conversion methods between the game's two card systems:
 * 
 * SYSTEM 1 (levels.js): Color Arrays
 * - Format: { colors: ['red', 'blue'] }
 * - Used by: game.js, setTheory.js, UIRenderer.js
 * - Purpose: Human-readable, easy to work with
 * 
 * SYSTEM 2 (scenarioManager.js): Bitwise Integers
 * - Format: 10 (binary: 1010 = red + green)
 * - Used by: Tutorial scenarios, Puzzle Builder
 * - Purpose: Compact JSON storage
 * 
 * WHY THIS UTILITY EXISTS:
 * - Both systems work well for their use cases
 * - This provides conversion methods if needed
 * - Could be used to unify the systems in the future
 * 
 * CURRENT STATUS:
 * - Created during refactoring but not actively used
 * - Both encoding systems coexist peacefully in the codebase
 * - Available if/when unification is desired
 * 
 * BITWISE ENCODING REFERENCE:
 *   Bit 3 (8)  = Red
 *   Bit 2 (4)  = Blue
 *   Bit 1 (2)  = Green
 *   Bit 0 (1)  = Gold
 * 
 * Examples:
 *   5  = 0101 = Red + Green   = ['red', 'green']
 *   10 = 1010 = Red + Blue    = ['red', 'blue']
 *   15 = 1111 = All 4 colors  = ['red', 'blue', 'green', 'gold']
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class CardEncoder {
    // Bitwise color flags (MUST match scenarioManager.js bit positions!)
    static RED = 8;    // Bit 3: 1000
    static BLUE = 4;   // Bit 2: 0100
    static GREEN = 2;  // Bit 1: 0010
    static GOLD = 1;   // Bit 0: 0001
    
    /**
     * Convert bitwise encoding to sequential index (0-15)
     * Used when displaying/working with card arrays
     */
    static bitwiseToIndex(bitwise) {
        // Bitwise encoding maps directly to index
        // 0=empty, 1=red, 2=blue, 3=red+blue, etc.
        return bitwise;
    }
    
    /**
     * Convert sequential index (0-15) to bitwise encoding
     * Used when storing/transmitting card data
     */
    static indexToBitwise(index) {
        // Index IS the bitwise value
        return index;
    }
    
    /**
     * Decode bitwise value to color array
     * Example: 5 (binary 0101) = [red, green]
     */
    static decode(bitwise) {
        const colors = [];
        if (bitwise & this.RED) colors.push('red');
        if (bitwise & this.BLUE) colors.push('blue');
        if (bitwise & this.GREEN) colors.push('green');
        if (bitwise & this.GOLD) colors.push('gold');
        return colors;
    }
    
    /**
     * Encode color array to bitwise value
     * Example: ['red', 'green'] = 5 (binary 0101)
     */
    static encode(colors) {
        let value = 0;
        if (colors.includes('red')) value |= this.RED;
        if (colors.includes('blue')) value |= this.BLUE;
        if (colors.includes('green')) value |= this.GREEN;
        if (colors.includes('gold')) value |= this.GOLD;
        return value;
    }
    
    /**
     * Check if card has specific color
     */
    static hasColor(bitwise, color) {
        const colorFlag = {
            'red': this.RED,
            'blue': this.BLUE,
            'green': this.GREEN,
            'gold': this.GOLD
        }[color];
        return (bitwise & colorFlag) !== 0;
    }
    
    /**
     * Get all 16 possible cards in bitwise format
     */
    static getAllCards() {
        return Array.from({ length: 16 }, (_, i) => i);
    }
    
    /**
     * Generate a random subset of cards
     */
    static getRandomCards(count = 8) {
        const allCards = this.getAllCards();
        const shuffled = allCards.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}

