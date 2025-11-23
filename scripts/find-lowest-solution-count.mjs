import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzles = data.puzzles;

console.log('🔍 Scanning all daily puzzles...\n');

// Decode all puzzles and collect data
const allPuzzles = puzzles.map(puzzle => {
  const decoded = decodePuzzle(puzzle);
  return {
    id: puzzle.id,
    goal: puzzle.goal,
    solutionCount: puzzle.solutionCount,
    shortestSolution: puzzle.shortestSolution,
    longestSolution: puzzle.longestSolution,
    topRow: decoded.solution.topRow,
    bottomRow: decoded.solution.bottomRow,
    hasRestriction: decoded.solution.hasRestriction,
    cards: decoded.cards,
    dice: decoded.dice
  };
});

// Sort by fewest solutions
allPuzzles.sort((a, b) => a.solutionCount - b.solutionCount);

console.log('📊 Top 10 Puzzles with LOWEST Solution Count:\n');
console.log('='.repeat(80));

allPuzzles.slice(0, 10).forEach((p, i) => {
  console.log(`\n${i + 1}. Puzzle #${p.id}`);
  console.log(`   Goal: ${p.goal} cards`);
  console.log(`   Solutions: ${p.solutionCount}`);
  console.log(`   Cube Range: ${p.shortestSolution} - ${p.longestSolution} cubes`);
  console.log(`   Has Restriction: ${p.hasRestriction ? 'Yes' : 'No'}`);
  console.log(`   Top Row:    ${p.topRow || '(empty)'}`);
  console.log(`   Bottom Row: ${p.bottomRow || '(empty)'}`);
});

console.log('\n' + '='.repeat(80));

// Check for puzzles with longestSolution < 8
const shortPuzzles = allPuzzles.filter(p => p.longestSolution < 8);
console.log(`\n⚠️  Puzzles with longest solution < 8 cubes: ${shortPuzzles.length} out of ${puzzles.length}`);

if (shortPuzzles.length > 0) {
  console.log(`   This might indicate an issue with puzzle generation or solution counting.`);
  console.log(`   First few examples:`);
  shortPuzzles.slice(0, 5).forEach(p => {
    console.log(`   - Puzzle #${p.id}: longest = ${p.longestSolution} cubes`);
  });
}

