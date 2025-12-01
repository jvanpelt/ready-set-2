/**
 * Test script to verify that prime patterns are now correctly counted (QUIET VERSION)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const countAllSolutions = solutionFinderModule.countAllSolutions;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;

// Make imported functions available globally (but suppress console output)
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;

// Suppress console.log from setTheory module
const originalLog = console.log;
console.log = () => {};

console.log = originalLog; // Restore for our output

console.log('\n🧪 TESTING PRIME PATTERN FIX (Quiet Mode)\n');

// Load puzzle data
const puzzleDataPath = path.resolve(projectRoot, 'data/daily-puzzles-production-rebalanced-with-counts.json');
const puzzleData = JSON.parse(fs.readFileSync(puzzleDataPath, 'utf8'));

// Find puzzles with prime operator
const primePuzzles = puzzleData.puzzles.filter(p => 
    p.dice.some(d => d.value === '′')
);

console.log(`Found ${primePuzzles.length} puzzles with prime operator`);

// Suppress console.log during counting
console.log = () => {};

// Test puzzle #199 specifically
const puzzle199 = primePuzzles.find(p => p.id === 199);
if (puzzle199) {
    const result = countAllSolutions(puzzle199.cards, puzzle199.dice, puzzle199.goal, false);
    
    console.log = originalLog; // Restore
    
    console.log(`\n━━━ Puzzle #199 (Known Problem Case) ━━━`);
    console.log(`Solution: ${puzzle199.solution.topRow || ''} | ${puzzle199.solution.bottomRow || ''}`);
    console.log(`Pattern: ${puzzle199.solution.pattern}`);
    console.log(`Previous longestSolution: ${puzzle199.longestSolution}`);
    console.log(`NEW longestSolution: ${result.longestCubeCount}`);
    console.log(result.longestCubeCount === 8 ? `✅ FIXED!` : `❌ Still broken`);
    
    console.log = () => {}; // Suppress again
}

// Summary statistics
let fixed = 0;
let nowAt8 = 0;

primePuzzles.forEach(puzzle => {
    const result = countAllSolutions(puzzle.cards, puzzle.dice, puzzle.goal, false);
    
    if (result.longestCubeCount === 8) {
        nowAt8++;
        if (puzzle.longestSolution !== 8) {
            fixed++;
        }
    }
});

console.log = originalLog; // Restore

console.log(`\n━━━ SUMMARY ━━━`);
console.log(`Total prime puzzles: ${primePuzzles.length}`);
console.log(`Now reporting longestSolution = 8: ${nowAt8} / ${primePuzzles.length}`);
console.log(`Puzzles fixed by this change: ${fixed}`);

if (nowAt8 === primePuzzles.length) {
    console.log(`\n✅ ALL PRIME PUZZLES FIXED!\n`);
} else {
    console.log(`\n⚠️  Some puzzles still not at 8 cubes\n`);
}

