#!/usr/bin/env node

/**
 * Generate verified daily puzzles using the actual DailyPuzzleGenerator
 * This ensures all goals are automatically validated
 */

import DailyPuzzleGenerator from './js/DailyPuzzleGenerator.js';
import { writeFileSync } from 'fs';

console.log('🎲 Generating 20 verified daily puzzles...\n');

const generator = new DailyPuzzleGenerator();

// Generate batch of puzzles
const puzzles = generator.generateBatch(20);

console.log(`✅ Generated ${puzzles.length} puzzles\n`);

// Log summary
puzzles.forEach((puzzle, i) => {
  console.log(`Puzzle ${puzzle.id || i+1}: Goal ${puzzle.goal}, Difficulty ${puzzle.difficulty.rating}`);
});

// Export to JSON
const exported = generator.exportBatch(puzzles);

// Write to file
writeFileSync('data/daily-puzzles-generated.json', exported);

console.log('\n✅ Saved to data/daily-puzzles-generated.json');
console.log('\nReview the file, then:');
console.log('  mv data/daily-puzzles-generated.json data/daily-puzzles.json');

