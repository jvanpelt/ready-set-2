// Set theory evaluation engine

import { OPERATORS } from './levels.js';

/**
 * Get the effective value of a die (handles wild cubes)
 * For wild cubes, returns the selected operator symbol, otherwise returns the die's value
 */
function getEffectiveValue(die) {
    if (die.type === 'wild' && die.selectedOperator) {
        // selectedOperator is already the symbol (e.g., '∪', '∩', '−', '′')
        return die.selectedOperator;
    }
    return die.value;
}

/**
 * Evaluates a set theory expression against a collection of cards
 * @param {Array} expression - Array of dice objects representing the expression
 * @param {Array} cards - Array of card configurations
 * @returns {Set} - Set of card indices that match the expression
 */
export function evaluateExpression(expression, cards) {
    if (!expression || expression.length === 0) {
        return new Set();
    }
    
    console.log('=== EVALUATING EXPRESSION ===');
    console.log('Dice (left-to-right by X):', 
        [...expression].sort((a, b) => a.x - b.x).map(d => d.value).join(' '));
    console.log('Dice positions:', expression.map(d => `${d.value}(${d.x},${d.y})`).join(', '));
    
    // Detect groups based on physical proximity
    const groups = detectGroups(expression);
    console.log('Detected groups:', groups.length);
    if (groups.length > 0) {
        groups.forEach((group, i) => {
            const groupDice = group.map(idx => expression[idx]);
            console.log(`  Group ${i}: indices ${group}, dice: [${groupDice.map(d => d.value).join(', ')}]`);
        });
    }
    
    // Evaluate valid groups first, then the remaining expression
    const result = evaluateWithGroups(expression, groups, cards);
    // console.log('Result: Found', result.size, 'matching cards');
    // console.log('=============================\n');
    
    return result;
}

/**
 * Detect groups of dice that are touching each other
 * @param {Array} dice - Array of dice with x, y positions
 * @returns {Array} - Array of groups, each group is an array of die indices
 */
function detectGroups(dice) {
    if (!dice || dice.length === 0) return [];
    
    // Use responsive die size (same logic as UI)
    // Default to 80 for Node.js environments (no window)
    const dieSize = typeof window !== 'undefined' && window.innerWidth <= 768 ? 50 : 80;
    const touchThreshold = 15; // Same as UI threshold
    const visited = new Set();
    const groups = [];
    
    function areDiceTouching(die1, die2) {
        const dx = Math.abs(die1.x - die2.x);
        const dy = Math.abs(die1.y - die2.y);
        // Use same logic as UI: check if edges are within threshold
        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
    }
    
    function findGroup(startIndex) {
        const group = [startIndex];
        visited.add(startIndex);
        
        // Recursively find all connected dice
        for (let i = 0; i < group.length; i++) {
            const currentIndex = group[i];
            for (let j = 0; j < dice.length; j++) {
                if (!visited.has(j) && areDiceTouching(dice[currentIndex], dice[j])) {
                    group.push(j);
                    visited.add(j);
                }
            }
        }
        
        return group;
    }
    
    for (let i = 0; i < dice.length; i++) {
        if (!visited.has(i)) {
            const group = findGroup(i);
            if (group.length > 1) { // Only consider groups of 2+ dice
                groups.push(group);
            }
        }
    }
    
    return groups;
}

/**
 * Check if a group is logically valid for evaluation
 * A valid group must:
 * 1. Contain at least one operator
 * 2. Match a valid solution pattern
 */
