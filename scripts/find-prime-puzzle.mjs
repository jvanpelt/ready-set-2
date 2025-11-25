/**
 * Find puzzle configurations that require Prime in interesting ways
 * Goal: Exactly 1 solution, uses Prime in pattern like "color′ ∩ color" or "(color ∩ color)′"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const findShortestSolution = solutionFinderModule.findShortestSolution;
const countAllSolutions = solutionFinderModule.countAllSolutions;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;
const scenarioManagerModule = await import(`file://${projectRoot}/js/scenarioManager.js`);
const ScenarioManager = scenarioManagerModule.ScenarioManager;
const levelsModule = await import(`file://${projectRoot}/js/levels.js`);
const generateCardConfig = levelsModule.generateCardConfig;

// Make imported functions available globally
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;

const scenarioManager = new ScenarioManager({ level: 8 });

// Fixed dice (from your puzzle builder)
const dice = [
    { "type": "color", "value": "red", "name": "RED" },
    { "type": "color", "value": "green", "name": "GREEN" },
    { "type": "color", "value": "green", "name": "GREEN" },
    { "type": "color", "value": "gold", "name": "GOLD" },
    { "type": "operator", "value": "∩", "name": "INTERSECTION" },
    { "type": "operator", "value": "′", "name": "COMPLEMENT", "isRequired": true },
    { "type": "set-constant", "value": "U", "name": "UNIVERSE" },
    { "type": "set-constant", "value": "∅", "name": "NULL" }
];

console.log('\n🔍 SEARCHING FOR PRIME-REQUIRED PUZZLES\n');
console.log('Criteria:');
console.log('  - Exactly 1 solution with Prime');
console.log('  - Solution is NOT just "color ′"');
console.log('  - Prefer patterns like "color′ ∩ color" or "(color ∩ color)′"\n');
console.log('=' .repeat(60));

const candidates = [];
let tested = 0;

// Try different card combinations and goals
for (let cardCount = 8; cardCount <= 8; cardCount++) {
    // Generate random card sets to test
    for (let attempt = 0; attempt < 1000; attempt++) {
        const cards = generateCardConfig(cardCount);
        
        // Try different goals (1-7)
        for (let goal = 1; goal <= 7; goal++) {
            tested++;
            
            // Count solutions WITH Prime
            const withPrime = countAllSolutions(cards, dice, goal, false);
            
            // Only interested in puzzles with exactly 1 solution
            if (withPrime.totalSolutions !== 1) continue;
            
            // Find the solution
            const solution = findShortestSolution(cards, dice, goal);
            if (!solution) continue;
            
            // Get solution string
            const solutionStr = solution.setNameDice.map(d => d.value).join(' ');
            
            // Filter out "color ′" patterns (too simple)
            if (solution.cubeCount === 2 && solutionStr.includes('′')) {
                continue; // Skip "red ′", "green ′", etc.
            }
            
            // Prefer solutions with 3-4 cubes (interesting complexity)
            if (solution.cubeCount < 3 || solution.cubeCount > 4) {
                continue;
            }
            
            // Check if Prime is actually required
            const diceWithoutPrime = dice.filter(d => d.value !== '′');
            const withoutPrime = countAllSolutions(cards, diceWithoutPrime, goal, false);
            
            // Must have 0 solutions without Prime
            if (withoutPrime.totalSolutions > 0) continue;
            
            // Found a candidate!
            candidates.push({
                cards,
                goal,
                solution,
                solutionStr,
                cubeCount: solution.cubeCount
            });
            
            if (candidates.length <= 10) {
                console.log(`\n✅ Candidate #${candidates.length}:`);
                console.log(`   Goal: ${goal} cards`);
                console.log(`   Solution: ${solutionStr} (${solution.cubeCount} cubes)`);
                console.log(`   Cards:`);
                cards.forEach((card, i) => {
                    console.log(`     [${i}] ${card.colors.join(', ')}`);
                });
            }
            
            // Stop after finding 10 good candidates
            if (candidates.length >= 10) {
                console.log(`\n\n🎯 Found 10 candidates! Stopping search...`);
                console.log(`   (Tested ${tested} configurations)\n`);
                console.log('=' .repeat(60));
                process.exit(0);
            }
        }
    }
}

if (candidates.length === 0) {
    console.log(`\n❌ No candidates found after testing ${tested} configurations`);
    console.log('   Try adjusting the dice or criteria.\n');
} else {
    console.log(`\n\n✅ Found ${candidates.length} candidates after testing ${tested} configurations\n`);
    console.log('=' .repeat(60));
}

