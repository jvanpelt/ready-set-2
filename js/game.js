// Game state management

import { generateCardConfig, generateDiceForLevel, getLevelConfig, hasNextLevel, generateGoal } from './levels.js';
import { evaluateExpression, calculateScore, isValidSyntax, getPatternString, hasRestriction, isValidRestriction, evaluateRestriction } from './setTheory.js';
import { GameStorage } from './storage.js';

export class Game {
    constructor() {
        this.storage = new GameStorage();
        
        // Mode management - ALWAYS one of: 'regular' | 'daily'
        this.mode = 'regular'; // Default to regular game mode
        
        // Regular game state
        this.level = 1;
        this.score = 0;
        this.cards = [];
        this.dice = [];
        this.solutions = [[], []]; // Always 2 rows: [restriction row, set name row]
        this.goalCards = 3;
        this.tutorialShown = false;
        this.isTutorialActive = false; // Set by TutorialManager to suppress timer timeout
        
        // Daily puzzle state (set when in daily mode)
        this.dailyPuzzle = null;
        
        // Save state when page unloads or loses focus
        this.setupAutoSaveListeners();
        
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
        
        // Restore timer if it was running
        if (savedState.timerStartTime && savedState.timerDuration) {
            console.log('⏱️ Timer data found in saved state...');
            const elapsed = Math.floor((Date.now() - savedState.timerStartTime) / 1000);
            const remaining = savedState.timerDuration - elapsed;
            console.log('  - Elapsed:', elapsed, 'seconds');
            console.log('  - Remaining:', remaining, 'seconds');
            
            if (remaining > 0) {
                console.log('  - Timer still active - will restore after UI ready');
                // Store timer state for UIController to restore
                // (Can't start now - callbacks not set yet)
                this.timerStartTime = savedState.timerStartTime;
                this.timerDuration = savedState.timerDuration;
                this.timeRemaining = remaining;
                // UIController will call startTimer() after setting callbacks
            } else {
                console.log('  - Timer expired - generating new round');
                // Timer expired while away - start new round
                this.generateNewRound();
            }
        } else {
            console.log('  - No timer to restore');
            
            // Check if this level normally has a timer and should start one
            // (same logic as resetRound)
            if (this.mode !== 'daily') {
                const settings = this.storage.loadSettings();
                const config = getLevelConfig(this.level, settings.testMode);
                
                if (config.timeLimit) {
                    const hasInterstitial = this.level >= 7 && !this.storage.isTutorialViewed(this.level);
                    
                    console.log(`⏱️ Timer decision for restored Level ${this.level}:`);
                    console.log(`  - config.timeLimit: ${config.timeLimit}`);
                    console.log(`  - hasInterstitial: ${hasInterstitial}`);
                    
                    if (!hasInterstitial) {
                        console.log(`  → Will start timer after UI ready (${config.timeLimit}s)`);
                        // Store for UIController to start after callbacks are set
                        this.timeRemaining = config.timeLimit;
                        // UIController will call startTimer() when ready
                    } else {
                        console.log(`  → Timer will start after interstitial/tutorial`);
                    }
                }
            }
        }
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
        // Timer management:
        // - Daily puzzles: never start timer
        // - Levels with interstitials (7+): timer started AFTER interstitial/tutorial dismisses
        // - Other levels: start timer immediately
        if (this.mode === 'daily') {
            this.stopTimer();
        } else {
            const settings = this.storage.loadSettings();
            const config = getLevelConfig(this.level, settings.testMode);
            
            // For levels >= 7, timer will be started after interstitial/tutorial
            // This prevents timer from running during interstitial screen
            const hasInterstitial = this.level >= 7 && !this.storage.isTutorialViewed(this.level);
            
            console.log(`⏱️ Timer decision - Level ${this.level}:`);
            console.log(`  - config.timeLimit: ${config.timeLimit}`);
            console.log(`  - hasInterstitial: ${hasInterstitial}`);
            console.log(`  - isTutorialViewed: ${this.storage.isTutorialViewed(this.level)}`);
            
            if (config.timeLimit && !hasInterstitial) {
                console.log(`  → Starting timer immediately (${config.timeLimit}s)`);
                this.startTimer(config.timeLimit);
            } else if (!config.timeLimit) {
                console.log(`  → Stopping timer (no time limit for this level)`);
                this.stopTimer();
            } else {
                console.log(`  → Timer will start after interstitial/tutorial`);
            }
            // If hasInterstitial, timer stays stopped until UI starts it
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
            
            // Timer state will be saved on user interactions and page unload
            // No need to save every second
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.timeRemaining = null;
            this.timerStartTime = null;
            this.timerDuration = null;
            this.saveState(); // Clear timer from storage
        } else {
            // No active timer, just clear the properties without saving
            this.timeRemaining = null;
            this.timerStartTime = null;
            this.timerDuration = null;
        }
    }
    
