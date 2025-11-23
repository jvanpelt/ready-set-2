import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzles = data.puzzles;

console.log('🔍 Inspecting puzzle structure...\n');

// Look at the first few puzzles to understand the format
for (let i = 0; i < 5; i++) {
  const puzzle = puzzles[i];
  const decoded = decodePuzzle(puzzle);
  
  console.log(`\n=== Puzzle #${puzzle.id} ===`);
  console.log('Raw puzzle keys:', Object.keys(puzzle));
  console.log('Decoded keys:', Object.keys(decoded));
  console.log('Solution:', JSON.stringify(decoded.solution, null, 2));
  console.log('---');
}

// Now search for puzzles with 6 total cubes
console.log('\n\n🔍 Searching for 6-cube puzzles with restrictions...\n');

const matches = [];

for (const puzzle of puzzles) {
  const decoded = decodePuzzle(puzzle);
  const solution = decoded.solution;
  
  // Count total cubes in solution
  let totalCubes = 0;
  if (solution.topRow) totalCubes += solution.topRow.split(' ').length;
  if (solution.bottomRow) totalCubes += solution.bottomRow.split(' ').length;
  
  // Looking for 6-cube solutions with restrictions
  if (totalCubes === 6 && solution.hasRestriction) {
    const topRowCubes = solution.topRow ? solution.topRow.split(' ').length : 0;
    const bottomRowCubes = solution.bottomRow ? solution.bottomRow.split(' ').length : 0;
    
    matches.push({
      id: puzzle.id,
      goal: puzzle.goal,
      topRow: solution.topRow,
      bottomRow: solution.bottomRow,
      topRowCubes,
      bottomRowCubes,
      solutionCount: puzzle.solutionCount,
      cards: decoded.cards,
      dice: decoded.dice
    });
  }
}

// Sort by fewest solutions
matches.sort((a, b) => a.solutionCount - b.solutionCount);

console.log(`✅ Found ${matches.length} puzzles with 6 cubes and restrictions\n`);
console.log('📊 Top 15 (fewest solutions):\n');

matches.slice(0, 15).forEach((m, i) => {
  console.log(`${i + 1}. Puzzle #${m.id} (Goal: ${m.goal}, ${m.solutionCount} solutions)`);
  console.log(`   ${m.topRowCubes} top row + ${m.bottomRowCubes} bottom row`);
  console.log(`   Top:    ${m.topRow}`);
  console.log(`   Bottom: ${m.bottomRow}`);
  console.log(`   Cards: ${m.cards.join(', ')}`);
  console.log(`   Dice:  ${m.dice.join(', ')}`);
  console.log('');
});

