// Main UI controller - coordinates rendering, modals, and interactions

import { UIRenderer } from './UIRenderer.js';
import { DragDropHandler } from './DragDropHandler.js';
import { ModalManager } from './ModalManager.js';
import { WildCubeManager } from './WildCubeManager.js';
import { PuzzleBuilderManager } from './PuzzleBuilderManager.js';
import { TutorialManager } from './TutorialManager.js';
import { AppStateManager } from './AppStateManager.js';
import { UI_VIEWS, GAMEPLAY_MODES, MODALS } from '../constants.js';
import { evaluateExpression, hasRestriction, evaluateRestriction } from '../setTheory.js';
import { hasPossibleSolution } from '../solutionFinder.js';
import { getLevelConfig } from '../levels.js';
import { isSolutionSyntaxValid } from '../utils/validation.js';

export class UIController {
    constructor(game, onUpdate) {
        this.game = game;
        this.onUpdate = onUpdate;
        
        // Initialize state manager first
        this.stateManager = new AppStateManager();
        
        // Listen to state changes
        this.stateManager.on('stateChanged', this.handleStateChange.bind(this));
        
        // Initialize sub-components
        this.tutorialManager = new TutorialManager(game, this);
        this.renderer = new UIRenderer(game, this.tutorialManager);
        this.modals = new ModalManager(game);
        this.wildCubeManager = new WildCubeManager(game, () => {
            this.evaluateSolutionHelper(); // Update game state before render
            this.render();
        });
        this.builderManager = new PuzzleBuilderManager(game, this);
        
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
        
        // Timer callbacks are wired up in main.js via TimerManager
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
        
        this.dailyTestModeToggle = document.getElementById('daily-test-mode-toggle');
        // Load from DailyPuzzleManager if it exists (it's initialized before UIController)
        if (window.dailyPuzzleManager) {
            this.dailyTestModeToggle.checked = window.dailyPuzzleManager.testMode;
        }
        
        this.themeSelector = document.getElementById('theme-selector');
        this.themeSelector.value = this.settings.theme || 'default';
        // Apply saved theme on load
        this.switchTheme(this.settings.theme || 'default');
        
        // Test mode
        this.jumpToLevelBtn = document.getElementById('jump-to-level-btn');
    }
    
    /**
     * Clean up any active overlays/screens before transitioning to a new view
     * This centralizes the logic for hiding interstitials, tutorials, etc.
     */
    initEventListeners() {
        // Card clicks (for note-taking)
        this.cardsContainer.addEventListener('click', (e) => {
            // Don't allow manual card clicks when Solution Helper is ON
            // Solution Helper automatically manages card dimming/flipping
            if (this.settings.solutionHelper) {
                return;
            }
            
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
            this.stateManager.openModal(MODALS.MENU);
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
        document.getElementById('menu-close-btn').addEventListener('click', () => this.stateManager.closeModal());
        document.getElementById('refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.stateManager.setState({ 
                view: UI_VIEWS.GAMEPLAY, 
                mode: GAMEPLAY_MODES.TUTORIAL,
                modal: null 
            });
            this.showIntroTutorial('menu-during-gameplay');
        });
        document.getElementById('menu-home-btn').addEventListener('click', () => {
            this.stateManager.setState({ 
                view: UI_VIEWS.HOME,
                mode: null,  // Clear gameplay mode when returning to home
                modal: null 
            });
        });
        
        // Settings (part of menu modal, not a separate modal)
        document.getElementById('settings-btn').addEventListener('click', () => this.modals.showSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.modals.hideSettings());
        
        // Scoring Guide (part of menu modal, not a separate modal)
        document.getElementById('scoring-btn').addEventListener('click', () => this.modals.showScoring());
        document.getElementById('scoring-back-btn').addEventListener('click', () => this.modals.hideSettings());
        
        // About (part of menu modal, not a separate modal)
        document.getElementById('about-btn').addEventListener('click', () => this.modals.showAbout());
        document.getElementById('about-back-btn').addEventListener('click', () => this.modals.hideSettings());
        
        // Puzzle Builder (part of menu modal, not a separate modal)
        document.getElementById('puzzle-builder-btn').addEventListener('click', () => {
            this.modals.showBuilder();
        });
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
        
        this.dailyTestModeToggle.addEventListener('change', (e) => {
            // Update DailyPuzzleManager if it exists
            if (window.dailyPuzzleManager) {
                window.dailyPuzzleManager.setTestMode(e.target.checked);
            }
        });
        