function isValidGroup(group, dice) {
    const groupDice = group.map(i => dice[i]);
    groupDice.sort((a, b) => a.x - b.x);
    const groupValues = groupDice.map(d => d.value).join(' ');
    const groupTypes = groupDice.map(d => d.type).join(', ');
    
    // A valid group must contain at least one operator OR restriction
    const hasOperator = group.some(index => 
        dice[index].type === 'operator' || dice[index].type === 'restriction'
    );
    
    console.log(`  Checking group [${groupValues}], types: [${groupTypes}], hasOperator: ${hasOperator}`);
    
    if (!hasOperator) {
        console.log(`  Group [${groupValues}]: INVALID - no operator or restriction`);
        return false;
    }
    
    // Convert to pattern string
    const patternString = dicesToPatternString(groupDice);
    
    // Check if it's a valid set name pattern OR a valid restriction pattern
    const isValidSetName = SETNAME_PATTERNS.includes(patternString);
    const isValidRestriction = RESTRICTION_PATTERNS.includes(patternString);
    const isValid = isValidSetName || isValidRestriction;
    
    console.log(`  Group [${groupValues}]: ${isValid ? 'VALID' : 'INVALID'} (pattern: ${patternString}, setName: ${isValidSetName}, restriction: ${isValidRestriction})`);
    
    return isValid;
}

/**
 * Evaluate expression with grouping support
 */
function evaluateWithGroups(dice, groups, cards) {
    // Filter to only valid groups
    const validGroups = groups.filter(group => isValidGroup(group, dice));
    
    console.log('evaluateWithGroups: Valid groups:', validGroups.length, 'of', groups.length, 'total groups');
    
    // If no valid groups, evaluate left-to-right by X position
    if (validGroups.length === 0) {
        // console.log('No valid groups - evaluating left-to-right');
        // Sort dice by X position for left-to-right evaluation
        const sortedDice = dice
            .map((die, index) => ({ die, index }))
            .sort((a, b) => a.die.x - b.die.x);
        const tokens = sortedDice.map(item => getEffectiveValue(item.die));
        return evaluate(tokens, cards);
    }
    
    // console.log('Evaluating with groups...');

    
    // Create a mapping of which group each die belongs to
    const dieToGroup = new Map();
    validGroups.forEach((group, groupIndex) => {
        group.forEach(dieIndex => {
            dieToGroup.set(dieIndex, groupIndex);
        });
    });
    
    // Evaluate each group and store results with position
    const groupResults = validGroups.map((group, groupIndex) => {
        const groupDice = group.map(i => dice[i]);
        // Sort group dice left-to-right for proper evaluation within group
        groupDice.sort((a, b) => a.x - b.x);
        
        // Check if this group is a restriction
        const isRestrictionGroup = groupDice.some(die => die.value === '=' || die.value === '⊆');
        
        console.log(`📦 Evaluating group: [${groupDice.map(d => d.value).join(' ')}], isRestriction: ${isRestrictionGroup}`);
        
        let result;
        if (isRestrictionGroup) {
            // This is a restriction group - evaluate it as a restriction
            // Restrictions return cards to FLIP, so we need to invert that to get the cards that PASS
            const cardsToFlip = evaluateRestriction(groupDice, cards);
            const flippedSet = new Set(cardsToFlip);
            
            console.log(`  Restriction group flips cards: ${cardsToFlip}`);
            
            // Result is all cards that are NOT flipped
            result = new Set();
            cards.forEach((card, index) => {
                if (!flippedSet.has(index)) {
                    result.add(index);
                }
            });
            
            console.log(`  Restriction group result (non-flipped): ${Array.from(result)}`);
        } else {
            // Regular set name group - evaluate normally
            const groupTokens = groupDice.map(die => getEffectiveValue(die));
            result = evaluate(groupTokens, cards);
            console.log(`  Set name group result: ${Array.from(result)}`);
        }
        
        // Use leftmost X position as group position
        const minX = Math.min(...group.map(i => dice[i].x));
        
        return {
            result,
            x: minX,
            groupIndex
        };
    });
    
    // Build final expression: process all dice left-to-right
    // Groups become single tokens at their position
    const tokens = [];
    
    // Create items for each die or group
    const items = [];
    
    dice.forEach((die, index) => {
        const groupIndex = dieToGroup.get(index);
        if (groupIndex !== undefined) {
            // This die is part of a group - only add the group once (for first die encountered)
            const group = validGroups[groupIndex];
            if (group[0] === index) {
                // This is the first die in the group
                items.push({
                    type: 'group',
                    x: groupResults[groupIndex].x,
                    result: groupResults[groupIndex].result
                });
            }
        } else {
            // Ungrouped die
            items.push({
                type: 'die',
                x: die.x,
                value: getEffectiveValue(die)
            });
        }
    });
    
    // Sort items left-to-right
    items.sort((a, b) => a.x - b.x);
    
    // Build final token list
    items.forEach(item => {
        if (item.type === 'group') {
            tokens.push({
                type: 'group-result',
                result: item.result
            });
        } else {
            tokens.push(item.value);
        }
    });
    
    // Evaluate final expression
    return evaluateFinal(tokens, cards);
}

