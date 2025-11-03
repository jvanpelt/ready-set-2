// Main UI controller - coordinates rendering, modals, and interactions

import { UIRenderer } from './UIRenderer.js';
import { DragDropHandler } from './DragDropHandler.js';
import { ModalManager } from './ModalManager.js';
import { WildCubeManager } from './WildCubeManager.js';
import { PuzzleBuilderManager } from './PuzzleBuilderManager.js';
import { TutorialManager } from './TutorialManager.js';
import { evaluateExpression, hasRestriction, evaluateRestriction } from '../setTheory.js';
import { hasPossibleSolution } from '../solutionFinder.js';
import { getLevelConfig } from '../levels.js';

export class UIController {
    constructor(game, onUpdate) {
        this.game = game;
        this.onUpdate = onUpdate;
        
        // Initialize sub-components
        this.renderer = new UIRenderer(game);
        this.modals = new ModalManager(game);
        this.wildCubeManager = new WildCubeManager(game, () => {
            this.evaluateSolutionHelper(); // Update game state before render
            this.render();
        });
        this.builderManager = new PuzzleBuilderManager(game, this);
        this.tutorialManager = new TutorialManager(game, this);
        
        // Load settings
        this.settings = this.game.storage.loadSettings();
        
        // Flags for preventing duplicate actions
        this.isProcessingPass = false;
        
        this.initElements();
        this.initEventListeners();
        
        // Initialize drag/drop after DOM elements are ready
        this.dragDropHandler = new DragDropHandler(
            game,
            this.diceContainer,
            this.solutionArea,
            () => {
                // Evaluate solution helper BEFORE render to update game.cardStates
                this.evaluateSolutionHelper();
                this.render();
            },
            (rowIndex, dieIndex) => {
                // Auto-show popover when wild cube is dropped
                this.showWildCubePopoverByIndex(rowIndex, dieIndex);
            },
            this.tutorialManager // Pass tutorial manager for drag restrictions
        );
        
        // Wire up timer callbacks (Level 7+)
        this.game.onTimerTick = (timeRemaining) => {
            this.updateTimer(timeRemaining);
        };
        this.game.onTimeout = () => this.handleTimeout();
        
        // If timer is already running (restored from saved state), trigger immediate update
        if (this.game.timeRemaining !== null) {
            // DEBUG: console.log('⏱️ Timer already running on init, remaining:', this.game.timeRemaining);
            // DEBUG: console.log('   Timer interval active?', this.game.timerInterval !== null);
            this.updateTimer(this.game.timeRemaining);
        }
    }
    
