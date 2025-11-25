import { decodePuzzle } from '../js/puzzleCodec.js';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/daily-puzzles.json', 'utf8'));
const puzzleIds = [329, 780, 1086, 506, 999, 388, 360, 317, 752, 981];

console.log('Checking for Prime (′) in top 10 puzzles:\n');

for (const id of puzzleIds) {
    const puzzle = data.puzzles.find(p => p.id === id);
    if (!puzzle) {
        console.log(`❌ Puzzle #${id} not found`);
        continue;
    }
    
    const decoded = decodePuzzle(puzzle);
    const hasPrime = decoded.dice.includes('′');
    
    console.log(`Puzzle #${id}: ${hasPrime ? '✅ HAS Prime' : '❌ No Prime'}`);
    console.log(`  Dice: ${decoded.dice.join(' ')}`);
}

