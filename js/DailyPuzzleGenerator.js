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
import { generateCardConfig } from './levels.js';

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
        const ops = ['∪', '∩', '−']; // Regular operators
        
        // ===== CATEGORY 1: No Restriction (8 tokens) =====
        
        // color op color op color op color′ (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ops.forEach(op3 => {
                    templates.push({ 
                        topRow: null, 
                        bottomRow: `color ${op1} color ${op2} color ${op3} color′`, 
                        pattern: "8-setname"
                    });
                });
            });
        });
        
        // setName op color op color op color′ (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ops.forEach(op3 => {
                    templates.push({ 
                        topRow: null, 
                        bottomRow: `setName ${op1} color ${op2} color ${op3} color′`, 
                        pattern: "8-setname-univ"
                    });
                });
            });
        });
        
        // ===== CATEGORY 2: Restriction + Set Name = 8 tokens =====
        
        // 3+5: color restriction color + color op color op color (8 tokens)
        ops.forEach(op => {
            ['=', '⊆'].forEach(restr => {
                templates.push({ 
                    topRow: `color ${restr} color`, 
                    bottomRow: `color ${op} color ${op} color`, 
                    pattern: `3+5-${restr}`
                });
            });
        });
        
        // 5+3: color op color restriction color + color op color (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({ 
                        topRow: `color ${op1} color ${restr} color`, 
                        bottomRow: `color ${op2} color`, 
                        pattern: `5+3-${restr}`
                    });
                });
            });
        });
        
        // 5+3: color restriction color op color + color op color (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({ 
                        topRow: `color ${restr} color ${op1} color`, 
                        bottomRow: `color ${op2} color`, 
                        pattern: `5+3-${restr}`
                    });
                });
            });
        });
        
        // 4+4: color restriction color′ + color op color′ (8 tokens)
        ops.forEach(op => {
            ['=', '⊆'].forEach(restr => {
                templates.push({ 
                    topRow: `color ${restr} color′`, 
                    bottomRow: `color ${op} color′`, 
                    pattern: `4+4-${restr}`
                });
            });
        });
        
        // 7+1: color op color restriction color op color + color (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({ 
                        topRow: `color ${op1} color ${restr} color ${op2} color`, 
                        bottomRow: `color`, 
                        pattern: `7+1-${restr}`
                    });
                });
            });
        });
        
        // ===== CATEGORY 3: Two Restriction Cubes (= AND ⊆) =====
        
        // 5+3: color restriction color restriction color + color op color (8 tokens)
        ops.forEach(op => {
            templates.push({ 
                topRow: `color ⊆ color = color`, 
                bottomRow: `color ${op} color`, 
                pattern: `5+3-both`
            });
            templates.push({ 
                topRow: `color = color ⊆ color`, 
                bottomRow: `color ${op} color`, 
                pattern: `5+3-both`
            });
        });
        
        // ===== CATEGORY 4: Universe/Null (8 tokens) =====
        
        // 5+3: setName restriction color op color + color op color (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({ 
                        topRow: `setName ${restr} color ${op1} color`, 
                        bottomRow: `color ${op2} color`, 
                        pattern: `5+3-setName-${restr}`
                    });
                    templates.push({ 
                        topRow: `color ${op1} color ${restr} setName`, 
                        bottomRow: `color ${op2} color`, 
                        pattern: `5+3-setName-${restr}`
                    });
                });
            });
        });
        
        // 3+5: setName restriction color + color op color op color (8 tokens)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({ 
                        topRow: `setName ${restr} color`, 
                        bottomRow: `color ${op1} color ${op2} color`, 
                        pattern: `3+5-setName-${restr}`
                    });
                    templates.push({ 
                        topRow: `color ${restr} setName`, 
                        bottomRow: `color ${op1} color ${op2} color`, 
                        pattern: `3+5-setName-${restr}`
                    });
                });
            });
        });
        
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
     * Generate a batch of puzzles for offline storage
     * @param {number} count - Number of puzzles to generate
     * @returns {Array} - Array of puzzle objects
     */
    generateBatch(count) {
        console.log(`\n🎲 Generating batch of ${count} daily puzzles...`);
        const puzzles = [];
        const startTime = Date.now();
        
        for (let i = 0; i < count; i++) {
            const puzzle = this.generatePuzzle();
            if (puzzle) {
                puzzles.push({
                    id: i + 1,
                    ...puzzle
                });
                console.log(`✅ Puzzle ${i + 1}/${count} generated (Difficulty: ${puzzle.difficulty.rating}, Goal: ${puzzle.goal})`);
            } else {
                console.warn(`⚠️ Puzzle ${i + 1}/${count} failed to generate after max attempts`);
            }
        }
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Batch complete! Generated ${puzzles.length}/${count} puzzles in ${elapsed}s`);
        
        // Generate statistics
        this.logBatchStatistics(puzzles);
        
        return puzzles;
    }
    
    /**
     * Log statistics about a batch of puzzles
     */
    logBatchStatistics(puzzles) {
        console.log('\n📊 BATCH STATISTICS:');
        
        // Difficulty distribution
        const diffCounts = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
        puzzles.forEach(p => diffCounts[p.difficulty.rating]++);
        console.log('Difficulty Distribution:');
        Object.entries(diffCounts).forEach(([rating, count]) => {
            const pct = ((count / puzzles.length) * 100).toFixed(1);
            console.log(`  ${rating}: ${count} (${pct}%)`);
        });
        
        // Goal distribution
        const goalCounts = {};
        puzzles.forEach(p => {
            goalCounts[p.goal] = (goalCounts[p.goal] || 0) + 1;
        });
        console.log('\nGoal Distribution (matching cards):');
        Object.entries(goalCounts).sort((a, b) => a[0] - b[0]).forEach(([goal, count]) => {
            const pct = ((count / puzzles.length) * 100).toFixed(1);
            console.log(`  ${goal} cards: ${count} (${pct}%)`);
        });
        
        // Cube usage in shortest solutions
        const cubeCounts = {};
        puzzles.forEach(p => {
            const cubes = p.shortestSolution.cubeCount;
            cubeCounts[cubes] = (cubeCounts[cubes] || 0) + 1;
        });
        console.log('\nShortest Solution Length:');
        Object.entries(cubeCounts).sort((a, b) => a[0] - b[0]).forEach(([cubes, count]) => {
            const pct = ((count / puzzles.length) * 100).toFixed(1);
            console.log(`  ${cubes} cubes: ${count} (${pct}%)`);
        });
        
        console.log('\n');
    }
    
    /**
     * Export batch to JSON format (for offline storage)
     * Solutions are stored in plain text for now - will obfuscate in Phase 2
     */
    exportBatch(puzzles) {
        const exportData = {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            count: puzzles.length,
            puzzles: puzzles.map(p => ({
                id: p.id,
                cards: p.cards,
                dice: p.dice,
                goal: p.goal,
                difficulty: p.difficulty,
                // 8-cube solution (for reference/validation, not shown to player)
                generatedSolution: {
                    topRow: p.solution.topRow,
                    bottomRow: p.solution.bottomRow
                },
                // Shortest solution (for scoring/difficulty calculation)
                shortestSolution: {
                    cubeCount: p.shortestSolution.cubeCount,
                    hasRestriction: p.shortestSolution.hasRestriction
                }
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
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
            
            // Instantiate the template with real colors/operators
            // Abstract types (color, setName) are replaced with random concrete values
            const solution = this.instantiateTemplate(template);
            
            // Generate 8 random cards using existing game function
            const cards = generateCardConfig(8);
            
            // Evaluate the solution against these cards
            const matchingIndices = this.evaluateSolution(solution, cards);
            
            // The goal is the number of matching cards
            const goal = matchingIndices.size;
            
            // Validate: we want 1-7 matching cards (matching regular game goal range)
            // Exclude 0 (impossible) and 8 (too easy - everything matches)
            if (goal === 0 || goal === 8 || goal > 8) {
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
     * No color mapping needed - we replace abstract types directly
     * This method is kept for backwards compatibility but not used
     */
    createColorMapping(template) {
        return {};
    }
    
    /**
     * Instantiate a template with actual colors
     * Replaces abstract types: "color", "setName" with concrete values
     * Allows natural reuse by picking colors randomly for each occurrence
     */
    instantiateTemplate(template) {
        const replaceAbstractTypes = (expr) => {
            if (!expr) return null;
            
            // Replace each "color" with a random color (allows natural reuse)
            let result = expr;
            while (result.includes('color')) {
                const randomColor = this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
                result = result.replace('color', randomColor);
            }
            
            // Replace each "setName" with U or ∅ (50/50 chance)
            while (result.includes('setName')) {
                const randomSetName = Math.random() < 0.5 ? 'U' : '∅';
                result = result.replace('setName', randomSetName);
            }
            
            return result;
        };
        
        const topRow = replaceAbstractTypes(template.topRow);
        const bottomRow = replaceAbstractTypes(template.bottomRow);
        
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
                    type: dieType,
                    value: token
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
     * Log a puzzle to console for debugging
     * Handles both generated puzzles and loaded puzzles from JSON
     */
    logPuzzle(puzzle) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎲 DAILY PUZZLE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 ID:         ${puzzle.id || 'N/A'}`);
        console.log(`🎯 Goal:       ${puzzle.goal} cards`);
        
        // Handle difficulty (could be string or object)
        const difficultyStr = typeof puzzle.difficulty === 'object' 
            ? puzzle.difficulty.rating 
            : puzzle.difficulty;
        console.log(`📊 Difficulty: ${difficultyStr} (based on shortest solution)`);
        console.log(`\n✅ GENERATED SOLUTION (8 cubes):`);
        
        // Handle both 'solution' (generated) and 'generatedSolution' (loaded from JSON)
        const sol = puzzle.solution || puzzle.generatedSolution;
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
        
        // Display solution type (if available from generated puzzles)
        if (typeof sol.restrictionCubeCount !== 'undefined') {
            if (sol.restrictionCubeCount === 0) {
                console.log(`   Type: Set Name Only (no restriction)`);
            } else if (sol.restrictionCubeCount === 1) {
                console.log(`   Type: One Restriction (1 cube) + Set Name`);
            } else if (sol.restrictionCubeCount === 2) {
                console.log(`   Type: One Restriction (2 cubes: = and ⊆) + Set Name`);
            }
        }
        
        // Display shortest solution
        console.log(`\n⭐ SHORTEST SOLUTION (${puzzle.shortestSolution ? puzzle.shortestSolution.cubeCount : '?'} cubes):`);
        if (puzzle.shortestSolution) {
            const shortest = puzzle.shortestSolution;
            if (shortest.hasRestriction !== undefined) {
                console.log(`   Has Restriction: ${shortest.hasRestriction ? 'Yes' : 'No'}`);
            }
            // Only show detailed dice if available (generated puzzles have this)
            if (shortest.restrictionDice && shortest.setNameDice) {
                if (shortest.hasRestriction) {
                    console.log(`   Restriction: ${shortest.restrictionDice.map(d => d.value).join(' ')}`);
                }
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

export default DailyPuzzleGenerator;
