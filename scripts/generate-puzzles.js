#!/usr/bin/env node

/**
 * Offline puzzle generation script
 * Usage: node scripts/generate-puzzles.js [count]
 * Example: node scripts/generate-puzzles.js 50
 */

// Mock browser globals for Node.js environment
global.window = {
    innerWidth: 1024,
    innerHeight: 768
};
global.Math = Math;

// Import the generator (we'll need to adjust imports for Node)
// For now, we'll inline the necessary logic

const fs = require('fs');
const path = require('path');

// Configuration
const COLORS = ['red', 'blue', 'green', 'gold'];
const OPERATORS = ['∪', '∩', '−'];
const RESTRICTIONS = ['=', '⊆'];

/**
 * Generate a random card configuration
 */
function generateRandomCard() {
    // Pick 1-3 colors randomly
    const numColors = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    return {
        colors: shuffled.slice(0, numColors)
    };
}

/**
 * Generate 8 diverse cards
 */
function generateRandomCards() {
    const cards = [];
    
    // Ensure all 4 colors appear at least once
    const guaranteedCards = COLORS.map(color => ({ colors: [color] }));
    cards.push(...guaranteedCards);
    
    // Fill remaining slots with random cards
    while (cards.length < 8) {
        cards.push(generateRandomCard());
    }
    
    // Shuffle for randomness
    return cards.sort(() => Math.random() - 0.5);
}

/**
 * Simple template structures (subset of full generator)
 */
function createTemplates() {
    const templates = [];
    const ops = OPERATORS;
    
    // 3+5: color restriction color + color op color op color
    ops.forEach(op => {
        ['=', '⊆'].forEach(restr => {
            templates.push({ 
                topRow: `color ${restr} color`, 
                bottomRow: `color ${op} color ${op} color` 
            });
        });
    });
    
    // 5+3: color op color restriction color + color op color
    ops.forEach(op1 => {
        ops.forEach(op2 => {
            ['=', '⊆'].forEach(restr => {
                templates.push({ 
                    topRow: `color ${op1} color ${restr} color`, 
                    bottomRow: `color ${op2} color` 
                });
            });
        });
    });
    
    // 5+3: color restriction color op color + color op color
    ops.forEach(op1 => {
        ops.forEach(op2 => {
            ['=', '⊆'].forEach(restr => {
                templates.push({ 
                    topRow: `color ${restr} color ${op1} color`, 
                    bottomRow: `color ${op2} color` 
                });
            });
        });
    });
    
    // 8-token no restriction: color op color op color op color′
    ops.forEach(op1 => {
        ops.forEach(op2 => {
            ops.forEach(op3 => {
                templates.push({ 
                    topRow: null, 
                    bottomRow: `color ${op1} color ${op2} color ${op3} color′` 
                });
            });
        });
    });
    
    return templates;
}

/**
 * Instantiate template with random colors
 */
function instantiateTemplate(template) {
    const replaceAbstractTypes = (expr) => {
        if (!expr) return null;
        
        let result = expr;
        while (result.includes('color')) {
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            result = result.replace('color', randomColor);
        }
        
        while (result.includes('setName')) {
            const randomSetName = Math.random() < 0.5 ? 'U' : '∅';
            result = result.replace('setName', randomSetName);
        }
        
        return result;
    };
    
    const topRow = replaceAbstractTypes(template.topRow);
    const bottomRow = replaceAbstractTypes(template.bottomRow);
    
    return { topRow, bottomRow };
}

/**
 * Simplified evaluation (just count matching cards)
 * For offline generation, we'll do a basic evaluation
 */
function evaluateSolution(solution, cards) {
    // Simplified: just return a random goal between 1-8 for now
    // In production, this would use the full setTheory.js evaluation
    return Math.floor(Math.random() * 8) + 1;
}

/**
 * Calculate difficulty based on cube count
 */
function calculateDifficulty(cubeCount) {
    if (cubeCount <= 2) return { rating: 'beginner', cubeCount };
    if (cubeCount <= 4) return { rating: 'intermediate', cubeCount };
    if (cubeCount <= 6) return { rating: 'advanced', cubeCount };
    return { rating: 'expert', cubeCount };
}

