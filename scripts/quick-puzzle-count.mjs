/**
 * Quick solution count for a puzzle (no verbose output)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import modules
const setTheoryModule = await import(`file://${projectRoot}/js/setTheory.js`);
const evaluateExpression = setTheoryModule.evaluateExpression;
const evaluateRestriction = setTheoryModule.evaluateRestriction;
const isValidSyntax = setTheoryModule.isValidSyntax;
const isValidRestriction = setTheoryModule.isValidRestriction;
const scenarioManagerModule = await import(`file://${projectRoot}/js/scenarioManager.js`);
const ScenarioManager = scenarioManagerModule.ScenarioManager;

// Make imported functions available globally
global.evaluateExpression = evaluateExpression;
global.evaluateRestriction = evaluateRestriction;
global.isValidSyntax = isValidSyntax;
global.isValidRestriction = isValidRestriction;

// Helper: Get all combinations of size k from array
function getCombinations(array, k) {
    if (k === 0) return [[]];
    if (k > array.length) return [];
    if (k === array.length) return [array];
    
    const result = [];
    
    function backtrack(start, current) {
        if (current.length === k) {
            result.push([...current]);
            return;
        }
        
        for (let i = start; i < array.length; i++) {
            current.push(array[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    
    backtrack(0, []);
    return result;
}

// Helper: Get all permutations of an array
function getPermutations(array) {
    if (array.length === 0) return [[]];
    if (array.length === 1) return [array];
    
    const result = [];
    
    for (let i = 0; i < array.length; i++) {
        const current = array[i];
        const remaining = [...array.slice(0, i), ...array.slice(i + 1)];
        const remainingPerms = getPermutations(remaining);
        
        for (let perm of remainingPerms) {
            result.push([current, ...perm]);
        }
    }
    
    return result;
}

// Puzzle data
const puzzleData = {
  "cards": [5, 7, 11, 10, 6, 4, 12, 1],
  "dice": [
    { "type": "color", "value": "red", "name": "RED", "id": "1", "x": 0, "y": 0 },
    { "type": "color", "value": "green", "name": "GREEN", "id": "2", "x": 100, "y": 0 },
    { "type": "color", "value": "green", "name": "GREEN", "id": "3", "x": 200, "y": 0 },
    { "type": "color", "value": "gold", "name": "GOLD", "id": "4", "x": 300, "y": 0 },
    { "type": "operator", "value": "∩", "name": "INTERSECTION", "id": "5", "x": 400, "y": 0 },
    { "type": "operator", "value": "′", "name": "COMPLEMENT", "id": "6", "isRequired": true, "x": 500, "y": 0 },
    { "type": "set-constant", "value": "U", "name": "UNIVERSE", "id": "7", "x": 600, "y": 0 },
    { "type": "set-constant", "value": "∅", "name": "NULL", "id": "8", "x": 700, "y": 0 }
  ],
  "goal": 3
};

// Convert card indices to card objects
const scenarioManager = new ScenarioManager({ level: 8 });
const cards = scenarioManager.cardsFromIndices(puzzleData.cards);

console.log('🎲 Analyzing puzzle...');
console.log('Cards:', puzzleData.cards.join(', '));
console.log('Dice:', puzzleData.dice.map(d => d.value).join(' '));
console.log('Goal:', puzzleData.goal);
console.log('Required cube:', puzzleData.dice.find(d => d.isRequired)?.value || 'none');
console.log('\n📋 ALL SOLUTIONS:\n');

let solutionNumber = 0;
const uniqueSolutions = new Set(); // Track unique solution strings

// Try all possible dice combinations from size 2 to dice.length
for (let size = 2; size <= puzzleData.dice.length; size++) {
    const combinations = getCombinations(puzzleData.dice, size);
    
    for (let combo of combinations) {
        // Try as a simple set name (no restriction)
        const perms = getPermutations(combo);
        
        for (let perm of perms) {
            const diceWithPositions = perm.map((die, i) => ({
                ...die,
                x: i * 100,
                y: 10
            }));
            
            if (isValidSyntax(diceWithPositions)) {
                const result = evaluateExpression(diceWithPositions, cards);
                if (result && result.size === puzzleData.goal) {
                    const diceStr = diceWithPositions.map(d => d.value).join(' ');
                    if (!uniqueSolutions.has(diceStr)) {
                        uniqueSolutions.add(diceStr);
                        solutionNumber++;
                        const hasPrime = diceWithPositions.some(d => d.value === '′');
                        console.log(`${solutionNumber}. ${diceStr} ${hasPrime ? '✅' : '❌'}`);
                    }
                }
            }
        }
        
        // Try splitting into restriction + set name
        if (size >= 3) {
            for (let restrictionSize = 2; restrictionSize <= size - 1; restrictionSize++) {
                const restrictionCombos = getCombinations(combo, restrictionSize);
                
                for (let restrictionDice of restrictionCombos) {
                    const setNameDice = combo.filter(die => !restrictionDice.includes(die));
                    
                    const restrictionPerms = getPermutations(restrictionDice);
                    
                    for (let restrictionPerm of restrictionPerms) {
                        const restrictionWithPos = restrictionPerm.map((die, i) => ({
                            ...die,
                            x: i * 100,
                            y: 10
                        }));
                        
                        if (!isValidRestriction(restrictionWithPos)) {
                            continue;
                        }
                        
                        const setNamePerms = getPermutations(setNameDice);
                        
                        for (let setNamePerm of setNamePerms) {
                            const setNameWithPos = setNamePerm.map((die, i) => ({
                                ...die,
                                x: i * 100,
                                y: 10
                            }));
                            
                            if (isValidSyntax(setNameWithPos)) {
                                const result = evaluateExpression(setNameWithPos, restrictionWithPos, cards);
                                if (result && result.size === puzzleData.goal) {
                                    const setNameStr = setNameWithPos.map(d => d.value).join(' ');
                                    const restrictionStr = restrictionWithPos.map(d => d.value).join(' ');
                                    const fullStr = `${setNameStr} | ${restrictionStr}`;
                                    
                                    if (!uniqueSolutions.has(fullStr)) {
                                        uniqueSolutions.add(fullStr);
                                        solutionNumber++;
                                        const fullCombo = [...setNameWithPos, ...restrictionWithPos];
                                        const hasPrime = fullCombo.some(d => d.value === '′');
                                        console.log(`${solutionNumber}. ${fullStr} ${hasPrime ? '✅' : '❌'}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

console.log(`\n🏆 Total solutions: ${solutionNumber}`);
console.log('✅ = uses Prime, ❌ = no Prime\n');

