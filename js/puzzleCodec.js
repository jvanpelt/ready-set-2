/**
 * Puzzle Data Codec - Encode/Decode puzzle data for obfuscation
 * 
 * Uses Base64 encoding with a simple XOR cipher to make puzzle data
 * non-obvious to casual inspection. Not cryptographically secure,
 * but prevents easy solution lookup.
 */

// Simple key for XOR cipher (obscured as seemingly random number)
const KEY = 0x52533221; // "RS2!" in hex

/**
 * Encode puzzle data for storage
 */
export function encodePuzzle(puzzle) {
    // Clone to avoid mutating original
    const encoded = { ...puzzle };
    
    // Encode cards (color combinations)
    if (puzzle.cards) {
        encoded.cards = encodeData(JSON.stringify(puzzle.cards));
    }
    
    // Encode dice (cube types and values)
    if (puzzle.dice) {
        encoded.dice = encodeData(JSON.stringify(puzzle.dice));
    }
    
    // Encode solution (the actual solution structure)
    if (puzzle.solution) {
        encoded.solution = encodeData(JSON.stringify(puzzle.solution));
    }
    
    // Keep other metadata as-is (id, goal, counts, etc.)
    return encoded;
}

/**
 * Decode puzzle data for use
 */
export function decodePuzzle(puzzle) {
    // Clone to avoid mutating original
    const decoded = { ...puzzle };
    
    // Decode cards
    if (puzzle.cards && typeof puzzle.cards === 'string') {
        decoded.cards = JSON.parse(decodeData(puzzle.cards));
    }
    
    // Decode dice
    if (puzzle.dice && typeof puzzle.dice === 'string') {
        decoded.dice = JSON.parse(decodeData(puzzle.dice));
    }
    
    // Decode solution
    if (puzzle.solution && typeof puzzle.solution === 'string') {
        decoded.solution = JSON.parse(decodeData(puzzle.solution));
    }
    
    return decoded;
}

/**
 * Encode string data with XOR + Base64
 */
function encodeData(str) {
    // Convert string to bytes
    const bytes = new TextEncoder().encode(str);
    
    // XOR each byte with key
    const xored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        xored[i] = bytes[i] ^ ((KEY >> (8 * (i % 4))) & 0xFF);
    }
    
    // Convert to base64
    return btoa(String.fromCharCode(...xored));
}

/**
 * Decode string data from XOR + Base64
 */
function decodeData(str) {
    // Decode base64
    const decoded = atob(str);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
    }
    
    // XOR each byte with key (reverse operation)
    const xored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        xored[i] = bytes[i] ^ ((KEY >> (8 * (i % 4))) & 0xFF);
    }
    
    // Convert back to string
    return new TextDecoder().decode(xored);
}

// Node.js compatibility for scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { encodePuzzle, decodePuzzle };
}

