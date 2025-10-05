// Solution finder - checks if any valid solution exists

import { isValidSyntax, evaluateExpression } from './setTheory.js';

/**
 * Check if any valid solution exists for the current puzzle
 * @param {Array} cards - Array of card configurations
 * @param {Array} dice - Array of available dice
 * @param {number} goal - Target number of cards
 * @returns {boolean} - True if a solution exists
 */
export function hasPossibleSolution(cards, dice, goal) {
    // Check if there's a required cube (Level 8+)
    const requiredDie = dice.find(die => die.isRequired);
    
    // Try all possible dice combinations from size 2 to dice.length
    for (let size = 2; size <= dice.length; size++) {
        const combinations = getCombinations(dice, size);
        
        for (let combo of combinations) {
            // Skip combinations that don't include the required die
            if (requiredDie && !combo.some(die => die.id === requiredDie.id)) {
                continue;
            }
            
            // Try all permutations of this combination
            const perms = getPermutations(combo);
            
            for (let perm of perms) {
                // Add dummy positions for validation (won't affect result)
                const diceWithPositions = perm.map((die, i) => ({
                    ...die,
                    x: i * 100,
                    y: 10
                }));
                
                // Check if this permutation is valid syntax
                if (isValidSyntax(diceWithPositions)) {
                    // Evaluate and check if it matches the goal
                    const result = evaluateExpression(diceWithPositions, cards);
                    if (result.size === goal) {
                        return true; // Found a solution!
                    }
                }
            }
        }
    }
    
    return false; // No solution found
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

