/**
 * DailyPuzzleGenerator - Creates daily puzzles with 8-cube solutions
 * 
 * Design Philosophy:
 * - All puzzles require at least 1 operator AND 1 restriction (= or ⊆)
 * - Target 8 cubes for maximum complexity
 * - Allow redundancy (e.g., "RED ∪ RED") for point padding
 * - Allow tautologies (e.g., "UNIVERSE ⊆ UNIVERSE")
 * - Multiple solutions are encouraged (different scoring opportunities)
 */

class DailyPuzzleGenerator {
    constructor() {
        // Color options
        this.COLORS = ['red', 'blue', 'green', 'gold'];
        
        // Operators
        this.OPERATORS = ['∪', '∩', '−'];
        this.RESTRICTIONS = ['=', '⊆'];
        
        // 8-cube solution templates
        // Format: { restriction, operator, setName, description }
        this.TEMPLATES = this.createTemplates();
    }
    
    /**
     * Create comprehensive template library for 8-cube solutions
     * Format: { topRow, bottomRow, pattern }
     * where topRow and bottomRow can each be a restriction or set name
     */
    createTemplates() {
        const templates = [];
        
        // ===== CATEGORY 1: No Restrictions (8 cubes in set name only) =====
        templates.push(
            { topRow: null, bottomRow: "A ∪ B ∪ C ∪ D′", pattern: "0+8-setname" },
            { topRow: null, bottomRow: "A ∪ B ∪ C ∪ D ∪ A", pattern: "0+9-setname-reuse" }, // 9 cubes, will trim
            { topRow: null, bottomRow: "A ∪ A ∪ B ∪ C ∪ D", pattern: "0+9-setname-reuse" } // 9 cubes
        );
        
        // ===== CATEGORY 2: One Restriction (3-5 cubes) + Set Name (3-5 cubes) =====
        
        // 3-cube restriction + 5-cube set name
        templates.push(
            { topRow: "A ∪ B = C", bottomRow: "D ∪ A ∪ B", pattern: "3+5" },
            { topRow: "A ∩ B = C", bottomRow: "D ∪ A ∪ B", pattern: "3+5" },
            { topRow: "A − B = C", bottomRow: "D ∪ A ∪ B", pattern: "3+5" },
            { topRow: "A = B ∪ C", bottomRow: "D ∪ A ∪ B", pattern: "3+5" }
        );
        
        // 4-cube restriction + 4-cube set name  
        templates.push(
            { topRow: "A ∪ B = C ∪ D", bottomRow: "A ∪ B ∪ C", pattern: "4+4" },
            { topRow: "A ∩ B = C ∩ D", bottomRow: "A ∪ B ∪ C", pattern: "4+4" },
            { topRow: "A ∪ B = C − D", bottomRow: "A ∪ B ∪ C", pattern: "4+4" },
            { topRow: "A ∪ B ⊆ C ∪ D", bottomRow: "A ∪ B ∪ C", pattern: "4+4-subset" },
            { topRow: "A ∪ B = C′", bottomRow: "D ∪ A ∪ B", pattern: "4+5-prime" }
        );
        
        // 5-cube restriction + 3-cube set name
        templates.push(
            { topRow: "A ∪ B ∪ C = D ∪ A", bottomRow: "B ∪ C", pattern: "5+3" },
            { topRow: "A ∪ B = C ∪ D", bottomRow: "A ∪ B′", pattern: "4+4-prime" },
            { topRow: "A ∩ B ∪ C = D", bottomRow: "A ∪ B", pattern: "5+3" }
        );
        
        // ===== CATEGORY 3: Two Restrictions (4 cubes each) =====
        templates.push(
            { topRow: "A ∪ B = C ∪ D", bottomRow: "A ∩ B = C ∩ D", pattern: "4+4-double-restriction" },
            { topRow: "A ∪ B = C − D", bottomRow: "A ∩ C = B ∪ D", pattern: "4+4-double-restriction" },
            { topRow: "A ∪ B ⊆ C ∪ D", bottomRow: "A ∩ B = C ∩ D", pattern: "4+4-double-restriction-subset" }
        );
        
        // ===== CATEGORY 4: Using Universe/Null =====
        templates.push(
            { topRow: "U − A = B ∪ C", bottomRow: "D ∪ A", pattern: "4+3-universe" },
            { topRow: "∅ ∪ A = B", bottomRow: "C ∪ D ∪ A", pattern: "3+5-null" },
            { topRow: null, bottomRow: "U − A − B − C", pattern: "0+7-universe" }
        );
        
        return templates;
    }
    
