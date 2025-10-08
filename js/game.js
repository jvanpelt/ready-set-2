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
        this.isTutorialActive = false; // Set by TutorialManager to suppress timer timeout
        
        // Timer (Level 7+)
        this.timeRemaining = null;
        this.timerInterval = null;
        this.timerStartTime = null; // Timestamp when timer started (for persistence)
        this.timerDuration = null; // Original duration (for persistence)
        this.onTimerTick = null; // Callback for UI updates
        this.onTimeout = null; // Callback when time runs out
        
        this.init();
    }
    
    init() {
        console.log('🎮 Game.init() called');
        
        // Try to load saved game first
        const savedState = this.storage.loadGameState();
        console.log('💾 Saved state loaded:', savedState ? 'YES' : 'NO');
        
        if (savedState && savedState.cards.length > 0) {
            console.log('✅ Restoring from saved state');
            console.log('  - Level:', savedState.level);
            console.log('  - Cards:', savedState.cards.length);
            console.log('  - Dice:', savedState.dice.length);
            
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
                console.log('  - Migrating old 1-row format to 2-row format');
                this.solutions = [[], savedState.solutions[0]];
            } else {
                this.solutions = savedState.solutions;
            }
            
            console.log('  - Solutions:', this.solutions.length, 'rows');
            
            // Restore timer if it was running
            if (savedState.timerStartTime && savedState.timerDuration) {
                console.log('⏱️ Restoring timer...');
                const elapsed = Math.floor((Date.now() - savedState.timerStartTime) / 1000);
                const remaining = savedState.timerDuration - elapsed;
                console.log('  - Elapsed:', elapsed, 'seconds');
                console.log('  - Remaining:', remaining, 'seconds');
                
                if (remaining > 0) {
                    console.log('  - Timer still active - restoring');
                    // Set the original start time and duration BEFORE calling startTimer
                    // This prevents startTimer from creating a new timestamp
                    this.timerStartTime = savedState.timerStartTime;
                    this.timerDuration = savedState.timerDuration;
                    // Timer still has time left - restore it
                    this.startTimer(remaining);
                } else {
                    console.log('  - Timer expired - generating new round');
                    // Timer expired while away - start new round
                    this.generateNewRound();
                }
            } else {
                console.log('  - No timer to restore');
            }
        } else {
            console.log('🆕 Starting fresh - generating new round');
            // Start fresh
            this.generateNewRound();
        }
        
        console.log('📊 Getting level config for level', this.level);
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
        if (config) {
            this.goalScore = config.goalScore;
            console.log('✅ Level config loaded - goal score:', this.goalScore);
        } else {
            console.error('❌ Failed to load level config for level', this.level);
        }
        
        console.log('✅ Game.init() complete');
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
        
        // Start timer if level has time limit (Level 7+)
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
        if (config.timeLimit) {
            this.startTimer(config.timeLimit);
        } else {
            this.stopTimer();
        }
    }
    
    startNewLevel() {
        this.level++;
        this.tutorialShown = false; // Show tutorial for new level
        this.score = 0; // Reset score for new level
        this.generateNewRound();
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
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
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
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
        
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
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
    
    // Timer methods (Level 7+)
    startTimer(seconds) {
        this.stopTimer(); // Clear any existing timer
        this.timeRemaining = seconds;
        
        // Save start time and duration for persistence (only if not restoring)
        if (!this.timerStartTime) {
            this.timerStartTime = Date.now();
            this.timerDuration = seconds;
        }
        
        console.log(`⏱️ Timer started: ${seconds} seconds`);
        
        // Tick immediately
        if (this.onTimerTick) {
            this.onTimerTick(this.timeRemaining);
        }
        
        // Then tick every second
        this.timerInterval = setInterval(() => {
            // Don't go below 0
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
            }
            
            if (this.onTimerTick) {
                this.onTimerTick(this.timeRemaining);
            }
            
            if (this.timeRemaining <= 0) {
                this.handleTimeout();
            }
            
            // Save state on each tick to persist timer
            this.saveState();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timeRemaining = null;
        this.timerStartTime = null;
        this.timerDuration = null;
        this.saveState(); // Clear timer from storage
    }
    
    handleTimeout() {
        console.log('⏰ Time expired!');
        
        // Suppress timeout during tutorials - let timer tick but don't end round
        if (this.isTutorialActive) {
            console.log('🎓 Tutorial active - suppressing timeout (timer will stay at 0:00)');
            return;
        }
        
        this.stopTimer();
        
        if (this.onTimeout) {
            this.onTimeout();
        }
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
        // Sort dice by X position (left-to-right) before validation
        const restrictionRow = (this.solutions[0] || []).sort((a, b) => a.x - b.x);
        const setNameRow = (this.solutions[1] || []).sort((a, b) => a.x - b.x);
        
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
        
        // Check total cube count: SOLUTION must have at least 2 cubes total
        const totalCubes = restrictionRow.length + setNameRow.length;
        if (totalCubes < 2) {
            return { valid: false, message: 'Solution must use at least 2 cubes!' };
        }
        
        // Combine both rows for validation checks
        const allDice = [...restrictionRow, ...setNameRow];
        
        // Check wild cubes (Level 9+): must have an operator selected
        const wildCubesWithoutSelection = allDice.filter(die => 
            die.type === 'wild' && !die.selectedOperator
        );
        if (wildCubesWithoutSelection.length > 0) {
            console.log('❌ VALIDATION FAILED: Wild cube without operator selection');
            return { valid: false, message: 'Click the wild cube (?) to choose an operator!' };
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
        
        console.log('📊 Validation Summary:');
        console.log('  - Active card indices:', Array.from(activeCardIndices));
        console.log('  - Matching cards (in active array):', Array.from(matchingCards));
        
        // Map back to original card indices
        const activeCardsArray = Array.from(activeCardIndices);
        const finalMatchingCards = new Set(
            Array.from(matchingCards).map(activeIdx => activeCardsArray[activeIdx])
        );
        
        console.log('  - Final matching cards (original indices):', Array.from(finalMatchingCards));
        console.log('  - Final count:', finalMatchingCards.size);
        console.log('  - Goal:', this.goalCards);
        
        // Check if exactly the goal number of cards
        if (finalMatchingCards.size !== this.goalCards) {
            console.log('❌ VALIDATION FAILED: Card count mismatch');
            return { 
                valid: false, 
                message: `Found ${finalMatchingCards.size} cards, need ${this.goalCards}!`,
                matchingCards: finalMatchingCards,
                cardsToFlip
            };
        }
        
        console.log('✅ Card count matches goal!');
        
        // Check if required cube is used (Level 8+)
        const requiredDie = this.dice.find(die => die.isRequired);
        if (requiredDie) {
            console.log('🟩 Required cube check:');
            console.log('  - Required die:', requiredDie.value, 'ID:', requiredDie.id);
            console.log('  - Solution dice IDs:', allDice.map(d => d.id));
            const usedRequiredCube = allDice.some(die => die.id === requiredDie.id);
            console.log('  - Used required cube?', usedRequiredCube);
            
            if (!usedRequiredCube) {
                console.log('❌ VALIDATION FAILED: Required cube not used');
                return {
                    valid: false,
                    message: 'You must use the required cube (green border)!',
                    matchingCards: finalMatchingCards,
                    cardsToFlip
                };
            }
            console.log('✅ Required cube is used!');
        } else {
            console.log('No required cube this round');
        }
        
        // Calculate score (all dice from both rows)
        let points = calculateScore(allDice);
        
        // Add bonus for using special cubes
        // Required cube: 50 points (Level 8+)
        if (requiredDie) {
            const usedRequiredCube = allDice.some(die => die.id === requiredDie.id);
            if (usedRequiredCube) {
                points += 50;
                console.log('✅ Required cube bonus: +50 points');
            }
        }
        
        // Wild cube: 25 points (Level 9+)
        const wildCubesUsed = allDice.filter(die => die.type === 'wild');
        if (wildCubesUsed.length > 0) {
            points += wildCubesUsed.length * 25;
            console.log(`✅ Wild cube bonus: +${wildCubesUsed.length * 25} points (${wildCubesUsed.length} wild cubes)`);
        }
        
        // Bonus cube: 50 points (Level 10)
        const bonusCubesUsed = allDice.filter(die => die.isBonus);
        if (bonusCubesUsed.length > 0) {
            points += bonusCubesUsed.length * 50;
            console.log(`✅ Bonus cube bonus: +${bonusCubesUsed.length * 50} points (${bonusCubesUsed.length} bonus cubes)`);
        }
        
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
            // Stop timer on successful submission
            this.stopTimer();
            
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
        // Stop timer when passing
        this.stopTimer();
        // Generate new puzzle (small penalty could be added)
        this.resetRound();
        return { passed: true, message: 'New puzzle generated!' };
    }
    
    correctPass() {
        // Stop timer when passing
        this.stopTimer();
        // No points awarded for passing (even if correct)
        this.resetRound();
        return { 
            passed: true, 
            correct: true,
            points: 0,
            message: "You're right! No solution exists." 
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
        const settings = this.storage.loadSettings();
        const config = getLevelConfig(this.level, settings.testMode);
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
            restrictionsEnabled: this.level >= 6, // Whether top row (restrictions) is enabled
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration
        };
    }
}

