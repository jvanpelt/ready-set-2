/**
 * Shared validation utilities
 */

/**
 * Validate if a solution row has correct syntax
 * Handles: binary operators (∪, ∩, −, =, ⊆), postfix operators (′), wild cubes
 * 
 * @param {Array} dice - Array of dice objects to validate
 * @param {boolean} sortByPosition - Whether to sort dice by X position before validating (default: true)
 * @returns {boolean} - True if syntax is valid
 */
export function isSolutionSyntaxValid(dice, sortByPosition = true) {
    if (dice.length === 0) return true;
    
    // Sort dice left-to-right if needed (for visual consistency)
    const diceToValidate = sortByPosition ? [...dice].sort((a, b) => a.x - b.x) : dice;
    
    // Check for wild cubes without operator selection - these are invalid (incomplete)
    const hasIncompleteWild = diceToValidate.some(die => die.type === 'wild' && !die.selectedOperator);
    if (hasIncompleteWild) {
        return false;
    }
    
    // Binary operators (infix: operand → operator → operand)
    const binaryOperators = ['∪', '∩', '−', '=', '⊆'];
    // Postfix operators (operand → operator)
    const postfixOperators = ['′'];
    
    // Helper: Get effective value (for wild cubes, use selectedOperator)
    const getEffectiveValue = (die) => {
        if (die.type === 'wild' && die.selectedOperator) {
            return die.selectedOperator;
        }
        return die.value;
    };
    
    // Single die is valid only if it's an operand (not an operator)
    if (diceToValidate.length === 1) {
        const value = getEffectiveValue(diceToValidate[0]);
        return !binaryOperators.includes(value) && !postfixOperators.includes(value);
    }
    
    // Strategy: Treat "operand + optional postfix" as a single unit
    // Valid patterns:
    // - operand (with optional ′)
    // - operand (with optional ′) operator operand (with optional ′) ...
    
    let expectingOperand = true; // Start expecting an operand
    
    for (let i = 0; i < diceToValidate.length; i++) {
        const die = diceToValidate[i];
        const value = getEffectiveValue(die);
        const isBinaryOp = binaryOperators.includes(value);
        const isPostfixOp = postfixOperators.includes(value);
        
        if (expectingOperand) {
            // Should be an operand (color/set)
            if (isBinaryOp || isPostfixOp) {
                return false; // Can't start with operator
            }
            // Consume all consecutive postfix operators (e.g., ′ ′ for double complement)
            while (i + 1 < diceToValidate.length && postfixOperators.includes(getEffectiveValue(diceToValidate[i + 1]))) {
                i++; // Skip each postfix operator
            }
            expectingOperand = false; // Next should be binary operator (or end)
        } else {
            // Should be a binary operator
            if (!isBinaryOp) {
                return false; // Expected binary operator, got something else
            }
            expectingOperand = true; // Next should be operand
        }
    }
    
    // Must end with an operand (not expecting an operator)
    return !expectingOperand;
}