        // Test mode: Jump to level
        this.jumpToLevelBtn.addEventListener('click', async () => {
            // Exit daily mode if active (ensures proper mode state)
            if (this.game.mode === 'daily') {
                this.game.enterRegularMode();
            }
            
            // Stop any active timer (will be restarted after tutorial/interstitial)
            this.game.timer.stop(true);
            
            const targetLevel = parseInt(document.getElementById('level-selector').value);
            this.game.jumpToLevel(targetLevel);
            
            // Transition to level interstitial
            this.stateManager.setState({ 
                view: UI_VIEWS.LEVEL_INTERSTITIAL,
                modal: null,
                data: { level: targetLevel }
            });
            
            this.render({ animate: true }); // Animate new level
            this.clearSolutionHelper();
            
            // Show tutorial for this level (if exists)
            await this.showTutorialForLevel(targetLevel);
        });
        
        // Clear today's daily puzzle
        document.getElementById('clear-daily-puzzle-btn').addEventListener('click', () => {
            if (window.dailyPuzzleManager) {
                window.dailyPuzzleManager.clearTodayCompletion();
                alert('✅ Today\'s puzzle has been cleared!\n\nYou can now play it again.');
            } else {
                console.error('❌ DailyPuzzleManager not initialized');
            }
        });
        