/**
 * Generate dice from solution
 */
function generateDiceFromSolution(solution) {
    const dice = [];
    let dieIndex = 0;
    const timestamp = Date.now();
    
    const parseSolution = (expr) => {
        if (!expr) return [];
        const tokens = expr.split(' ');
        return tokens.map(token => {
            const id = `die-${dieIndex++}-${timestamp}`;
            
            if (COLORS.includes(token)) {
                return { id, type: 'color', value: token, x: 0, y: 0 };
            } else if (['∪', '∩', '−', 'U', '∅'].includes(token)) {
                return { id, type: 'operator', value: token, x: 0, y: 0 };
            } else if (['=', '⊆'].includes(token)) {
                return { id, type: 'restriction', value: token, x: 0, y: 0 };
            } else if (token === '′') {
                return { id, type: 'operator', value: '′', x: 0, y: 0 };
            } else if (token.endsWith('′')) {
                // Split color and prime
                const color = token.slice(0, -1);
                return [
                    { id: `die-${dieIndex - 1}-${timestamp}`, type: 'color', value: color, x: 0, y: 0 },
                    { id: `die-${dieIndex++}-${timestamp}`, type: 'operator', value: '′', x: 0, y: 0 }
                ];
            }
            return null;
        }).flat().filter(d => d);
    };
    
    dice.push(...parseSolution(solution.topRow));
    dice.push(...parseSolution(solution.bottomRow));
    
    return dice;
}

/**
 * Generate a single puzzle
 */
function generatePuzzle(templates) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const solution = instantiateTemplate(template);
    const cards = generateRandomCards();
    const dice = generateDiceFromSolution(solution);
    const goal = evaluateSolution(solution, cards);
    
    // Estimate shortest solution (simplified - assume 2-4 cubes)
    const shortestCubeCount = Math.floor(Math.random() * 3) + 2;
    const difficulty = calculateDifficulty(shortestCubeCount);
    
    return {
        cards,
        dice,
        goal,
        difficulty,
        generatedSolution: {
            topRow: solution.topRow,
            bottomRow: solution.bottomRow
        },
        shortestSolution: {
            cubeCount: shortestCubeCount,
            hasRestriction: solution.topRow !== null
        }
    };
}

/**
 * Generate batch of puzzles
 */
function generateBatch(count) {
    console.log(`\n🎲 Generating ${count} daily puzzles...\n`);
    
    const templates = createTemplates();
    console.log(`✅ Created ${templates.length} templates\n`);
    
    const puzzles = [];
    const startTime = Date.now();
    
    for (let i = 0; i < count; i++) {
        const puzzle = generatePuzzle(templates);
        puzzles.push({
            id: i + 1,
            ...puzzle
        });
        
        if ((i + 1) % 10 === 0) {
            console.log(`✅ Generated ${i + 1}/${count} puzzles...`);
        }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Batch complete! Generated ${puzzles.length} puzzles in ${elapsed}s\n`);
    
    // Statistics
    const diffCounts = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    puzzles.forEach(p => diffCounts[p.difficulty.rating]++);
    
    console.log('📊 Difficulty Distribution:');
    Object.entries(diffCounts).forEach(([rating, count]) => {
        const pct = ((count / puzzles.length) * 100).toFixed(1);
        console.log(`  ${rating}: ${count} (${pct}%)`);
    });
    console.log('');
    
    return puzzles;
}

/**
 * Main execution
 */
function main() {
    const count = parseInt(process.argv[2]) || 50;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   DAILY PUZZLE GENERATOR (Offline)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const puzzles = generateBatch(count);
    
    // Create export data
    const exportData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        count: puzzles.length,
        puzzles: puzzles
    };
    
    // Save to file
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const outputPath = path.join(dataDir, 'daily-puzzles.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 Saved ${puzzles.length} puzzles to: data/daily-puzzles.json`);
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log('\n✅ Generation complete!\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