    /**
     * Generate a single random puzzle
     */
    generatePuzzle() {
        let attempts = 0;
        const maxAttempts = 50;
        
        // Keep trying until we get a valid puzzle
        while (attempts < maxAttempts) {
            attempts++;
            
            // Pick a random template
            const template = this.pickRandomTemplate();
            
            // Assign colors to A, B, C, D, U, ∅ placeholders
            const colorMap = this.createColorMapping(template);
            
            // Instantiate the template with real colors/operators
            const solution = this.instantiateTemplate(template, colorMap);
            
            // Generate 4 random cards with variety
            const cards = this.generateRandomCards();
            
            // Evaluate the solution against these cards
            const matchingIndices = this.evaluateSolution(solution, cards);
            
            // The goal is the number of matching cards
            const goal = matchingIndices.size;
            
            // Validate: we want 1-8 matching cards (not 0, that's impossible!)
            if (goal === 0 || goal > 8) {
                continue; // Try again
            }
            
            // Calculate difficulty (placeholder for now)
            const difficulty = this.estimateDifficulty(solution);
            
            return {
                cards: cards,
                solution: solution,
                goal: goal,
                matchingCards: Array.from(matchingIndices),
                difficulty: difficulty,
                template: template.pattern,
                timestamp: Date.now()
            };
        }
        
        // Fallback: if we couldn't generate a valid puzzle, return a simple one
        console.warn('⚠️ Failed to generate valid puzzle after', maxAttempts, 'attempts. Using fallback.');
        return this.generateFallbackPuzzle();
    }
    
    /**
     * Pick a random template from the library
     */
    pickRandomTemplate() {
        return this.TEMPLATES[Math.floor(Math.random() * this.TEMPLATES.length)];
    }
    
    /**
     * Create a color mapping for template placeholders
     * A, B, C, D can be colors (red, blue, green, gold)
     * U = Universe, ∅ = Null
     * Colors can repeat for padding
     */
    createColorMapping(template) {
        const mapping = {};
        
        // Shuffle colors for randomness
        const shuffledColors = [...this.COLORS].sort(() => Math.random() - 0.5);
        
        // Extract unique placeholders from template
        const templateString = template.restriction + template.setName;
        const placeholders = [...new Set(templateString.match(/[ABCD]/g) || [])];
        
        // Assign colors to placeholders
        placeholders.forEach((placeholder, index) => {
            // Allow color reuse by cycling through colors
            mapping[placeholder] = shuffledColors[index % shuffledColors.length];
        });
        
        // Universe and Null are constants
        mapping['U'] = 'U';
        mapping['∅'] = '∅';
        
        return mapping;
    }
    
    /**
     * Instantiate a template with actual colors
     */
    instantiateTemplate(template, colorMap) {
        const replaceColors = (expr) => {
            if (!expr) return null;
            let result = expr;
            // Replace placeholders with actual colors
            for (const [placeholder, color] of Object.entries(colorMap)) {
                const regex = new RegExp(placeholder, 'g');
                result = result.replace(regex, color);
            }
            return result;
        };
        
        const topRow = replaceColors(template.topRow);
        const bottomRow = replaceColors(template.bottomRow);
        
        return {
            topRow: topRow,
            bottomRow: bottomRow,
            pattern: template.pattern,
            // For backwards compatibility and logging
            hasRestriction: topRow && (topRow.includes('=') || topRow.includes('⊆')),
            hasTwoRestrictions: topRow && bottomRow && 
                (topRow.includes('=') || topRow.includes('⊆')) &&
                (bottomRow.includes('=') || bottomRow.includes('⊆'))
        };
    }
    
    /**
     * Evaluate a solution against a set of cards to determine which cards match
     * Uses the same evaluation logic as the game
     */
    evaluateSolution(solution, cards) {
        // For now, only evaluate the bottom row (set name or second restriction)
        // TODO: In the future, apply top row restriction first (flip cards), then evaluate bottom row
        const bottomRow = solution.bottomRow;
        
        if (!bottomRow) {
            return new Set(); // No solution
        }
        
        // Check if bottom row is a restriction (contains = or ⊆)
        if (bottomRow.includes('=') || bottomRow.includes('⊆')) {
            // Bottom row is a restriction - can't evaluate like a set name yet
            // For now, just parse the left side of the restriction
            const leftSide = bottomRow.split(/[=⊆]/)[0].trim();
            const tokens = this.parseExpression(leftSide);
            return this.evaluateTokens(tokens, cards);
        }
        
        // Bottom row is a set name - evaluate normally
        const tokens = this.parseExpression(bottomRow);
        const matchingIndices = this.evaluateTokens(tokens, cards);
        
        return matchingIndices;
    }
    