        // Reset Free Play stats
        document.getElementById('reset-free-play-btn').addEventListener('click', () => {
            if (confirm('⚠️ Are you sure you want to reset your Free Play stats?\n\nThis will:\n• Reset your Free Play score to 0\n• Reset your Free Play puzzles solved to 0\n\nThis action cannot be undone!')) {
                this.game.resetFreePlayStats();
                alert('✅ Free Play stats have been reset!');
            }
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
    
    /**
     * Handle state changes - orchestrate UI transitions
     * This is called whenever app state changes via AppStateManager
     */
    handleStateChange({ from, to }) {
        console.log('🎭 UIController handling state change:', { from, to });
        
        // Determine what changed
        const viewChanged = from.view !== to.view;
        const modeChanged = from.mode !== to.mode;
        const modalChanged = from.modal !== to.modal;
        
        // Only exit/enter primary view if view or mode changed
        if (viewChanged || modeChanged) {
            this.exitState(from);
            this.enterState(to);
        }
        
        // Handle modal changes separately (they overlay, don't replace views)
        if (modalChanged) {
            // Close old modal if there was one
            if (from.modal) {
                this.closeModalByName(from.modal);
            }
            
            // Open new modal if there is one
            if (to.modal) {
                this.openModalByName(to.modal);
            }
        }
    }
    
    /**
     * Exit a state - cleanup logic
     */
    exitState(state) {
        const { view, mode, modal } = state;
        
        console.log(`🚪 Exiting state: view=${view}, mode=${mode}, modal=${modal}`);
        
        // Cleanup based on view
        switch (view) {
            case UI_VIEWS.HOME:
                if (window.homeScreen) {
                    window.homeScreen.hide();
                }
                break;
                
            case UI_VIEWS.LEVEL_INTERSTITIAL:
                this.modals.hideInterstitial();
                break;
                
            case UI_VIEWS.DAILY_INTRO:
                this.modals.hideDailyPuzzleInterstitial();
                break;
                
            case UI_VIEWS.DAILY_RESULT:
                this.modals.hideDailyPuzzleResult();
                break;
                
            case UI_VIEWS.GAMEPLAY:
                // Cleanup tutorials if active
                if (this.tutorialManager.isActive) {
                    this.tutorialManager.cleanup();
                }
                // If exiting gameplay with tutorial or daily mode, restore regular game state
                if (mode === GAMEPLAY_MODES.TUTORIAL || mode === GAMEPLAY_MODES.DAILY) {
                    console.log(`🧹 Exiting ${mode} mode - will restore regular game on next gameplay entry`);
                    // Clear daily puzzle reference if exiting daily mode
                    if (mode === GAMEPLAY_MODES.DAILY) {
                        this.game.dailyPuzzle = null;
                    }
                }
                break;
        }
        
        // Cleanup modals
        if (modal) {
            switch (modal) {
                case MODALS.MENU:
                    this.modals.hideMenu();
                    break;
                case MODALS.SETTINGS:
                    this.modals.hideSettings();
                    break;
                case MODALS.PASS:
                    this.modals.hidePassModal();
                    break;
                case MODALS.RESULT:
                    this.modals.hideResult();
                    break;
                case MODALS.TIMEOUT:
                    this.modals.hideTimeout();
                    break;
                case MODALS.PUZZLE_BUILDER:
                    this.modals.hideBuilder();
                    break;
            }
        }
    }
    
    /**
     * Enter a state - setup logic
     */
    enterState(state) {
        const { view, mode, modal, data } = state;
        
        console.log(`🚪 Entering state: view=${view}, mode=${mode}, modal=${modal}`, data);
        
        // Setup based on view
        switch (view) {
            case UI_VIEWS.HOME:
                if (window.homeScreen) {
                    window.homeScreen.show();
                }
                break;
                
            case UI_VIEWS.LEVEL_INTERSTITIAL:
                // Interstitial showing is handled by showTutorialForLevel()
                // (which populates content and displays it)
                break;
                
            case UI_VIEWS.DAILY_INTRO:
                // Daily intro showing is handled by DailyPuzzleManager
                break;
                
            case UI_VIEWS.DAILY_RESULT:
                // Daily result showing is handled by DailyPuzzleManager
                break;
                
            case UI_VIEWS.GAMEPLAY:
                // Mode-specific setup
                if (mode === GAMEPLAY_MODES.REGULAR) {
                    this.game.enterRegularMode();
                    this.render({ animate: true });
                    this.game.timer.startFresh();
                } else if (mode === GAMEPLAY_MODES.TUTORIAL) {
                    // Tutorial setup is handled by TutorialManager
                } else if (mode === GAMEPLAY_MODES.DAILY) {
                    // Daily setup is handled by DailyPuzzleManager
                }
                break;
        }
    }
    
    /**
     * Open a modal by name (helper for state manager)
     */
    openModalByName(modalName) {
        console.log(`🪟 Opening modal: ${modalName}`);
        
        switch (modalName) {
            case MODALS.MENU:
                this.modals.showMenu();
                break;
            case MODALS.PASS:
                this.modals.showPassModal();
                break;
            case MODALS.RESULT:
                // Result modal is shown by game logic, not directly
                break;
            case MODALS.TIMEOUT:
                // Timeout modal is shown by timer, not directly
                break;
        }
    }
    
    /**
     * Close a modal by name (helper for state manager)
     */
    closeModalByName(modalName) {
        console.log(`🪟 Closing modal: ${modalName}`);
        
        switch (modalName) {
            case MODALS.MENU:
                this.modals.hideMenu();
                break;
            case MODALS.PASS:
                this.modals.hidePassModal();
                break;
            case MODALS.RESULT:
                this.modals.hideResult();
                break;
            case MODALS.TIMEOUT:
                this.modals.hideTimeout();
                break;
        }
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
            
            // Daily puzzle mode: show result modal with share option
            if (this.game.mode === 'daily' && window.dailyPuzzleManager) {
                console.log('✅ Daily puzzle solved!');
                
                // Count cubes used in solution
                const cubeCount = (this.game.solutions[0] || []).length + (this.game.solutions[1] || []).length;
                
                // Prepare result data
                const dailyResult = {
                    puzzleId: this.game.dailyPuzzle.puzzleId,
                    score: result.points,
                    cubes: cubeCount,
                    solution: {
                        topRow: this.game.solutions[0] || [],
                        bottomRow: this.game.solutions[1] || []
                    }
                };
                
                // Mark puzzle as complete in non-test mode
                if (window.dailyPuzzleManager && !window.dailyPuzzleManager.testMode) {
                    window.dailyPuzzleManager.markPuzzleComplete(dailyResult);
                }
                
                // Show daily puzzle result modal (with cards/dice still visible behind)
                this.modals.showDailyPuzzleResult(dailyResult, async () => {
                    // After user clicks Done, animate out
                    await Promise.all([
                        this.renderer.animateCardsOut(),
                        this.renderer.animateDiceOut(),
                        this.renderer.animateSolutionDiceOut()
                    ]);
                    
                    if (window.dailyPuzzleManager.testMode) {
                        // In test mode, load another random puzzle
                        window.dailyPuzzleManager.startDailyPuzzle();
                    } else {
                        // In production, return to home screen
                        // Mode transition happens when user chooses Continue or Daily Puzzle
                        if (window.homeScreen) {
                            window.homeScreen.show();
                        }
                    }
                });
                
                return;
            }
            
            // Check if this completes level 10 (end game)
            const completesGame = this.game.level === 10 && this.game.canAdvanceLevel();
            
            if (completesGame) {
                console.log('🏆 Level 10 completed! Skipping result modal, going to end-game screen');
                
                // Stop timer immediately
                if (this.game.timer) {
                    console.log('⏱️ Stopping timer for end-game screen');
                    this.game.timer.stop(true);
                }
                
                // Animate everything out
                await Promise.all([
                    this.renderer.animateCardsOut(),
                    this.renderer.animateDiceOut(),
                    this.renderer.animateSolutionDiceOut()
                ]);
                
                // Show end-game screen directly
                this.modals.showEndGameScreen();
            } else {
                // Normal game mode: show result modal and wait for user
                this.modals.showResult('Success!', result.message, result.points);
                await Promise.all([
                    this.renderer.animateCardsOut(),
                    this.renderer.animateDiceOut(),
                    this.renderer.animateSolutionDiceOut()
                ]);
                // Don't render here - wait for user to click Continue
            }
        } else {
            this.playErrorAnimation();
            this.playBonkSound();
            this.render(); // Re-render to clear invalid solution
        }
    }
    
    // ========== TIMER CONTROL (via TimerManager) ==========
    
    handleContinueFromHome() {
        const savedState = this.game.storage.loadGameState();
        
        if (savedState && savedState.timeRemaining) {
            // Restore timer from saved state
            this.game.timer.restoreFromSave({
                timeRemaining: savedState.timeRemaining,
                timerDuration: savedState.timerDuration
            });
        } else {
            // No saved timer - start fresh if level needs one
            this.game.timer.startFresh();
        }
    }
    
    handleTutorialComplete() {
        // Start fresh timer after tutorial
        this.game.timer.startFresh();
    }
    
    handleLevelAdvanced() {
        // Start fresh timer after leveling up
        this.game.timer.startFresh();
    }
    
    handleNewRoundAfterSubmit() {
        // Start fresh timer after submitting
        this.game.timer.startFresh();
    }
    
    // ========== END TIMER CONTROL ==========
    
    handleReset() {
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
        
        // Render new round with entrance animations
        this.render({ animate: true });
        this.clearSolutionHelper();
        
        // Start fresh timer for new round
        this.game.timer.startFresh();
        
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
        
        // Render new round with entrance animations
        this.render({ animate: true });
        this.clearSolutionHelper();
        
        // Start fresh timer for new round
        this.game.timer.startFresh();
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
            // Update the href to the new theme with dynamic cache busting
            const cacheBust = window.cacheBust || Date.now();
            themeLink.href = `css/themes/${themeName}.css?v=${cacheBust}`;
        }
    }
    
