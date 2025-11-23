import { readFileSync } from 'fs';
import { decodePuzzle } from '../js/puzzleCodec.js';

// Get puzzle ID from command line argument, default to 780
const puzzleId = process.argv[2] ? parseInt(process.argv[2]) : 780;

// Load puzzles
const data = JSON.parse(readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzle = data.puzzles.find(p => p.id === puzzleId);

if (!puzzle) {
  console.log(`❌ Puzzle #${puzzleId} not found`);
  process.exit(1);
}

const decoded = decodePuzzle(puzzle);

console.log(`\n📋 Puzzle #${puzzle.id} Details\n`);
console.log('='.repeat(60));
console.log(`Goal: ${puzzle.goal} cards`);
console.log(`Solutions: ${puzzle.solutionCount}`);
console.log(`Cube Range: ${puzzle.shortestSolution} - ${puzzle.longestSolution} cubes`);
console.log('='.repeat(60));

console.log(`\n🃏 Cards (8):`);
decoded.cards.forEach((card, i) => {
  const colors = Array.isArray(card.colors) 
    ? (card.colors.length > 0 ? card.colors.join(', ') : '(empty)') 
    : card.colors;
  console.log(`   ${i + 1}. ${colors}`);
});

console.log(`\n🎲 Dice (8):`);
decoded.dice.forEach((die, i) => {
  const dieValue = typeof die === 'object' ? die.value : die;
  console.log(`   ${i + 1}. ${dieValue}`);
});

console.log(`\n✅ Example Solution:`);
console.log(`   Top Row:    ${decoded.solution.topRow || '(empty)'}`);
console.log(`   Bottom Row: ${decoded.solution.bottomRow || '(empty)'}`);

console.log('\n' + '='.repeat(60) + '\n');