    setupAutoSaveListeners() {
        // Save when page is about to unload (refresh, close, navigate away)
        window.addEventListener('beforeunload', () => {
            console.log('💾 Auto-save: page unload');
            this.saveState();
        });
        
        // Save when tab loses focus (switching tabs, minimizing)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('💾 Auto-save: tab hidden');
                this.saveState();
            }
        });
        
        // Save when window loses focus (clicking outside browser)
        window.addEventListener('blur', () => {
            console.log('💾 Auto-save: window blur');
            this.saveState();
        });
    }
    
    handleTimeout() {
        console.log('⏰ Time expired!');
        
        // Suppress timeout for all tutorials EXCEPT Level 7 (where timer is the lesson)
        if (this.isTutorialActive && this.level !== 7) {
            console.log('🎓 Tutorial active (non-Level 7) - suppressing timeout');
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
    
    /**
     * Calculate current score for daily puzzle (dynamic, updates as cubes are placed)
     * Uses same scoring logic as calculateScore but for all solution cubes combined
     */
    getCurrentDailyScore() {
        if (this.mode !== 'daily') return 0;
        
        // Combine all cubes from both solution rows
        const allCubes = [...(this.solutions[0] || []), ...(this.solutions[1] || [])];
        
        if (allCubes.length === 0) return 0;
        
        let totalPoints = 0;
        
        allCubes.forEach(die => {
            if (die.type === 'color') {
                totalPoints += 5; // Base points for colors
            } else if (die.type === 'wild') {
                totalPoints += 25; // Wild cubes (Level 9+)
            } else if (die.type === 'operator') {
                // Operator points (union=10, intersection=15, etc)
                const operatorPoints = {
                    '∪': 10,  // Union
                    '∩': 15,  // Intersection
                    '−': 20,  // Difference
                    '′': 25   // Prime
                };
                totalPoints += operatorPoints[die.value] || 0;
            } else if (die.type === 'set-constant') {
                totalPoints += 30; // Universe/Null
            } else if (die.type === 'restriction') {
                totalPoints += 30; // Equals/Subset
            }
        });
        
        // Multiply by cube count for complexity bonus
        return totalPoints * allCubes.length;
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
        console.log('🚀 submitSolution() called');
        
        try {
            const result = this.validateSolution();
            console.log('📋 Validation result:', result.valid ? '✅ VALID' : '❌ INVALID', '-', result.message);
            
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
        const stateData = {
            level: this.level,
            score: this.score,
            goalCards: this.goalCards,
            cards: this.cards,
            dice: this.dice,
            solutions: this.solutions,
            cardStates: this.cardStates,
            tutorialShown: this.tutorialShown,
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration,
            dailyPuzzle: this.dailyPuzzle
        };
        
        // DEBUG: Log what we're saving and where
        console.log(`💾 saveState() - mode: ${this.mode}`);
        console.log(`  - Level: ${this.level}, Dice: ${this.dice?.length}`);
        
        // Save to appropriate storage location based on mode
        if (this.mode === 'daily') {
            console.log(`  → Saving to DAILY PUZZLE storage`);
            this.storage.saveDailyPuzzleState(stateData);
        } else {
            console.log(`  → Saving to REGULAR GAME storage`);
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
            timerStartTime: this.timerStartTime,
            timerDuration: this.timerDuration,
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
        
        // Stop any timer (will restart if needed for Level 7+)
        if (this.timerInterval) {
            this.stopTimer();
        }
        
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
            }
        } else {
            console.log('⚠️ No saved state found, generating new round');
            this.generateNewRound();
        }
        
        // NOW set mode to 'regular' - data is correct
        this.mode = 'regular';
        
        console.log('✅ Regular game mode active');
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
        
        // Set mode explicitly
        this.mode = 'daily';
        
        // Store daily puzzle data (enhanced with metadata)
        this.dailyPuzzle = {
            puzzleId: puzzle.id,
            templatePattern: puzzle.templatePattern, // For debugging
            difficulty: puzzle.difficulty,
            solution: puzzle.solution || puzzle.generatedSolution,
            matchingCards: puzzle.matchingCards,
            startTime: Date.now()
        };
        
        // Stop any timer (daily puzzles don't have timers)
        if (this.timerInterval) {
            this.stopTimer();
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

