/**
 * Regenerate all daily puzzle test data
 * Run with: node scripts/regenerate-test-puzzles.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules using dynamic import (note: DailyPuzzleGenerator is default export)
const DailyPuzzleGeneratorModule = await import(`file://${projectRoot}/js/DailyPuzzleGenerator.js`);
const DailyPuzzleGenerator = DailyPuzzleGeneratorModule.default;
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const findShortestSolution = solutionFinderModule.findShortestSolution;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const levelsModule = await import(`file://${projectRoot}/js/levels.js`);
const generateCardConfig = levelsModule.generateCardConfig;
const generateDiceForLevel = levelsModule.generateDiceForLevel;

// Make imported functions available globally for DailyPuzzleGenerator
global.findShortestSolution = findShortestSolution;
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.generateCardConfig = generateCardConfig;
global.generateDiceForLevel = generateDiceForLevel;

console.log('\n🎲 REGENERATING DAILY PUZZLE TEST SET\n');
console.log('This will create fresh puzzles with the fixed dice generation.');
console.log('All puzzles will respect: 4 colors max, 2-per-color max, 2 operators max.\n');

const generator = new DailyPuzzleGenerator();
const puzzles = generator.generateTestSet();

// Validate all puzzles
let invalidCount = 0;
puzzles.forEach(puzzle => {
    const colorCounts = {};
    puzzle.dice.forEach(die => {
        if (die.type === 'color') {
            colorCounts[die.value] = (colorCounts[die.value] || 0) + 1;
        }
    });
    
    const maxColorCount = Math.max(...Object.values(colorCounts), 0);
    const totalColors = Object.keys(colorCounts).length;
    const operatorCount = puzzle.dice.filter(d => 
        d.type === 'operator' && ['∪', '∩', '−', '′'].includes(d.value)
    ).length;
    
    if (maxColorCount > 2 || totalColors > 4 || operatorCount > 2) {
        console.error(`❌ Puzzle #${puzzle.id} INVALID:`);
        if (maxColorCount > 2) console.error(`   - Has ${maxColorCount} of one color (max 2)`);
        if (totalColors > 4) console.error(`   - Has ${totalColors} color types (max 4)`);
        if (operatorCount > 2) console.error(`   - Has ${operatorCount} operators (max 2)`);
        invalidCount++;
    }
});

if (invalidCount > 0) {
    console.error(`\n❌ ${invalidCount} INVALID PUZZLES FOUND - ABORTING`);
    process.exit(1);
}

console.log(`\n✅ All ${puzzles.length} puzzles validated!`);
console.log('   - Max 2 of any color: ✓');
console.log('   - Max 4 colors total: ✓');
console.log('   - Max 2 operators: ✓\n');

// Export to JSON
const exportData = {
    version: '2.0.0-fixed',
    generatedAt: new Date().toISOString(),
    description: 'Test puzzles with fixed dice generation (max 2 per color)',
    count: puzzles.length,
    puzzles: puzzles
};

const outputPath = path.join(projectRoot, 'data', 'daily-puzzles-test.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`✅ Saved ${puzzles.length} puzzles to data/daily-puzzles-test.json`);
console.log('\nDone! 🎉\n');

