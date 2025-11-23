import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzles = data.puzzles;

console.log('🔍 Searching for 3+3 (restriction + set name) puzzles...\n');

const matches = [];

for (const puzzle of puzzles) {
  const decoded = decodePuzzle(puzzle);
  const solution = decoded.solution;
  
  const topRowCubes = solution.topRow ? solution.topRow.split(' ').length : 0;
  const bottomRowCubes = solution.bottomRow ? solution.bottomRow.split(' ').length : 0;
  
  // Looking for EXACTLY 3 cubes in restriction (topRow) and 3 cubes in set name (bottomRow)
  if (topRowCubes === 3 && bottomRowCubes === 3 && solution.hasRestriction) {
    // Decode cards and dice (they're encoded in the JSON)
    const cards = decoded.cards.map(card => {
      if (typeof card === 'string') return card;
      return card.colors ? card.colors.join('/') : JSON.stringify(card);
    });
    
    const dice = decoded.dice.map(die => typeof die === 'string' ? die : JSON.stringify(die));
    
    matches.push({
      id: puzzle.id,
      goal: puzzle.goal,
      topRow: solution.topRow,
      bottomRow: solution.bottomRow,
      solutionCount: puzzle.solutionCount,
      shortestSolution: puzzle.shortestSolution,
      longestSolution: puzzle.longestSolution,
      cards,
      dice
    });
  }
}

// Sort by fewest solutions (most challenging/interesting)
matches.sort((a, b) => a.solutionCount - b.solutionCount);

console.log(`✅ Found ${matches.length} puzzles with 3+3 structure\n`);

if (matches.length === 0) {
  console.log('❌ No puzzles found with exactly 3 restriction cubes + 3 set name cubes.');
  console.log('\nThis might be because:');
  console.log('  - The puzzle generator doesn\'t create this specific pattern');
  console.log('  - It\'s a rare combination');
  console.log('  - The tutorial scenario might need adjustment');
} else {
  console.log('📊 Top 10 (fewest solutions):\n');
  console.log('='.repeat(80));

  matches.slice(0, 10).forEach((m, i) => {
    console.log(`\n${i + 1}. Puzzle #${m.id} (Goal: ${m.goal} cards)`);
    console.log(`   Solutions: ${m.solutionCount} | Range: ${m.shortestSolution}-${m.longestSolution} cubes`);
    console.log(`   Top Row (restriction):  ${m.topRow}`);
    console.log(`   Bottom Row (set name):  ${m.bottomRow}`);
    console.log(`   Cards: ${m.cards.join(', ')}`);
    console.log(`   Dice:  ${m.dice.join(', ')}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nShowing top ${Math.min(10, matches.length)} of ${matches.length} total matches`);
}

