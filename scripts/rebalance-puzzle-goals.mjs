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

// Weighted goal array (from game.js regular mode)
// Produces bell curve: 14%, 19%, 19%, 19%, 14%, 10%, 5%
const WEIGHTED_GOALS = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

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

console.log('\n🎯 REBALANCING PUZZLE GOAL DISTRIBUTION\n');
console.log('Target: Weighted bell curve from regular game mode\n');
console.log('='.repeat(60));

// Get input file from command line or use default
const inputFile = process.argv[2] || 'data/daily-puzzles-decoded-with-counts.json';
const inputPath = path.resolve(projectRoot, inputFile);

console.log(`\nInput file: ${path.relative(projectRoot, inputPath)}\n`);

// Load existing puzzles
const existingData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const existingPuzzles = existingData.puzzles;

console.log(`\nLoaded ${existingPuzzles.length} existing puzzles\n`);

// Analyze current distribution
const currentCounts = {};
existingPuzzles.forEach(p => {
    currentCounts[p.goal] = (currentCounts[p.goal] || 0) + 1;
});

// Calculate target counts based on WEIGHTED_GOALS array
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
        let dice = generator.generateDiceFromSolution(solution);
        
        // Apply special cube logic (25% required, 25% wild, 25% bonus, 25% none)
        dice = applySpecialCube(dice, solution);
        
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

// STEP 2: Remove excess puzzles from overrepresented goals
console.log('='.repeat(60));
console.log('STEP 2: Removing excess puzzles from goals 1-3\n');

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

// STEP 3: Merge and reassign IDs
console.log('='.repeat(60));
console.log('STEP 3: Merging and finalizing\n');

const finalPuzzles = [...keptPuzzles, ...newPuzzles];

// Shuffle to mix old and new puzzles
finalPuzzles.sort(() => Math.random() - 0.5);

// Reassign IDs
finalPuzzles.forEach((puzzle, index) => {
    puzzle.id = index + 1;
});

console.log(`Final puzzle count: ${finalPuzzles.length}\n`);

// STEP 4: Verify final distribution
console.log('='.repeat(60));
console.log('STEP 4: Verifying final distribution\n');

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
console.log('STEP 5: Saving rebalanced puzzles\n');

const outputData = {
    version: '3.1.0-rebalanced',
    generatedAt: new Date().toISOString(),
    description: 'Production daily puzzles with rebalanced weighted goal distribution',
    goalWeighting: 'Bell curve favoring goals 2-4 (properly balanced)',
    rebalancedFrom: path.basename(inputPath),
    count: finalPuzzles.length,
    puzzles: finalPuzzles
};

// Generate output filename based on input
const outputFile = inputFile.replace('.json', '-rebalanced.json');
const outputPath = path.resolve(projectRoot, outputFile);
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

const outputRelative = path.relative(projectRoot, outputPath);
console.log(`💾 Saved to: ${outputRelative}`);
console.log('\n✅ REBALANCING COMPLETE!\n');
console.log('Next steps:');
console.log('  1. Review the distribution above');
console.log('  2. Verify with: node scripts/verify-goal-distribution.mjs ' + outputRelative);
console.log('  3. Obfuscate: node scripts/obfuscate-puzzles.mjs ' + outputRelative);
console.log('\nDone! 🎉\n');

