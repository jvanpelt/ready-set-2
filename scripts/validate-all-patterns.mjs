/**
 * Generate and validate ALL physically possible restriction and set name patterns
 * 
 * PHYSICAL CONSTRAINTS (Regular Game, Level 6+):
 * - 4 color cubes (max)
 * - 2 operator cubes from [∪, ∩, −, ′] (max)  
 * - 2 special cubes from [U, ∅, =, ⊆] (max)
 * 
 * Within those 2 special cubes:
 * - Can be 0-2 setName cubes [U, ∅]
 * - Can be 0-2 restriction cubes [=, ⊆]
 * - Total special cubes ≤ 2
 * 
 * VALID COMBINATIONS:
 * - 2 setName + 0 restriction ✓
 * - 1 setName + 1 restriction ✓
 * - 0 setName + 2 restriction ✓
 * - 2 setName + 1 restriction ✗ (3 special)
 * - 1 setName + 2 restriction ✗ (3 special)
 */

/**
 * Count cube types in a pattern
 */
function countCubes(pattern) {
    const tokens = pattern.split(',');
    
    const counts = {
        color: 0,
        operator: 0,    // ∪, ∩, −
        prime: 0,       // ′
        setName: 0,     // U, ∅
        restriction: 0  // =, ⊆
    };
    
    tokens.forEach(token => {
        if (token === 'color') counts.color++;
        else if (token === 'operator') counts.operator++;
        else if (token === 'prime') counts.prime++;
        else if (token === 'setName') counts.setName++;
        else if (token === 'restriction') counts.restriction++;
    });
    
    // Prime is treated as an operator in physical counting
    const totalOperators = counts.operator + counts.prime;
    const totalSpecial = counts.setName + counts.restriction;
    
    return {
        ...counts,
        totalOperators,
        totalSpecial,
        totalCubes: tokens.length
    };
}

/**
 * Check if pattern is physically possible
 */
function isPhysicallyPossible(pattern) {
    const counts = countCubes(pattern);
    
    // Check cube limits
    if (counts.color > 4) return false;
    if (counts.totalOperators > 2) return false;
    if (counts.totalSpecial > 2) return false;
    if (counts.totalCubes > 8) return false;
    
    return true;
}

/**
 * Check if restriction pattern is mathematically valid
 */
function isValidRestrictionPattern(pattern) {
    const tokens = pattern.split(',');
    
    // Must have exactly 1 restriction
    const restrictionCount = tokens.filter(t => t === 'restriction').length;
    if (restrictionCount !== 1) return false;
    
    // Find restriction position
    const restrictionIdx = tokens.indexOf('restriction');
    
    // Must have at least 1 token on each side
    if (restrictionIdx === 0) return false; // Nothing on left
    if (restrictionIdx === tokens.length - 1) return false; // Nothing on right
    
    // Left side must be a valid set expression
    const leftSide = tokens.slice(0, restrictionIdx);
    if (!isValidSetExpression(leftSide)) return false;
    
    // Right side must be a valid set expression
    const rightSide = tokens.slice(restrictionIdx + 1);
    if (!isValidSetExpression(rightSide)) return false;
    
    return true;
}

/**
 * Check if set name pattern is mathematically valid
 */
function isValidSetNamePattern(pattern) {
    const tokens = pattern.split(',');
    
    // Must not have restriction
    if (tokens.includes('restriction')) return false;
    
    // Must have at least one operand
    const operands = tokens.filter(t => ['color', 'setName'].includes(t));
    if (operands.length === 0) return false;
    
    // Check if it's a valid set expression
    return isValidSetExpression(tokens);
}

/**
 * Check if tokens form a valid set expression
 */
