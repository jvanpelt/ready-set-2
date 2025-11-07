/**
 * Rebalance puzzle goal distribution to match weighted bell curve
 * Run with: node scripts/rebalance-puzzle-goals.mjs
 * 
 * This script:
 * 1. Analyzes current distribution
 * 2. Generates new puzzles for underrepresented goals (4-7)
 * 3. Removes excess puzzles from overrepresented goals (1-3)
 * 4. Counts solutions for new puzzles only
 * 5. Creates balanced production set
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules
const DailyPuzzleGeneratorModule = await import(`file://${projectRoot}/js/DailyPuzzleGenerator.js`);
const DailyPuzzleGenerator = DailyPuzzleGeneratorModule.default;
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const findShortestSolution = solutionFinderModule.findShortestSolution;
const countAllSolutions = solutionFinderModule.countAllSolutions;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;
const levelsModule = await import(`file://${projectRoot}/js/levels.js`);
const generateCardConfig = levelsModule.generateCardConfig;
const generateDiceForLevel = levelsModule.generateDiceForLevel;

// Make imported functions available globally
global.findShortestSolution = findShortestSolution;
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;
global.generateCardConfig = generateCardConfig;
global.generateDiceForLevel = generateDiceForLevel;

// Weighted goal array (from game.js)
const WEIGHTED_GOALS = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

console.log('\n🎯 REBALANCING PUZZLE GOAL DISTRIBUTION\n');
console.log('='.repeat(60));

// Load existing puzzles
const inputPath = path.join(projectRoot, 'data', 'daily-puzzles-production-with-counts.json');
const existingData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const existingPuzzles = existingData.puzzles;

console.log(`\nLoaded ${existingPuzzles.length} existing puzzles\n`);

// Analyze current distribution
const currentCounts = {};
existingPuzzles.forEach(p => {
    currentCounts[p.goal] = (currentCounts[p.goal] || 0) + 1;
});

// Calculate target counts based on weight array
const totalPuzzles = existingPuzzles.length;
const targetCounts = {};
const weightCounts = {};
WEIGHTED_GOALS.forEach(g => {
    weightCounts[g] = (weightCounts[g] || 0) + 1;
});
Object.keys(weightCounts).forEach(goal => {
    targetCounts[goal] = Math.round((weightCounts[goal] / WEIGHTED_GOALS.length) * totalPuzzles);
});

// Calculate what we need
const toAdd = {};
const toRemove = {};
[1, 2, 3, 4, 5, 6, 7].forEach(goal => {
    const current = currentCounts[goal] || 0;
    const target = targetCounts[goal] || 0;
    const diff = target - current;
    
    if (diff > 0) {
        toAdd[goal] = diff;
    } else if (diff < 0) {
        toRemove[goal] = Math.abs(diff);
    }
});

console.log('CURRENT vs TARGET DISTRIBUTION:\n');
console.log('Goal | Current | Target | Action');
console.log('-----|---------|--------|--------');
[1, 2, 3, 4, 5, 6, 7].forEach(goal => {
    const current = currentCounts[goal] || 0;
    const target = targetCounts[goal] || 0;
    const diff = target - current;
    let action = '';
    if (diff > 0) action = `ADD ${diff}`;
    else if (diff < 0) action = `REMOVE ${Math.abs(diff)}`;
    else action = 'OK';
    console.log(`  ${goal}  |  ${current.toString().padStart(4)}   |  ${target.toString().padStart(4)}  | ${action}`);
});

const totalToAdd = Object.values(toAdd).reduce((sum, n) => sum + n, 0);
const totalToRemove = Object.values(toRemove).reduce((sum, n) => sum + n, 0);

console.log(`\nNeed to ADD ${totalToAdd} puzzles (goals 4-7)`);
console.log(`Need to REMOVE ${totalToRemove} puzzles (goals 1-3)`);
console.log('');

// STEP 1: Generate new puzzles for underrepresented goals
console.log('='.repeat(60));
console.log('STEP 1: Generating new puzzles for goals 4-7\n');

const generator = new DailyPuzzleGenerator();
const templates = generator.TEMPLATES;
const newPuzzles = [];
const maxAttemptsPerGoal = 20000;

Object.entries(toAdd).forEach(([goal, count]) => {
    const targetGoal = parseInt(goal);
    console.log(`\nGenerating ${count} puzzles for goal ${targetGoal}...`);
    
    let generated = 0;
    let attempts = 0;
    const startTime = Date.now();
    
    while (generated < count && attempts < maxAttemptsPerGoal) {
        attempts++;
        
        // Show progress
        if (attempts % 500 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = attempts / (Date.now() - startTime) * 1000;
            console.log(`  [${generated}/${count}] ${attempts} attempts, ${elapsed}s elapsed (${rate.toFixed(1)} attempts/s)`);
        }
        
        // Pick random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate dice and cards
        const generatedDice = generateDiceForLevel(6);
        const solution = generator.instantiateTemplate(template, generatedDice);
        if (!solution) continue;
        
        const cards = generateCardConfig(8);
        const matchingIndices = generator.evaluateSolution(solution, cards);
        const actualGoal = matchingIndices.size;
        
        // Only accept if it matches our target goal
        if (actualGoal !== targetGoal) continue;
        
        // Success!
        const dice = generator.generateDiceFromSolution(solution);
        newPuzzles.push({
            id: null, // Will be assigned later
            templateIndex: templates.indexOf(template),
            templatePattern: template.pattern,
            cards: cards,
            dice: dice,
            goal: actualGoal,
            solution: solution,
            isNew: true // Flag for solution counting
        });
        
        generated++;
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✓ Generated ${generated}/${count} in ${elapsed}s (${attempts} attempts)`);
});

console.log(`\n✅ Generated ${newPuzzles.length} new puzzles\n`);

// STEP 2: Count solutions for new puzzles
console.log('='.repeat(60));
console.log('STEP 2: Counting solutions for new puzzles\n');
console.log(`This will take ~${Math.ceil(newPuzzles.length * 2.5 / 60)} minutes...\n`);

const countStartTime = Date.now();
newPuzzles.forEach((puzzle, index) => {
    if ((index + 1) % 10 === 0 || index === 0 || index === newPuzzles.length - 1) {
        const progress = Math.floor(((index + 1) / newPuzzles.length) * 100);
        const elapsed = (Date.now() - countStartTime) / 1000;
        const avgTime = elapsed / (index + 1);
        const remaining = Math.ceil((newPuzzles.length - (index + 1)) * avgTime);
        console.log(`[${progress}%] Counting puzzle ${index + 1}/${newPuzzles.length} (~${remaining}s remaining)`);
    }
    
    const result = countAllSolutions(puzzle.cards, puzzle.dice, puzzle.goal, false);
    puzzle.solutionCount = result.totalSolutions;
    puzzle.shortestSolution = result.shortestCubeCount;
    puzzle.longestSolution = result.longestCubeCount;
    delete puzzle.isNew;
});

const countElapsed = ((Date.now() - countStartTime) / 1000).toFixed(1);
console.log(`\n✅ Counted solutions in ${countElapsed}s\n`);

// STEP 3: Remove excess puzzles from overrepresented goals
console.log('='.repeat(60));
console.log('STEP 3: Removing excess puzzles from goals 1-3\n');

const keptPuzzles = [];

[1, 2, 3, 4, 5, 6, 7].forEach(goal => {
    const goalPuzzles = existingPuzzles.filter(p => p.goal === goal);
    const target = targetCounts[goal] || 0;
    
    if (goalPuzzles.length <= target) {
        // Keep all
        keptPuzzles.push(...goalPuzzles);
        console.log(`Goal ${goal}: Keeping all ${goalPuzzles.length} puzzles`);
    } else {
        // Randomly select which to keep
        const shuffled = goalPuzzles.sort(() => Math.random() - 0.5);
        const kept = shuffled.slice(0, target);
        keptPuzzles.push(...kept);
        console.log(`Goal ${goal}: Keeping ${kept.length}/${goalPuzzles.length} puzzles (removed ${goalPuzzles.length - kept.length})`);
    }
});

console.log(`\n✅ Kept ${keptPuzzles.length} existing puzzles\n`);

// STEP 4: Merge and reassign IDs
console.log('='.repeat(60));
console.log('STEP 4: Merging and finalizing\n');

const finalPuzzles = [...keptPuzzles, ...newPuzzles];

// Shuffle to mix old and new puzzles
finalPuzzles.sort(() => Math.random() - 0.5);

// Reassign IDs
finalPuzzles.forEach((puzzle, index) => {
    puzzle.id = index + 1;
});

console.log(`Final puzzle count: ${finalPuzzles.length}\n`);

// STEP 5: Verify final distribution
console.log('='.repeat(60));
console.log('STEP 5: Verifying final distribution\n');

const finalCounts = {};
finalPuzzles.forEach(p => {
    finalCounts[p.goal] = (finalCounts[p.goal] || 0) + 1;
});

console.log('FINAL DISTRIBUTION:\n');
console.log('Goal | Count | Target | Actual % | Expected %');
console.log('-----|-------|--------|----------|------------');
[1, 2, 3, 4, 5, 6, 7].forEach(goal => {
    const count = finalCounts[goal] || 0;
    const target = targetCounts[goal] || 0;
    const actualPercent = ((count / finalPuzzles.length) * 100).toFixed(1);
    const expectedPercent = ((weightCounts[goal] / WEIGHTED_GOALS.length) * 100).toFixed(1);
    console.log(`  ${goal}  |  ${count.toString().padStart(4)} |  ${target.toString().padStart(4)}  |   ${actualPercent.padStart(5)}%  |    ${expectedPercent.padStart(5)}%`);
});

console.log('');

// Visual
[1, 2, 3, 4, 5, 6, 7].forEach(goal => {
    const count = finalCounts[goal] || 0;
    const percent = ((count / finalPuzzles.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 10));
    console.log(`Goal ${goal}: ${count.toString().padStart(4)} (${percent.padStart(5)}%) ${bar}`);
});

// STEP 6: Save
console.log('\n' + '='.repeat(60));
console.log('STEP 6: Saving rebalanced puzzles\n');

const outputData = {
    version: '3.1.0-rebalanced',
    generatedAt: new Date().toISOString(),
    description: 'Production daily puzzles with rebalanced weighted goal distribution',
    goalWeighting: 'Bell curve favoring goals 2-4 (properly balanced)',
    rebalancedFrom: 'daily-puzzles-production-with-counts.json',
    count: finalPuzzles.length,
    puzzles: finalPuzzles
};

const outputPath = path.join(projectRoot, 'data', 'daily-puzzles-production-rebalanced.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log(`💾 Saved to: data/daily-puzzles-production-rebalanced.json`);
console.log('\n✅ REBALANCING COMPLETE!\n');
console.log('Next steps:');
console.log('  1. Review the distribution above');
console.log('  2. If satisfied, deploy:');
console.log('     cp data/daily-puzzles-production-rebalanced.json data/daily-puzzles.json');
console.log('  3. Test in-game to verify');
console.log('\nDone! 🎉\n');

