import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzles = data.puzzles;

console.log('🔍 Searching for puzzles with 3 restriction + 3 set name cubes...\n');

const matches = [];

for (const puzzle of puzzles) {
  const decoded = decodePuzzle(puzzle);
  const solution = decoded.solution;
  
  const topRowCubes = solution.topRow ? solution.topRow.split(' ').length : 0;
  const bottomRowCubes = solution.bottomRow ? solution.bottomRow.split(' ').length : 0;
  
  // Looking for 3 cubes in restriction (topRow) and 3 cubes in set name (bottomRow)
  if (topRowCubes === 3 && bottomRowCubes === 3 && solution.hasRestriction) {
    matches.push({
      id: puzzle.id,
      goal: puzzle.goal,
      topRow: solution.topRow,
      bottomRow: solution.bottomRow,
      solutionCount: puzzle.solutionCount,
      shortestSolution: puzzle.shortestSolution,
      longestSolution: puzzle.longestSolution,
      cards: decoded.cards,
      dice: decoded.dice
    });
  }
}

// Sort by fewest solutions (most challenging/interesting)
matches.sort((a, b) => a.solutionCount - b.solutionCount);

console.log(`✅ Found ${matches.length} puzzles with 3+3 structure\n`);
console.log('📊 Top 10 (fewest solutions):\n');
console.log('=' .repeat(70));

matches.slice(0, 10).forEach((m, i) => {
  console.log(`\n${i + 1}. Puzzle #${m.id} (Goal: ${m.goal} cards)`);
  console.log(`   Solutions: ${m.solutionCount} | Range: ${m.shortestSolution}-${m.longestSolution} cubes`);
  console.log(`   Restriction: ${m.topRow}`);
  console.log(`   Set Name:    ${m.bottomRow}`);
  console.log(`   Cards: ${m.cards.join(', ')}`);
  console.log(`   Dice:  ${m.dice.join(', ')}`);
});

console.log('\n' + '='.repeat(70));
console.log(`\nShowing top 10 of ${matches.length} total matches`);

// Optional: Show summary statistics
const avgSolutions = matches.reduce((sum, m) => sum + m.solutionCount, 0) / matches.length;
console.log(`\n📈 Average solutions for 3+3 puzzles: ${avgSolutions.toFixed(1)}`);

