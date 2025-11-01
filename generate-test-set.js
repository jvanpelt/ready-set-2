/**
 * Generate full test set of daily puzzles (one per template)
 * Run with: node generate-test-set.js
 */

import DailyPuzzleGenerator from './js/DailyPuzzleGenerator.js';
import fs from 'fs';

console.log('🧪 DAILY PUZZLE TEST SET GENERATOR\n');
console.log('This will generate one puzzle for each of the 261 templates.');
console.log('Each puzzle is verified with a valid goal (1-7 matching cards).\n');

const generator = new DailyPuzzleGenerator();

// Generate test set
const testSet = generator.generateTestSet();

// Save to JSON
const jsonOutput = JSON.stringify(testSet, null, 2);
fs.writeFileSync('data/daily-puzzles-test.json', jsonOutput);

console.log('\n✅ Test set saved to data/daily-puzzles-test.json');
console.log(`📦 File size: ${(jsonOutput.length / 1024).toFixed(2)} KB`);
console.log('\n🎯 Ready for systematic testing!');