    /**
     * Parse an expression string into tokens
     * e.g., "red ∪ blue" -> ['red', '∪', 'blue']
     */
    parseExpression(expr) {
        const tokens = [];
        const parts = expr.split(/\s+/);
        
        for (const part of parts) {
            // Remove parentheses for now (we'll handle grouping later if needed)
            const cleaned = part.replace(/[()]/g, '');
            if (cleaned) tokens.push(cleaned);
        }
        
        return tokens;
    }
    
    /**
     * Evaluate tokens against cards (basic set theory evaluation)
     * Returns a Set of matching card indices
     */
    evaluateTokens(tokens, cards) {
        if (!tokens || tokens.length === 0) {
            return new Set();
        }
        
        // Handle single token
        if (tokens.length === 1) {
            const token = tokens[0];
            if (this.COLORS.includes(token)) {
                return this.getCardsWithColor(token, cards);
            }
            if (token === 'U') {
                return this.getAllCards(cards);
            }
            if (token === '∅') {
                return new Set();
            }
            return new Set();
        }
        
        // Process operators left to right
        let result = null;
        let i = 0;
        
        while (i < tokens.length) {
            const token = tokens[i];
            
            if (this.COLORS.includes(token)) {
                const cardSet = this.getCardsWithColor(token, cards);
                if (result === null) {
                    result = cardSet;
                }
                i++;
            } else if (token === 'U') {
                const cardSet = this.getAllCards(cards);
                if (result === null) {
                    result = cardSet;
                }
                i++;
            } else if (token === '∅') {
                const cardSet = new Set();
                if (result === null) {
                    result = cardSet;
                }
                i++;
            } else if (token === '∪') {
                // Union: combine with next operand
                i++;
                if (i < tokens.length) {
                    const nextSet = this.getOperand(tokens[i], cards);
                    result = this.union(result, nextSet);
                    i++;
                }
            } else if (token === '∩') {
                // Intersection: overlap with next operand
                i++;
                if (i < tokens.length) {
                    const nextSet = this.getOperand(tokens[i], cards);
                    result = this.intersection(result, nextSet);
                    i++;
                }
            } else if (token === '−') {
                // Difference: remove next operand
                i++;
                if (i < tokens.length) {
                    const nextSet = this.getOperand(tokens[i], cards);
                    result = this.difference(result, nextSet);
                    i++;
                }
            } else if (token === '′') {
                // Complement: invert current result
                result = this.complement(result, cards);
                i++;
            } else {
                i++;
            }
        }
        
        return result || new Set();
    }
    
    /**
     * Get operand as a set of card indices
     */
    getOperand(token, cards) {
        if (this.COLORS.includes(token)) {
            return this.getCardsWithColor(token, cards);
        } else if (token === 'U') {
            return this.getAllCards(cards);
        } else if (token === '∅') {
            return new Set();
        }
        return new Set();
    }
    
    /**
     * Get all cards with a specific color
     */
    getCardsWithColor(color, cards) {
        const result = new Set();
        cards.forEach((card, index) => {
            if (card.colors.includes(color)) {
                result.add(index);
            }
        });
        return result;
    }
    
    /**
     * Get all cards (universe)
     */
    getAllCards(cards) {
        const result = new Set();
        cards.forEach((_, index) => result.add(index));
        return result;
    }
    
    /**
     * Set operations
     */
    union(setA, setB) {
        return new Set([...setA, ...setB]);
    }
    
    intersection(setA, setB) {
        return new Set([...setA].filter(x => setB.has(x)));
    }
    
    difference(setA, setB) {
        return new Set([...setA].filter(x => !setB.has(x)));
    }
    
    complement(setA, cards) {
        const all = this.getAllCards(cards);
        return this.difference(all, setA);
    }
    
