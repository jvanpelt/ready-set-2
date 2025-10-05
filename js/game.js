// Game state management

import { generateCardConfig, generateDiceForLevel, getLevelConfig, hasNextLevel, generateGoal } from './levels.js';
import { evaluateExpression, calculateScore, isValidSyntax, getPatternString, hasRestriction, isValidRestriction, evaluateRestriction } from './setTheory.js';
import { GameStorage } from './storage.js';

export class Game {
    constructor() {
        this.storage = new GameStorage();
        this.level = 1;
        this.score = 0;
        this.cards = [];
        this.dice = [];
        this.solutions = [[], []]; // Always 2 rows: [restriction row, set name row]
        this.goalCards = 3;
        this.tutorialShown = false;
        
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
            this.cardStates = savedState.cardStates;
            this.tutorialShown = savedState.tutorialShown;
            
            // Migrate old saved state to new 2-row format
            if (savedState.solutions.length === 1) {
                // Old format: single row - move to bottom row
                this.solutions = [[], savedState.solutions[0]];
            } else {
                this.solutions = savedState.solutions;
            }
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
        this.solutions = [[], []]; // Always 2 rows: [restriction row, set name row]
        
        // Reset card states - ensure all cards start fully visible
        this.cardStates = this.cards.map(() => ({
            dimmed: false,
            excluded: false,
            flipped: false  // Level 6+: card removed from universe
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
        this.solutions = [[], []]; // Clear both rows
        this.saveState();
    }
    
    toggleCardState(cardIndex) {
        const state = this.cardStates[cardIndex];
        
        if (!state.dimmed && !state.flipped) {
            // First tap: dim (note-taking)
            state.dimmed = true;
            state.excluded = false;
        } else if (state.dimmed && !state.flipped) {
            // Second tap: flip (remove from universe)
            state.dimmed = false;
            state.excluded = true;
            state.flipped = true;
        } else {
            // Third tap: reset
            state.dimmed = false;
            state.excluded = false;
            state.flipped = false;
        }
        this.saveState();
    }
    
    // Flip cards based on restriction (called during evaluation)
    flipCardsByRestriction(cardIndicesToFlip) {
        cardIndicesToFlip.forEach(index => {
            this.cardStates[index].flipped = true;
            this.cardStates[index].excluded = true;
            this.cardStates[index].dimmed = false;
        });
        this.saveState();
    }
    
    validateSolution() {
        const restrictionRow = this.solutions[0] || [];
        const setNameRow = this.solutions[1] || [];
        
        // Check if any row has dice
        if (restrictionRow.length === 0 && setNameRow.length === 0) {
            return { valid: false, message: 'Add dice to create a solution!' };
        }
        
        // Check for restrictions in both rows (not allowed)
        if (hasRestriction(restrictionRow) && hasRestriction(setNameRow)) {
            return { valid: false, message: "You can't have 2 restrictions!" };
        }
        
        // Check for set names in both rows (not allowed)
        if (restrictionRow.length > 0 && !hasRestriction(restrictionRow) && 
            setNameRow.length > 0 && !hasRestriction(setNameRow)) {
            return { valid: false, message: "You can't have 2 set names!" };
        }
        
        // Determine which row has the restriction and which has the set name
        let restriction = null;
        let setName = null;
        
        if (hasRestriction(restrictionRow)) {
            restriction = restrictionRow;
            setName = setNameRow;
        } else if (hasRestriction(setNameRow)) {
            restriction = setNameRow;
            setName = restrictionRow;
        } else {
            // No restriction, just a set name
            setName = restrictionRow.length > 0 ? restrictionRow : setNameRow;
        }
        
        // Validate patterns
        if (restriction && restriction.length > 0) {
            if (!isValidRestriction(restriction)) {
                return { valid: false, message: 'Invalid restriction syntax!' };
            }
            // Must have a set name with a restriction
            if (!setName || setName.length === 0) {
                return { valid: false, message: "You can't have a restriction without a set name!" };
            }
        }
        
        if (setName && setName.length > 0) {
            if (!isValidSyntax(setName)) {
                return { valid: false, message: 'Invalid set name syntax!' };
            }
        }
        
        // Apply restriction if present (flip cards)
        let cardsToFlip = [];
        if (restriction && restriction.length > 0) {
            cardsToFlip = evaluateRestriction(restriction, this.cards);
        }
        
        // Filter out flipped cards for set name evaluation
        const activeCardIndices = new Set(
            this.cards.map((_, idx) => idx).filter(idx => 
                !cardsToFlip.includes(idx) && !this.cardStates[idx].flipped
            )
        );
        const activeCards = this.cards.filter((_, idx) => activeCardIndices.has(idx));
        
        // Evaluate set name against active (non-flipped) cards
        const matchingCards = evaluateExpression(setName, activeCards);
        
        // Map back to original card indices
        const activeCardsArray = Array.from(activeCardIndices);
        const finalMatchingCards = new Set(
            Array.from(matchingCards).map(activeIdx => activeCardsArray[activeIdx])
        );
        
        // Check if exactly the goal number of cards
        if (finalMatchingCards.size !== this.goalCards) {
            return { 
                valid: false, 
                message: `Found ${finalMatchingCards.size} cards, need ${this.goalCards}!`,
                matchingCards: finalMatchingCards,
                cardsToFlip
            };
        }
        
        // Calculate score (all dice from both rows)
        const allDice = [...restrictionRow, ...setNameRow];
        const points = calculateScore(allDice);
        
        return {
            valid: true,
            message: 'Correct solution!',
            points,
            matchingCards: finalMatchingCards,
            cardsToFlip
        };
    }
    
    submitSolution() {
        const result = this.validateSolution();
        
        if (result.valid) {
            // Apply restriction flips if present
            if (result.cardsToFlip && result.cardsToFlip.length > 0) {
                this.flipCardsByRestriction(result.cardsToFlip);
            }
            
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
            restrictionsEnabled: this.level >= 6 // Whether top row (restrictions) is enabled
        };
    }
}

