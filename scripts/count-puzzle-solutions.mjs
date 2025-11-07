/**
 * Count all possible solutions for each puzzle and add metadata
 * Run with: node scripts/count-puzzle-solutions.mjs [input-file]
 * 
 * Examples:
 *   node scripts/count-puzzle-solutions.mjs data/daily-puzzles-test.json
 *   node scripts/count-puzzle-solutions.mjs data/daily-puzzles.json
 * 
 * Adds to each puzzle:
 *   - solutionCount: Total number of valid solutions
 *   - shortestSolution: Minimum cube count for any solution
 *   - longestSolution: Maximum cube count for any solution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const countAllSolutions = solutionFinderModule.countAllSolutions;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;

// Make imported functions available globally
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;

// Get input file from command line args
const inputFile = process.argv[2] || 'data/daily-puzzles-test.json';
const inputPath = path.resolve(projectRoot, inputFile);

console.log('\n🔢 COUNTING PUZZLE SOLUTIONS\n');
console.log(`Input: ${inputFile}`);

// Load puzzle data
if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
}

const puzzleData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const puzzles = puzzleData.puzzles;

console.log(`Loaded ${puzzles.length} puzzles\n`);
console.log('This may take several minutes...\n');

// Track statistics
let totalSolutionsFound = 0;
let minSolutions = Infinity;
let maxSolutions = 0;
let totalTime = 0;
const startTime = Date.now();

// Process each puzzle
puzzles.forEach((puzzle, index) => {
    const puzzleNum = index + 1;
    const progressPercent = Math.floor((puzzleNum / puzzles.length) * 100);
    
    // Show progress every 10 puzzles or on first/last
    if (puzzleNum === 1 || puzzleNum === puzzles.length || puzzleNum % 10 === 0) {
        const elapsed = Date.now() - startTime;
        const avgTime = elapsed / puzzleNum;
        const remaining = Math.ceil((puzzles.length - puzzleNum) * avgTime / 1000);
        console.log(`[${progressPercent}%] Processing puzzle ${puzzleNum}/${puzzles.length} (${remaining}s remaining)`);
    }
    
    // Count all solutions (cards are already in correct format)
    const cards = puzzle.cards;
    
    const result = countAllSolutions(cards, puzzle.dice, puzzle.goal, false);
    
    // Add metadata to puzzle
    puzzle.solutionCount = result.totalSolutions;
    puzzle.shortestSolution = result.shortestCubeCount;
    puzzle.longestSolution = result.longestCubeCount;
    
    // Update statistics
    totalSolutionsFound += result.totalSolutions;
    minSolutions = Math.min(minSolutions, result.totalSolutions);
    maxSolutions = Math.max(maxSolutions, result.totalSolutions);
    totalTime += result.timeMs;
    
    // Warn if no solutions found
    if (result.totalSolutions === 0) {
        console.warn(`   ⚠️  WARNING: Puzzle #${puzzle.id} has NO solutions!`);
    }
});

const totalElapsed = Date.now() - startTime;

console.log('\n✅ COUNTING COMPLETE!\n');
console.log('Statistics:');
console.log(`  Total puzzles: ${puzzles.length}`);
console.log(`  Total solutions found: ${totalSolutionsFound.toLocaleString()}`);
console.log(`  Average per puzzle: ${Math.round(totalSolutionsFound / puzzles.length)}`);
console.log(`  Min solutions: ${minSolutions}`);
console.log(`  Max solutions: ${maxSolutions}`);
console.log(`  Total computation time: ${(totalElapsed / 1000).toFixed(1)}s`);
console.log(`  Average per puzzle: ${(totalElapsed / puzzles.length).toFixed(0)}ms\n`);

// Check for puzzles with no solutions
const unsolvable = puzzles.filter(p => p.solutionCount === 0);
if (unsolvable.length > 0) {
    console.error(`❌ WARNING: ${unsolvable.length} puzzles have NO solutions:`);
    unsolvable.forEach(p => console.error(`   Puzzle #${p.id}`));
    console.error('\nAborting - fix puzzles before saving.\n');
    process.exit(1);
}

// Update metadata
puzzleData.version = puzzleData.version + '-with-counts';
puzzleData.solutionCountsGeneratedAt = new Date().toISOString();
puzzleData.description = (puzzleData.description || '') + ' (with solution counts)';

// Create output filename
const inputDir = path.dirname(inputPath);
const inputBasename = path.basename(inputFile, '.json');
const outputPath = path.join(inputDir, `${inputBasename}-with-counts.json`);

// Save updated data
fs.writeFileSync(outputPath, JSON.stringify(puzzleData, null, 2));

console.log(`💾 Saved to: ${path.relative(projectRoot, outputPath)}`);
console.log('\nDone! 🎉\n');

