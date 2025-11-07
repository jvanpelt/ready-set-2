/**
 * Obfuscate puzzle data for production deployment
 * Run with: node scripts/obfuscate-puzzles.mjs [input-file]
 * 
 * This script:
 * 1. Loads puzzle data
 * 2. Encodes sensitive fields (cards, dice, solution)
 * 3. Minifies JSON output
 * 4. Saves obfuscated version
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
 * Encode puzzle data
 */
function encodePuzzle(puzzle) {
    const encoded = { ...puzzle };
    
    // Encode cards
    if (puzzle.cards) {
        encoded.cards = encodeData(JSON.stringify(puzzle.cards));
    }
    
    // Encode dice
    if (puzzle.dice) {
        encoded.dice = encodeData(JSON.stringify(puzzle.dice));
    }
    
    // Encode solution
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

// Create output data
const outputData = {
    version: (data.version || '1.0.0') + '-obfuscated',
    generatedAt: new Date().toISOString(),
    description: (data.description || 'Daily puzzles') + ' (obfuscated)',
    encoded: true,
    count: encodedPuzzles.length,
    puzzles: encodedPuzzles
};

// Minify JSON (no spaces)
console.log('\n🗜️  Minifying JSON...');
const minified = JSON.stringify(outputData);
const minifiedSize = Buffer.byteLength(minified, 'utf8');

console.log(`✓ Minified size: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB`);

const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
console.log(`✓ Size reduction: ${reduction}%`);

// Save obfuscated version
const inputDir = path.dirname(inputPath);
const inputBasename = path.basename(inputFile, '.json');
const outputPath = path.join(inputDir, `${inputBasename}-obfuscated.json`);

console.log('\n💾 Saving obfuscated data...');
fs.writeFileSync(outputPath, minified);

console.log(`✓ Saved to: ${path.relative(projectRoot, outputPath)}`);

// Sample encoded data
console.log('\n📋 SAMPLE ENCODED DATA:');
console.log('');
console.log('Before (puzzle #1 cards):');
console.log(JSON.stringify(puzzles[0].cards, null, 2).slice(0, 200) + '...');
console.log('');
console.log('After (puzzle #1 cards):');
console.log('"' + encodedPuzzles[0].cards.slice(0, 100) + '..."');

console.log('\n' + '='.repeat(60));
console.log('✅ OBFUSCATION COMPLETE!\n');
console.log('Summary:');
console.log(`  • Puzzles encoded: ${encodedPuzzles.length}`);
console.log(`  • Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  • Final size: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  • Reduction: ${reduction}%`);
console.log(`  • Output: ${path.relative(projectRoot, outputPath)}`);
console.log('\n⚠️  IMPORTANT:');
console.log('   DailyPuzzleManager must decode puzzles using puzzleCodec.js');
console.log('   Ensure "encoded: true" flag is checked before decoding.\n');

