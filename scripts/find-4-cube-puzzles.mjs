import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/daily-puzzles-production.json', 'utf8'));

console.log('🔍 Searching for puzzles with shortestSolution === 4 AND Prime in dice...\n');

// Filter for shortestSolution === 4 AND contains Prime
const fourCubePuzzles = data.puzzles.filter(p => {
    if (p.shortestSolution !== 4) return false;
    
    // Check if any die has value '′' (Prime)
    return p.dice.some(die => die.value === '′');
});

console.log(`Found ${fourCubePuzzles.length} puzzles with 4-cube shortest solution AND Prime\n`);

// Sort by solutionCount (ascending)
fourCubePuzzles.sort((a, b) => a.solutionCount - b.solutionCount);

// Take top 10
const top10 = fourCubePuzzles.slice(0, 10);

console.log('📊 Top 10 Puzzles with Shortest Solution = 4 (sorted by lowest solution count):\n');
console.log('='.repeat(80));

for (let i = 0; i < top10.length; i++) {
    const puzzle = top10[i];
    
    console.log(`\n${i + 1}. Puzzle #${puzzle.id}`);
    console.log(`   Goal: ${puzzle.goal.length} cards`);
    console.log(`   Solutions: ${puzzle.solutionCount}`);
    console.log(`   Cube Range: ${puzzle.shortestSolution} - ${puzzle.longestSolution} cubes`);
    console.log(`   Dice: ${puzzle.dice.map(d => d.value).join(' ')}`);
    if (puzzle.solution && puzzle.solution.length > 0) {
        console.log(`   Example Solution: ${puzzle.solution.map(s => s.value).join(' ')}`);
    }
}

console.log('\n' + '='.repeat(80));

