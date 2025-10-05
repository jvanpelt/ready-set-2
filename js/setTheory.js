// Set theory evaluation engine

import { OPERATORS } from './levels.js';

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
    
    // Detect groups based on physical proximity
    const groups = detectGroups(expression);
    console.log('Detected groups:', groups.length);
    
    // Evaluate valid groups first, then the remaining expression
    const result = evaluateWithGroups(expression, groups, cards);
    console.log('Result: Found', result.size, 'matching cards');
    console.log('=============================\n');
    
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
    const dieSize = window.innerWidth <= 768 ? 50 : 80;
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
    
    if (!group.some(index => dice[index].type === 'operator')) {
        console.log(`  Group [${groupValues}]: INVALID - no operator`);
        return false;
    }
    
    // Convert to pattern string
    const patternString = dicesToPatternString(groupDice);
    const isValid = SETNAME_PATTERNS.includes(patternString);
    
    console.log(`  Group [${groupValues}]: ${isValid ? 'VALID' : 'INVALID'} (pattern: ${patternString})`);
    
    return isValid;
}

/**
 * Evaluate expression with grouping support
 */
function evaluateWithGroups(dice, groups, cards) {
    // Filter to only valid groups
    const validGroups = groups.filter(group => isValidGroup(group, dice));
    
    console.log('Valid groups:', validGroups.length, 'of', groups.length);
    
    // If no valid groups, evaluate left-to-right by X position
    if (validGroups.length === 0) {
        console.log('No valid groups - evaluating left-to-right');
        // Sort dice by X position for left-to-right evaluation
        const sortedDice = dice
            .map((die, index) => ({ die, index }))
            .sort((a, b) => a.die.x - b.die.x);
        const tokens = sortedDice.map(item => item.die.value);
        return evaluate(tokens, cards);
    }
    
    console.log('Evaluating with groups...');

    
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
        const groupTokens = groupDice.map(die => die.value);
        const result = evaluate(groupTokens, cards);
        
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
                value: die.value
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
 */
export function calculateScore(expression) {
    if (!expression || expression.length === 0) return 0;
    
    let totalPoints = 0;
    
    expression.forEach(die => {
        if (die.type === 'color') {
            totalPoints += 5; // Base points for colors
        } else if (die.type === 'operator') {
            // Find operator points
            const operator = Object.values(OPERATORS).find(op => op.symbol === die.value);
            if (operator) {
                totalPoints += operator.points;
            }
        }
    });
    
    // Multiply by number of dice used for complexity bonus
    return totalPoints * expression.length;
}

/**
 * Valid solution patterns for set names (based on original game)
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
    // five cubes
    "color,operator,color,operator,color",
    "color,operator,setName,operator,color",
    "color,operator,color,operator,setName",
    "color,operator,setName,operator,setName",
    "setName,operator,color,operator,color",
    "setName,operator,setName,operator,color",
    "setName,operator,color,operator,setName"
];

/**
 * Valid restriction patterns (Level 6+, based on original game)
 */
const RESTRICTION_PATTERNS = [
    // three cubes
    "color,restriction,color",
    "setName,restriction,color",
    "color,restriction,setName",
    // four cubes
    "color,restriction,color,prime",
    "color,restriction,setName,prime",
    "color,prime,restriction,setName",
    "color,prime,restriction,color",
    "setName,restriction,color,prime",
    "setName,restriction,setName,prime",
    "setName,prime,restriction,color",
    "setName,prime,restriction,setName",
    // five cubes
    "color,restriction,color,operator,color",
    "color,operator,color,restriction,color",
    "color,restriction,color,restriction,color",
    "setName,restriction,color,operator,color",
    "setName,operator,color,restriction,color",
    "setName,restriction,color,restriction,color",
    "color,restriction,setName,operator,color",
    "color,operator,setName,restriction,color",
    "color,restriction,setName,restriction,color",
    "color,restriction,color,operator,setName",
    "color,operator,color,restriction,setName",
    "color,restriction,color,restriction,setName",
    "color,restriction,setName,operator,setName",
    "color,operator,setName,restriction,setName",
    "color,restriction,setName,restriction,setName",
    "setName,restriction,color,operator,setName",
    "setName,operator,color,restriction,setName",
    "setName,restriction,color,restriction,setName",
    "setName,restriction,setName,operator,color",
    "setName,operator,setName,restriction,color",
    "setName,restriction,setName,restriction,color",
    "color,prime,prime,restriction,color",
    "color,restriction,color,prime,prime",
    "setName,restriction,color,prime,prime",
    "color,restriction,setName,prime,prime",
    "setName,prime,prime,restriction,color",
    "color,prime,prime,restriction,setName",
    "setName,prime,prime,restriction,setName",
    // six cubes
    "color,operator,setName,restriction,color,prime",
    "color,restriction,setName,operator,color,prime",
    "color,restriction,color,operator,color,prime",
    "color,operator,color,restriction,color,prime",
    "setName,operator,color,restriction,color,prime",
    "setName,restriction,color,operator,color,prime",
    "color,restriction,setName,operator,color,prime",
    "color,operator,setName,restriction,color,prime",
    "color,operator,color,restriction,setName,prime",
    "color,restriction,color,operator,setName,prime",
    "color,prime,operator,setName,restriction,color",
    "color,prime,restriction,setName,operator,color",
    "color,prime,restriction,color,operator,color",
    "color,prime,operator,color,restriction,color",
    "setName,prime,operator,color,restriction,color",
    "setName,prime,restriction,color,operator,color",
    "color,prime,restriction,setName,operator,color",
    "color,prime,operator,setName,restriction,color",
    "color,prime,operator,color,restriction,setName",
    "color,prime,restriction,color,operator,setName",
    "color,operator,setName,prime,restriction,color",
    "color,restriction,setName,prime,operator,color",
    "color,restriction,color,prime,operator,color",
    "color,operator,color,prime,restriction,color",
    "setName,operator,color,prime,restriction,color",
    "setName,restriction,color,prime,operator,color",
    "color,operator,setName,prime,restriction,color",
    "color,operator,color,prime,restriction,setName",
    "color,restriction,color,prime,operator,setName",
    // seven cubes
    "color,operator,color,restriction,color,operator,setName",
    "color,operator,color,restriction,setName,operator,color",
    "color,operator,setName,restriction,color,operator,color",
    "setName,operator,color,restriction,color,operator,color",
    "color,operator,color,restriction,setName,operator,color"
];

/**
 * Convert dice array to pattern string for validation
 */
function dicesToPatternString(dice) {
    return dice.map(die => {
        if (die.type === 'color') {
            return 'color';
        } else if (die.type === 'operator') {
            // Prime (complement) is special
            if (die.value === '′') {
                return 'prime';
            }
            // U and ∅ are "setName" types
            if (die.value === 'U' || die.value === '∅') {
                return 'setName';
            }
            // Equals and Subset are "restriction" types
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
    
    // Single die validation: Only color cubes are allowed as single-cube solutions
    // Universe (U) and Null (∅) require at least 2 cubes
    if (expression.length === 1) {
        const die = expression[0];
        if (die.type === 'color') {
            console.log('Single color cube validation: ✓ VALID');
            return true;
        } else {
            console.log('Single die validation: ✗ INVALID (U and ∅ require at least 2 cubes)');
            return false;
        }
    }
    
    // Sort dice by X position (left to right) before validation
    const sortedDice = [...expression].sort((a, b) => (a.x || 0) - (b.x || 0));
    
    // Convert to pattern string
    const patternString = dicesToPatternString(sortedDice);
    const isValid = SETNAME_PATTERNS.includes(patternString);
    
    console.log('Pattern validation:', patternString, '→', isValid ? '✓ VALID' : '✗ INVALID');
    if (!isValid) {
        console.log('Valid patterns include: color,operator,color | color,operator,color,operator,color | etc.');
    }
    
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
        console.log('Restriction validation: INVALID (requires at least 3 dice)');
        return false;
    }
    
    // Sort dice by X position (left to right) before validation
    const sortedDice = [...expression].sort((a, b) => (a.x || 0) - (b.x || 0));
    
    // Convert to pattern string
    const patternString = dicesToPatternString(sortedDice);
    const isValid = RESTRICTION_PATTERNS.includes(patternString);
    
    console.log('Restriction pattern validation:', patternString, '→', isValid ? '✓ VALID' : '✗ INVALID');
    
    return isValid;
}

/**
 * Evaluate a restriction expression and return indices of cards to flip
 * @param {Array} restriction - The restriction dice expression
 * @param {Array} cards - All cards
 * @returns {Array} - Array of card indices that should be flipped (removed from universe)
 */
export function evaluateRestriction(restriction, cards) {
    if (!restriction || restriction.length === 0) return [];
    
    console.log('=== EVALUATING RESTRICTION ===');
    
    // Find the restriction operator
    const restrictionDie = restriction.find(die => die.value === '=' || die.value === '⊆');
    if (!restrictionDie) return [];
    
    const restrictionIndex = restriction.indexOf(restrictionDie);
    const leftSide = restriction.slice(0, restrictionIndex);
    const rightSide = restriction.slice(restrictionIndex + 1);
    
    // Evaluate both sides
    const leftCards = evaluateExpression(leftSide, cards);
    const rightCards = evaluateExpression(rightSide, cards);
    
    console.log(`Left side (${leftSide.map(d => d.value).join(' ')}):`, Array.from(leftCards));
    console.log(`Right side (${rightSide.map(d => d.value).join(' ')}):`, Array.from(rightCards));
    
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
    
    console.log('Cards to flip:', cardsToFlip);
    console.log('==============================\n');
    
    return cardsToFlip;
}

