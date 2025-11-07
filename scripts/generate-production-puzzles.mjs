/**
 * Generate production daily puzzles with weighted goal distribution
 * Run with: node scripts/generate-production-puzzles.mjs [count]
 * 
 * Default: 1461 puzzles (4 years of daily puzzles)
 * Uses weighted goals favoring 2-4 (like regular game mode)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules using dynamic import
const DailyPuzzleGeneratorModule = await import(`file://${projectRoot}/js/DailyPuzzleGenerator.js`);
const DailyPuzzleGenerator = DailyPuzzleGeneratorModule.default;
const solutionFinderModule = await import(`file://${projectRoot}/js/solutionFinder.js`);
const findShortestSolution = solutionFinderModule.findShortestSolution;
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const levelsModule = await import(`file://${projectRoot}/js/levels.js`);
const generateCardConfig = levelsModule.generateCardConfig;
const generateDiceForLevel = levelsModule.generateDiceForLevel;

// Make imported functions available globally for DailyPuzzleGenerator
global.findShortestSolution = findShortestSolution;
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.generateCardConfig = generateCardConfig;
global.generateDiceForLevel = generateDiceForLevel;

// Weighted goal array (from game.js regular mode)
// Bell curve weighted toward goals 2-4
// Excludes 0 and 8 (too trivial / too hard)
const WEIGHTED_GOALS = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

/**
 * Pick a random weighted goal
 */
function pickWeightedGoal() {
    return WEIGHTED_GOALS[Math.floor(Math.random() * WEIGHTED_GOALS.length)];
}

/**
 * Generate production puzzles with weighted goals
 */
function generateProductionPuzzles(targetCount) {
    console.log('\n🎲 GENERATING PRODUCTION DAILY PUZZLES\n');
    console.log(`Target: ${targetCount} puzzles`);
    console.log('Goal distribution: Weighted toward 2-4 (bell curve)\n');
    
    const generator = new DailyPuzzleGenerator();
    const templates = generator.TEMPLATES;
    const puzzles = [];
    const goalCounts = {};
    const startTime = Date.now();
    
    let attempts = 0;
    const maxAttemptsPerPuzzle = 100;
    const maxTotalAttempts = targetCount * 500; // Safety limit
    
    console.log(`Available templates: ${templates.length}`);
    console.log('Starting generation...\n');
    
    while (puzzles.length < targetCount && attempts < maxTotalAttempts) {
        attempts++;
        
        // Show progress every 50 puzzles
        if (puzzles.length > 0 && puzzles.length % 50 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (puzzles.length / (Date.now() - startTime) * 1000).toFixed(1);
            const remaining = Math.ceil((targetCount - puzzles.length) / rate);
            console.log(`[${puzzles.length}/${targetCount}] Generated ${puzzles.length} puzzles (${elapsed}s elapsed, ~${remaining}s remaining)`);
        }
        
        // Pick a random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate dice for level 6+ (has restrictions)
        const generatedDice = generateDiceForLevel(6);
        
        // Instantiate template with dice
        const solution = generator.instantiateTemplate(template, generatedDice);
        if (!solution) {
            continue; // Template couldn't be instantiated, try again
        }
        
        // Generate random cards
        const cards = generateCardConfig(8);
        
        // Evaluate solution to get actual goal
        const matchingIndices = generator.evaluateSolution(solution, cards);
        const actualGoal = matchingIndices.size;
        
        // Pick desired weighted goal
        const targetGoal = pickWeightedGoal();
        
        // Only accept if actual goal matches our weighted target
        // This ensures proper distribution
        if (actualGoal !== targetGoal) {
            continue;
        }
        
        // Generate dice array from solution
        const dice = generator.generateDiceFromSolution(solution);
        
        // Success! Add puzzle
        puzzles.push({
            id: puzzles.length + 1,
            templateIndex: templates.indexOf(template),
            templatePattern: template.pattern,
            cards: cards,
            dice: dice,
            goal: actualGoal,
            solution: solution
        });
        
        // Track goal distribution
        goalCounts[actualGoal] = (goalCounts[actualGoal] || 0) + 1;
    }
    
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ GENERATION COMPLETE!\n`);
    console.log(`Generated: ${puzzles.length}/${targetCount} puzzles`);
    console.log(`Total attempts: ${attempts}`);
    console.log(`Success rate: ${((puzzles.length / attempts) * 100).toFixed(1)}%`);
    console.log(`Time: ${totalElapsed}s\n`);
    
    // Show goal distribution
    console.log('Goal Distribution:');
    [1, 2, 3, 4, 5, 6, 7].forEach(goal => {
        const count = goalCounts[goal] || 0;
        const percent = ((count / puzzles.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(count / 10));
        console.log(`  Goal ${goal}: ${count.toString().padStart(4)} (${percent.padStart(5)}%) ${bar}`);
    });
    
    if (puzzles.length < targetCount) {
        console.warn(`\n⚠️  WARNING: Only generated ${puzzles.length}/${targetCount} puzzles`);
        console.warn('    Reached max attempts limit. This is okay - you can run again to generate more.');
    }
    
    return puzzles;
}

// Get target count from command line (default 1461 = 4 years)
const targetCount = parseInt(process.argv[2]) || 1461;

console.log('\n' + '='.repeat(60));
console.log('  READY, SET 2 - PRODUCTION PUZZLE GENERATOR');
console.log('='.repeat(60));

const puzzles = generateProductionPuzzles(targetCount);

// Export to JSON
const exportData = {
    version: '3.0.0-production',
    generatedAt: new Date().toISOString(),
    description: 'Production daily puzzles with weighted goal distribution (4 years)',
    goalWeighting: 'Bell curve favoring goals 2-4 (excludes 0 and 8)',
    count: puzzles.length,
    puzzles: puzzles
};

const outputPath = path.join(projectRoot, 'data', 'daily-puzzles-production.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`\n💾 Saved to: data/daily-puzzles-production.json`);
console.log('\n📋 NEXT STEPS:');
console.log('   1. Count solutions:');
console.log('      node scripts/count-puzzle-solutions.mjs data/daily-puzzles-production.json');
console.log('   2. Review output file: data/daily-puzzles-production-with-counts.json');
console.log('   3. If satisfied, rename to daily-puzzles.json for production use');
console.log('\nDone! 🎉\n');

