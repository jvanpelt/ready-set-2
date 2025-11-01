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
     */
    createTemplates() {
        const templates = [];
        
        // Pattern A: 5-cube restriction + 2-cube setname (total 8)
        // Examples: "A ∪ B ∪ C = D′", "A ∩ B ∪ C = D′"
        templates.push(
            { restriction: "A ∪ B ∪ C", operator: "=", setName: "D′", pattern: "5+2" },
            { restriction: "A ∪ B ∪ A", operator: "=", setName: "D′", pattern: "5+2-reuse" },
            { restriction: "A ∩ B ∪ C", operator: "=", setName: "D′", pattern: "5+2" },
            { restriction: "A ∪ B − C", operator: "=", setName: "D′", pattern: "5+2" },
            { restriction: "A − B − C", operator: "=", setName: "D′", pattern: "5+2" },
            { restriction: "A − B ∪ C", operator: "=", setName: "D′", pattern: "5+2" },
            { restriction: "U ∪ A ∪ B", operator: "=", setName: "C′", pattern: "5+2-universe" },
            { restriction: "∅ ∪ A ∪ B", operator: "=", setName: "C′", pattern: "5+2-null" },
            { restriction: "A ∪ B ∪ C", operator: "⊆", setName: "D′", pattern: "5+2-subset" },
            { restriction: "A ∩ B ∪ C", operator: "⊆", setName: "D′", pattern: "5+2-subset" }
        );
        
        // Pattern B: 3-cube restriction + 4-cube setname (total 8)
        // Examples: "A ∪ B = (C ∪ D)′", "A ∩ B = (C − D)′"
        templates.push(
            { restriction: "A ∪ B", operator: "=", setName: "(C ∪ D)′", pattern: "3+4" },
            { restriction: "A ∩ B", operator: "=", setName: "(C ∪ D)′", pattern: "3+4" },
            { restriction: "A − B", operator: "=", setName: "(C ∪ D)′", pattern: "3+4" },
            { restriction: "A ∪ A", operator: "=", setName: "(C ∪ D)′", pattern: "3+4-reuse" },
            { restriction: "A ∩ A", operator: "=", setName: "(C ∪ D)′", pattern: "3+4-reuse" },
            { restriction: "A ∪ B", operator: "=", setName: "(C ∩ D)′", pattern: "3+4" },
            { restriction: "A ∪ B", operator: "=", setName: "(C − D)′", pattern: "3+4" },
            { restriction: "U − A", operator: "=", setName: "(B ∪ C)′", pattern: "3+4-universe" },
            { restriction: "∅ ∪ A", operator: "=", setName: "(B ∪ C)′", pattern: "3+4-null" },
            { restriction: "A ∪ B", operator: "⊆", setName: "(C ∪ D)′", pattern: "3+4-subset" },
            { restriction: "A ∩ B", operator: "⊆", setName: "(C − D)′", pattern: "3+4-subset" }
        );
        
        // Pattern C: 4-cube restriction + 3-cube setname (total 8)
        // Examples: "(A ∪ B)′ = C ∪ D", "A ∪ B′ = C ∪ D"
        templates.push(
            { restriction: "(A ∪ B)′", operator: "=", setName: "C ∪ D", pattern: "4+3" },
            { restriction: "(A ∩ B)′", operator: "=", setName: "C ∪ D", pattern: "4+3" },
            { restriction: "A ∪ B′", operator: "=", setName: "C ∪ D", pattern: "4+3" },
            { restriction: "A ∩ B′", operator: "=", setName: "C ∪ D", pattern: "4+3" },
            { restriction: "A ∪ B′", operator: "=", setName: "C ∩ D", pattern: "4+3" },
            { restriction: "A ∪ B′", operator: "=", setName: "C − D", pattern: "4+3" },
            { restriction: "(A ∪ B)′", operator: "⊆", setName: "C ∪ D", pattern: "4+3-subset" },
            { restriction: "A ∪ B′", operator: "⊆", setName: "C ∪ D", pattern: "4+3-subset" }
        );
        
        // Pattern D: Complex with repeated colors
        // Examples: "(A ∪ B) ∩ A = C′", "A − B − A ⊆ D′"
        templates.push(
            { restriction: "(A ∪ B) ∩ A", operator: "=", setName: "C′", pattern: "5+2-complex" },
            { restriction: "(A ∩ B) ∪ A", operator: "=", setName: "C′", pattern: "5+2-complex" },
            { restriction: "A − B − A", operator: "=", setName: "C′", pattern: "5+2-complex" },
            { restriction: "A ∪ B ∪ A", operator: "=", setName: "C′", pattern: "5+2-complex" },
            { restriction: "(A ∪ B) ∩ A", operator: "⊆", setName: "C′", pattern: "5+2-complex-subset" },
            { restriction: "(A ∩ B) ∪ A", operator: "⊆", setName: "C′", pattern: "5+2-complex-subset" }
        );
        
        // Pattern E: All 4 colors used
        // Examples: "RED ∪ BLUE = GREEN ∪ GOLD′"
        templates.push(
            { restriction: "A ∪ B", operator: "=", setName: "C ∪ D′", pattern: "3+4-all-colors" },
            { restriction: "A ∩ B", operator: "=", setName: "C ∪ D′", pattern: "3+4-all-colors" },
            { restriction: "A − B", operator: "=", setName: "C ∪ D′", pattern: "3+4-all-colors" },
            { restriction: "A ∪ B′", operator: "=", setName: "C ∪ D", pattern: "4+3-all-colors" },
            { restriction: "A ∩ B′", operator: "=", setName: "C ∩ D", pattern: "4+3-all-colors" }
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
            
            // Validate: we want 1-4 matching cards (not 0, that's impossible!)
            if (goal === 0 || goal > 4) {
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
            let result = expr;
            // Replace placeholders with actual colors
            for (const [placeholder, color] of Object.entries(colorMap)) {
                const regex = new RegExp(placeholder, 'g');
                result = result.replace(regex, color);
            }
            return result;
        };
        
        return {
            restriction: replaceColors(template.restriction),
            operator: template.operator,
            setName: replaceColors(template.setName),
            fullExpression: `${replaceColors(template.restriction)} ${template.operator} ${replaceColors(template.setName)}`,
            pattern: template.pattern
        };
    }
    
    /**
     * Evaluate a solution against a set of cards to determine which cards match
     * Uses the same evaluation logic as the game
     */
    evaluateSolution(solution, cards) {
        // Parse the set name expression into tokens
        const tokens = this.parseExpression(solution.setName);
        
        // Evaluate using basic set theory logic
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
     * Generate 4 random cards with variety
     * Uses all 4 colors, distributed across the cards
     */
    generateRandomCards() {
        const cards = [];
        
        // Strategy: Create diverse cards with different color combinations
        // Ensure all 4 colors appear somewhere in the cards
        
        const usedColors = new Set();
        
        // Generate 4 cards
        for (let i = 0; i < 4; i++) {
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
            { colors: ['gold'] }
        ];
        
        const solution = {
            restriction: "red ∪ blue",
            operator: "=",
            setName: "green ∪ gold",
            fullExpression: "red ∪ blue = green ∪ gold",
            pattern: "fallback"
        };
        
        return {
            cards: cards,
            solution: solution,
            goal: 2, // green and gold match
            matchingCards: [2, 3],
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
        console.log(`\n🧮 Solution:   ${puzzle.solution.fullExpression}`);
        console.log(`   Restriction: ${puzzle.solution.restriction} ${puzzle.solution.operator}`);
        console.log(`   Set Name:    ${puzzle.solution.setName}`);
        console.log(`\n🃏 Cards:`);
        puzzle.cards.forEach((card, i) => {
            const isMatch = puzzle.matchingCards && puzzle.matchingCards.includes(i);
            const marker = isMatch ? '✓' : ' ';
            console.log(`   [${marker}] Card ${i}: ${card.colors.join(', ')}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