/**
 * Evaluate expression that may contain pre-computed group results
 */
function evaluateFinal(tokens, cards) {
    if (tokens.length === 0) return new Set();
    
    // Handle single token
    if (tokens.length === 1) {
        const token = tokens[0];
        if (typeof token === 'object' && token.type === 'group-result') {
            return token.result;
        }
        if (isColor(token)) {
            return getCardsWithColor(token, cards);
        }
        if (token === 'U') {
            return getAllCards(cards);
        }
        if (token === '∅') {
            return new Set();
        }
        return new Set();
    }
    
    // Process left to right
    let result = null;
    let i = 0;
    
    while (i < tokens.length) {
        const token = tokens[i];
        
        // Handle group result token
        if (typeof token === 'object' && token.type === 'group-result') {
            if (result === null) {
                result = token.result;
            }
            i++;
        }
        // Handle operands
        else if (isColor(token) || token === 'U' || token === '∅') {
            const cardSet = getOperand(token, cards);
            if (result === null) {
                result = cardSet;
            }
            i++;
        }
        // Handle operators
        else if (token === '∪') {
            i++;
            if (i < tokens.length) {
                const nextSet = getOperandOrResult(tokens[i], cards);
                result = union(result, nextSet);
                i++;
            }
        } else if (token === '∩') {
            i++;
            if (i < tokens.length) {
                const nextSet = getOperandOrResult(tokens[i], cards);
                result = intersection(result, nextSet);
                i++;
            }
        } else if (token === '−') {
            i++;
            if (i < tokens.length) {
                const nextSet = getOperandOrResult(tokens[i], cards);
                result = difference(result, nextSet);
                i++;
            }
        } else if (token === '′') {
            result = complement(result, cards);
            i++;
        } else {
            i++;
        }
    }
    
    return result || new Set();
}

/**
 * Get operand or extract result from group-result token
 */
function getOperandOrResult(token, cards) {
    if (typeof token === 'object' && token.type === 'group-result') {
        return token.result;
    }
    return getOperand(token, cards);
}

/**
 * Parse and evaluate tokens
 */
function evaluate(tokens, cards) {
    // Handle single color
    if (tokens.length === 1) {
        if (isColor(tokens[0])) {
            return getCardsWithColor(tokens[0], cards);
        }
        if (tokens[0] === 'U') {
            return getAllCards(cards);
        }
        if (tokens[0] === '∅') {
            return new Set();
        }
        return new Set();
    }
    
    // Process operators from left to right (simplified for now)
    let result = null;
    let i = 0;
    
    while (i < tokens.length) {
        const token = tokens[i];
        
        if (isColor(token)) {
            const cardSet = getCardsWithColor(token, cards);
            if (result === null) {
                result = cardSet;
            }
            i++;
        } else if (token === 'U') {
            const cardSet = getAllCards(cards);
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
                const nextSet = getOperand(tokens[i], cards);
                result = union(result, nextSet);
                i++;
            }
        } else if (token === '∩') {
            // Intersection: overlap with next operand
            i++;
            if (i < tokens.length) {
                const nextSet = getOperand(tokens[i], cards);
                result = intersection(result, nextSet);
                i++;
            }
        } else if (token === '−') {
            // Difference: remove next operand
            i++;
            if (i < tokens.length) {
                const nextSet = getOperand(tokens[i], cards);
                result = difference(result, nextSet);
                i++;
            }
        } else if (token === '′') {
            // Complement: invert current result
            result = complement(result, cards);
            i++;
        } else {
            i++;
        }
    }
    
    return result || new Set();
}

