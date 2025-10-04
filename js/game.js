// Game state management

import { generateCardConfig, generateDiceForLevel, getLevelConfig, hasNextLevel, generateGoal } from './levels.js';
import { evaluateExpression, calculateScore, isValidSyntax, getPatternString } from './setTheory.js';
import { GameStorage } from './storage.js';

export class Game {
    constructor() {
        this.storage = new GameStorage();
        this.level = 1;
        this.score = 0;
        this.cards = [];
        this.dice = [];
        this.solutions = [[]]; // Array of solution rows
        this.goalCards = 3;
        this.tutorialShown = false;
        this.maxRows = 2; // Maximum solution rows allowed
        
        this.init();
    }
    
    init() {
        // Try to load saved game first
        const savedState = this.storage.loadGameState();
        
        if (savedState && savedState.cards.length > 0) {
            // Restore from saved state
            this.level = savedState.level;
            this.score = savedState.score;
            this.goalCards = savedState.goalCards;
            this.cards = savedState.cards;
            this.dice = savedState.dice;
            this.solutions = savedState.solutions;
            this.cardStates = savedState.cardStates;
            this.tutorialShown = savedState.tutorialShown;
        } else {
            // Start fresh
            this.generateNewRound();
        }
        
        const config = getLevelConfig(this.level);
        this.goalScore = config.goalScore;
    }
    
    generateNewRound() {
        this.cards = generateCardConfig(8);
        this.dice = generateDiceForLevel(this.level);
        
        // Add unique IDs to each die
        this.dice = this.dice.map((die, index) => ({
            ...die,
            id: `die-${index}-${Date.now()}`
        }));
        
        this.goalCards = generateGoal(); // New random goal each round
        this.solutions = [[]]; // Reset to single empty row
        
        // Reset card states - ensure all cards start fully visible
        this.cardStates = this.cards.map(() => ({
            dimmed: false,
            excluded: false
        }));
    }
    
    startNewLevel() {
        this.level++;
        this.tutorialShown = false; // Show tutorial for new level
        this.score = 0; // Reset score for new level
        this.generateNewRound();
        const config = getLevelConfig(this.level);
        this.goalScore = config.goalScore;
        this.saveState();
    }
    
    resetRound() {
        this.generateNewRound();
        this.saveState();
    }
    
    newGame() {
        this.level = 1;
        this.score = 0;
        this.tutorialShown = false;
        this.storage.clear(); // Clear saved game
        this.generateNewRound();
        const config = getLevelConfig(this.level);
        this.goalScore = config.goalScore;
        this.saveState();
    }
    
    // Test mode: Jump to any level
    jumpToLevel(targetLevel) {
        if (targetLevel < 1 || targetLevel > 10) return;
        
        this.level = targetLevel;
        this.score = 0; // Reset score for new level
        this.tutorialShown = false; // Show tutorial for new level
        this.generateNewRound();
        
        const config = getLevelConfig(this.level);
        this.goalScore = config.goalScore;
        
        // Update highest level if needed
        if (targetLevel > this.highestLevel) {
            this.highestLevel = targetLevel;
        }
        
        this.saveState();
    }
    
    addDieToSolution(die, rowIndex = 0, x = null, y = null) {
        if (!this.solutions[rowIndex]) {
            this.solutions[rowIndex] = [];
        }
        // Add random rotation and position for visual variety
        const dieWithPosition = {
            ...die,
            rotation: die.rotation || ((Math.random() * 16) - 8),
            x: x !== null ? x : this.solutions[rowIndex].length * 70 + 10, // Auto-position if not specified
            y: y !== null ? y : 10
        };
        this.solutions[rowIndex].push(dieWithPosition);
        this.saveState();
    }
    
    removeDieFromSolution(rowIndex, dieIndex) {
        if (this.solutions[rowIndex]) {
            const removed = this.solutions[rowIndex].splice(dieIndex, 1)[0];
            this.saveState();
            return removed;
        }
    }
    
