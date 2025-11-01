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
        // Pick a random template
        const template = this.pickRandomTemplate();
        
        // Assign colors to A, B, C, D, U, ∅ placeholders
        const colorMap = this.createColorMapping(template);
        
        // Instantiate the template with real colors/operators
        const solution = this.instantiateTemplate(template, colorMap);
        
        // Evaluate what the solution produces (which cards match)
        const evaluatedResult = this.evaluateSolution(solution);
        
        // Generate 4 cards based on the result
        const cards = this.generateCards(evaluatedResult);
        
        // Calculate difficulty (would need to find shortest solution - placeholder for now)
        const difficulty = this.estimateDifficulty(solution);
        
        return {
            cards: cards,
            solution: solution,
            difficulty: difficulty,
            template: template.pattern,
            timestamp: Date.now()
        };
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
     * Evaluate a solution to determine which cards it produces
     * This is a placeholder - we'll integrate with existing setTheory.js logic
     */
    evaluateSolution(solution) {
        // For now, return a random result
        // TODO: Integrate with actual evaluation logic from setTheory.js
        const numCards = Math.floor(Math.random() * 4) + 1; // 1-4 cards
        const result = [];
        
        for (let i = 0; i < numCards; i++) {
            const numColors = Math.floor(Math.random() * 3) + 1; // 1-3 colors per card
            const colors = [];
            for (let j = 0; j < numColors; j++) {
                colors.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
            }
            result.push([...new Set(colors)]); // Remove duplicates
        }
        
        return result;
    }
    
    /**
     * Generate 4 cards based on the evaluated solution result
     */
    generateCards(evaluatedResult) {
        const cards = [];
        
        // Start with the cards from the evaluated result
        for (let i = 0; i < evaluatedResult.length; i++) {
            cards.push({ colors: evaluatedResult[i] });
        }
        
        // Fill remaining slots with random cards
        while (cards.length < 4) {
            const numColors = Math.floor(Math.random() * 3) + 1;
            const colors = [];
            for (let j = 0; j < numColors; j++) {
                colors.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
            }
            cards.push({ colors: [...new Set(colors)] });
        }
        
        // Shuffle cards
        return cards.sort(() => Math.random() - 0.5);
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
        console.log('🎲 Generated Daily Puzzle:');
        console.log(`  Pattern: ${puzzle.template}`);
        console.log(`  Solution: ${puzzle.solution.fullExpression}`);
        console.log(`  Difficulty: ${puzzle.difficulty}`);
        console.log(`  Cards:`, puzzle.cards.map(c => c.colors.join('+')).join(', '));
    }
}

