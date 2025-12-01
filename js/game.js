// Game state management

import { generateCardConfig, generateDiceForLevel, getLevelConfig, hasNextLevel, generateGoal } from './levels.js';
import { evaluateExpression, calculateScore, isValidSyntax, getPatternString, hasRestriction, isValidRestriction, evaluateRestriction } from './setTheory.js';
import { GameStorage } from './storage.js';

export class Game {
    constructor() {
        this.storage = new GameStorage();
        
        // State manager reference (set by main.js)
        this.stateManager = null;
        
        // Regular game state
        this.level = 1;
        this.score = 0;
        this.cards = [];
        this.dice = [];
        this.solutions = [[], []]; // Always 2 rows: [restriction row, set name row]
        this.goalCards = 3;
        this.tutorialShown = false;
        
        // Daily puzzle state (set when in daily mode)
        this.dailyPuzzle = null;
        
        // Timer (Level 7+) - managed by TimerManager
        // Set in main.js after construction
        this.timer = null;
        
        this.init();
    }
    
    /**
     * Get current game mode from state manager
     * @returns {'regular'|'tutorial'|'daily'}
     */
    get mode() {
        if (!this.stateManager) {
            return 'regular'; // Fallback during initialization
        }
        const state = this.stateManager.getState();
        // If we're in gameplay view, use the mode from state
        if (state.view === 'gameplay' && state.mode) {
            return state.mode;
        }
        // Otherwise check if we have a daily puzzle active
        if (this.dailyPuzzle) {
            return 'daily';
        }
        return 'regular';
    }
    
    /**
     * Check if tutorial is currently active
     * @returns {boolean}
     */
    get isTutorialActive() {
        return this.mode === 'tutorial';
    }
    