/**
 * Get operand (color set or special set)
 */
function getOperand(token, cards) {
    if (isColor(token)) {
        return getCardsWithColor(token, cards);
    } else if (token === 'U') {
        return getAllCards(cards);
    } else if (token === '∅') {
        return new Set();
    }
    return new Set();
}

/**
 * Check if token is a color
 */
function isColor(token) {
    return ['red', 'blue', 'green', 'gold'].includes(token);
}

/**
 * Get all cards that contain a specific color
 */
function getCardsWithColor(color, cards) {
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
function getAllCards(cards) {
    const result = new Set();
    cards.forEach((_, index) => result.add(index));
    return result;
}

/**
 * Set operations
 */
function union(setA, setB) {
    const result = new Set(setA);
    setB.forEach(item => result.add(item));
    return result;
}

function intersection(setA, setB) {
    const result = new Set();
    setA.forEach(item => {
        if (setB.has(item)) {
            result.add(item);
        }
    });
    return result;
}

function difference(setA, setB) {
    const result = new Set(setA);
    setB.forEach(item => result.delete(item));
    return result;
}

function complement(set, cards) {
    const universe = getAllCards(cards);
    return difference(universe, set);
}

/**
 * Calculate score based on expression complexity
 * Matches original game scoring logic:
 * 1. Sum base points for all cubes (including special cubes)
 * 2. Multiply by cube count
 * 
 * Special cube rules (from original game):
 * - ANY cube can be Required (25 points) or Bonus (50 points)
 * - Wild cubes are always 25 points (can't be required/bonus)
 */
export function calculateScore(expression) {
    if (!expression || expression.length === 0) return 0;
    
    let totalPoints = 0;
    
    expression.forEach(die => {
        // Special cubes override base points
        if (die.isBonus) {
            totalPoints += 50; // Bonus cubes are always 50 points
        } else if (die.isRequired) {
            totalPoints += 25; // Required cubes are always 25 points
        } else if (die.type === 'wild') {
            totalPoints += 25; // Wild cubes are 25 points
        } else if (die.type === 'color') {
            totalPoints += 5; // Colors: 5 points base
        } else if (die.type === 'operator') {
            // Find operator points from OPERATORS constant
            const operator = Object.values(OPERATORS).find(op => op.symbol === die.value);
            if (operator) {
                totalPoints += operator.points; // Union/Intersection/Difference: 10, Prime: 15
            }
        } else if (die.type === 'set-constant') {
            totalPoints += 15; // Universe/Null: 15 points base
        } else if (die.type === 'restriction') {
            totalPoints += 20; // Equals/Subset: 20 points base
        }
    });
    
    // Multiply by number of dice used for complexity bonus
    return totalPoints * expression.length;
}

/**
 * Valid set name patterns (Level 1+)
 * 
 * Physical constraints (8 cubes total):
 * - 4 color cubes (max)
 * - 2 operator cubes including prime (max)
 * - 2 setName cubes: U, ∅ (max)
 */
const SETNAME_PATTERNS = [
    "color",
    "setName",
    // two cubes
    "color,prime",
    "setName,prime",
    // three cubes
    "color,operator,color",
    "setName,operator,color",
    "color,operator,setName",
    "setName,operator,setName",
    "color,prime,prime",
    "setName,prime,prime",
    // four cubes
    "color,operator,color,prime",
    "color,prime,operator,color",
    "color,prime,operator,setName",
    "color,operator,setName,prime",
    "setName,prime,operator,color",
    "setName,prime,operator,setName",
    "setName,operator,setName,prime",
    "setName,operator,color,prime",
    // five cubes (7 patterns - removed 1 impossible)
    "color,operator,color,operator,color",
    "color,operator,setName,operator,color",
    "color,operator,color,operator,setName",
    "color,operator,setName,operator,setName",
    "setName,operator,color,operator,color",
    "setName,operator,setName,operator,color",
    "setName,operator,color,operator,setName"
    // REMOVED: "setName,operator,setName,operator,setName" - needs 3 setName cubes (max is 2)
];

/**
 * Valid restriction patterns (Level 6+, based on original game)
 * 
 * Physical constraints (8 cubes total):
 * - 4 color cubes (max)
 * - 2 operator cubes including prime (max)
 * - 2 special cubes: setName + restriction combined (max)
 */
// Complete set of physically possible RESTRICTION patterns (73 total)
// Generated and validated with scripts/validate-all-patterns.mjs
// Constraints: max 4 colors, max 2 operators (∪∩−′), max 2 special cubes (U∅=⊆)
const RESTRICTION_PATTERNS = [
    // 3 cubes (3 patterns)
    "color,restriction,color",
    "color,restriction,setName",
    "setName,restriction,color",
    // 4 cubes (6 patterns)
    "color,prime,restriction,color",
    "color,prime,restriction,setName",
    "color,restriction,color,prime",
    "color,restriction,setName,prime",
    "setName,prime,restriction,color",
    "setName,restriction,color,prime",
    // 5 cubes (25 patterns - includes 8 with double restrictions)
    "color,operator,color,restriction,color",
    "color,operator,color,restriction,setName",
    "color,operator,setName,restriction,color",
    "color,prime,prime,restriction,color",
    "color,prime,prime,restriction,setName",
    "color,prime,restriction,color,prime",
    "color,prime,restriction,setName,prime",
    "color,restriction,color,operator,color",
    "color,restriction,color,operator,setName",
    "color,restriction,color,prime,prime",
    "color,restriction,setName,operator,color",
    "color,restriction,setName,prime,prime",
    "setName,operator,color,restriction,color",
    "setName,prime,prime,restriction,color",
    "setName,prime,restriction,color,prime",
    "setName,restriction,color,operator,color",
    "setName,restriction,color,prime,prime",
    // 5 cubes with TWO restrictions (8 patterns added)
    "color,restriction,color,restriction,color",
    "color,restriction,color,restriction,setName",
    "color,restriction,setName,restriction,color",
    "color,restriction,setName,restriction,setName",
    "setName,restriction,color,restriction,color",
    "setName,restriction,color,restriction,setName",
    "setName,restriction,setName,restriction,color",
    "setName,restriction,setName,restriction,setName",
    // 6 cubes (24 patterns)
    "color,operator,color,prime,restriction,color",
    "color,operator,color,prime,restriction,setName",
    "color,operator,color,restriction,color,prime",
    "color,operator,color,restriction,setName,prime",
    "color,operator,setName,prime,restriction,color",
    "color,operator,setName,restriction,color,prime",
    "color,prime,operator,color,restriction,color",
    "color,prime,operator,color,restriction,setName",
    "color,prime,operator,setName,restriction,color",
    "color,prime,restriction,color,operator,color",
    "color,prime,restriction,color,operator,setName",
    "color,prime,restriction,setName,operator,color",
    "color,restriction,color,operator,color,prime",
    "color,restriction,color,operator,setName,prime",
    "color,restriction,color,prime,operator,color",
    "color,restriction,color,prime,operator,setName",
    "color,restriction,setName,operator,color,prime",
    "color,restriction,setName,prime,operator,color",
    "setName,operator,color,prime,restriction,color",
    "setName,operator,color,restriction,color,prime",
    "setName,prime,operator,color,restriction,color",
    "setName,prime,restriction,color,operator,color",
    "setName,restriction,color,operator,color,prime",
    "setName,restriction,color,prime,operator,color",
    // 6 cubes with TWO restrictions + prime (3 patterns added for daily puzzle fix)
    // Matches the 6+2 double-restriction template from DailyPuzzleGenerator
    // Physical constraint: 2 restrictions + 1 prime + 3 colors = 6 dice (uses all 2 special cube slots for restrictions)
    // Cannot include setName as that would exceed the 2-special-cube limit (restr + setName combined)
    // Valid syntactic positions based on similar patterns in 5-cube restrictions:
    "color,prime,restriction,color,restriction,color",      // prime on first color (A′ = B = C)
    "color,restriction,color,prime,restriction,color",      // prime in middle (A = B′ = C)
    "color,restriction,color,restriction,color,prime",      // prime on last color (A = B = C′)
    // 7 cubes (15 patterns)
    "color,operator,color,operator,color,restriction,color",
    "color,operator,color,operator,color,restriction,setName",
    "color,operator,color,operator,setName,restriction,color",
    "color,operator,color,restriction,color,operator,color",
    "color,operator,color,restriction,color,operator,setName",
    "color,operator,color,restriction,setName,operator,color",
    "color,operator,setName,operator,color,restriction,color",
    "color,operator,setName,restriction,color,operator,color",
    "color,restriction,color,operator,color,operator,color",
    "color,restriction,color,operator,color,operator,setName",
    "color,restriction,color,operator,setName,operator,color",
    "color,restriction,setName,operator,color,operator,color",
    "setName,operator,color,operator,color,restriction,color",
    "setName,operator,color,restriction,color,operator,color",
    "setName,restriction,color,operator,color,operator,color"
];

/**
 * Convert dice array to pattern string for validation
 */
function dicesToPatternString(dice) {
    return dice.map(die => {
        if (die.type === 'color') {
            return 'color';
        } else if (die.type === 'wild') {
            // Wild cubes are treated as operators based on their selection
            const effectiveValue = getEffectiveValue(die);
            if (effectiveValue === '′') {
                return 'prime';
            }
            return 'operator';
        } else if (die.type === 'set-constant') {
            // Universe and Null are "setName" types
            return 'setName';
        } else if (die.type === 'restriction') {
            // Equals and Subset are "restriction" types
            return 'restriction';
        } else if (die.type === 'operator') {
            // Prime (complement) is special
            if (die.value === '′') {
                return 'prime';
            }
            // U and ∅ are "setName" types (for backwards compatibility)
            if (die.value === 'U' || die.value === '∅') {
                return 'setName';
            }
            // Equals and Subset are "restriction" types (for backwards compatibility)
            if (die.value === '=' || die.value === '⊆') {
                return 'restriction';
            }
            return 'operator';
        }
        return 'unknown';
    }).join(',');
}

/**
 * Get the pattern string for debugging
 * @param {Array} expression - Array of dice objects
 * @returns {string} - Pattern string for debugging
 */
export function getPatternString(expression) {
    if (!expression || expression.length === 0) return '';
    const sortedDice = [...expression].sort((a, b) => (a.x || 0) - (b.x || 0));
    return dicesToPatternString(sortedDice);
}

/**
 * Validate if expression matches a known valid pattern
 */
export function isValidSyntax(expression) {
    if (!expression || expression.length === 0) return false;
    
    // Single die: Color cubes, Universe, and Null are valid as single-die expressions
    // (Solution-level validation handles the 2-cube minimum for complete solutions)
    if (expression.length === 1) {
        const die = expression[0];
        // Allow colors, set-constants (U, ∅), and specific operator values for backwards compatibility
        if (die.type === 'color' || die.type === 'set-constant' || die.value === 'U' || die.value === '∅') {
            // console.log('Single operand (color/Universe/Null): ✓ VALID pattern');
            return true;
        }
        // console.log('Single operator: ✗ INVALID');
        return false;
    }
    
    // Sort dice by X position (left to right) before validation
    const sortedDice = [...expression].sort((a, b) => (a.x || 0) - (b.x || 0));
    
    // Convert to pattern string
    const patternString = dicesToPatternString(sortedDice);
    const isValid = SETNAME_PATTERNS.includes(patternString);
    
    // console.log('Pattern validation:', patternString, '→', isValid ? '✓ VALID' : '✗ INVALID');
    // if (!isValid) {
    //     console.log('Valid patterns include: color,operator,color | color,operator,color,operator,color | etc.');
    // }
    
    // Check if it matches any valid pattern
    return isValid;
}

/**
 * Check if an expression contains a restriction operator (= or ⊆)
 */
export function hasRestriction(expression) {
    if (!expression || expression.length === 0) return false;
    return expression.some(die => die.value === '=' || die.value === '⊆');
}

/**
 * Validate if expression matches a known valid restriction pattern
 */
export function isValidRestriction(expression) {
    if (!expression || expression.length === 0) return false;
    
    // Must have at least 3 dice for restrictions (color, restriction, color)
    if (expression.length < 3) {
        // console.log('Restriction validation: INVALID (requires at least 3 dice)');
        return false;
    }
    
    // Sort dice by X position (left to right) before validation
    const sortedDice = [...expression].sort((a, b) => (a.x || 0) - (b.x || 0));
    
    // Convert to pattern string
    const patternString = dicesToPatternString(sortedDice);
    const isValid = RESTRICTION_PATTERNS.includes(patternString);
    
    // console.log('Restriction pattern validation:', patternString, '→', isValid ? '✓ VALID' : '✗ INVALID');
    
    return isValid;
}

/**
 * Evaluate a restriction expression and return indices of cards to flip
 * @param {Array} restriction - The restriction dice expression
 * @param {Array} cards - All cards
 * @param {number} depth - Recursion depth (for safety)
 * @returns {Array} - Array of card indices that should be flipped (removed from universe)
 */
export function evaluateRestriction(restriction, cards, depth = 0) {
    if (!restriction || restriction.length === 0) return [];
    
    // Safety: Prevent infinite recursion (though depth > 1 is physically impossible with max 2 restriction cubes)
    const MAX_DEPTH = 3;
    if (depth > MAX_DEPTH) {
        console.warn(`⚠️ Max recursion depth (${MAX_DEPTH}) reached in evaluateRestriction`);
        return [];
    }
    
    console.log('=== EVALUATING RESTRICTION (depth:', depth, ') ===');
    console.log('Restriction dice:', restriction.map(d => d.value).join(' '));
    
    // IMPORTANT: Detect groups first before splitting on restriction operators
    // This ensures grouped restrictions like (blue = green) are treated as single units
    const groups = detectGroups(restriction);
    const validGroups = groups.filter(group => isValidGroup(group, restriction));
    
    // If there are valid groups, we need to find the restriction operator that's NOT in a group
    let restrictionDie = null;
    let restrictionIndex = -1;
    
    // Check each die to see if it's a restriction operator AND not part of a group
    restriction.forEach((die, index) => {
        if ((die.value === '=' || die.value === '⊆') && restrictionDie === null) {
            // Check if this die is part of any valid group
            const inGroup = validGroups.some(group => group.includes(index));
            if (!inGroup) {
                // This restriction operator is not grouped - use it as the split point
                restrictionDie = die;
                restrictionIndex = index;
            }
        }
    });
    
    // If we didn't find an ungrouped restriction, fall back to finding ANY restriction
    // This handles cases like (blue = green) where the entire expression is one group
    if (!restrictionDie) {
        console.log('No ungrouped restriction found - looking for any restriction operator');
        restrictionDie = restriction.find(die => die.value === '=' || die.value === '⊆');
        if (restrictionDie) {
            restrictionIndex = restriction.indexOf(restrictionDie);
            console.log(`Found grouped restriction operator: ${restrictionDie.value} at index ${restrictionIndex}`);
        } else {
            console.log('⚠️ No restriction operator found at all');
            return [];
        }
    }
    
    const leftSide = restriction.slice(0, restrictionIndex);
    const rightSide = restriction.slice(restrictionIndex + 1);
    
    console.log('Left side:', leftSide.map(d => d.value).join(' '));
    console.log('Right side:', rightSide.map(d => d.value).join(' '));
    
    // Track accumulated flips from nested restrictions
    let accumulatedFlips = [];
    
    // OPTIMIZATION: Only detect groups if side contains restriction operators
    // This avoids unnecessary group detection on pure set name sides like "red ∪ blue"
    
    // Check if left side has any restriction operators
    const leftHasRestrictionOp = leftSide.some(die => die.value === '=' || die.value === '⊆');
    let leftHasRestrictionGroup = false;
    
    if (leftHasRestrictionOp) {
        console.log('Left side contains restriction operator - checking for groups');
        const leftSideGroups = detectGroups(leftSide);
        const leftValidGroups = leftSideGroups.filter(g => isValidGroup(g, leftSide));
        leftHasRestrictionGroup = leftValidGroups.some(group => 
            group.some(idx => leftSide[idx].value === '=' || leftSide[idx].value === '⊆')
        );
    } else {
        console.log('Left side is pure set name - no group detection needed');
    }
    
    // Check if right side has any restriction operators
    const rightHasRestrictionOp = rightSide.some(die => die.value === '=' || die.value === '⊆');
    let rightHasRestrictionGroup = false;
    
    if (rightHasRestrictionOp) {
        console.log('Right side contains restriction operator - checking for groups');
        const rightSideGroups = detectGroups(rightSide);
        const rightValidGroups = rightSideGroups.filter(g => isValidGroup(g, rightSide));
        rightHasRestrictionGroup = rightValidGroups.some(group => 
            group.some(idx => rightSide[idx].value === '=' || rightSide[idx].value === '⊆')
        );
    } else {
        console.log('Right side is pure set name - no group detection needed');
    }
    
    console.log('Left side has restriction group:', leftHasRestrictionGroup);
    console.log('Right side has restriction group:', rightHasRestrictionGroup);
    
    // If left side has a nested restriction, evaluate it and accumulate its flips
    let leftCards;
    if (leftHasRestrictionGroup) {
        const leftFlips = evaluateRestriction(leftSide, cards, depth + 1);
        console.log('Left side nested flips:', leftFlips);
        accumulatedFlips.push(...leftFlips);
        
        // Get cards that PASS the left restriction (non-flipped)
        const flippedSet = new Set(leftFlips);
        leftCards = new Set();
        cards.forEach((card, index) => {
            if (!flippedSet.has(index)) {
                leftCards.add(index);
            }
        });
    } else {
        leftCards = evaluateExpression(leftSide, cards);
    }
    
    // If right side has a nested restriction, evaluate it and accumulate its flips
    let rightCards;
    if (rightHasRestrictionGroup) {
        const rightFlips = evaluateRestriction(rightSide, cards, depth + 1);
        console.log('Right side nested flips:', rightFlips);
        accumulatedFlips.push(...rightFlips);
        
        // Get cards that PASS the right restriction (non-flipped)
        const flippedSet = new Set(rightFlips);
        rightCards = new Set();
        cards.forEach((card, index) => {
            if (!flippedSet.has(index)) {
                rightCards.add(index);
            }
        });
    } else {
        rightCards = evaluateExpression(rightSide, cards);
    }
    
    console.log(`Left cards:`, Array.from(leftCards));
    console.log(`Right cards:`, Array.from(rightCards));
    
    let cardsToFlip = [];
    
    if (restrictionDie.value === '⊆') {
        // Subset: All cards in left must be in right
        // Flip any cards in left that are NOT in right
        cardsToFlip = Array.from(leftCards).filter(cardIndex => !rightCards.has(cardIndex));
        console.log(`Subset restriction: Flipping ${cardsToFlip.length} cards from left that aren't in right`);
    } else if (restrictionDie.value === '=') {
        // Equals: Left and right must be identical
        // Flip any cards that are in one but not the other
        const leftOnly = Array.from(leftCards).filter(cardIndex => !rightCards.has(cardIndex));
        const rightOnly = Array.from(rightCards).filter(cardIndex => !leftCards.has(cardIndex));
        cardsToFlip = [...leftOnly, ...rightOnly];
        console.log(`Equals restriction: Flipping ${cardsToFlip.length} cards (${leftOnly.length} left-only + ${rightOnly.length} right-only)`);
    }
    
    // Combine with accumulated flips from nested restrictions (remove duplicates)
    const allFlips = [...new Set([...accumulatedFlips, ...cardsToFlip])];
    
    console.log('Cards to flip from this restriction:', cardsToFlip);
    console.log('Accumulated flips from nested restrictions:', accumulatedFlips);
    console.log('Total cards to flip:', allFlips);
    console.log('==============================\n');
    
    return allFlips;
}