    updateDiePosition(rowIndex, dieIndex, x, y) {
        if (this.solutions[rowIndex] && this.solutions[rowIndex][dieIndex]) {
            this.solutions[rowIndex][dieIndex].x = x;
            this.solutions[rowIndex][dieIndex].y = y;
            this.saveState();
        }
    }
    
    clearSolution() {
        this.solutions = [[]]; // Reset to single empty row
        this.saveState();
    }
    
    addSolutionRow() {
        if (this.solutions.length < this.maxRows) {
            this.solutions.push([]);
            this.saveState();
            return true;
        }
        return false;
    }
    
    canAddRow() {
        return this.solutions.length < this.maxRows;
    }
    
    toggleCardState(cardIndex) {
        const state = this.cardStates[cardIndex];
        
        if (!state.dimmed && !state.excluded) {
            // First tap: dim
            state.dimmed = true;
        } else if (state.dimmed && !state.excluded) {
            // Second tap: exclude (flip to blue)
            state.dimmed = false;
            state.excluded = true;
        } else {
            // Third tap: reset
            state.dimmed = false;
            state.excluded = false;
        }
        this.saveState();
    }
    
    validateSolution() {
        // Check if any row has dice
        const hasAnyDice = this.solutions.some(row => row.length > 0);
        if (!hasAnyDice) {
            return { valid: false, message: 'Add dice to create a solution!' };
        }
        
        // Find the first non-empty row and validate it
        const solution = this.solutions.find(row => row.length > 0);
        
        if (!solution) {
            return { valid: false, message: 'Add dice to create a solution!' };
        }
        
        // Check syntax
        if (!isValidSyntax(solution)) {
            const pattern = getPatternString(solution);
            console.log(`Invalid pattern: ${pattern}`);
            return { valid: false, message: 'Invalid expression syntax! Check dice order.' };
        }
        
        // Evaluate expression
        const matchingCards = evaluateExpression(solution, this.cards);
        
        // Check if exactly the goal number of cards
        if (matchingCards.size !== this.goalCards) {
            return { 
                valid: false, 
                message: `Found ${matchingCards.size} cards, need ${this.goalCards}!`,
                matchingCards
            };
        }
        
        // Calculate score
        const points = calculateScore(solution);
        
        return {
            valid: true,
            message: 'Correct solution!',
            points,
            matchingCards
        };
    }
    
    submitSolution() {
        const result = this.validateSolution();
        
        if (result.valid) {
            this.score += result.points;
            this.saveState();
        }
        
        return result;
    }
    
    pass() {
        // Generate new puzzle (small penalty could be added)
        this.resetRound();
        return { passed: true, message: 'New puzzle generated!' };
    }
    
    correctPass() {
        // Award points for correctly identifying unsolvable puzzle
        // Points: 15 × level
        const passPoints = 15 * this.level;
        this.score += passPoints;
        this.resetRound();
        return { 
            passed: true, 
            correct: true,
            points: passPoints,
            message: "You're correct! There was no possible solution." 
        };
    }
    
    canAdvanceLevel() {
        return this.score >= this.goalScore;
    }
    
    shouldShowTutorial() {
        return !this.tutorialShown;
    }
    
    markTutorialShown() {
        this.tutorialShown = true;
        this.saveState();
    }
    
    saveState() {
        this.storage.saveGameState({
            level: this.level,
            score: this.score,
            goalCards: this.goalCards,
            cards: this.cards,
            dice: this.dice,
            solutions: this.solutions,
            cardStates: this.cardStates,
            tutorialShown: this.tutorialShown
        });
    }
    
    hasSavedGame() {
        return this.storage.hasSavedGame();
    }
    
    getHighestLevel() {
        return this.storage.getHighestLevel();
    }
    
    getTutorial() {
        const config = getLevelConfig(this.level);
        return config.tutorial;
    }
    
    getState() {
        return {
            level: this.level,
            score: this.score,
            goalScore: this.goalScore,
            cards: this.cards,
            cardStates: this.cardStates,
            dice: this.dice,
            solutions: this.solutions,
            goalCards: this.goalCards,
            canAdvance: this.canAdvanceLevel(),
            hasNextLevel: hasNextLevel(this.level),
            canAddRow: this.canAddRow()
        };
    }
}