    init() {
        console.log('🎮 Game.init() called');
        
        // Try to load saved game first
        const savedState = this.storage.loadGameState();
        console.log('💾 Saved state loaded:', savedState ? 'YES' : 'NO');
        
        if (savedState && savedState.cards.length > 0) {
            this.restoreFromSavedState(savedState);
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
    
    /**
     * Restore game state from saved data
     * @param {Object} savedState - The saved game state to restore
     */
    restoreFromSavedState(savedState) {
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
        
        // Timer restoration is now handled by TimerManager in UIController
        console.log('  - Timer data in saved state:', {
            timeRemaining: savedState.timeRemaining,
            timerDuration: savedState.timerDuration
        });
    }
    
    generateNewRound() {
        console.log('🎲 ===== GENERATE NEW ROUND =====');
        console.log('  - Current mode:', this.mode);
        console.log('  - Current level:', this.level);
        
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
        
        // NOTE: generateNewRound() does NOT start timers!
        // Timer starting is handled explicitly by the caller:
        // - enterRegularMode() for Continue button
        // - pass() for Pass button  
        // - submitSolution() for Go button
        // - Level advancement for interstitial/tutorial flow
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
    
    // Timer methods removed - now handled by TimerManager
    
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
    
    /**
     * Calculate current score for daily puzzle (dynamic, updates as cubes are placed)
     * Uses unified calculateScore() function for consistency
     */
    getCurrentDailyScore() {
        if (this.mode !== 'daily') return 0;
        
        // Combine all cubes from both solution rows
        const allCubes = [...(this.solutions[0] || []), ...(this.solutions[1] || [])];
        
        if (allCubes.length === 0) return 0;
        
        // Use the same scoring logic as regular gameplay
        return calculateScore(allCubes);
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
        console.log('🎯 ===== VALIDATING SOLUTION =====');
        
        // Sort dice by X position (left-to-right) before validation
        const restrictionRow = (this.solutions[0] || []).sort((a, b) => a.x - b.x);
        const setNameRow = (this.solutions[1] || []).sort((a, b) => a.x - b.x);
        
        console.log('  Row 0:', restrictionRow.map(d => d.value).join(' ') || '(empty)');
        console.log('  Row 1:', setNameRow.map(d => d.value).join(' ') || '(empty)');
        
        // Check if any row has dice
        if (restrictionRow.length === 0 && setNameRow.length === 0) {
            console.log('❌ No dice in solution');
            return { valid: false, message: 'Add dice to create a solution!' };
        }
        
        // Check for restrictions in both rows (not allowed)
        if (hasRestriction(restrictionRow) && hasRestriction(setNameRow)) {
            console.log('❌ Both rows have restrictions');
            return { valid: false, message: "You can't have 2 restrictions!" };
        }
        
        // Check for set names in both rows (not allowed)
        if (restrictionRow.length > 0 && !hasRestriction(restrictionRow) && 
            setNameRow.length > 0 && !hasRestriction(setNameRow)) {
            console.log('❌ Both rows have set names (no restriction)');
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
        
        // 1-cube set name is only valid with a restriction
        // Without restriction, minimum set name is 2 cubes (e.g., "blue′")
        const setNameLength = setName ? setName.length : 0;
        if (setNameLength === 1 && !restriction) {
            return { valid: false, message: 'A 1-cube set name requires a restriction. Try adding more cubes!' };
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
        // Special cube bonuses are now included in calculateScore()
        let points = calculateScore(allDice);
        
        return {
            valid: true,
            message: 'Correct solution!',
            points,
            matchingCards: finalMatchingCards,
            cardsToFlip
        };
    }
    
    submitSolution() {
        console.log('🚀 submitSolution() called');
        
        try {
            const result = this.validateSolution();
            console.log('📋 Validation result:', result.valid ? '✅ VALID' : '❌ INVALID', '-', result.message);
            
            if (result.valid) {
                // NOTE: Timer is stopped by UIController AFTER animations
                // Don't stop it here or animations will be jarring
                
                // Apply restriction flips if present
                if (result.cardsToFlip && result.cardsToFlip.length > 0) {
                    this.flipCardsByRestriction(result.cardsToFlip);
                }
                
                this.score += result.points;
                this.saveState();
            }
            
            return result;
        } catch (error) {
            console.error('💥 ERROR in submitSolution():', error);
            console.error('Stack trace:', error.stack);
            return {
                valid: false,
                message: 'An error occurred: ' + error.message
            };
        }
    }
    
    pass() {
        // Stop current timer (clear data - new round will start fresh)
        if (this.timer) {
            this.timer.stop(true);
        }
        
        // Generate new puzzle
        this.resetRound();
        
        return { passed: true, message: 'New puzzle generated!' };
    }
    
    correctPass() {
        // Stop timer when passing (clear data - new round will start fresh)
        if (this.timer) {
            this.timer.stop(true);
        }
        // No points awarded for passing (even if correct)
        this.resetRound();
        return { 
            passed: true, 
            correct: true,
            points: 0,
            message: "You're right! No solution exists!" 
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
        // Don't save state during tutorials - tutorial data is temporary
        if (this.isTutorialActive) {
            console.log('⏸️ Skipping save - tutorial is active');
            return;
        }
        
        const stateData = {
            level: this.level,
            score: this.score,
            goalCards: this.goalCards,
            cards: this.cards,
            dice: this.dice,
            solutions: this.solutions,
            cardStates: this.cardStates,
            tutorialShown: this.tutorialShown,
            ...(this.timer ? this.timer.getStateData() : { timerStartTime: null, timerDuration: null }),
            dailyPuzzle: this.dailyPuzzle
        };
        
        // Save to appropriate storage location based on mode
        if (this.mode === 'daily') {
            this.storage.saveDailyPuzzleState(stateData);
        } else {
            this.storage.saveGameState(stateData);
        }
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
            // Daily puzzles always have both rows enabled, regular game enables at level 6+
            restrictionsEnabled: this.mode === 'daily' ? true : this.level >= 6,
            ...(this.timer ? this.timer.getStateData() : { timerStartTime: null, timerDuration: null }),
            mode: this.mode // 'daily' or 'regular'
        };
    }
    
    /**
     * Enter regular game mode
     * Restores saved regular game state and ensures clean mode transition
     */
    enterRegularMode() {
        console.log('🎮 ===== ENTERING REGULAR GAME MODE =====');
        
        // CRITICAL: Don't set mode until AFTER we've restored the correct data!
        // If we set mode='regular' now, but this.cards/this.dice still contain
        // daily puzzle data, any saveState() call will corrupt the regular game save.
        
        // Clear daily puzzle data
        this.dailyPuzzle = null;
        this.storage.clearDailyPuzzleState();
        
        // NOTE: Don't stop timer here!
        // Timer was never started on this page load (we're just entering regular mode)
        // It will be restored from localStorage when Continue is clicked
        
        // Restore saved regular game state FIRST
        const savedState = this.storage.loadGameState();
        if (savedState && savedState.cards && savedState.cards.length > 0) {
            console.log('📂 Found saved regular game state');
            console.log('  - Level:', savedState.level);
            console.log('  - Cards:', savedState.cards.length);
            console.log('  - Dice:', savedState.dice?.length);
            
            // VALIDATE: Check if this is actually regular game data, not daily puzzle data
            const expectedDice = savedState.level < 5 ? 6 : 8;
            const actualDice = savedState.dice?.length || 0;
            
            if (actualDice !== 0 && actualDice !== expectedDice) {
                console.error('🚫 Regular game save contains wrong dice count!');
                console.error('  - Expected:', expectedDice, 'for level', savedState.level);
                console.error('  - Found:', actualDice, '(possible daily puzzle contamination)');
                console.error('  - Discarding and generating fresh round at saved level');
                
                // Keep level/score but regenerate puzzle
                this.level = savedState.level;
                this.score = savedState.score || 0;
                this.generateNewRound();
            } else {
                console.log('✅ Valid regular game state, restoring');
                this.restoreFromSavedState(savedState);
                
                // NOTE: Timer is restored by UIController after Continue is clicked
            }
        } else {
            console.log('⚠️ No saved state found, generating new round');
            this.generateNewRound();
        }
        
        // Clear daily puzzle reference when entering regular mode
        this.dailyPuzzle = null;
        
        console.log('✅ Regular game mode active');
        // NOTE: Mode is now managed by state manager
    }
    
    /**
     * Enter daily puzzle mode
     * Sets up daily puzzle state without affecting regular game save
     * @param {Object} puzzle - The daily puzzle data
     */
    enterDailyMode(puzzle) {
        console.log('🎲 ===== ENTERING DAILY PUZZLE MODE =====');
        
        // NOTE: Regular game state is saved by DailyPuzzleManager BEFORE calling this
        // This ensures we save clean data before any daily puzzle loading
        // NOTE: Mode is now managed by state manager
        
        // Store daily puzzle data (enhanced with metadata)
        this.dailyPuzzle = {
            puzzleId: puzzle.id,
            templatePattern: puzzle.templatePattern, // For debugging
            difficulty: puzzle.difficulty,
            solution: puzzle.solution || puzzle.generatedSolution,
            matchingCards: puzzle.matchingCards,
            startTime: Date.now()
        };
        
        // Stop any timer if it's actively running
        // (daily puzzles don't have timers)
        if (this.timer && this.timer.timerInterval) {
            this.timer.stop(false); // false = keep data for restoration when returning to regular mode
        }
        
        // Load puzzle data into game state
        this.cards = puzzle.cards;
        this.goalCards = puzzle.goal;
        
        // Load dice and add runtime properties (id, x, y)
        const timestamp = Date.now();
        this.dice = puzzle.dice.map((die, i) => ({
            ...die,
            id: `die-${i}-${timestamp}`,
            x: 0,
            y: 0
        }));
        
        // Check for saved work-in-progress for this puzzle
        const savedWork = this.storage.loadDailyPuzzleState();
        if (savedWork && savedWork.puzzleId === puzzle.id) {
            console.log('📂 Restoring work-in-progress for puzzle #' + puzzle.id);
            const topRowDice = savedWork.solutions[0]?.length || 0;
            const bottomRowDice = savedWork.solutions[1]?.length || 0;
            console.log(`  - Restoring ${topRowDice + bottomRowDice} dice in solution (${topRowDice} top, ${bottomRowDice} bottom)`);
            
            // Restore player's solutions (dice with positions) and card states
            this.solutions = savedWork.solutions || [[], []];
            this.cardStates = savedWork.cardStates || this.cards.map(() => ({
                dimmed: false,
                excluded: false,
                flipped: false
            }));
        } else {
            if (savedWork) {
                console.log('⚠️ Saved work found but for different puzzle (saved: #' + savedWork.puzzleId + ', current: #' + puzzle.id + ')');
            }
            // Starting fresh
            this.solutions = [[], []];
            this.cardStates = this.cards.map(() => ({
                dimmed: false,
                excluded: false,
                flipped: false
            }));
        }
        
        console.log(`✅ Daily puzzle mode active - Puzzle #${puzzle.id}`);
        console.log(`  - Goal: ${puzzle.goal} cards`);
        console.log(`  - Cards: ${this.cards.length}`);
        console.log(`  - Dice: ${this.dice.length}`);
    }
}