    /**
     * Generate 8 random cards with variety
     * Uses all 4 colors, distributed across the cards
     */
    generateRandomCards() {
        const cards = [];
        
        // Strategy: Create diverse cards with different color combinations
        // Ensure all 4 colors appear somewhere in the cards
        
        const usedColors = new Set();
        
        // Generate 8 cards
        for (let i = 0; i < 8; i++) {
            const numColors = Math.floor(Math.random() * 3) + 1; // 1-3 colors per card
            const colors = [];
            
            for (let j = 0; j < numColors; j++) {
                // Pick a random color
                const color = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
                if (!colors.includes(color)) {
                    colors.push(color);
                    usedColors.add(color);
                }
            }
            
            // Ensure at least one color
            if (colors.length === 0) {
                colors.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
            }
            
            cards.push({ colors: colors });
        }
        
        // Ensure all 4 colors are represented (for more interesting puzzles)
        this.COLORS.forEach(color => {
            if (!usedColors.has(color)) {
                // Add this color to a random card
                const randomCard = cards[Math.floor(Math.random() * cards.length)];
                if (!randomCard.colors.includes(color)) {
                    randomCard.colors.push(color);
                }
            }
        });
        
        return cards;
    }
    
    /**
     * Generate a simple fallback puzzle when generation fails
     */
    generateFallbackPuzzle() {
        const cards = [
            { colors: ['red'] },
            { colors: ['blue'] },
            { colors: ['green'] },
            { colors: ['gold'] },
            { colors: ['red', 'blue'] },
            { colors: ['green', 'gold'] },
            { colors: ['red', 'green'] },
            { colors: ['blue', 'gold'] }
        ];
        
        const solution = {
            topRow: "red ∪ blue = green ∪ gold",
            bottomRow: "red ∪ green",
            pattern: "fallback",
            hasRestriction: true,
            hasTwoRestrictions: false
        };
        
        return {
            cards: cards,
            solution: solution,
            goal: 4, // cards with red or green match (after restriction)
            matchingCards: [0, 2, 4, 6],
            difficulty: 'beginner',
            template: 'fallback',
            timestamp: Date.now()
        };
    }
    
    /**
     * Estimate puzzle difficulty based on solution complexity
     * Beginner: 3-5 cubes, Intermediate: 6-7 cubes, Advanced: 8+ cubes
     */
    estimateDifficulty(solution) {
        // Count cubes in the full expression (very rough estimate)
        const cubeCount = solution.fullExpression.split(/\s+/).length;
        
        if (cubeCount <= 5) return 'beginner';
        if (cubeCount <= 7) return 'intermediate';
        return 'advanced';
    }
    
    /**
     * Generate a batch of puzzles for testing
     */
    generateBatch(count = 10) {
        const puzzles = [];
        for (let i = 0; i < count; i++) {
            puzzles.push(this.generatePuzzle());
        }
        return puzzles;
    }
    
    /**
     * Log a puzzle to console for debugging
     */
    logPuzzle(puzzle) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎲 DAILY PUZZLE GENERATED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 Pattern:    ${puzzle.template}`);
        console.log(`🎯 Goal:       ${puzzle.goal} cards`);
        console.log(`📊 Difficulty: ${puzzle.difficulty}`);
        console.log(`\n✅ SOLUTION (One Possible Answer):`);
        
        const sol = puzzle.solution;
        if (sol.topRow && sol.bottomRow) {
            console.log(`   Top Row:    ${sol.topRow}`);
            console.log(`   Bottom Row: ${sol.bottomRow}`);
            if (sol.hasTwoRestrictions) {
                console.log(`   Type: Two Restrictions`);
            } else if (sol.hasRestriction) {
                console.log(`   Type: Restriction + Set Name`);
            } else {
                console.log(`   Type: Set Name Only (both rows)`);
            }
        } else if (sol.topRow) {
            console.log(`   Top Row:    ${sol.topRow}`);
            console.log(`   Bottom Row: (empty)`);
        } else if (sol.bottomRow) {
            console.log(`   Top Row:    (empty)`);
            console.log(`   Bottom Row: ${sol.bottomRow}`);
            console.log(`   Type: Set Name Only`);
        }
        
        console.log(`\n🃏 Cards (${puzzle.cards.length} total):`);
        puzzle.cards.forEach((card, i) => {
            const isMatch = puzzle.matchingCards && puzzle.matchingCards.includes(i);
            const marker = isMatch ? '✓' : ' ';
            console.log(`   [${marker}] Card ${i}: ${card.colors.join(', ')}`);
        });
        console.log(`\n   ✓ = Should match the solution (Goal: ${puzzle.goal})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

