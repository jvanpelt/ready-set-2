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

import { findShortestSolution } from './solutionFinder.js';
import { evaluateExpression, evaluateRestriction } from './setTheory.js';

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
     * Count total tokens (cubes) in a template
     * Each token = 1 cube (colors, operators, restrictions, set constants)
     * CRITICAL: Prime (′) attached to letters counts as 2 tokens (e.g., "A′" = A + ′ = 2 cubes)
     */
    countTokens(template) {
        const expr = (template.topRow || '') + ' ' + (template.bottomRow || '');
        // Remove parentheses and split by spaces
        const tokens = expr.replace(/[()]/g, '').split(/\s+/).filter(t => t);
        
        // Count prime symbols separately - each attached prime adds 1 to the count
        // "A′" is split as one token but represents 2 cubes
        const primeCount = (expr.match(/′/g) || []).length;
        
        return tokens.length + primeCount;
    }
    
    /**
     * Create comprehensive template library for 8-cube solutions
     * CRITICAL: Each template must use EXACTLY 8 cubes total
     * Count includes: colors, operators (∪,∩,−,′), restrictions (=,⊆), set constants (U,∅)
     * 
     * Valid formats:
     * 1. No restriction: topRow = null, bottomRow = 8-token set name
     * 2. One restriction: topRow = restriction, bottomRow = set name (total 8 tokens)
     */
    createTemplates() {
        const templates = [];
        
        // ===== CATEGORY 1: No Restriction (8 tokens) =====
        templates.push(
            // A ∪ B ∪ C ∪ D′ = 8 tokens ✓
            { topRow: null, bottomRow: "A ∪ B ∪ C ∪ D′", pattern: "8-setname" },
            // A ∪ B ∪ C′ ∪ D = 8 tokens ✓
            { topRow: null, bottomRow: "A ∪ B ∪ C′ ∪ D", pattern: "8-setname-prime" },
            // A ∩ B ∪ C ∪ D′ = 8 tokens ✓
            { topRow: null, bottomRow: "A ∩ B ∪ C ∪ D′", pattern: "8-setname-mixed" },
            // A ∪ B ∪ C ∪ A = 7 tokens, so add ′ → A ∪ B ∪ C ∪ A′ = 8 tokens ✓
            { topRow: null, bottomRow: "A ∪ B ∪ C ∪ A′", pattern: "8-setname-reuse" }
        );
        
        // ===== CATEGORY 2: Restriction (topRow) + Set Name (bottomRow) = 8 total =====
        
        // 3 + 5 = 8 tokens
        templates.push(
            // A = B (3 tokens) + C ∪ D ∪ A (5 tokens) = 8 ✓
            { topRow: "A = B", bottomRow: "C ∪ D ∪ A", pattern: "3+5-eq" },
            // A ⊆ B (3 tokens) + C ∪ D ∪ A (5 tokens) = 8 ✓
            { topRow: "A ⊆ B", bottomRow: "C ∪ D ∪ A", pattern: "3+5-subset" },
            // A = B (3 tokens) + C ∪ D ∪ E′ (5 tokens) = 8 ✓ (no reuse)
            { topRow: "A = B", bottomRow: "C ∪ D′ ∪ A", pattern: "3+5-eq-prime" }
        );
        
        // 5 + 3 = 8 tokens
        templates.push(
            // A ∪ B = C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A ∪ B = C", bottomRow: "D ∪ A", pattern: "5+3-eq" },
            // A ∩ B = C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A ∩ B = C", bottomRow: "D ∪ A", pattern: "5+3-eq" },
            // A − B = C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A − B = C", bottomRow: "D ∪ A", pattern: "5+3-eq" },
            // A = B ∪ C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A = B ∪ C", bottomRow: "D ∪ A", pattern: "5+3-eq" },
            // A = B ∩ C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A = B ∩ C", bottomRow: "D ∪ A", pattern: "5+3-eq" },
            // A ∪ B ⊆ C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A ∪ B ⊆ C", bottomRow: "D ∪ A", pattern: "5+3-subset" },
            // A ⊆ B ∪ C (5 tokens) + D ∪ A (3 tokens) = 8 ✓
            { topRow: "A ⊆ B ∪ C", bottomRow: "D ∪ A", pattern: "5+3-subset" }
        );
        
        // 4 + 4 = 8 tokens
        templates.push(
            // A = B′ (4 tokens) + C ∪ D (3 tokens) = 7... need one more
            // A = B′ (4 tokens) + C ∪ D′ (4 tokens) = 8 ✓
            { topRow: "A = B′", bottomRow: "C ∪ D′", pattern: "4+4-prime" },
            // A′ = B (4 tokens) + C ∪ D′ (4 tokens) = 8 ✓
            { topRow: "A′ = B", bottomRow: "C ∪ D′", pattern: "4+4-prime" }
        );
        
        // 6 + 2 = 8 tokens
        templates.push(
            // A ∪ B = C ∪ D (7 tokens) + A = 7 + 1 = 8 ✓
            { topRow: "A ∪ B = C ∪ D", bottomRow: "A", pattern: "7+1-eq" },
            // A ∪ B = C′ (6 tokens) + D′ (2 tokens) = 8 ✓
            { topRow: "A ∪ B = C′", bottomRow: "D′", pattern: "6+2-prime" },
            // A ∪ B′ = C (6 tokens) + D′ (2 tokens) = 8 ✓
            { topRow: "A ∪ B′ = C", bottomRow: "D′", pattern: "6+2-prime" }
        );
        
        // ===== CATEGORY 3: Two restriction cubes (= AND ⊆) =====
        templates.push(
            // A ⊆ B = C (5 tokens - reads as "A subset B equals C") + D ∪ A (3) = 8 ✓
            { topRow: "A ⊆ B = C", bottomRow: "D ∪ A", pattern: "5+3-both" },
            // A = B ⊆ C (5 tokens) + D ∪ A (3) = 8 ✓
            { topRow: "A = B ⊆ C", bottomRow: "D ∪ A", pattern: "5+3-both" }
        );
        
        // ===== CATEGORY 4: Universe/Null (8 tokens total) =====
        templates.push(
            // U = A ∪ B (5 tokens) + C ∪ D (3 tokens) = 8 ✓
            { topRow: "U = A ∪ B", bottomRow: "C ∪ D", pattern: "5+3-univ-eq" },
            // A ∪ B = U (5 tokens) + C ∪ D (3 tokens) = 8 ✓
            { topRow: "A ∪ B = U", bottomRow: "C ∪ D", pattern: "5+3-univ-eq" },
            // ∅ = A ∩ B (5 tokens) + C ∪ D (3 tokens) = 8 ✓
            { topRow: "∅ = A ∩ B", bottomRow: "C ∪ D", pattern: "5+3-null-eq" },
            // A ∩ B = ∅ (5 tokens) + C ∪ D (3 tokens) = 8 ✓
            { topRow: "A ∩ B = ∅", bottomRow: "C ∪ D", pattern: "5+3-null-eq" },
            // U = A (3 tokens) + B ∪ C ∪ D (5 tokens) = 8 ✓
            { topRow: "U = A", bottomRow: "B ∪ C ∪ D", pattern: "3+5-univ-eq" },
            // A = U (3 tokens) + B ∪ C ∪ D (5 tokens) = 8 ✓
            { topRow: "A = U", bottomRow: "B ∪ C ∪ D", pattern: "3+5-univ-eq" },
            // U − A − B − C′ (8 tokens, no restriction)
            { topRow: null, bottomRow: "U − A − B − C′", pattern: "8-univ-diff" }
        );
        
        // Validate all templates
        templates.forEach(t => {
            const count = this.countTokens(t);
            if (count !== 8) {
                console.error(`❌ Template has ${count} tokens, expected 8:`, t);
            }
        });
        
        console.log(`✅ Created ${templates.length} validated 8-token templates`);
        
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
            
            // Generate dice from the 8-cube solution
            const dice = this.generateDiceFromSolution(solution);
            
            // Find the shortest possible solution with these cards and dice
            const shortestSolution = findShortestSolution(cards, dice, goal);
            
            // Calculate difficulty based on shortest solution
            const difficulty = this.calculateDifficulty(shortestSolution);
            
            return {
                cards: cards,
                dice: dice, // Pre-generated dice - no need to regenerate at runtime
                solution: solution, // The 8-cube solution we generated
                goal: goal,
                matchingCards: Array.from(matchingIndices),
                difficulty: difficulty,
                shortestSolution: shortestSolution, // The easiest way to solve it
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
        const templateString = (template.topRow || '') + (template.bottomRow || '');
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
        
        // Count restriction cubes in the solution
        const fullSolution = (topRow || '') + ' ' + (bottomRow || '');
        const restrictionCubeCount = (fullSolution.match(/=/g) || []).length + 
                                      (fullSolution.match(/⊆/g) || []).length;
        
        return {
            topRow: topRow,
            bottomRow: bottomRow,
            pattern: template.pattern,
            // Identification flags
            hasRestriction: topRow && (topRow.includes('=') || topRow.includes('⊆')),
            restrictionCubeCount: restrictionCubeCount, // 0, 1, or 2
            isSetNameOnly: !topRow || (!topRow.includes('=') && !topRow.includes('⊆'))
        };
    }
    
    /**
     * Evaluate a solution against a set of cards to determine which cards match
     * Uses the same evaluation logic as the game (from setTheory.js)
     */
    evaluateSolution(solution, cards) {
        const { topRow, bottomRow } = solution;
        
        // Convert string expressions to dice objects
        const topDice = topRow ? this.stringToDice(topRow) : [];
        const bottomDice = bottomRow ? this.stringToDice(bottomRow) : [];
        
        // Determine which row has restriction and which has set name
        const hasTopRestriction = topRow && (topRow.includes('=') || topRow.includes('⊆'));
        const hasBottomRestriction = bottomRow && (bottomRow.includes('=') || bottomRow.includes('⊆'));
        
        let activeCards = cards; // Cards available for set name evaluation
        let cardsToFlip = [];
        
        // Step 1: Apply restriction if present
        if (hasTopRestriction) {
            // Top row is restriction
            cardsToFlip = evaluateRestriction(topDice, cards);
            // Filter to only non-flipped cards
            const flippedSet = new Set(cardsToFlip);
            activeCards = cards.filter((_, idx) => !flippedSet.has(idx));
        } else if (hasBottomRestriction) {
            // Bottom row is restriction
            cardsToFlip = evaluateRestriction(bottomDice, cards);
            const flippedSet = new Set(cardsToFlip);
            activeCards = cards.filter((_, idx) => !flippedSet.has(idx));
        }
        
        // Step 2: Evaluate set name against active cards
        let setNameDice = null;
        if (hasTopRestriction) {
            // Top is restriction, bottom is set name
            setNameDice = bottomDice;
        } else if (hasBottomRestriction) {
            // Bottom is restriction, top is set name
            setNameDice = topDice;
        } else {
            // No restriction, bottom row is set name
            setNameDice = bottomDice;
        }
        
        if (!setNameDice || setNameDice.length === 0) {
            return new Set();
        }
        
        // Evaluate set name
        const matchingIndices = evaluateExpression(setNameDice, activeCards);
        
        // Map back to original card indices if we filtered
        if (cardsToFlip.length > 0) {
            const flippedSet = new Set(cardsToFlip);
            const originalIndices = cards
                .map((_, idx) => idx)
                .filter(idx => !flippedSet.has(idx));
            
            // Convert active card indices back to original indices
            const finalIndices = new Set();
            matchingIndices.forEach(activeIdx => {
                finalIndices.add(originalIndices[activeIdx]);
            });
            return finalIndices;
        }
        
        return matchingIndices;
    }
    
    /**
     * Convert a solution string (e.g., "red ∪ blue") to dice objects
     */
    stringToDice(expr) {
        if (!expr) return [];
        
        // Parse into tokens, handling parentheses and prime
        let tokens = expr.split(/\s+/).map(t => t.replace(/[()]/g, ''));
        
        // Split tokens with attached prime (e.g., "gold′" → ["gold", "′"])
        const finalTokens = [];
        tokens.forEach(token => {
            if (token.includes('′')) {
                const parts = token.split('′');
                parts.forEach((part, i) => {
                    if (part) finalTokens.push(part);
                    if (i < parts.length - 1) finalTokens.push('′');
                });
            } else if (token) {
                finalTokens.push(token);
            }
        });
        
        // Convert tokens to dice objects with positions
        return finalTokens.map((token, i) => {
            let dieType = 'operator';
            
            if (['red', 'blue', 'green', 'gold'].includes(token)) {
                dieType = 'color';
            } else if (['=', '⊆'].includes(token)) {
                dieType = 'restriction';
            } else if (['U', '∅'].includes(token)) {
                dieType = 'set-constant';
            } else if (['∪', '∩', '−', '′'].includes(token)) {
                dieType = 'operator';
            }
            
            return {
                value: token,
                type: dieType,
                x: i * 100, // Space dice evenly for left-to-right evaluation
                y: 10,
                id: `eval-${i}`
            };
        });
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
        
        // Generate dice for the fallback puzzle
        const dice = this.generateDiceFromSolution(solution);
        
        // Hardcoded shortest solution for the fallback (3 cubes: "red ∪ green")
        const shortestSolution = {
            cubeCount: 3,
            hasRestriction: false,
            restrictionDice: null,
            setNameDice: [
                { value: 'red', type: 'color', id: 'fallback-1', x: 0, y: 10 },
                { value: '∪', type: 'operator', id: 'fallback-2', x: 100, y: 10 },
                { value: 'green', type: 'color', id: 'fallback-3', x: 200, y: 10 }
            ],
            totalCubes: 3
        };
        
        return {
            cards: cards,
            dice: dice, // Pre-generated dice
            solution: solution,
            goal: 4, // cards with red or green match (after restriction)
            matchingCards: [0, 2, 4, 6],
            difficulty: 'beginner',
            shortestSolution: shortestSolution,
            template: 'fallback',
            timestamp: Date.now()
        };
    }
    
    /**
     * Generate dice from a solution template
     * This creates the 8 dice that the player can use
     * Parses the full expression token by token to extract exactly what's needed
     */
    generateDiceFromSolution(solution) {
        const dice = [];
        
        // Combine both rows into one expression
        let expr = '';
        if (solution.topRow) expr += solution.topRow + ' ';
        if (solution.bottomRow) expr += solution.bottomRow;
        expr = expr.trim();
        
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
                    type: dieType,
                    id: `die-${Date.now()}-${Math.random()}`
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
                dice.push({ 
                    value: '∪', 
                    type: 'operator',
                    id: `die-filler-${Date.now()}-${Math.random()}`
                });
            }
            if (dice.length > 8) {
                dice.length = 8;
            }
        }
        
        return dice;
    }
    
    /**
     * Calculate puzzle difficulty based on shortest solution cube count
     * Beginner: 2-4 cubes, Intermediate: 5-6 cubes, Advanced: 7-8 cubes
     */
    calculateDifficulty(shortestSolution) {
        if (!shortestSolution) {
            return 'intermediate'; // Fallback if no solution found
        }
        
        const cubeCount = shortestSolution.cubeCount;
        
        if (cubeCount <= 4) {
            return 'beginner';
        } else if (cubeCount <= 6) {
            return 'intermediate';
        } else {
            return 'advanced';
        }
    }
    
    /**
     * DEPRECATED: Estimate puzzle difficulty based on solution complexity
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
        console.log(`📊 Difficulty: ${puzzle.difficulty} (based on shortest solution)`);
        console.log(`\n✅ GENERATED SOLUTION (8 cubes):`);
        
        const sol = puzzle.solution;
        if (sol.topRow && sol.bottomRow) {
            console.log(`   Top Row:    ${sol.topRow}`);
            console.log(`   Bottom Row: ${sol.bottomRow}`);
        } else if (sol.topRow) {
            console.log(`   Top Row:    ${sol.topRow}`);
            console.log(`   Bottom Row: (empty)`);
        } else if (sol.bottomRow) {
            console.log(`   Top Row:    (empty)`);
            console.log(`   Bottom Row: ${sol.bottomRow}`);
        }
        
        // Display solution type
        if (sol.restrictionCubeCount === 0) {
            console.log(`   Type: Set Name Only (no restriction)`);
        } else if (sol.restrictionCubeCount === 1) {
            console.log(`   Type: One Restriction (1 cube) + Set Name`);
        } else if (sol.restrictionCubeCount === 2) {
            console.log(`   Type: One Restriction (2 cubes: = and ⊆) + Set Name`);
        }
        
        // Display shortest solution
        console.log(`\n⭐ SHORTEST SOLUTION (${puzzle.shortestSolution ? puzzle.shortestSolution.cubeCount : '?'} cubes):`);
        if (puzzle.shortestSolution) {
            const shortest = puzzle.shortestSolution;
            if (shortest.hasRestriction) {
                console.log(`   Restriction: ${shortest.restrictionDice.map(d => d.value).join(' ')}`);
                console.log(`   Set Name:    ${shortest.setNameDice.map(d => d.value).join(' ')}`);
            } else {
                console.log(`   Set Name:    ${shortest.setNameDice.map(d => d.value).join(' ')}`);
            }
        } else {
            console.log(`   (None found)`);
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

// Export for ES6 module
export default DailyPuzzleGenerator;

// Also expose globally for backwards compatibility
if (typeof window !== 'undefined') {
    window.DailyPuzzleGenerator = DailyPuzzleGenerator;
}