    /**
     * Check if a solution row has valid syntax
     * @param {Array} dice - Array of dice sorted left-to-right
     * @returns {boolean} - True if syntax is valid
     */
    isSolutionSyntaxValid(dice) {
        // Use shared validation utility (no sorting needed - dice are already sorted)
        return isSolutionSyntaxValid(dice, false);
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
        
        // Check if tutorial is active
        const tutorialActive = this.game.isTutorialActive;
        console.log('  - tutorialActive:', tutorialActive);
        console.log('  - this.tutorialManager exists:', !!this.tutorialManager);
        console.log('  - tutorialManager.isActive:', this.tutorialManager?.isActive);
        
        // Show timeout modal
        this.modals.showTimeout(() => {
            console.log('⏰ Timeout modal OK clicked');
            console.log('  - tutorialActive (captured):', tutorialActive);
            console.log('  - this.tutorialManager exists:', !!this.tutorialManager);
            
            // If tutorial was active, end it first
            if (tutorialActive && this.tutorialManager) {
                console.log('🎓 Ending tutorial due to timeout');
                this.tutorialManager.cleanup();
                // cleanup() handles hiding tutorial UI
            } else {
                console.log('⚠️ Tutorial NOT active or tutorialManager missing');
            }
            
            // Generate new round when user clicks OK
            this.game.resetRound();
            this.render({ animate: true }); // Animate new round
            this.clearSolutionHelper();
        }, tutorialActive); // Pass flag to modal for custom message
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
        // Never show timer for daily puzzles or Free Play
        if (this.game.mode === 'daily' || this.game.mode === 'freeplay') {
            this.timerDisplay.style.display = 'none';
        } else {
            const config = getLevelConfig(this.game.level, this.settings.testMode);
            if (config && config.timeLimit) {
                this.timerDisplay.style.display = 'flex';
                // If timer isn't running, show the initial time
                if (this.game.timer && this.game.timer.timeRemaining === null) {
                    this.timerValue.textContent = config.timeLimit;
                }
            } else {
                this.timerDisplay.style.display = 'none';
            }
        }
        
        // Show puzzle ID for daily puzzles (helps with testing/screenshots)
        // Hide during tutorials regardless of mode
        if (this.tutorialManager.isActive) {
            this.puzzleIdDisplay.style.display = 'none';
        } else if (this.game.mode === 'daily' && this.game.dailyPuzzle && this.game.dailyPuzzle.puzzleId) {
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
        
        // Set data attribute to indicate if Solution Helper is active
        // This allows CSS to change cursor and visual feedback
        this.cardsContainer.dataset.solutionHelper = this.settings.solutionHelper ? 'true' : 'false';
        
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
                
                // If there was an active drag that moved, ignore this click
                // Let handleSolutionDragEnd process the reposition first
                if (this.dragDropHandler && this.dragDropHandler.isDragging) {
                    const wasDragging = this.dragDropHandler.hasMoved;
                    // If hasMoved was true, this was a real drag - don't treat as click
                    // DON'T reset drag state here - handleSolutionDragEnd needs it!
                    if (wasDragging) {
                        console.log('🔄 Wild cube click handler: skipping (was a drag, letting handleSolutionDragEnd process)');
                        return;
                    }
                    // Only reset if it wasn't a real drag (just a tap)
                    console.log('🔄 Wild cube click handler: resetting drag state (was just a tap)');
                    this.dragDropHandler.resetDragState();
                }
                
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
    
    async showIntroTutorial(entryPoint = 'home-screen') {
        // Load and start the intro tutorial
        console.log('📚 Starting intro tutorial'); // KEEP: Important action
        
        // Reset game state for clean tutorial experience
        this.game.score = 0;
        if (this.game.timer) {
            this.game.timer.stop(false); // Pause timer (keep data for restoration)
        }
        
        const { getTutorialScenario } = await import('../tutorialScenarios.js');
        const introScenario = getTutorialScenario('intro');
        
        if (introScenario) {
            this.tutorialManager.start(introScenario, entryPoint);
        } else {
            console.error('❌ Intro tutorial scenario not found!');
        }
    }
    
    async showFirstTimeInterstitial() {
        // Show Level 1 interstitial and wait for tutorial choice
        const wantsTutorial = await this.modals.showInterstitialAsync(1);
        
        if (wantsTutorial) {
            // Start intro tutorial (used for both Level 1 and menu access)
            const { getTutorialScenario } = await import('../tutorialScenarios.js');
            const tutorialScenario = getTutorialScenario('intro');
            if (tutorialScenario) {
                this.tutorialManager.start(tutorialScenario, 'level-interstitial');
                
                // Mark tutorial as viewed
                this.game.storage.markTutorialAsViewed(1);
            }
        } else {
            // User declined tutorial - mark as viewed so they don't see it again
            this.game.storage.markTutorialAsViewed(1);
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
        
        console.log(`🎓 Showing level ${level} interstitial`);
        
        // Show interstitial and wait for user choice
        const wantsTutorial = await this.modals.showInterstitialAsync(level);
        
        if (wantsTutorial) {
            // Transition to tutorial mode
            this.stateManager.setState({
                view: UI_VIEWS.GAMEPLAY,
                mode: GAMEPLAY_MODES.TUTORIAL
            });
            
            // Level 1 uses the intro tutorial, other levels use their own
            const scenarioKey = level === 1 ? 'intro' : level;
            const tutorialToShow = getTutorialScenario(scenarioKey);
            
            if (tutorialToShow) {
                this.tutorialManager.start(tutorialToShow, 'level-interstitial');
                // Timer will be started when tutorial completes (in TutorialManager.complete())
                
                // Mark tutorial as viewed
                this.game.storage.markTutorialAsViewed(level);
            }
        } else {
            // User declined tutorial - transition to regular gameplay
            this.stateManager.setState({
                view: UI_VIEWS.GAMEPLAY,
                mode: GAMEPLAY_MODES.REGULAR
            });
            
            // Start timer now
            this.game.timer.startFresh();
            
            // Mark as viewed so they don't see it again
            this.game.storage.markTutorialAsViewed(level);
        }
    }
}