function isValidSetExpression(tokens) {
    if (tokens.length === 0) return false;
    
    // Single operand is valid
    if (tokens.length === 1) {
        return ['color', 'setName'].includes(tokens[0]);
    }
    
    // Two tokens: operand + prime
    if (tokens.length === 2) {
        return ['color', 'setName'].includes(tokens[0]) && tokens[1] === 'prime';
    }
    
    // Three or more: must follow pattern
    // Valid: operand, operator, operand
    // Valid: operand, operator, operand, prime
    // Valid: operand, prime, operator, operand
    // etc.
    
    // Check alternating pattern (allowing prime after operands)
    let expectOperand = true;
    let lastWasOperand = false;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token === 'prime') {
            // Prime must follow an operand
            if (!lastWasOperand) return false;
            // Prime doesn't change expectation
            continue;
        }
        
        const isOperand = ['color', 'setName'].includes(token);
        const isOperator = token === 'operator';
        
        if (expectOperand) {
            if (!isOperand) return false;
            lastWasOperand = true;
            expectOperand = false;
        } else {
            if (!isOperator) return false;
            lastWasOperand = false;
            expectOperand = true;
        }
    }
    
    // Must end with an operand (or prime after operand)
    return lastWasOperand;
}

/**
 * Generate all possible patterns of a given length
 */
function generatePatterns(length, includeRestriction) {
    const elements = ['color', 'operator', 'prime', 'setName'];
    if (includeRestriction) {
        elements.push('restriction');
    }
    
    const patterns = [];
    
    function backtrack(current) {
        if (current.length === length) {
            patterns.push(current.join(','));
            return;
        }
        
        for (const element of elements) {
            backtrack([...current, element]);
        }
    }
    
    backtrack([]);
    return patterns;
}

console.log('\n' + '='.repeat(70));
console.log('  COMPREHENSIVE PATTERN VALIDATION');
console.log('='.repeat(70));

console.log('\n📋 PHYSICAL CONSTRAINTS (Regular Game Level 6+):\n');
console.log('  • 4 color cubes (max)');
console.log('  • 2 operator cubes [∪, ∩, −] + prime [′] (max)');
console.log('  • 2 special cubes [U, ∅, =, ⊆] (max)');
console.log('');
console.log('  Valid special cube combinations:');
console.log('    ✓ 2 setName + 0 restriction (e.g., U, ∅)');
console.log('    ✓ 1 setName + 1 restriction (e.g., U, =)');
console.log('    ✓ 0 setName + 2 restriction (e.g., =, ⊆)');
console.log('    ✗ 3+ special cubes (physically impossible)');

// Generate RESTRICTION PATTERNS
console.log('\n' + '='.repeat(70));
console.log('RESTRICTION PATTERNS (must contain exactly 1 restriction)');
console.log('='.repeat(70));

const validRestrictionPatterns = new Set();

// Generate patterns from length 3 to 8
for (let length = 3; length <= 8; length++) {
    console.log(`\n🔍 Checking length ${length}...`);
    
    const allPatterns = generatePatterns(length, true);
    let mathValid = 0;
    let physicallyValid = 0;
    
    for (const pattern of allPatterns) {
        if (isValidRestrictionPattern(pattern)) {
            mathValid++;
            if (isPhysicallyPossible(pattern)) {
                validRestrictionPatterns.add(pattern);
                physicallyValid++;
            }
        }
    }
    
    console.log(`  Generated: ${allPatterns.length.toLocaleString()}`);
    console.log(`  Math valid: ${mathValid}`);
    console.log(`  Physically possible: ${physicallyValid}`);
}

console.log(`\n✅ Total valid RESTRICTION patterns: ${validRestrictionPatterns.size}`);

// Show breakdown by special cube count
const bySpecial = { 0: [], 1: [], 2: [] };
validRestrictionPatterns.forEach(pattern => {
    const counts = countCubes(pattern);
    bySpecial[counts.totalSpecial].push(pattern);
});

console.log('\nBreakdown by special cubes:');
console.log(`  0 special (colors + operators only): ${bySpecial[0].length} patterns`);
console.log(`  1 special (1 restriction OR 1 setName): ${bySpecial[1].length} patterns`);
console.log(`  2 special (2 restrictions OR 1+1 OR 2 setNames): ${bySpecial[2].length} patterns`);

