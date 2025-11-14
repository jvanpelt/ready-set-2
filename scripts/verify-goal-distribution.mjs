/**
 * Verify goal distribution in puzzle data
 * Usage: node scripts/verify-goal-distribution.mjs [puzzle-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Get input file from command line
const inputFile = process.argv[2] || 'data/daily-puzzles-decoded-with-counts.json';
const inputPath = path.resolve(projectRoot, inputFile);

console.log('\n📊 GOAL DISTRIBUTION ANALYSIS\n');
console.log(`Input: ${path.relative(projectRoot, inputPath)}\n`);

// Load puzzles
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const puzzles = data.puzzles || data;

console.log(`Total puzzles: ${puzzles.length}\n`);

// Count goals
const goalCounts = {};
for (let i = 1; i <= 7; i++) {
    goalCounts[i] = 0;
}

puzzles.forEach(p => {
    if (p.goal >= 1 && p.goal <= 7) {
        goalCounts[p.goal]++;
    }
});

// Expected distribution from WEIGHTED_GOALS array (for 1461 puzzles)
// [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7]
const expected = {
    1: 209,  // 14.3% (3/21)
    2: 278,  // 19.0% (4/21)
    3: 278,  // 19.0% (4/21)
    4: 278,  // 19.0% (4/21)
    5: 209,  // 14.3% (3/21)
    6: 139,  // 9.5% (2/21)
    7: 70    // 4.8% (1/21)
};

// Calculate totals
let totalExpected = 0;
let totalActual = 0;

console.log('Goal Distribution:\n');
console.log('Goal | Actual | Expected | Diff   | %Actual | %Expected');
console.log('-----|--------|----------|--------|---------|----------');

for (let goal = 1; goal <= 7; goal++) {
    const actual = goalCounts[goal];
    const exp = expected[goal];
    const diff = actual - exp;
    const pctActual = ((actual / puzzles.length) * 100).toFixed(1);
    const pctExpected = ((exp / puzzles.length) * 100).toFixed(1);
    
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const marker = Math.abs(diff) > 10 ? ' ⚠️' : '';
    
    console.log(`  ${goal}  |  ${String(actual).padStart(4)}  |   ${String(exp).padStart(4)}   |  ${String(diffStr).padStart(4)}  |  ${pctActual.padStart(5)}% |   ${pctExpected.padStart(5)}%${marker}`);
    
    totalActual += actual;
    totalExpected += exp;
}

console.log('-----|--------|----------|--------|---------|----------');
console.log(`Total|  ${String(totalActual).padStart(4)}  |   ${String(totalExpected).padStart(4)}   |        |         |`);

// Check if rebalancing is needed
const maxDiff = Math.max(...Object.keys(goalCounts).map(g => Math.abs(goalCounts[g] - expected[g])));

console.log('\n');
if (maxDiff <= 10) {
    console.log('✅ Goal distribution looks good! No rebalancing needed.');
} else if (maxDiff <= 25) {
    console.log('⚠️  Some deviation from expected distribution.');
    console.log('   Consider whether rebalancing is worth the effort.');
} else {
    console.log('❌ Significant deviation from expected distribution!');
    console.log('   Rebalancing recommended.');
}

console.log('\nExpected Distribution: 14.3%, 19%, 19%, 19%, 14.3%, 9.5%, 4.8%');
console.log('');

