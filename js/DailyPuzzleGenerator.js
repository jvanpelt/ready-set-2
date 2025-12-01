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
import { generateCardConfig, generateDiceForLevel } from './levels.js';

class DailyPuzzleGenerator {
    constructor() {
        // UNUSED: These arrays are defined but never referenced
        // Keeping commented out in case needed for future features
        // this.COLORS = ['red', 'blue', 'green', 'gold'];
        // this.OPERATORS = ['∪', '∩', '−'];
        // this.RESTRICTIONS = ['=', '⊆'];
        
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
     * Generate all grouping variations for expressions with 2+ operators
     * For example: "color ∪ color ∩ color" generates:
     *   - "(color ∪ color) ∩ color" (left grouping)
     *   - "color ∪ (color ∩ color)" (right grouping)
     */
    generateGroupingVariations(expr) {
        if (!expr) return [expr];
        
        const variations = [expr]; // Include ungrouped version
        
        // Count operators in expression (including prime)
        const operators = (expr.match(/[∪∩−′]/g) || []);
        
        // If less than 2 operators, no grouping needed
        if (operators.length < 2) return [expr];
        
        // Split expression into tokens
        const tokens = expr.split(' ').filter(t => t && !t.match(/^[()]+$/));
        
        // PATTERN 1: Two regular operators (A op1 B op2 C)
        // Matches: "color ∪ color ∩ color"
        if (tokens.length === 5 && operators.length === 2 && !expr.includes('′')) {
            const [t0, op1, t1, op2, t2] = tokens;
            variations.push(`(${t0} ${op1} ${t1}) ${op2} ${t2}`); // Left
            variations.push(`${t0} ${op1} (${t1} ${op2} ${t2})`); // Right
        }
        
        // PATTERN 2: Operator + Prime (A op B′)
        // Matches: "color ∪ color′"
        else if (tokens.length === 3 && expr.includes('′')) {
            const primeIndex = tokens.findIndex(t => t.includes('′'));
            if (primeIndex === 2) { // Prime on last token
                const [t0, op, t1] = tokens;
                const t1Base = t1.replace('′', '');
                variations.push(`(${t0} ${op} ${t1Base})′`); // Prime on whole
                variations.push(`${t0} ${op} (${t1Base}′)`); // Prime on last only
            }
        }
        
        // PATTERN 3: Prime + Operator (A′ op B)
        // Matches: "color′ ∪ color"
        else if (tokens.length === 3 && expr.includes('′')) {
            const primeIndex = tokens.findIndex(t => t.includes('′'));
            if (primeIndex === 0) { // Prime on first token
                const [t0, op, t1] = tokens;
                const t0Base = t0.replace('′', '');
                variations.push(`(${t0Base}′) ${op} ${t1}`); // Explicit grouping (same as ungrouped)
                variations.push(`(${t0Base} ${op} ${t1})′`); // Prime on whole
            }
        }
        
        // PATTERN 4: Two operators + Prime (A op1 B op2 C′)
        // Matches: "color ∪ color ∩ color′"
        else if (tokens.length === 5 && expr.includes('′')) {
            const primeIndex = tokens.findIndex(t => t.includes('′'));
            if (primeIndex === 4) { // Prime on last token
                const [t0, op1, t1, op2, t2] = tokens;
                const t2Base = t2.replace('′', '');
                // All grouping combinations
                variations.push(`(${t0} ${op1} ${t1}) ${op2} (${t2Base}′)`); // Left + prime on last
                variations.push(`${t0} ${op1} (${t1} ${op2} ${t2Base}′)`); // Right + prime on last
                variations.push(`(${t0} ${op1} ${t1}) ${op2} ${t2Base})`); // Left + prime on whole (invalid - ignoring for now)
                variations.push(`((${t0} ${op1} ${t1}) ${op2} ${t2Base})′`); // Prime on entire expression
                variations.push(`(${t0} ${op1} (${t1} ${op2} ${t2Base}))′`); // Prime on right-grouped
            }
        }
        
        // PATTERN 5: Prime + Two operators (A′ op1 B op2 C)
        // Matches: "color′ ∪ color ∩ color"
        else if (tokens.length === 5 && expr.includes('′')) {
            const primeIndex = tokens.findIndex(t => t.includes('′'));
            if (primeIndex === 0) { // Prime on first token
                const [t0, op1, t1, op2, t2] = tokens;
                const t0Base = t0.replace('′', '');
                variations.push(`(${t0Base}′ ${op1} ${t1}) ${op2} ${t2}`); // Left with prime
                variations.push(`${t0Base}′ ${op1} (${t1} ${op2} ${t2})`); // Right with prime
                variations.push(`((${t0Base}′ ${op1} ${t1}) ${op2} ${t2})`); // Whole left
                variations.push(`((${t0Base} ${op1} ${t1}) ${op2} ${t2})′`); // Prime on whole
            }
        }
        
        // PATTERN 6: Four tokens with prime (A op B prime op C)
        // Matches: "color ∪ color′ ∩ color"
        else if (tokens.length === 4 && expr.includes('′')) {
            // This is complex, variations depend on where the prime is
            // For now, return ungrouped version
        }
        
        return variations;
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
        
        // ===== CATEGORY 1: Valid Restriction + Set Name Templates =====
        // Note: Templates with 5+ color tokens have been removed
        // as they violate the 4-color maximum rule
        
        // REMOVED: 3+5, 5+3, 7+1, 5+3-both patterns (all had 5 color tokens)
        // REMOVED: 4+4 pattern (had 3 operators: 2× ′ + 1× regular operator)
        
        // ===== CATEGORY 4: Universe/Null (8 tokens) =====
        
        // 5+3: setName restriction color op color + color op color (8 tokens)
        // WITH GROUPING VARIATIONS for restriction row (has 2 operators)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    // Base patterns with all setName positions
                    const basePatterns = [
                        { topRow: `setName ${restr} color ${op1} color`, bottomRow: `color ${op2} color` },
                        { topRow: `color ${op1} setName ${restr} color`, bottomRow: `color ${op2} color` },
                        { topRow: `color ${op1} color ${restr} setName`, bottomRow: `color ${op2} color` },
                        { topRow: `color ${op1} color ${restr} color`, bottomRow: `setName ${op2} color` },
                        { topRow: `color ${op1} color ${restr} color`, bottomRow: `color ${op2} setName` }
                    ];
                    
                    basePatterns.forEach((base, idx) => {
                        // Generate grouping variations for the row with 2 operators
                        const topVariations = this.generateGroupingVariations(base.topRow);
                        const bottomVariations = this.generateGroupingVariations(base.bottomRow);
                        
                        // Create template for each combination of variations
                        topVariations.forEach((topVar, tIdx) => {
                            bottomVariations.forEach((bottomVar, bIdx) => {
                                templates.push({
                                    topRow: topVar,
                                    bottomRow: bottomVar,
                                    pattern: `5+3-p${idx}-${restr}-t${tIdx}b${bIdx}`
                                });
                            });
                        });
                    });
                });
            });
        });
        
        // 3+5: setName restriction color + color op color op color (8 tokens)
        // WITH GROUPING VARIATIONS for set name row (has 2 operators)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    // Base patterns with all setName positions
                    const basePatterns = [
                        { topRow: `setName ${restr} color`, bottomRow: `color ${op1} color ${op2} color` },
                        { topRow: `color ${restr} setName`, bottomRow: `color ${op1} color ${op2} color` },
                        { topRow: `color ${restr} color`, bottomRow: `setName ${op1} color ${op2} color` },
                        { topRow: `color ${restr} color`, bottomRow: `color ${op1} setName ${op2} color` },
                        { topRow: `color ${restr} color`, bottomRow: `color ${op1} color ${op2} setName` }
                    ];
                    
                    basePatterns.forEach((base, idx) => {
                        // Generate grouping variations for the row with 2 operators
                        const topVariations = this.generateGroupingVariations(base.topRow);
                        const bottomVariations = this.generateGroupingVariations(base.bottomRow);
                        
                        // Create template for each combination of variations
                        topVariations.forEach((topVar, tIdx) => {
                            bottomVariations.forEach((bottomVar, bIdx) => {
                                templates.push({
                                    topRow: topVar,
                                    bottomRow: bottomVar,
                                    pattern: `3+5-p${idx}-${restr}-t${tIdx}b${bIdx}`
                                });
                            });
                        });
                    });
                });
            });
        });
        
        // ===== CATEGORY 5: 7+1 Templates (7-cube restriction + 1-cube set name) =====
        // These use all 2 operators in the restriction row, leaving just 1 cube for set name
        // All 7-cube restriction patterns from setTheory.js have exactly 2 operators
        
        // Pattern 1: color op color restriction color op setName + color (7+1)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({
                        topRow: `color ${op1} color ${restr} color ${op2} setName`,
                        bottomRow: `color`,
                        pattern: `7+1-pattern1-${restr}`
                    });
                });
            });
        });
        
        // Pattern 2: color op color restriction setName op color + color (7+1)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({
                        topRow: `color ${op1} color ${restr} setName ${op2} color`,
                        bottomRow: `color`,
                        pattern: `7+1-pattern2-${restr}`
                    });
                });
            });
        });
        
        // Pattern 3: color op setName restriction color op color + color (7+1)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({
                        topRow: `color ${op1} setName ${restr} color ${op2} color`,
                        bottomRow: `color`,
                        pattern: `7+1-pattern3-${restr}`
                    });
                });
            });
        });
        
        // Pattern 4: setName op color restriction color op color + color (7+1)
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({
                        topRow: `setName ${op1} color ${restr} color ${op2} color`,
                        bottomRow: `color`,
                        pattern: `7+1-pattern4-${restr}`
                    });
                });
            });
        });
        
        // Pattern 5:  
        ops.forEach(op1 => {
            ops.forEach(op2 => {
                ['=', '⊆'].forEach(restr => {
                    templates.push({
                        topRow: `color ${op1} color ${restr} color ${op2} color`,
                        bottomRow: `setName`,
                        pattern: `7+1-pattern5-${restr}`
                    });
                });
            });
        });
        
        // ===== CATEGORY 6: 6+2 Templates with 2 Restrictions (double restriction) =====
        // Pattern: color restr1 color restr2 color prime + color prime (6+2)
        // Uses 2 restrictions in top row, 2 prime operators (one in each row)
        // Total: 4 colors, 2 operators (both prime), 2 restrictions
        ['=', '⊆'].forEach(restr1 => {
            ['=', '⊆'].forEach(restr2 => {
                templates.push({
                    topRow: `color ${restr1} color ${restr2} color′`,
                    bottomRow: `color′`,
                    pattern: `6+2-double-${restr1}${restr2}`
                });
            });
        });
        
        // ===== CATEGORY 7: 4+3 and 3+4 Templates with Prime (7-cube max solutions) =====
        // These allow proper use of prime operator while staying within physical constraints
        // 1 restriction + 1 prime + 1 regular operator + 4 colors OR 3 colors + 1 setName
        // Total: 7 cubes (but puzzle still has 8 dice with 1 unused)
        
        ops.forEach(op => {
            ['=', '⊆'].forEach(restr => {
                // Pattern A1: 4+3 with prime before restriction, 4 colors
                // color prime restriction color + color operator color (7 tokens)
                const patternA1 = { topRow: `color′ ${restr} color`, bottomRow: `color ${op} color` };
                const topVarsA1 = this.generateGroupingVariations(patternA1.topRow);
                const bottomVarsA1 = this.generateGroupingVariations(patternA1.bottomRow);
                topVarsA1.forEach((topVar, tIdx) => {
                    bottomVarsA1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern A2: 4+3 with prime after first color, 4 colors
                // color restriction color prime + color operator color (7 tokens)
                const patternA2 = { topRow: `color ${restr} color′`, bottomRow: `color ${op} color` };
                const topVarsA2 = this.generateGroupingVariations(patternA2.topRow);
                const bottomVarsA2 = this.generateGroupingVariations(patternA2.bottomRow);
                topVarsA2.forEach((topVar, tIdx) => {
                    bottomVarsA2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern A3: 4+3 with prime before restriction, 3 colors + 1 setName in bottom row
                // color prime restriction color + color operator setName (7 tokens)
                const baseA3_1 = { topRow: `color′ ${restr} color`, bottomRow: `color ${op} setName` };
                const topVarsA3_1 = this.generateGroupingVariations(baseA3_1.topRow);
                const bottomVarsA3_1 = this.generateGroupingVariations(baseA3_1.bottomRow);
                topVarsA3_1.forEach((topVar, tIdx) => {
                    bottomVarsA3_1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A3.1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseA3_2 = { topRow: `color′ ${restr} color`, bottomRow: `setName ${op} color` };
                const topVarsA3_2 = this.generateGroupingVariations(baseA3_2.topRow);
                const bottomVarsA3_2 = this.generateGroupingVariations(baseA3_2.bottomRow);
                topVarsA3_2.forEach((topVar, tIdx) => {
                    bottomVarsA3_2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A3.2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern A4: 4+3 with prime after first color, 3 colors + 1 setName in bottom row
                // color restriction color prime + color operator setName (7 tokens)
                const baseA4_1 = { topRow: `color ${restr} color′`, bottomRow: `color ${op} setName` };
                const topVarsA4_1 = this.generateGroupingVariations(baseA4_1.topRow);
                const bottomVarsA4_1 = this.generateGroupingVariations(baseA4_1.bottomRow);
                topVarsA4_1.forEach((topVar, tIdx) => {
                    bottomVarsA4_1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A4.1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseA4_2 = { topRow: `color ${restr} color′`, bottomRow: `setName ${op} color` };
                const topVarsA4_2 = this.generateGroupingVariations(baseA4_2.topRow);
                const bottomVarsA4_2 = this.generateGroupingVariations(baseA4_2.bottomRow);
                topVarsA4_2.forEach((topVar, tIdx) => {
                    bottomVarsA4_2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A4.2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern A5: 4+3 with setName in top row (various positions)
                // color prime restriction setName + color operator color (7 tokens)
                const baseA5 = { topRow: `color′ ${restr} setName`, bottomRow: `color ${op} color` };
                const topVarsA5 = this.generateGroupingVariations(baseA5.topRow);
                const bottomVarsA5 = this.generateGroupingVariations(baseA5.bottomRow);
                topVarsA5.forEach((topVar, tIdx) => {
                    bottomVarsA5.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A5-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // setName prime restriction color + color operator color (7 tokens)
                const baseA6 = { topRow: `setName′ ${restr} color`, bottomRow: `color ${op} color` };
                const topVarsA6 = this.generateGroupingVariations(baseA6.topRow);
                const bottomVarsA6 = this.generateGroupingVariations(baseA6.bottomRow);
                topVarsA6.forEach((topVar, tIdx) => {
                    bottomVarsA6.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A6-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // color restriction setName prime + color operator color (7 tokens)
                const baseA7 = { topRow: `color ${restr} setName′`, bottomRow: `color ${op} color` };
                const topVarsA7 = this.generateGroupingVariations(baseA7.topRow);
                const bottomVarsA7 = this.generateGroupingVariations(baseA7.bottomRow);
                topVarsA7.forEach((topVar, tIdx) => {
                    bottomVarsA7.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A7-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // setName restriction color prime + color operator color (7 tokens)
                const baseA8 = { topRow: `setName ${restr} color′`, bottomRow: `color ${op} color` };
                const topVarsA8 = this.generateGroupingVariations(baseA8.topRow);
                const bottomVarsA8 = this.generateGroupingVariations(baseA8.bottomRow);
                topVarsA8.forEach((topVar, tIdx) => {
                    bottomVarsA8.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `4+3-A8-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern B1: 3+4 with prime before operator, 4 colors
                // color restriction color + color prime operator color (7 tokens)
                const patternB1 = { topRow: `color ${restr} color`, bottomRow: `color′ ${op} color` };
                const topVarsB1 = this.generateGroupingVariations(patternB1.topRow);
                const bottomVarsB1 = this.generateGroupingVariations(patternB1.bottomRow);
                topVarsB1.forEach((topVar, tIdx) => {
                    bottomVarsB1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern B2: 3+4 with prime after operator, 4 colors
                // color restriction color + color operator color prime (7 tokens)
                const patternB2 = { topRow: `color ${restr} color`, bottomRow: `color ${op} color′` };
                const topVarsB2 = this.generateGroupingVariations(patternB2.topRow);
                const bottomVarsB2 = this.generateGroupingVariations(patternB2.bottomRow);
                topVarsB2.forEach((topVar, tIdx) => {
                    bottomVarsB2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern B3: 3+4 with setName in bottom row, various prime positions
                // color restriction color + color prime operator setName (7 tokens)
                const baseB3_1 = { topRow: `color ${restr} color`, bottomRow: `color′ ${op} setName` };
                const topVarsB3_1 = this.generateGroupingVariations(baseB3_1.topRow);
                const bottomVarsB3_1 = this.generateGroupingVariations(baseB3_1.bottomRow);
                topVarsB3_1.forEach((topVar, tIdx) => {
                    bottomVarsB3_1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B3.1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseB3_2 = { topRow: `color ${restr} color`, bottomRow: `setName′ ${op} color` };
                const topVarsB3_2 = this.generateGroupingVariations(baseB3_2.topRow);
                const bottomVarsB3_2 = this.generateGroupingVariations(baseB3_2.bottomRow);
                topVarsB3_2.forEach((topVar, tIdx) => {
                    bottomVarsB3_2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B3.2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseB3_3 = { topRow: `color ${restr} color`, bottomRow: `color ${op} setName′` };
                const topVarsB3_3 = this.generateGroupingVariations(baseB3_3.topRow);
                const bottomVarsB3_3 = this.generateGroupingVariations(baseB3_3.bottomRow);
                topVarsB3_3.forEach((topVar, tIdx) => {
                    bottomVarsB3_3.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B3.3-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseB3_4 = { topRow: `color ${restr} color`, bottomRow: `setName ${op} color′` };
                const topVarsB3_4 = this.generateGroupingVariations(baseB3_4.topRow);
                const bottomVarsB3_4 = this.generateGroupingVariations(baseB3_4.bottomRow);
                topVarsB3_4.forEach((topVar, tIdx) => {
                    bottomVarsB3_4.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B3.4-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // Pattern B4: 3+4 with setName in top row
                // color restriction setName + color prime operator color (7 tokens)
                const baseB4_1 = { topRow: `color ${restr} setName`, bottomRow: `color′ ${op} color` };
                const topVarsB4_1 = this.generateGroupingVariations(baseB4_1.topRow);
                const bottomVarsB4_1 = this.generateGroupingVariations(baseB4_1.bottomRow);
                topVarsB4_1.forEach((topVar, tIdx) => {
                    bottomVarsB4_1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B4.1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseB4_2 = { topRow: `color ${restr} setName`, bottomRow: `color ${op} color′` };
                const topVarsB4_2 = this.generateGroupingVariations(baseB4_2.topRow);
                const bottomVarsB4_2 = this.generateGroupingVariations(baseB4_2.bottomRow);
                topVarsB4_2.forEach((topVar, tIdx) => {
                    bottomVarsB4_2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B4.2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                // setName restriction color + color prime operator color (7 tokens)
                const baseB5_1 = { topRow: `setName ${restr} color`, bottomRow: `color′ ${op} color` };
                const topVarsB5_1 = this.generateGroupingVariations(baseB5_1.topRow);
                const bottomVarsB5_1 = this.generateGroupingVariations(baseB5_1.bottomRow);
                topVarsB5_1.forEach((topVar, tIdx) => {
                    bottomVarsB5_1.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B5.1-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
                
                const baseB5_2 = { topRow: `setName ${restr} color`, bottomRow: `color ${op} color′` };
                const topVarsB5_2 = this.generateGroupingVariations(baseB5_2.topRow);
                const bottomVarsB5_2 = this.generateGroupingVariations(baseB5_2.bottomRow);
                topVarsB5_2.forEach((topVar, tIdx) => {
                    bottomVarsB5_2.forEach((bottomVar, bIdx) => {
                        templates.push({
                            topRow: topVar,
                            bottomRow: bottomVar,
                            pattern: `3+4-B5.2-${restr}-${op}-t${tIdx}b${bIdx}`
                        });
                    });
                });
            });
        });
        
        // Validate all templates
        templates.forEach(t => {
            const count = this.countTokens(t);
            // 7-cube templates are valid (for prime usage), 8-cube templates are the standard
            if (count !== 7 && count !== 8) {
                console.error(`❌ Template has ${count} tokens, expected 7 or 8:`, t);
            }
        });
        
        const count7 = templates.filter(t => this.countTokens(t) === 7).length;
        const count8 = templates.filter(t => this.countTokens(t) === 8).length;
        console.log(`✅ Created ${templates.length} validated templates (${count8} 8-cube, ${count7} 7-cube)`);
        
        return templates;
    }
    
    // UNUSED: We use generateTestSet() instead for creating one puzzle per template
    // Keeping commented out in case we want random generation in the future
    // /**
    //  * Generate a batch of puzzles for offline storage
    //  * @param {number} count - Number of puzzles to generate
    //  * @returns {Array} - Array of puzzle objects
    //  */
    // generateBatch(count) {
    //     console.log(`\n🎲 Generating batch of ${count} daily puzzles...`);
    //     const puzzles = [];
    //     const startTime = Date.now();
    //     
    //     for (let i = 0; i < count; i++) {
    //         const puzzle = this.generatePuzzle();
    //         if (puzzle) {
    //             puzzles.push({
    //                 id: i + 1,
    //                 ...puzzle
    //             });
    //             console.log(`✅ Puzzle ${i + 1}/${count} generated (Difficulty: ${puzzle.difficulty.rating}, Goal: ${puzzle.goal})`);
    //         } else {
    //             console.warn(`⚠️ Puzzle ${i + 1}/${count} failed to generate after max attempts`);
    //         }
    //     }
    //     
    //     const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    //     console.log(`\n✅ Batch complete! Generated ${puzzles.length}/${count} puzzles in ${elapsed}s`);
    //     
    //     // Generate statistics
    //     this.logBatchStatistics(puzzles);
    //     
    //     return puzzles;
    // }
    
    /**
     * Generate one puzzle per template for comprehensive testing
     * @returns {Array} - Array of test puzzle objects
     */
    generateTestSet() {
        console.log(`\n🧪 Generating FULL TEST SET (one puzzle per template)...`);
        const templates = this.createTemplates();
        const puzzles = [];
        const startTime = Date.now();
        let attempts = 0;
        const maxAttemptsPerTemplate = 500; // Increased from 100 for better success rate
        
        templates.forEach((template, index) => {
            console.log(`\n🎯 Template ${index + 1}/${templates.length}: ${template.pattern}`);
            
            let puzzle = null;
            let templateAttempts = 0;
            
            while (!puzzle && templateAttempts < maxAttemptsPerTemplate) {
                templateAttempts++;
                attempts++;
                
                // Generate valid dice using core game logic
                const generatedDice = generateDiceForLevel(6);
                
                // Instantiate template using generated dice
                const solution = this.instantiateTemplate(template, generatedDice);
                
                // If template needs more colors than available, skip
                if (!solution) {
                    continue;
                }
                
                // Generate 8 random cards
                const cards = generateCardConfig(8);
                
                // Evaluate the solution to get matching cards (returns a Set)
                const matchingCards = this.evaluateSolution(solution, cards);
                const goal = matchingCards.size; // Get the count
                
                // Keep if goal is valid (1-7)
                if (goal >= 1 && goal <= 7) {
                    // Generate dice from the solution (now that solutions respect color constraints)
                    const dice = this.generateDiceFromSolution(solution);
                    
                    // For test puzzles, use a simple difficulty based on cube count
                    // (We're testing templates, not optimizing for difficulty)
                    const cubeCount = dice.length;
                    let difficultyRating = 'intermediate';
                    if (cubeCount <= 3) difficultyRating = 'beginner';
                    else if (cubeCount >= 7) difficultyRating = 'expert';
                    else if (cubeCount >= 5) difficultyRating = 'advanced';
                    
                    puzzle = {
                        id: index + 1,
                        templateIndex: index,
                        templatePattern: template.pattern,
                        cards,
                        dice,
                        goal,
                        generatedSolution: solution,
                        difficulty: { rating: difficultyRating, cubes: cubeCount }
                    };
                    
                    console.log(`   ✅ Valid puzzle found (${templateAttempts} attempts)`);
                    console.log(`      Goal: ${goal}, Cubes: ${cubeCount}, Difficulty: ${difficultyRating}`);
                }
            }
            
            if (!puzzle) {
                console.warn(`   ⚠️ Failed to generate valid puzzle for template after ${maxAttemptsPerTemplate} attempts`);
                // Create a fallback minimal puzzle for this template
                puzzle = {
                    id: index + 1,
                    templateIndex: index,
                    templatePattern: template.pattern,
                    cards: generateCardConfig(8),
                    dice: [],
                    goal: 0,
                    generatedSolution: { topRow: null, bottomRow: "FAILED" },
                    difficulty: { rating: "unknown", cubes: 0 },
                    failed: true
                };
            }
            
            puzzles.push(puzzle);
        });
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Filter out failed puzzles - we only want working ones for testing
        const successfulPuzzles = puzzles.filter(p => !p.failed);
        const failedCount = puzzles.length - successfulPuzzles.length;
        
        console.log(`\n✅ Test set complete! Generated ${successfulPuzzles.length} valid puzzles in ${elapsed}s (${attempts} total attempts)`);
        if (failedCount > 0) {
            console.warn(`⚠️ ${failedCount} templates failed to generate valid puzzles (skipped)`);
        }
        
        // Generate statistics
        this.logBatchStatistics(successfulPuzzles);
        
        return successfulPuzzles;
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
        
        // Cube usage in shortest solutions (if available)
        const puzzlesWithShortestSolution = puzzles.filter(p => p.shortestSolution);
        if (puzzlesWithShortestSolution.length > 0) {
            const cubeCounts = {};
            puzzlesWithShortestSolution.forEach(p => {
                const cubes = p.shortestSolution.cubeCount;
                cubeCounts[cubes] = (cubeCounts[cubes] || 0) + 1;
            });
            console.log('\nShortest Solution Length:');
            Object.entries(cubeCounts).sort((a, b) => a[0] - b[0]).forEach(([cubes, count]) => {
                const pct = ((count / puzzlesWithShortestSolution.length) * 100).toFixed(1);
                console.log(`  ${cubes} cubes: ${count} (${pct}%)`);
            });
        }
        
        console.log('\n');
    }
    
    // UNUSED: Export is handled by Node.js script (regenerate-test-puzzles.mjs)
    // Keeping commented out in case we need alternative export method
    // /**
    //  * Export batch to JSON format (for offline storage)
    //  * Solutions are stored in plain text for now - will obfuscate in Phase 2
    //  */
    // exportBatch(puzzles) {
    //     const exportData = {
    //         version: '1.0.0',
    //         generatedAt: new Date().toISOString(),
    //         count: puzzles.length,
    //         puzzles: puzzles.map(p => ({
    //             id: p.id,
    //             cards: p.cards,
    //             dice: p.dice,
    //             goal: p.goal,
    //             difficulty: p.difficulty,
    //             // 8-cube solution (for reference/validation, not shown to player)
    //             generatedSolution: {
    //                 topRow: p.solution.topRow,
    //                 bottomRow: p.solution.bottomRow
    //             },
    //             // Shortest solution (for scoring/difficulty calculation)
    //             shortestSolution: {
    //                 cubeCount: p.shortestSolution.cubeCount,
    //                 hasRestriction: p.shortestSolution.hasRestriction
    //             }
    //         }))
    //     };
    //     
    //     return JSON.stringify(exportData, null, 2);
    // }
    
    // UNUSED: We use pre-generated puzzles (generateTestSet) instead of random generation
    // Keeping commented out in case we want runtime puzzle generation in the future
    // /**
    //  * Generate a single random puzzle
    //  */
    // generatePuzzle() {
    //     let attempts = 0;
    //     const maxAttempts = 50;
    //     
    //     // Keep trying until we get a valid puzzle
    //     while (attempts < maxAttempts) {
    //         attempts++;
    //         
    //         // STEP 1: Generate valid dice using core game logic (Level 6+)
    //         // This ensures: 4 colors (max 2 each) + 2 operators + 2 special cubes
    //         const generatedDice = generateDiceForLevel(6);
    //         
    //         // STEP 2: Pick a random template
    //         const template = this.pickRandomTemplate();
    //         
    //         // STEP 3: Instantiate the template using the generated dice
    //         const solution = this.instantiateTemplate(template, generatedDice);
    //         
    //         // If instantiation failed (not enough dice for template), try again
    //         if (!solution) {
    //             continue;
    //         }
    //         
    //         // STEP 4: Generate 8 random cards using existing game function
    //         const cards = generateCardConfig(8);
    //         
    //         // STEP 5: Evaluate the solution against these cards
    //         const matchingIndices = this.evaluateSolution(solution, cards);
    //         
    //         // The goal is the number of matching cards
    //         const goal = matchingIndices.size;
    //         
    //         // Validate: we want 1-7 matching cards (matching regular game goal range)
    //         // Exclude 0 (impossible) and 8 (too easy - everything matches)
    //         if (goal === 0 || goal === 8 || goal > 8) {
    //             continue; // Try again
    //         }
    //         
    //         // STEP 6: Generate dice from the solution
    //         // Now that instantiateTemplate() respects color constraints, we can
    //         // safely parse the solution to get all dice (colors + operators + special)
    //         const dice = this.generateDiceFromSolution(solution);
    //         
    //         // Find the shortest possible solution with these cards and dice
    //         const shortestSolution = findShortestSolution(cards, dice, goal);
    //         
    //         // Calculate difficulty based on shortest solution
    //         const difficulty = this.calculateDifficulty(shortestSolution);
    //         
    //         return {
    //             cards: cards,
    //             dice: dice, // Pre-generated dice - no need to regenerate at runtime
    //             solution: solution, // The 8-cube solution we generated
    //             goal: goal,
    //             matchingCards: Array.from(matchingIndices),
    //             difficulty: difficulty,
    //             shortestSolution: shortestSolution, // The easiest way to solve it
    //             template: template.pattern,
    //             timestamp: Date.now()
    //         };
    //     }
    //     
    //     // Fallback: if we couldn't generate a valid puzzle, return a simple one
    //     console.warn('⚠️ Failed to generate valid puzzle after', maxAttempts, 'attempts. Using fallback.');
    //     return this.generateFallbackPuzzle();
    // }
    
    // UNUSED: Only called by generatePuzzle() which is also commented out
    // /**
    //  * Pick a random template from the library
    //  */
    // pickRandomTemplate() {
    //     return this.TEMPLATES[Math.floor(Math.random() * this.TEMPLATES.length)];
    // }
    
    // UNUSED: Placeholder method never implemented
    // /**
    //  * No color mapping needed - we replace abstract types directly
    //  * This method is kept for backwards compatibility but not used
    //  */
    // createColorMapping(template) {
    //     return {};
    // }
    
    /**
     * Instantiate a template using generated dice from generateDiceForLevel()
     * This ensures all cube generation rules are followed:
     * - Exactly 4 color cubes (max 2 of each color)
     * - Exactly 2 operators
     * - Exactly 2 special cubes (U, ∅, =, ⊆)
     */
    instantiateTemplate(template, generatedDice) {
        // Extract dice by type
        const colorDice = generatedDice.filter(d => d.type === 'color');
        const operatorDice = generatedDice.filter(d => 
            d.type === 'operator' && ['∪', '∩', '−', '′'].includes(d.value)
        );
        const specialDice = generatedDice.filter(d => 
            d.type === 'operator' && ['U', '∅', '=', '⊆'].includes(d.value) ||
            d.type === 'set-constant'
        );
        
        // Create pools for instantiation
        const availableColors = [...colorDice].map(d => d.value);
        // UNUSED: Operators are baked into templates (e.g., "color ∪ color"), not replaced
        // const availableOperators = [...operatorDice].map(d => d.value);
        const availableSetNames = specialDice.filter(d => ['U', '∅'].includes(d.value)).map(d => d.value);
        // UNUSED: Restrictions are baked into templates (e.g., "color = color"), not replaced
        // const availableRestrictions = specialDice.filter(d => ['=', '⊆'].includes(d.value)).map(d => d.value);
        
        // Track color usage ACROSS both rows (not per-row)
        // This ensures we don't use more of any color than we have in generatedDice
        const colorUsage = {};
        availableColors.forEach(c => {
            colorUsage[c] = (colorUsage[c] || 0) + 1;
        });
        
        // Helper to replace abstract types with actual dice values
        // Note: Operators (∪, ∩, −, ′) and restrictions (=, ⊆) are already baked into templates
        // We only need to replace "color" and "setName" placeholders
        // IMPORTANT: Respect the actual counts of each color in generated dice
        const replaceAbstractTypes = (expr) => {
            if (!expr) return null;
            
            let result = expr;
            
            // Replace each "color" with an available color from generated dice
            while (result.includes('color')) {
                // Find colors that still have usage remaining
                const usableColors = Object.keys(colorUsage).filter(c => colorUsage[c] > 0);
                
                if (usableColors.length === 0) {
                    return null; // No more colors available
                }
                
                // Pick randomly from usable colors
                const randomColor = usableColors[Math.floor(Math.random() * usableColors.length)];
                result = result.replace('color', randomColor);
                
                // Decrement usage count (shared across both rows)
                colorUsage[randomColor]--;
            }
            
            // Replace "setName" with U or ∅ from generated dice
            while (result.includes('setName')) {
                if (availableSetNames.length === 0) {
                    return null; // No Universe/Null available
                }
                const randomIdx = Math.floor(Math.random() * availableSetNames.length);
                result = result.replace('setName', availableSetNames[randomIdx]);
            }
            
            return result;
        };
        
        const topRow = replaceAbstractTypes(template.topRow);
        const bottomRow = replaceAbstractTypes(template.bottomRow);
        
        // If instantiation failed, return null
        if ((template.topRow && !topRow) || (template.bottomRow && !bottomRow)) {
            return null;
        }
        
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
        
        // Parse expression with parentheses to identify groups
        // Parentheses indicate dice should be positioned close together (touching)
        
        // Track grouping levels and positions
        const diceWithGroups = [];
        let groupLevel = 0;
        let currentToken = '';
        
        // Parse character by character to track grouping
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            
            if (char === '(') {
                groupLevel++;
            } else if (char === ')') {
                groupLevel--;
            } else if (char === ' ') {
                if (currentToken) {
                    diceWithGroups.push({ token: currentToken, groupLevel });
                    currentToken = '';
                }
            } else {
                currentToken += char;
            }
        }
        if (currentToken) {
            diceWithGroups.push({ token: currentToken, groupLevel });
        }
        
        // Split tokens with attached prime (e.g., "gold′" → ["gold", "′"])
        const expandedDice = [];
        diceWithGroups.forEach(({ token, groupLevel }) => {
            if (token.includes('′')) {
                const parts = token.split('′');
                parts.forEach((part, i) => {
                    if (part) expandedDice.push({ token: part, groupLevel });
                    if (i < parts.length - 1) expandedDice.push({ token: '′', groupLevel });
                });
            } else if (token) {
                expandedDice.push({ token, groupLevel });
            }
        });
        
        // Convert tokens to dice objects with positions based on grouping
        // Dice within same group (groupLevel > 0) are positioned close together (touching)
        // Dice in different groups or no group are spaced apart
        let xPos = 0;
        const dieSize = 80; // Standard die size
        const touchThreshold = 15; // Same as detectGroups uses
        const groupSpacing = dieSize + touchThreshold - 10; // Close enough to touch
        const ungroupedSpacing = dieSize + touchThreshold + 30; // Spaced apart
        
        return expandedDice.map(({ token, groupLevel }, i) => {
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
            
            const die = {
                value: token,
                type: dieType,
                x: xPos,
                y: 10,
                id: `eval-${i}`
            };
            
            // Calculate next position based on whether next die is in same group
            const nextGroupLevel = i < expandedDice.length - 1 ? expandedDice[i + 1].groupLevel : 0;
            if (groupLevel > 0 && nextGroupLevel === groupLevel) {
                // Both in same group - keep close (touching)
                xPos += groupSpacing;
            } else {
                // Different groups or transitioning out of group - space apart
                xPos += ungroupedSpacing;
            }
            
            return die;
        });
    }
    
    
    // UNUSED: Only called by generatePuzzle() which is commented out
    // Keeping as emergency fallback if needed
    // /**
    //  * Generate a simple fallback puzzle when generation fails
    //  */
    // generateFallbackPuzzle() {
    //     const cards = [
    //         { colors: ['red'] },
    //         { colors: ['blue'] },
    //         { colors: ['green'] },
    //         { colors: ['gold'] },
    //         { colors: ['red', 'blue'] },
    //         { colors: ['green', 'gold'] },
    //         { colors: ['red', 'green'] },
    //         { colors: ['blue', 'gold'] }
    //     ];
    //     
    //     const solution = {
    //         topRow: "red ∪ blue = green ∪ gold",
    //         bottomRow: "red ∪ green",
    //         pattern: "fallback",
    //         hasRestriction: true
    //         // UNUSED property: hasTwoRestrictions: false
    //     };
    //     
    //     // Generate dice for the fallback puzzle
    //     const dice = this.generateDiceFromSolution(solution);
    //     
    //     // Hardcoded shortest solution for the fallback (3 cubes: "red ∪ green")
    //     const shortestSolution = {
    //         cubeCount: 3,
    //         hasRestriction: false,
    //         restrictionDice: null,
    //         setNameDice: [
    //             { value: 'red', type: 'color', id: 'fallback-1', x: 0, y: 10 },
    //             { value: '∪', type: 'operator', id: 'fallback-2', x: 100, y: 10 },
    //             { value: 'green', type: 'color', id: 'fallback-3', x: 200, y: 10 }
    //         ],
    //         totalCubes: 3
    //     };
    //     
    //     return {
    //         cards: cards,
    //         dice: dice, // Pre-generated dice
    //         solution: solution,
    //         goal: 4, // cards with red or green match (after restriction)
    //         matchingCards: [0, 2, 4, 6],
    //         difficulty: 'beginner',
    //         shortestSolution: shortestSolution,
    //         template: 'fallback',
    //         timestamp: Date.now()
    //     };
    // }
    
    /**
     * Generate dice from a solution template
     * 
     * This parses the solution string and creates the 8 dice that the player will use.
     * Works correctly because instantiateTemplate() now ensures solutions respect
     * the max-2-per-color constraint.
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
        
        // Validate we have exactly 8 dice
        if (dice.length !== 8) {
            console.warn(`⚠️ Generated ${dice.length} dice, expected 8!`);
            console.warn('Expression:', expr);
            console.warn('Final tokens:', finalTokens);
            console.warn('Token counts:', tokenCounts);
            
            // Fill to 8 respecting physical constraints
            while (dice.length < 8) {
                // Count current dice by type
                const colorCount = dice.filter(d => d.type === 'color').length;
                const operatorCount = dice.filter(d => d.type === 'operator').length;
                const restrictionCount = dice.filter(d => d.type === 'restriction').length;
                const setConstantCount = dice.filter(d => d.type === 'set-constant').length;
                const specialCount = restrictionCount + setConstantCount;
                
                // Priority 1: Add setName if under 2-special max and don't have one yet
                if (specialCount < 2 && setConstantCount === 0) {
                    const setName = Math.random() < 0.5 ? 'U' : '∅';
                    dice.push({ 
                        value: setName, 
                        type: 'set-constant',
                        id: `die-filler-${Date.now()}-${Math.random()}`
                    });
                }
                // Priority 2: Add color if under 4-color max
                else if (colorCount < 4) {
                    // Find which colors are already used
                    const usedColors = new Set(dice.filter(d => d.type === 'color').map(d => d.value));
                    const availableColors = ['red', 'blue', 'green', 'gold'].filter(c => !usedColors.has(c));
                    
                    // Pick a random unused color, or duplicate if all 4 colors used
                    const color = availableColors.length > 0 
                        ? availableColors[Math.floor(Math.random() * availableColors.length)]
                        : ['red', 'blue', 'green', 'gold'][Math.floor(Math.random() * 4)];
                    
                    dice.push({ 
                        value: color, 
                        type: 'color',
                        id: `die-filler-${Date.now()}-${Math.random()}`
                    });
                } else {
                    console.error(`❌ Cannot add 8th die - at max for all types! (${dice.length} dice)`);
                    break;
                }
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
