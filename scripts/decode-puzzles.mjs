/**
 * Decode obfuscated daily puzzles back to readable JSON
 * Usage: node scripts/decode-puzzles.mjs [input-file] [output-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decodePuzzle } from '../js/puzzleCodec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Get input and output files from command line
const inputFile = process.argv[2] || 'data/daily-puzzles.json';
const outputFile = process.argv[3] || inputFile.replace('.json', '-decoded.json');

const inputPath = path.resolve(projectRoot, inputFile);
const outputPath = path.resolve(projectRoot, outputFile);

console.log('\n🔓 DECODING PUZZLE DATA\n');
console.log(`Input:  ${path.relative(projectRoot, inputPath)}`);
console.log(`Output: ${path.relative(projectRoot, outputPath)}`);

// Load the encoded puzzles
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (!data.encoded) {
    console.log('\n⚠️  Puzzles are NOT encoded - nothing to decode!');
    process.exit(0);
}

console.log(`\nDecoding ${data.puzzles.length} puzzles...`);

// Decode each puzzle
const startTime = Date.now();
const decodedPuzzles = data.puzzles.map(encodedPuzzle => {
    return decodePuzzle(encodedPuzzle);
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

// Create output with decoded flag set to false
const outputData = {
    encoded: false,
    puzzles: decodedPuzzles
};

// Write to output file
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log(`\n✅ Successfully decoded ${decodedPuzzles.length} puzzles in ${elapsed}s`);
console.log(`   Output: ${path.relative(projectRoot, outputPath)}\n`);

