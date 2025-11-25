/**
 * Analyze a specific puzzle to find all solutions
 * Verifies if a required cube is truly required
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
const hasPossibleSolution = solutionFinderModule.hasPossibleSolution;
const countAllSolutions = solutionFinderModule.countAllSolutions;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;
const scenarioManagerModule = await import(`file://${projectRoot}/js/scenarioManager.js`);
const ScenarioManager = scenarioManagerModule.ScenarioManager;

// Make imported functions available globally
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;

// Puzzle data
const puzzleData = {
  "cards": [4, 5, 7, 11, 10, 9, 8, 14],
  "dice": [
    { "type": "color", "value": "red", "name": "RED", "id": "builder-color-0" },
    { "type": "color", "value": "green", "name": "GREEN", "id": "builder-color-1" },
    { "type": "color", "value": "green", "name": "GREEN", "id": "builder-color-2" },
    { "type": "color", "value": "gold", "name": "GOLD", "id": "builder-color-3" },
    { "type": "operator", "value": "∩", "name": "INTERSECTION", "id": "builder-op-0" },
    { "type": "operator", "value": "′", "name": "COMPLEMENT", "id": "builder-op-1", "isRequired": true },
    { "type": "set-constant", "value": "U", "name": "UNIVERSE", "id": "builder-op-2" },
    { "type": "set-constant", "value": "∅", "name": "NULL", "id": "builder-op-3" }
  ],
  "goal": 3
};

// Convert card indices to card objects
const scenarioManager = new ScenarioManager({ level: 8 });
const cards = scenarioManager.cardsFromIndices(puzzleData.cards);

console.log('\n🔍 ANALYZING PUZZLE\n');
console.log('=' .repeat(60));
console.log('\n🃏 Cards:');
cards.forEach((card, i) => {
    console.log(`   [${i}] ${card.colors.join(', ')}`);
});

console.log('\n🎲 Dice:');
puzzleData.dice.forEach((die, i) => {
    const flag = die.isRequired ? ' [REQUIRED]' : '';
    console.log(`   [${i}] ${die.value} (${die.name})${flag}`);
});

console.log(`\n🎯 Goal: ${puzzleData.goal} cards`);

// Count solutions WITH Prime
console.log('\n\n📊 COUNTING SOLUTIONS...\n');
const solutionsWithPrime = countAllSolutions(cards, puzzleData.dice, puzzleData.goal, true);

console.log(`\nTotal solutions WITH Prime: ${solutionsWithPrime.totalSolutions}`);
console.log(`Shortest solution: ${solutionsWithPrime.shortestCubeCount} cubes`);
console.log(`Longest solution: ${solutionsWithPrime.longestCubeCount} cubes`);

// Find the shortest solution
const shortestSolution = findShortestSolution(cards, puzzleData.dice, puzzleData.goal);
if (shortestSolution) {
    console.log('\n🏆 SHORTEST SOLUTION:');
    if (shortestSolution.restrictionDice && shortestSolution.restrictionDice.length > 0) {
        console.log(`   Restriction: ${shortestSolution.restrictionDice.map(d => d.value).join(' ')}`);
    }
    console.log(`   Set Name:    ${shortestSolution.setNameDice.map(d => d.value).join(' ')}`);
    console.log(`   Total cubes: ${shortestSolution.cubeCount}`);
    
    // Check if shortest uses Prime
    const allDice = [...(shortestSolution.restrictionDice || []), ...shortestSolution.setNameDice];
    const usesPrime = allDice.some(d => d.value === '′');
    console.log(`   Uses Prime:  ${usesPrime ? '✅ Yes' : '❌ No'}`);
}

// Verify Prime is REQUIRED
console.log('=' .repeat(60));
console.log('VERIFYING PRIME IS REQUIRED:');
console.log('=' .repeat(60) + '\n');

// Remove Prime and count solutions
const diceWithoutPrime = puzzleData.dice.filter(d => d.value !== '′');
console.log('Testing with Prime removed...');
console.log(`Dice without Prime: ${diceWithoutPrime.map(d => d.value).join(' ')}`);

const solutionsWithoutPrime = countAllSolutions(cards, diceWithoutPrime, puzzleData.goal, false);

console.log(`\nSolutions WITHOUT Prime: ${solutionsWithoutPrime.totalSolutions}`);
console.log(`Solutions WITH Prime: ${solutionsWithPrime.totalSolutions}`);

// Find shortest solution WITHOUT Prime to see what it is
if (solutionsWithoutPrime.totalSolutions > 0) {
    console.log('\n⚠️  Shortest solution WITHOUT Prime:');
    const shortestWithoutPrime = findShortestSolution(cards, diceWithoutPrime, puzzleData.goal);
    if (shortestWithoutPrime) {
        if (shortestWithoutPrime.restrictionDice && shortestWithoutPrime.restrictionDice.length > 0) {
            console.log(`   Restriction: ${shortestWithoutPrime.restrictionDice.map(d => d.value).join(' ')}`);
        }
        console.log(`   Set Name:    ${shortestWithoutPrime.setNameDice.map(d => d.value).join(' ')}`);
        console.log(`   Total cubes: ${shortestWithoutPrime.cubeCount}`);
    }
}

if (solutionsWithoutPrime.totalSolutions === 0 && solutionsWithPrime.totalSolutions > 0) {
    console.log('\n✅ VERIFIED: Prime is REQUIRED for this puzzle!');
    console.log('   No solutions exist without it.');
} else if (solutionsWithoutPrime.totalSolutions > 0) {
    console.log('\n⚠️  WARNING: Prime is NOT required!');
    console.log(`   ${solutionsWithoutPrime.totalSolutions} solution(s) exist without Prime.`);
} else {
    console.log('\n❌ ERROR: No solutions exist even WITH Prime!');
}

console.log('\n' + '=' .repeat(60) + '\n');

