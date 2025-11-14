/**
 * Obfuscate puzzle data for production deployment
 * Run with: node scripts/obfuscate-puzzles.mjs [input-file]
 * 
 * This script:
 * 1. Loads puzzle data
 * 2. Removes metadata fields (templatePattern, templateIndex)
 * 3. Encodes only the solution field (to prevent spoilers)
 * 4. Formats each puzzle as one line
 * 5. Minifies overall JSON output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Simple XOR key (same as in puzzleCodec.js)
const KEY = 0x52533221; // "RS2!" in hex

/**
 * Encode string data with XOR + Base64
 */
function encodeData(str) {
    // Convert string to bytes
    const bytes = Buffer.from(str, 'utf8');
    
    // XOR each byte with key
    const xored = Buffer.alloc(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        xored[i] = bytes[i] ^ ((KEY >> (8 * (i % 4))) & 0xFF);
    }
    
    // Convert to base64
    return xored.toString('base64');
}

/**
 * Prepare puzzle for production
 * - Remove metadata fields (templatePattern, templateIndex)
 * - Encode only the solution (to prevent spoilers)
 * - Keep cards/dice/metadata visible (displayed in-game anyway)
 */
function encodePuzzle(puzzle) {
    const encoded = {
        id: puzzle.id,
        cards: puzzle.cards,
        dice: puzzle.dice,
        goal: puzzle.goal,
        solutionCount: puzzle.solutionCount,
        shortestSolution: puzzle.shortestSolution,
        longestSolution: puzzle.longestSolution
    };
    
    // Encode only the solution to prevent spoilers
    if (puzzle.solution) {
        encoded.solution = encodeData(JSON.stringify(puzzle.solution));
    }
    
    return encoded;
}

// Get input file from command line
const inputFile = process.argv[2] || 'data/daily-puzzles.json';
const inputPath = path.resolve(projectRoot, inputFile);

console.log('\n🔒 OBFUSCATING PUZZLE DATA\n');
console.log('='.repeat(60));
console.log(`\nInput: ${inputFile}`);

// Check if file exists
if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Error: File not found: ${inputPath}`);
    console.error('Please provide a valid puzzle file path.\n');
    process.exit(1);
}

// Load puzzle data
console.log('\n📖 Loading puzzle data...');
const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);
const puzzles = data.puzzles || data;

if (!Array.isArray(puzzles)) {
    console.error('\n❌ Error: Invalid puzzle data format');
    process.exit(1);
}

console.log(`✓ Loaded ${puzzles.length} puzzles`);

// Calculate original size
const originalSize = Buffer.byteLength(rawData, 'utf8');
console.log(`✓ Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

// Encode each puzzle
console.log('\n🔐 Encoding puzzles...');
const encodedPuzzles = puzzles.map((puzzle, index) => {
    if ((index + 1) % 100 === 0 || index === 0 || index === puzzles.length - 1) {
        const percent = Math.floor(((index + 1) / puzzles.length) * 100);
        process.stdout.write(`\r   [${percent}%] Encoded ${index + 1}/${puzzles.length} puzzles`);
    }
    return encodePuzzle(puzzle);
});
console.log('\n✓ All puzzles encoded');

// Create output data with custom formatting
// Each puzzle on one line, overall structure readable
console.log('\n🗜️  Formatting output...');

const header = {
    version: (data.version || '1.0.0') + '-obfuscated',
    generatedAt: new Date().toISOString(),
    description: 'Daily puzzles (solution encoded, one per line)',
    encoded: true,
    count: encodedPuzzles.length
};

// Build JSON with one puzzle per line
let output = '{\n';
output += `  "version": "${header.version}",\n`;
output += `  "generatedAt": "${header.generatedAt}",\n`;
output += `  "description": "${header.description}",\n`;
output += `  "encoded": true,\n`;
output += `  "count": ${header.count},\n`;
output += '  "puzzles": [\n';

// Each puzzle on one line (minified)
encodedPuzzles.forEach((puzzle, index) => {
    const line = JSON.stringify(puzzle);
    const comma = index < encodedPuzzles.length - 1 ? ',' : '';
    output += `    ${line}${comma}\n`;
});

output += '  ]\n';
output += '}\n';

const minifiedSize = Buffer.byteLength(output, 'utf8');
console.log(`✓ Formatted size: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB`);

const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
console.log(`✓ Size reduction: ${reduction}%`);

// Save obfuscated version
const inputDir = path.dirname(inputPath);
const inputBasename = path.basename(inputFile, '.json');
const outputPath = path.join(inputDir, `${inputBasename}-obfuscated.json`);

console.log('\n💾 Saving obfuscated data...');
fs.writeFileSync(outputPath, output);

console.log(`✓ Saved to: ${path.relative(projectRoot, outputPath)}`);

// Sample data
console.log('\n📋 SAMPLE OUTPUT:');
console.log('');
console.log('Puzzle #1 (one line):');
const sampleLine = JSON.stringify(encodedPuzzles[0]);
console.log(sampleLine.slice(0, 200) + '...');
console.log('');
console.log('Solution field (encoded):');
console.log('"' + encodedPuzzles[0].solution.slice(0, 80) + '..."');
console.log('');
console.log('Cards/Dice (visible):');
console.log('Cards:', JSON.stringify(encodedPuzzles[0].cards).slice(0, 100) + '...');
console.log('Dice:', JSON.stringify(encodedPuzzles[0].dice).slice(0, 100) + '...');

console.log('\n' + '='.repeat(60));
console.log('✅ OBFUSCATION COMPLETE!\n');
console.log('Summary:');
console.log(`  • Puzzles processed: ${encodedPuzzles.length}`);
console.log(`  • Removed: templatePattern, templateIndex`);
console.log(`  • Encoded: solution only`);
console.log(`  • Visible: cards, dice, metadata`);
console.log(`  • Format: one puzzle per line`);
console.log(`  • Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  • Final size: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  • Reduction: ${reduction}%`);
console.log(`  • Output: ${path.relative(projectRoot, outputPath)}`);
console.log('\n✨ Benefits:');
console.log('   • Solution hidden from casual inspection');
console.log('   • Cards/dice debuggable in dev tools');
console.log('   • One-line-per-puzzle format reduces file size');
console.log('   • DailyPuzzleManager will auto-decode when "encoded: true"\n');

