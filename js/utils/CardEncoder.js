/**
 * CardEncoder - Unified card representation system
 * 
 * Problem: Two different indexing systems existed:
 * - levels.js: Sequential 0-15
 * - scenarioManager.js: Bitwise encoding (red=1, blue=2, green=4, gold=8)
 * 
 * Solution: This utility bridges both systems
 * - Internal storage uses bitwise (compact for JSON)
 * - Provides conversion methods for both systems
 * - Single source of truth for card representation
 */

export class CardEncoder {
    // Bitwise color flags
    static RED = 1;
    static BLUE = 2;
    static GREEN = 4;
    static GOLD = 8;
    
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

