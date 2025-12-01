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
 * Apply special cube logic to a puzzle
 * 25% chance for each: required, wild, bonus, none
 * Special cubes are always selected from dice used in the solution
 */
function applySpecialCube(dice, solution) {
    // Roll for special cube type (0-3: 25% each)
    const roll = Math.floor(Math.random() * 4);
    
    if (roll === 3) {
        // 25% chance: No special cube
        return dice;
    }
    
    // Parse solution to identify which dice indices are used
    const solutionDiceIndices = [];
    const solutionString = `${solution.topRow || ''} ${solution.bottomRow || ''}`.trim();
    
    // Remove parentheses and split into tokens
    const tokens = solutionString.replace(/[()]/g, '').split(/\s+/);
    
    // Track which dice indices we've already consumed
    const usedIndices = new Set();
    
    // For each token, find matching dice (consume each die only once)
    tokens.forEach(token => {
        // Handle tokens with prime attached (e.g., "blue′" → ["blue", "′"])
        if (token.includes('′')) {
            const parts = token.split('′');
            parts.forEach((part, i) => {
                if (part) {
                    // Find first unused die matching this value
                    const dieIndex = dice.findIndex((d, idx) => d.value === part && !usedIndices.has(idx));
                    if (dieIndex >= 0) {
                        usedIndices.add(dieIndex);
                        solutionDiceIndices.push(dieIndex);
                    }
                }
                if (i < parts.length - 1) {
                    // Add prime operator
                    const primeIndex = dice.findIndex((d, idx) => d.value === '′' && !usedIndices.has(idx));
                    if (primeIndex >= 0) {
                        usedIndices.add(primeIndex);
                        solutionDiceIndices.push(primeIndex);
                    }
                }
            });
        } else if (token) {
            // Find first unused die matching this value
            const dieIndex = dice.findIndex((d, idx) => d.value === token && !usedIndices.has(idx));
            if (dieIndex >= 0) {
                usedIndices.add(dieIndex);
                solutionDiceIndices.push(dieIndex);
            }
        }
    });
    
    if (solutionDiceIndices.length === 0) {
        console.warn('⚠️  No solution dice found, skipping special cube');
        return dice;
    }
    
    // Pick random die index from solution
    const selectedIndex = solutionDiceIndices[Math.floor(Math.random() * solutionDiceIndices.length)];
    
    // Apply special cube property based on roll
    const specialType = ['required', 'wild', 'bonus'][roll];
    const propertyName = specialType === 'required' ? 'isRequired' : 
                        specialType === 'wild' ? 'isWild' : 'isBonus';
    
    // Mark ONLY the selected die
    return dice.map((die, idx) => {
        if (idx === selectedIndex) {
            return { ...die, [propertyName]: true };
        }
        return die;
    });
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
    const specialCubeCounts = { required: 0, wild: 0, bonus: 0, none: 0 };
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
        let dice = generator.generateDiceFromSolution(solution);
        
        // Apply special cube logic (25% required, 25% wild, 25% bonus, 25% none)
        dice = applySpecialCube(dice, solution);
        
        // Track special cube type
        const hasRequired = dice.some(d => d.isRequired);
        const hasWild = dice.some(d => d.isWild);
        const hasBonus = dice.some(d => d.isBonus);
        if (hasRequired) specialCubeCounts.required++;
        else if (hasWild) specialCubeCounts.wild++;
        else if (hasBonus) specialCubeCounts.bonus++;
        else specialCubeCounts.none++;
        
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
    
    // Show special cube distribution
    console.log('\nSpecial Cube Distribution:');
    Object.entries(specialCubeCounts).forEach(([type, count]) => {
        const percent = ((count / puzzles.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(count / 10));
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        console.log(`  ${label.padEnd(10)}: ${count.toString().padStart(4)} (${percent.padStart(5)}%) ${bar}`);
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

