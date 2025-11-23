import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzles = data.puzzles;

console.log('🔍 Analyzing all 6-cube puzzle patterns...\n');

const patternCounts = {};
const examplesByPattern = {};

for (const puzzle of puzzles) {
  const decoded = decodePuzzle(puzzle);
  const solution = decoded.solution;
  
  const topRowCubes = solution.topRow ? solution.topRow.split(' ').length : 0;
  const bottomRowCubes = solution.bottomRow ? solution.bottomRow.split(' ').length : 0;
  const totalCubes = topRowCubes + bottomRowCubes;
  
  if (totalCubes === 6) {
    const pattern = `${topRowCubes}+${bottomRowCubes}`;
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    
    if (!examplesByPattern[pattern] || examplesByPattern[pattern].solutionCount > puzzle.solutionCount) {
      examplesByPattern[pattern] = {
        id: puzzle.id,
        goal: puzzle.goal,
        topRow: solution.topRow,
        bottomRow: solution.bottomRow,
        hasRestriction: solution.hasRestriction,
        solutionCount: puzzle.solutionCount
      };
    }
  }
}

console.log('📊 6-Cube Patterns Found:\n');
console.log('Pattern | Count | Best Example (fewest solutions)');
console.log('--------|-------|----------------------------------');

Object.entries(patternCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pattern, count]) => {
    const example = examplesByPattern[pattern];
    console.log(`${pattern.padEnd(7)} | ${String(count).padStart(5)} | Puzzle #${example.id} (${example.solutionCount} solutions, goal: ${example.goal})`);
    console.log(`        |       | ${example.topRow} ; ${example.bottomRow}`);
    console.log(`        |       | Has restriction: ${example.hasRestriction ? 'Yes' : 'No'}`);
    console.log('');
  });

console.log('\n💡 Recommendation for Level 6 Tutorial:');
console.log('   The most common 6-cube pattern with restrictions is likely 5+1.');
console.log('   Consider using that pattern, or stick with the current 8-cube (7+1) design.');

