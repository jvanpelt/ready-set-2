// Solution finder - checks if any valid solution exists

import { isValidSyntax, evaluateExpression, isValidRestriction, evaluateRestriction } from './setTheory.js';

/**
 * Check if any valid solution exists for the current puzzle
 * @param {Array} cards - Array of card configurations
 * @param {Array} dice - Array of available dice
 * @param {number} goal - Target number of cards
 * @returns {boolean} - True if a solution exists
 */
export function hasPossibleSolution(cards, dice, goal) {
    console.log('🔍 Checking for possible solutions...');
    console.log('   Dice:', dice.length, 'Goal:', goal);
    
    // Check if there's a required cube (Level 8+)
    const requiredDie = dice.find(die => die.isRequired);
    if (requiredDie) {
        console.log('   Required die:', requiredDie.value);
    }
    
    let checksPerformed = 0;
    const startTime = Date.now();
    
    // Try all possible dice combinations from size 2 to dice.length
    for (let size = 2; size <= dice.length; size++) {
        const combinations = getCombinations(dice, size);
        
        for (let combo of combinations) {
            // Skip combinations that don't include the required die
            if (requiredDie && !combo.some(die => die.id === requiredDie.id)) {
                continue;
            }
            
            // Try as a simple set name (no restriction)
            if (trySimpleSetName(combo, cards, goal)) {
                const elapsed = Date.now() - startTime;
                console.log(`✅ Solution found! (${checksPerformed} checks in ${elapsed}ms)`);
                return true;
            }
            checksPerformed++;
            
            // Try splitting into restriction + set name (Level 6+)
            // Only try if we have at least 3 dice (min: 2 for restriction, 1+ for set name)
            if (size >= 3) {
                // Try different split points
                for (let restrictionSize = 2; restrictionSize <= size - 1; restrictionSize++) {
                    const setNameSize = size - restrictionSize;
                    
                    // Get all ways to split combo into restriction and set name
                    const restrictionCombos = getCombinations(combo, restrictionSize);
                    
                    for (let restrictionDice of restrictionCombos) {
                        // Remaining dice go to set name
                        const setNameDice = combo.filter(die => !restrictionDice.includes(die));
                        
                        // Try this split
                        if (tryWithRestriction(restrictionDice, setNameDice, cards, goal)) {
                            const elapsed = Date.now() - startTime;
                            console.log(`✅ Solution found with restriction! (${checksPerformed} checks in ${elapsed}ms)`);
                            return true;
                        }
                        checksPerformed++;
                        
                        // Log progress every 10000 checks
                        if (checksPerformed % 10000 === 0) {
                            console.log(`   ... ${checksPerformed} checks so far`);
                        }
                    }
                }
            }
        }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`❌ No solution found (${checksPerformed} checks in ${elapsed}ms)`);
    return false; // No solution found
}

/**
 * Try a simple set name (no restriction)
 */
function trySimpleSetName(dice, cards, goal) {
    const perms = getPermutations(dice);
    
    for (let perm of perms) {
        const diceWithPositions = perm.map((die, i) => ({
            ...die,
            x: i * 100,
            y: 10
        }));
        
        if (isValidSyntax(diceWithPositions)) {
            const result = evaluateExpression(diceWithPositions, cards);
            if (result.size === goal) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Try a solution with restriction + set name
 */
function tryWithRestriction(restrictionDice, setNameDice, cards, goal) {
    // Try all permutations of restriction
    const restrictionPerms = getPermutations(restrictionDice);
    
    for (let restrictionPerm of restrictionPerms) {
        const restrictionWithPos = restrictionPerm.map((die, i) => ({
            ...die,
            x: i * 100,
            y: 10
        }));
        
        // Validate restriction syntax
        if (!isValidRestriction(restrictionWithPos)) {
            continue;
        }
        
        // Apply restriction to get flipped cards
        const cardsToFlip = evaluateRestriction(restrictionWithPos, cards);
        
        // Get active (non-flipped) cards
        const activeCardIndices = new Set(
            cards.map((_, idx) => idx).filter(idx => !cardsToFlip.includes(idx))
        );
        const activeCards = cards.filter((_, idx) => activeCardIndices.has(idx));
        
        // Try all permutations of set name
        const setNamePerms = getPermutations(setNameDice);
        
        for (let setNamePerm of setNamePerms) {
            const setNameWithPos = setNamePerm.map((die, i) => ({
                ...die,
                x: i * 100,
                y: 10
            }));
            
            // Validate set name syntax
            if (!isValidSyntax(setNameWithPos)) {
                continue;
            }
            
            // Evaluate set name against active cards
            const result = evaluateExpression(setNameWithPos, activeCards);
            
            // Map back to original card indices
            const activeCardsArray = Array.from(activeCardIndices);
            const finalMatchingCards = new Set(
                Array.from(result).map(activeIdx => activeCardsArray[activeIdx])
            );
            
            // Check if matches goal
            if (finalMatchingCards.size === goal) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Generate all combinations of k elements from array
 */
function getCombinations(array, k) {
    const results = [];
    
    function backtrack(start, current) {
        if (current.length === k) {
            results.push([...current]);
            return;
        }
        
        for (let i = start; i < array.length; i++) {
            current.push(array[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    
    backtrack(0, []);
    return results;
}

/**
 * Generate all permutations of an array
 */
function getPermutations(array) {
    if (array.length <= 1) return [array];
    
    const results = [];
    
    for (let i = 0; i < array.length; i++) {
        const current = array[i];
        const remaining = array.slice(0, i).concat(array.slice(i + 1));
        const remainingPerms = getPermutations(remaining);
        
        for (let perm of remainingPerms) {
            results.push([current, ...perm]);
        }
    }
    
    return results;
}