    initElements() {
        // Game elements
        this.cardsContainer = document.getElementById('cards-container');
        this.diceContainer = document.getElementById('dice-container');
        this.solutionArea = document.getElementById('solution-area');
        
        // Status bar
        this.currentScoreEl = document.getElementById('current-score');
        this.goalScoreEl = document.getElementById('goal-score');
        this.goalCardsEl = document.getElementById('goal-cards');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerValue = document.getElementById('timer-value');
        this.puzzleIdDisplay = document.getElementById('puzzle-id-display');
        this.puzzleIdValue = document.getElementById('puzzle-id-value');
        
        // Control buttons
        this.goBtn = document.getElementById('go-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.menuBtn = document.getElementById('menu-btn');
        
        // Settings
        this.solutionHelperToggle = document.getElementById('solution-helper-toggle');
        this.solutionHelperDescription = document.getElementById('solution-helper-description');
        this.solutionHelperToggle.checked = this.settings.solutionHelper;
        this.updateSolutionHelperDescription(this.settings.solutionHelper);
        
        this.testModeToggle = document.getElementById('test-mode-toggle');
        this.testModeToggle.checked = this.settings.testMode || false;
        
        this.reverseTestOrderToggle = document.getElementById('reverse-test-order-toggle');
        this.reverseTestOrderToggle.checked = this.settings.reverseTestOrder || false;
        
        this.themeSelector = document.getElementById('theme-selector');
        this.themeSelector.value = this.settings.theme || 'default';
        // Apply saved theme on load
        this.switchTheme(this.settings.theme || 'default');
        
        // Test mode
        this.jumpToLevelBtn = document.getElementById('jump-to-level-btn');
    }
    
    initEventListeners() {
        // Card clicks (for note-taking)
        this.cardsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const index = parseInt(card.dataset.index);
                this.game.toggleCardState(index);
                this.render();
            }
        });
        
        // Control buttons
        this.goBtn.addEventListener('click', () => this.handleGo());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.passBtn.addEventListener('click', () => this.handlePass());
        
        this.menuBtn.addEventListener('click', () => {
            // DEBUG: console.log('📋 MENU button clicked');
            this.modals.showMenu();
        });
        // DEBUG: this.menuBtn.addEventListener('mouseup', () => console.log('🖱️ MENU mouseup'));
        // DEBUG: this.menuBtn.addEventListener('touchend', () => console.log('👆 MENU touchend'));
        
        // Result modal
        document.getElementById('result-continue').addEventListener('click', () => {
            this.modals.hideResult(() => {
                this.render({ animate: true }); // Animate new round
                this.clearSolutionHelper();
            });
        });
        
        // Menu buttons
        document.getElementById('menu-close-btn').addEventListener('click', () => this.modals.hideMenu());
        document.getElementById('refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.modals.hideMenu();
            // Show intro tutorial for "How to Play"
            this.showIntroTutorial();
        });
        document.getElementById('menu-home-btn').addEventListener('click', () => {
            // Cleanup tutorial if active
            if (this.tutorialManager.isActive) {
                // DEBUG: console.log('🧹 Cleaning up tutorial before going home');
                this.tutorialManager.cleanup();
            }
            
            this.modals.hideMenu();
            if (window.homeScreen) {
                window.homeScreen.show();
            }
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.modals.showSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.modals.hideSettings());
        
        // Puzzle Builder
        document.getElementById('puzzle-builder-btn').addEventListener('click', () => this.modals.showBuilder());
        document.getElementById('builder-back-btn').addEventListener('click', () => this.modals.hideBuilder());
        
        this.solutionHelperToggle.addEventListener('change', (e) => {
            this.settings.solutionHelper = e.target.checked;
            this.game.storage.saveSettings(this.settings);
            this.updateSolutionHelperDescription(e.target.checked);
            
            if (this.settings.solutionHelper) {
                setTimeout(() => this.evaluateSolutionHelper(), 0);
            } else {
                this.clearSolutionHelper();
            }
        });
        
        this.themeSelector.addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.game.storage.saveSettings(this.settings);
            this.switchTheme(e.target.value);
        });
        
        this.testModeToggle.addEventListener('change', (e) => {
            this.settings.testMode = e.target.checked;
            this.game.storage.saveSettings(this.settings);
            
            // Update the current level's goal score immediately
            const config = getLevelConfig(this.game.level, this.settings.testMode);
            this.game.goalScore = config.goalScore;
            
            console.log(`🔧 Test Mode ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
            console.log(`   Goal score for Level ${this.game.level}: ${config.goalScore} points`);
            
            // Re-render to show new goal score
            this.render();
        });
        
        this.reverseTestOrderToggle.addEventListener('change', (e) => {
            this.settings.reverseTestOrder = e.target.checked;
            this.game.storage.saveSettings(this.settings);
            
            // Update DailyPuzzleManager if it exists
            if (window.dailyPuzzleManager) {
                window.dailyPuzzleManager.reverseOrder = e.target.checked;
                console.log(`🔄 Reverse Test Order ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                console.log(`   Next puzzle will load from ${e.target.checked ? 'END' : 'BEGINNING'} of untested puzzles`);
            }
        });
        
        // Test mode: Jump to level
        this.jumpToLevelBtn.addEventListener('click', async () => {
            // Cleanup tutorial if active
            if (this.tutorialManager.isActive) {
                // DEBUG: console.log('🧹 Cleaning up tutorial before jumping to level');
                this.tutorialManager.cleanup();
            }
            
            // Hide home screen if visible
            if (window.homeScreen && !document.getElementById('home-screen').classList.contains('hidden')) {
                // DEBUG: console.log('🏠 Hiding home screen before jumping to level');
                window.homeScreen.hide();
            }
            
            const targetLevel = parseInt(document.getElementById('level-selector').value);
            this.game.jumpToLevel(targetLevel);
            this.modals.hideMenu();
            this.render({ animate: true }); // Animate new level
            this.clearSolutionHelper();
            
            // Show tutorial for this level (if exists)
            await this.showTutorialForLevel(targetLevel);
        });
        
        // Clear game data
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('⚠️ Are you sure you want to clear all game data?\n\nThis will:\n• Reset your level to 1\n• Reset your score to 0\n• Clear all tutorial progress\n• Clear all settings\n\nThis action cannot be undone!')) {
                // Clear all localStorage
                localStorage.clear();
                console.log('🗑️ All game data cleared');
                
                // Reload the page to start fresh
                window.location.reload();
            }
        });
        
        // Pass confirmation modal
        document.getElementById('pass-cancel').addEventListener('click', () => this.modals.hidePassModal());
    }
    
    async handleGo() {
        // Check if tutorial is active - don't submit/score during tutorial
        if (this.tutorialManager.isActive) {
            this.tutorialManager.advanceOnSubmit();
            return; // Exit early - tutorial handles completion
        }
        
        const result = this.game.submitSolution();
        
        if (result.valid) {
            this.playSuccessAnimation(result.matchingCards);
            
            // In daily puzzle test mode, automatically load next puzzle after success
            if (this.game.mode === 'daily' && window.dailyPuzzleManager && window.dailyPuzzleManager.testMode) {
                console.log('✅ Solution correct! Loading next test puzzle...');
                // Quick animation out
                await Promise.all([
                    this.renderer.animateCardsOut(),
                    this.renderer.animateDiceOut(),
                    this.renderer.animateSolutionDiceOut()
                ]);
                // Load next puzzle
                window.dailyPuzzleManager.loadNextTestPuzzle();
                return;
            }
            
            // Normal game mode: show result modal and wait for user
            this.modals.showResult('Success!', result.message, result.points);
            await Promise.all([
                this.renderer.animateCardsOut(),
                this.renderer.animateDiceOut(),
                this.renderer.animateSolutionDiceOut()
            ]);
            // Don't render here - wait for user to click Continue
        } else {
            this.playErrorAnimation();
            this.playBonkSound();
            this.render(); // Re-render to clear invalid solution
        }
    }
    
    handleReset() {
        // Block reset during tutorial
        if (this.tutorialManager.isActive) {
            console.log('🎓 Tutorial active - Reset button disabled');
            return;
        }
        
        // Clear solution area
        this.game.clearSolution();
        
        // Clear all card dimming/exclusion states
        this.game.cardStates.forEach((state) => {
            state.dimmed = false;
            state.excluded = false;
        });
        
        // Clear solution helper and re-render
        this.clearSolutionHelper();
        this.render();
    }
    
    handlePass() {
        console.log('🔍 handlePass() called - checking for possible solution...');
        
        // Block pass during tutorial
        if (this.tutorialManager.isActive) {
            console.log('🎓 Tutorial active - Pass button disabled');
            return;
        }
        
        // Prevent duplicate processing
        if (this.isProcessingPass) {
            console.log('⚠️ Already processing Pass - ignoring duplicate click');
            return;
        }
        
        this.isProcessingPass = true;
        console.log('🔒 Set isProcessingPass = true');
        
        // Show "checking puzzle" modal immediately
        this.modals.showPassChecking();
        
        // Run check asynchronously to allow modal to render
        setTimeout(() => {
            try {
                const state = this.game.getState();
                
                const startTime = performance.now();
                const solutionExists = hasPossibleSolution(
                    state.cards,
                    state.dice,
                    state.goalCards
                );
                const endTime = performance.now();
                console.log(`⏱️ Solution check took ${(endTime - startTime).toFixed(2)}ms`);
                console.log(`📊 Solution exists: ${solutionExists}`);
                
                if (solutionExists) {
                    // Solution exists - show warning
                    console.log('⚠️ Showing pass warning modal');
                    this.modals.showPassWarning(
                        // onConfirm callback (pass anyway)
                        () => {
                            this.handleConfirmedPass();
                            this.isProcessingPass = false;
                            console.log('🔓 Set isProcessingPass = false (after confirmed pass)');
                        },
                        // onCancel callback (back to puzzle)
                        () => {
                            this.isProcessingPass = false;
                            console.log('🔓 Set isProcessingPass = false (after cancel)');
                        }
                    );
                } else {
                    // No solution exists - show confirmation (no points)
                    console.log('✅ No solution exists');
                    this.modals.showPassNoSolution(() => {
                        this.handleCorrectPass();
                        this.isProcessingPass = false;
                        console.log('🔓 Set isProcessingPass = false (after no solution)');
                    });
                }
            } catch (error) {
                console.error('❌ Error in handlePass:', error);
                this.modals.hidePassModal();
                this.isProcessingPass = false;
                console.log('🔓 Set isProcessingPass = false (after error)');
            }
        }, 100); // Small delay to let modal render
    }
    
    async handleCorrectPass() {
        // No points awarded, just reset the round
        this.game.correctPass();
        // Animate cards, dice, and solution dice out before rendering new round
        await Promise.all([
            this.renderer.animateCardsOut(),
            this.renderer.animateDiceOut(),
            this.renderer.animateSolutionDiceOut()
        ]);
        // Small delay to ensure clean transition
        await new Promise(resolve => setTimeout(resolve, 50));
        // Then render new round with entrance animations
        this.render({ animate: true });
        this.clearSolutionHelper();
        // Modal is already shown by handlePass(), no need to show result modal
    }
    
    async handleConfirmedPass() {
        this.game.pass();
        // Animate cards, dice, and solution dice out before rendering new round
        await Promise.all([
            this.renderer.animateCardsOut(),
            this.renderer.animateDiceOut(),
            this.renderer.animateSolutionDiceOut()
        ]);
        // Small delay to ensure clean transition
        await new Promise(resolve => setTimeout(resolve, 50));
        // Then render new round with entrance animations
        this.render({ animate: true });
        this.clearSolutionHelper();
    }
    
    // Next puzzle button removed - Go button now auto-loads next puzzle in test mode
    
    playSuccessAnimation(matchingCards) {
        matchingCards.forEach(index => {
            const card = this.cardsContainer.querySelector(`[data-index="${index}"]`);
            if (card) {
                card.classList.add('matched');
                setTimeout(() => card.classList.remove('matched'), 1000);
            }
        });
    }
    
    playErrorAnimation() {
        const rows = this.solutionArea.querySelectorAll('.solution-row');
        rows.forEach(row => {
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 300);
            
            const solutionDice = row.querySelectorAll('.solution-die');
            solutionDice.forEach(die => {
                die.classList.add('shake');
                setTimeout(() => die.classList.remove('shake'), 300);
            });
        });
    }
    
    playBonkSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 150;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    updateSolutionHelperDescription(isEnabled) {
        if (isEnabled) {
            this.solutionHelperDescription.textContent = 'Guided mode: automatically highlights cards that match your current solution.';
        } else {
            this.solutionHelperDescription.textContent = 'Advanced mode: manually tap cards to highlight and flip them to help visualize your solution.';
        }
    }
    
    switchTheme(themeName) {
        // Find the existing theme link
        const themeLink = document.querySelector('link[href*="/themes/"]');
        if (themeLink) {
            // Update the href to the new theme
            themeLink.href = `css/themes/${themeName}.css?v=4.0.2`;
        }
    }
    
    /**
     * Check if a solution row has valid syntax
     * @param {Array} dice - Array of dice sorted left-to-right
     * @returns {boolean} - True if syntax is valid
     */
    isSolutionSyntaxValid(dice) {
        if (dice.length === 0) return true;
        
        // Check for wild cubes without operator selection - these are invalid (incomplete)
        const hasIncompleteWild = dice.some(die => die.type === 'wild' && !die.selectedOperator);
        if (hasIncompleteWild) {
            return false;
        }
        
        // Binary operators (infix: operand → operator → operand)
        const binaryOperators = ['∪', '∩', '−', '=', '⊆'];
        // Postfix operators (operand → operator)
        const postfixOperators = ['′'];
        
        // Helper: Get effective value (for wild cubes, use selectedOperator)
        const getEffectiveValue = (die) => {
            if (die.type === 'wild' && die.selectedOperator) {
                return die.selectedOperator;
            }
            return die.value;
        };
        
        // Single die is valid only if it's an operand (not an operator)
        if (dice.length === 1) {
            const value = getEffectiveValue(dice[0]);
            return !binaryOperators.includes(value) && !postfixOperators.includes(value);
        }
        
        // Strategy: Treat "operand + optional postfix" as a single unit
        // Valid patterns:
        // - operand (with optional ′)
        // - operand (with optional ′) operator operand (with optional ′) ...
        
        let expectingOperand = true; // Start expecting an operand
        
        for (let i = 0; i < dice.length; i++) {
            const die = dice[i];
            const value = getEffectiveValue(die);
            const isBinaryOp = binaryOperators.includes(value);
            const isPostfixOp = postfixOperators.includes(value);
            
            if (expectingOperand) {
                // Should be an operand (color/set)
                if (isBinaryOp || isPostfixOp) {
                    return false; // Can't start with operator
                }
                // Check if next die is a postfix operator
                const nextDie = dice[i + 1];
                if (nextDie && postfixOperators.includes(getEffectiveValue(nextDie))) {
                    // Skip the postfix operator, it's part of this operand
                    i++;
                }
                expectingOperand = false; // Next should be binary operator (or end)
            } else {
                // Should be a binary operator
                if (!isBinaryOp) {
                    return false; // Expected binary operator, got something else
                }
                expectingOperand = true; // Next should be operand
            }
        }
        
        // Must end with an operand (not expecting an operator)
        return !expectingOperand;
    }
    
    evaluateSolutionHelper() {
        if (!this.settings.solutionHelper) {
            // console.log('Solution Helper: OFF');
            return;
        }
        
        // console.log('=== SOLUTION HELPER EVALUATION ===');
        
        // Sort dice by X position (left-to-right) before evaluation
        const restrictionRow = (this.game.solutions[0] || []).sort((a, b) => a.x - b.x);
        const setNameRow = (this.game.solutions[1] || []).sort((a, b) => a.x - b.x);
        
        // console.log('Restriction row (sorted L→R):', restrictionRow.map(d => d.value).join(' '));
        // console.log('Set name row (sorted L→R):', setNameRow.map(d => d.value).join(' '));
        
        // If both rows are empty, clear helper
        if (restrictionRow.length === 0 && setNameRow.length === 0) {
            // console.log('Both rows empty - clearing helper');
            // Force clear all card states
            this.game.cardStates.forEach((state) => {
                state.dimmed = false;
                state.excluded = false;
            });
            this.clearSolutionHelper();
            return;
        }
        
        // Determine which row has restriction and which has set name
        let restrictionRow_actual = null;
        let setNameRow_actual = null;
        
        if (hasRestriction(restrictionRow)) {
            restrictionRow_actual = restrictionRow;
            setNameRow_actual = setNameRow;
            // console.log('Restriction in row 0, set name in row 1');
        } else if (hasRestriction(setNameRow)) {
            restrictionRow_actual = setNameRow;
            setNameRow_actual = restrictionRow;
            // console.log('Restriction in row 1, set name in row 0');
        } else {
            // No restriction detected
            // If BOTH rows have content, this is invalid (can't have two set names)
            if (restrictionRow.length > 0 && setNameRow.length > 0) {
                // console.log('⚠️ Both rows have content but no restriction - treating as invalid');
                // Clear all card states and exit
                this.game.cardStates.forEach((state) => {
                    state.dimmed = false;
                    state.excluded = false;
                });
                this.clearSolutionHelper();
                return;
            }
            // Just one row with a regular set name
            setNameRow_actual = restrictionRow.length > 0 ? restrictionRow : setNameRow;
            // console.log('No restriction detected - single set name');
        }
        
        // Validate each row independently
        const restrictionValid = !restrictionRow_actual || this.isSolutionSyntaxValid(restrictionRow_actual);
        const setNameValid = !setNameRow_actual || this.isSolutionSyntaxValid(setNameRow_actual);
        
        // console.log('Validation:', { restrictionValid, setNameValid });
        
        const cards = this.cardsContainer.querySelectorAll('.card');
        
        // Store original user states
        cards.forEach((cardEl) => {
            if (!cardEl.dataset.helperActive) {
                cardEl.dataset.userDimmed = cardEl.classList.contains('dimmed') ? 'true' : 'false';
                cardEl.dataset.userExcluded = cardEl.classList.contains('excluded') ? 'true' : 'false';
                cardEl.dataset.helperActive = 'true';
            }
        });
        
        // STEP 1: Handle restriction (flips cards)
        let cardsToFlip = [];
        
        if (restrictionRow_actual && restrictionRow_actual.length > 0) {
            if (restrictionValid) {
                // console.log('Evaluating restriction:', restrictionRow_actual.map(d => d.value).join(' '));
                cardsToFlip = evaluateRestriction(restrictionRow_actual, this.game.cards);
                // console.log('Cards to flip from restriction:', cardsToFlip);
            } else {
                // console.log('❌ Restriction syntax invalid - clearing flips');
                // Clear only flips, not dimming
                this.game.cardStates.forEach((state) => {
                    state.excluded = false;
                });
            }
        }
        
        // STEP 2: Handle set name (dims cards)
        let matchingCards = new Set();
        
        if (setNameRow_actual && setNameRow_actual.length > 0) {
            if (setNameValid) {
                // console.log('Evaluating set name:', setNameRow_actual.map(d => d.value).join(' '));
                // Filter out flipped cards for set name evaluation
                const activeCardIndices = new Set(
                    this.game.cards.map((_, idx) => idx).filter(idx => 
                        !cardsToFlip.includes(idx) && !this.game.cardStates[idx].flipped
                    )
                );
                const activeCards = this.game.cards.filter((_, idx) => activeCardIndices.has(idx));
                
                // Evaluate set name against active (non-flipped) cards
                const matchingCardsRaw = evaluateExpression(setNameRow_actual, activeCards);
                
                // Map back to original card indices
                const activeCardsArray = Array.from(activeCardIndices);
                matchingCards = new Set(
                    Array.from(matchingCardsRaw).map(activeIdx => activeCardsArray[activeIdx])
                );
                // console.log('Matching cards from set name:', Array.from(matchingCards));
            } else {
                // console.log('❌ Set name syntax invalid - clearing dimming');
                // Clear only dimming, not flips
                this.game.cardStates.forEach((state) => {
                    state.dimmed = false;
                });
            }
        }
        
        // STEP 3: Apply visual states
        // Priority: Flipped (excluded) > Matches set name (bright) > Doesn't match set name (dimmed)
        // console.log('Applying visual states...');
        cards.forEach((cardEl, index) => {
            if (cardsToFlip.includes(index)) {
                // Flipped by restriction - highest priority (always shown as excluded)
                // console.log(`Card ${index}: FLIPPED (excluded by restriction)`);
                cardEl.classList.add('excluded');
                cardEl.classList.remove('dimmed');
                this.game.cardStates[index].excluded = true;
                this.game.cardStates[index].dimmed = false;
            } else if (setNameValid && setNameRow_actual && setNameRow_actual.length > 0) {
                // Set name is valid, apply dimming logic
                if (matchingCards.has(index)) {
                    // Matches set name - bright
                    // console.log(`Card ${index}: MATCHES set name (bright)`);
                    cardEl.classList.remove('dimmed', 'excluded');
                    this.game.cardStates[index].dimmed = false;
                    this.game.cardStates[index].excluded = false;
                } else {
                    // Doesn't match set name - dimmed
                    // console.log(`Card ${index}: Does NOT match set name (dimmed)`);
                    cardEl.classList.add('dimmed');
                    cardEl.classList.remove('excluded');
                    this.game.cardStates[index].dimmed = true;
                    this.game.cardStates[index].excluded = false;
                }
            } else {
                // No valid set name - all cards bright (unless already handled by restriction)
                // console.log(`Card ${index}: No valid set name (bright)`);
                cardEl.classList.remove('dimmed', 'excluded');
                this.game.cardStates[index].dimmed = false;
                this.game.cardStates[index].excluded = false;
            }
        });
        
        // console.log('=== END SOLUTION HELPER ===\n');
    }
    
    clearSolutionHelper() {
        const cards = this.cardsContainer.querySelectorAll('.card');
        cards.forEach((cardEl, index) => {
            if (cardEl.dataset.helperActive) {
                const userDimmed = cardEl.dataset.userDimmed === 'true';
                const userExcluded = cardEl.dataset.userExcluded === 'true';
                
                // Update DOM
                if (userDimmed) {
                    cardEl.classList.add('dimmed');
                } else {
                    cardEl.classList.remove('dimmed');
                }
                
                if (userExcluded) {
                    cardEl.classList.add('excluded');
                } else {
                    cardEl.classList.remove('excluded');
                }
                
                // Update game state to match
                this.game.cardStates[index].dimmed = userDimmed;
                this.game.cardStates[index].excluded = userExcluded;
                
                delete cardEl.dataset.helperActive;
                delete cardEl.dataset.userDimmed;
                delete cardEl.dataset.userExcluded;
            }
        });
    }
    
    updateTimer(timeRemaining) {
        // Defensive check - elements might not be initialized yet
        if (!this.timerValue) {
            console.warn('Timer value element not initialized yet');
            return;
        }
        
        // Update timer display
        this.timerValue.textContent = timeRemaining;
        
        // Show warning color when time is running low (< 30 seconds)
        if (timeRemaining <= 30 && timeRemaining > 0) {
            this.timerDisplay.style.borderColor = '#f0ad4e'; // Orange warning
        } else if (timeRemaining <= 10 && timeRemaining > 0) {
            this.timerDisplay.style.borderColor = '#d9534f'; // Red danger
        } else {
            this.timerDisplay.style.borderColor = 'var(--color-blue)'; // Normal blue
        }
    }
    
    handleTimeout() {
        console.log('⏰ Timeout handled in UI');
        
        // Show timeout modal
        this.modals.showTimeout(() => {
            // Generate new round when user clicks OK
            this.game.resetRound();
            this.render({ animate: true }); // Animate new round
            this.clearSolutionHelper();
        });
    }
    
    render(options = {}) {
        // Track render frequency for debugging
        if (!window._renderCount) window._renderCount = 0;
        if (!window._lastRenderTime) window._lastRenderTime = Date.now();
        window._renderCount++;
        const now = Date.now();
        const timeSinceLastRender = now - window._lastRenderTime;
        console.log(`🎨 RENDER #${window._renderCount} (${timeSinceLastRender}ms since last render)`);
        window._lastRenderTime = now;
        
        const state = this.game.getState();
        
        // Enable entrance animations if requested
        if (options.animate) {
            this.renderer.shouldAnimate = true;
        }
        
        // Show/hide timer display based on level config (Level 7+)
        // Never show timer for daily puzzles
        if (this.game.mode === 'daily') {
            this.timerDisplay.style.display = 'none';
        } else {
            const config = getLevelConfig(this.game.level, this.settings.testMode);
            if (config && config.timeLimit) {
                this.timerDisplay.style.display = 'flex';
                // If timer isn't running, show the initial time
                if (this.game.timeRemaining === null) {
                    this.timerValue.textContent = config.timeLimit;
                }
            } else {
                this.timerDisplay.style.display = 'none';
            }
        }
        
        // Show puzzle ID for daily puzzles (helps with testing/screenshots)
        if (this.game.mode === 'daily' && this.game.dailyPuzzle && this.game.dailyPuzzle.puzzleId) {
            this.puzzleIdDisplay.style.display = 'flex';
            this.puzzleIdValue.textContent = `#${this.game.dailyPuzzle.puzzleId}`;
        } else {
            this.puzzleIdDisplay.style.display = 'none';
        }
        
        // Next button removed - Go button now auto-loads next puzzle in test mode
        
        // Update status bar
        this.renderer.updateStatusBar(
            this.currentScoreEl,
            this.goalScoreEl,
            this.goalCardsEl,
            state
        );
        
        // Render cards
        this.renderer.renderCards(this.cardsContainer, state.cards, state.cardStates);
        
        // Render dice
        this.renderer.renderDice(this.diceContainer, state.dice, state.solutions);
        
        // Reset animation flag after rendering
        this.renderer.shouldAnimate = false;
        
        // Render solutions
        this.renderer.renderSolutions(this.solutionArea, state.solutions, state.restrictionsEnabled);
        
        // Set up wild cube click listeners
        this.setupWildCubeListeners();
    }
    
    /**
     * Set up click listeners for wild cubes in the solution area
     */
    setupWildCubeListeners() {
        // Clear all existing timers from previous renders
        if (this.wildCubeTimers) {
            this.wildCubeTimers.forEach(timer => clearTimeout(timer));
        }
        this.wildCubeTimers = [];
        
        // Find all wild cubes in solution area
        const wildCubes = this.solutionArea.querySelectorAll('.solution-die.wild');
        // DEBUG: console.log('🔍 Setting up wild cube listeners, found:', wildCubes.length, 'wild cubes');
        
        wildCubes.forEach(dieEl => {
            // Manual double-click detection that works on both desktop and mobile
            let clickTimer = null;
            let lastClickTime = 0;
            let lastEventTime = 0; // Track when we last processed an event
            const DOUBLE_CLICK_THRESHOLD = 250; // ms
            const DUPLICATE_EVENT_THRESHOLD = 50; // ms - ignore events within 50ms of each other
            
            const handleWildCubeClick = (e) => {
                e.preventDefault(); // Prevent any default behavior
                e.stopPropagation(); // Stop event from bubbling
                
                const currentTime = Date.now();
                
                // Prevent processing duplicate events (touch + click) for same interaction
                if (currentTime - lastEventTime < DUPLICATE_EVENT_THRESHOLD) {
                    // DEBUG: console.log('🚫 Ignoring duplicate event');
                    return;
                }
                lastEventTime = currentTime;
                
                const timeSinceLastClick = currentTime - lastClickTime;
                
                // DEBUG: console.log('🖱️ Wild cube clicked!', timeSinceLastClick, 'ms since last click');
                
                // If second click within threshold, remove the cube
                if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && timeSinceLastClick > 0) {
                    // DEBUG: console.log('🖱️🖱️ Double-click detected - removing cube');
                    
                    // Clear any pending single-click timer
                    if (clickTimer) {
                        clearTimeout(clickTimer);
                        clickTimer = null;
                    }
                    
                    // Hide wild cube popover if it's open
                    this.wildCubeManager.hide();
                    
                    // Remove the die directly
                    const row = dieEl.closest('.solution-row');
                    const rowIndex = parseInt(row.dataset.row);
                    const dieId = dieEl.dataset.id;
                    const dieIndex = this.game.solutions[rowIndex].findIndex(d => d.id === dieId);
                    
                    if (dieIndex !== -1) {
                        this.game.removeDieFromSolution(rowIndex, dieIndex);
                        this.evaluateSolutionHelper();
                        this.render();
                    }
                    
                    // Reset click time
                    lastClickTime = 0;
                    return;
                }
                
                // First click - start timer to show popover if no second click
                lastClickTime = currentTime;
                
                // Clear any existing timer
                if (clickTimer) {
                    clearTimeout(clickTimer);
                }
                
                // Wait for potential second click
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    
                    // This is a confirmed single-click - show popover
                    const rowIndex = parseInt(dieEl.closest('.solution-row').dataset.row);
                    const dieIndex = parseInt(dieEl.dataset.index);
                    // DEBUG: console.log('   Single-click confirmed - showing popover');
                    this.wildCubeManager.show(dieEl, rowIndex, dieIndex);
                }, DOUBLE_CLICK_THRESHOLD);
                
                // Track this timer so we can clear it on next render
                this.wildCubeTimers.push(clickTimer);
            };
            
            // Handle both click (desktop) and touchend (mobile)
            dieEl.addEventListener('click', handleWildCubeClick);
            dieEl.addEventListener('touchend', handleWildCubeClick);
        });
    }
    
    /**
     * Show wild cube popover by rowIndex and dieIndex (for auto-show on drop)
     */
    showWildCubePopoverByIndex(rowIndex, dieIndex) {
        // DEBUG: console.log('🎯 showWildCubePopoverByIndex called:', rowIndex, dieIndex);
        // Use requestAnimationFrame to ensure render is complete, then find element
        requestAnimationFrame(() => {
            const row = this.solutionArea.querySelector(`.solution-row[data-row="${rowIndex}"]`);
            if (row) {
                const dieEl = row.querySelector(`.solution-die[data-index="${dieIndex}"]`);
                // DEBUG: console.log('   Found die element?', !!dieEl);
                if (dieEl) {
                    // Small delay to ensure DOM is fully painted
                    setTimeout(() => {
                        // DEBUG: console.log('   Showing popover now');
                        this.wildCubeManager.show(dieEl, rowIndex, dieIndex);
                    }, 10); // Minimal delay just for DOM paint
                } else {
                    console.log('   ❌ Die element not found in DOM!'); // KEEP: Error condition
                }
            } else {
                console.log('   ❌ Row not found in DOM!'); // KEEP: Error condition
            }
        });
    }
    
    async showIntroTutorial() {
        // Load and start the intro tutorial
        console.log('📚 Starting intro tutorial'); // KEEP: Important action
        
        // Reset game state for clean tutorial experience
        this.game.score = 0;
        this.game.stopTimer(); // Stop any running timer
        this.game.timeRemaining = null; // Clear timer display
        
        const { getTutorialScenario } = await import('../tutorialScenarios.js');
        const introScenario = getTutorialScenario('intro');
        
        if (introScenario) {
            this.tutorialManager.start(introScenario);
        } else {
            console.error('❌ Intro tutorial scenario not found!');
        }
    }
    
    async showFirstTimeInterstitial() {
        // Show Level 1 interstitial and wait for tutorial choice
        const wantsTutorial = await this.modals.showInterstitialAsync(1);
        
        if (wantsTutorial) {
            // Start interactive tutorial
            const { getTutorialScenario } = await import('../tutorialScenarios.js');
            const tutorialScenario = getTutorialScenario(1);
            if (tutorialScenario) {
                this.tutorialManager.start(tutorialScenario);
                
                // Mark tutorial as viewed (COMMENTED OUT FOR TESTING)
                // TODO: Uncomment this after testing complete
                // this.game.storage.markTutorialAsViewed(1);
            }
        } else {
            // User declined tutorial
            // Mark as viewed so they don't see it again (COMMENTED OUT FOR TESTING)
            // TODO: Uncomment this after testing complete
            // this.game.storage.markTutorialAsViewed(1);
        }
        // If they decline, just continue with normal gameplay (already rendered)
    }
    
    async showTutorialForLevel(level) {
        // Check if a tutorial exists for this level
        const { getTutorialScenario } = await import('../tutorialScenarios.js');
        const tutorialScenario = getTutorialScenario(level);
        
        if (!tutorialScenario) {
            console.log(`🎓 No tutorial available for Level ${level}`);
            return;
        }
        
        console.log(`🎓 Showing tutorial for Level ${level}`);
        
        // Show interstitial and wait for user choice
        const wantsTutorial = await this.modals.showInterstitialAsync(level);
        
        if (wantsTutorial) {
            // Start interactive tutorial
            this.tutorialManager.start(tutorialScenario);
            
            // Mark tutorial as viewed (COMMENTED OUT FOR TESTING)
            // TODO: Uncomment this after testing complete
            // this.game.storage.markTutorialAsViewed(level);
        } else {
            // User declined tutorial
            // Mark as viewed so they don't see it again (COMMENTED OUT FOR TESTING)
            // TODO: Uncomment this after testing complete
            // this.game.storage.markTutorialAsViewed(level);
        }
    }
}