// Show samples of 2 setName patterns
const twoSetNamePatterns = Array.from(validRestrictionPatterns).filter(p => {
    const counts = countCubes(p);
    return counts.setName >= 2;
});
console.log(`\n  Patterns with 2+ setNames: ${twoSetNamePatterns.length}`);
if (twoSetNamePatterns.length > 0) {
    console.log('  Samples:');
    twoSetNamePatterns.slice(0, 5).forEach(p => console.log(`    - ${p}`));
}

// Generate SET NAME PATTERNS
console.log('\n' + '='.repeat(70));
console.log('SET NAME PATTERNS (no restriction operator)');
console.log('='.repeat(70));

const validSetNamePatterns = new Set();

for (let length = 1; length <= 8; length++) {
    console.log(`\n🔍 Checking length ${length}...`);
    
    const allPatterns = generatePatterns(length, false);
    let mathValid = 0;
    let physicallyValid = 0;
    
    for (const pattern of allPatterns) {
        if (isValidSetNamePattern(pattern)) {
            mathValid++;
            if (isPhysicallyPossible(pattern)) {
                validSetNamePatterns.add(pattern);
                physicallyValid++;
            }
        }
    }
    
    console.log(`  Generated: ${allPatterns.length.toLocaleString()}`);
    console.log(`  Math valid: ${mathValid}`);
    console.log(`  Physically possible: ${physicallyValid}`);
}

console.log(`\n✅ Total valid SET NAME patterns: ${validSetNamePatterns.size}`);

// Show breakdown by special cube count
const setNameBySpecial = { 0: [], 1: [], 2: [] };
validSetNamePatterns.forEach(pattern => {
    const counts = countCubes(pattern);
    setNameBySpecial[counts.totalSpecial].push(pattern);
});

console.log('\nBreakdown by special cubes:');
console.log(`  0 special (colors + operators only): ${setNameBySpecial[0].length} patterns`);
console.log(`  1 special (1 setName): ${setNameBySpecial[1].length} patterns`);
console.log(`  2 special (2 setNames): ${setNameBySpecial[2].length} patterns`);

// Show samples of 2 setName patterns
const setNameTwoSetNames = Array.from(validSetNamePatterns).filter(p => {
    const counts = countCubes(p);
    return counts.setName >= 2;
});
console.log(`\n  Patterns with 2 setNames: ${setNameTwoSetNames.length}`);
if (setNameTwoSetNames.length > 0) {
    console.log('  Samples:');
    setNameTwoSetNames.slice(0, 8).forEach(p => console.log(`    - ${p}`));
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`\nRESTRICTION_PATTERNS: ${validRestrictionPatterns.size} patterns`);
console.log(`SETNAME_PATTERNS: ${validSetNamePatterns.size} patterns`);

console.log('\n📊 Breakdown by length:\n');
console.log('RESTRICTION PATTERNS:');
for (let len = 3; len <= 8; len++) {
    const count = Array.from(validRestrictionPatterns).filter(p => p.split(',').length === len).length;
    console.log(`  ${len} cubes: ${count} patterns`);
}

console.log('\nSET NAME PATTERNS:');
for (let len = 1; len <= 8; len++) {
    const count = Array.from(validSetNamePatterns).filter(p => p.split(',').length === len).length;
    console.log(`  ${len} cubes: ${count} patterns`);
}

// Export to file
import fs from 'fs';
const output = {
    restrictionPatterns: Array.from(validRestrictionPatterns).sort(),
    setNamePatterns: Array.from(validSetNamePatterns).sort()
};

fs.writeFileSync('pattern-validation-output.json', JSON.stringify(output, null, 2));
console.log('\n💾 Saved to: pattern-validation-output.json');
console.log('\n✅ Done!\n');

