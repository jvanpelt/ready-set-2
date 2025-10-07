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
            this.render();
            this.evaluateSolutionHelper(); // Update cards after wild cube selection
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
                this.render();
                this.evaluateSolutionHelper();
            },
            (rowIndex, dieIndex) => {
                // Auto-show popover when wild cube is dropped
                this.showWildCubePopoverByIndex(rowIndex, dieIndex);
            },
            this.tutorialManager // Pass tutorial manager for drag restrictions
        );
        
        // Wire up timer callbacks (Level 7+)
        this.game.onTimerTick = (timeRemaining) => {
            console.log('⏱️ Timer tick callback:', timeRemaining);
            this.updateTimer(timeRemaining);
        };
        this.game.onTimeout = () => this.handleTimeout();
        
        // If timer is already running (restored from saved state), trigger immediate update
        if (this.game.timeRemaining !== null) {
            console.log('⏱️ Timer already running on init, remaining:', this.game.timeRemaining);
            console.log('   Timer interval active?', this.game.timerInterval !== null);
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
        this.currentLevelEl = document.getElementById('current-level');
        this.goalCardsEl = document.getElementById('goal-cards');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerValue = document.getElementById('timer-value');
        
        // Control buttons
        this.goBtn = document.getElementById('go-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.menuBtn = document.getElementById('menu-btn');
        
        // Settings
        this.solutionHelperToggle = document.getElementById('solution-helper-toggle');
        this.solutionHelperToggle.checked = this.settings.solutionHelper;
        
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
        
        // Control buttons with debug logging
        this.goBtn.addEventListener('click', () => {
            console.log('🎯 GO button clicked');
            this.handleGo();
        });
        this.goBtn.addEventListener('mouseup', () => console.log('🖱️ GO mouseup'));
        this.goBtn.addEventListener('touchend', () => console.log('👆 GO touchend'));
        
        this.resetBtn.addEventListener('click', () => {
            console.log('🔄 RESET button clicked');
            this.handleReset();
        });
        this.resetBtn.addEventListener('mouseup', () => console.log('🖱️ RESET mouseup'));
        this.resetBtn.addEventListener('touchend', () => console.log('👆 RESET touchend'));
        
        this.passBtn.addEventListener('click', () => {
            console.log('⏭️ PASS button clicked');
            this.handlePass();
        });
        this.passBtn.addEventListener('mouseup', () => console.log('🖱️ PASS mouseup'));
        this.passBtn.addEventListener('touchend', () => console.log('👆 PASS touchend'));
        
        this.menuBtn.addEventListener('click', () => {
            console.log('📋 MENU button clicked');
            this.modals.showMenu();
        });
        this.menuBtn.addEventListener('mouseup', () => console.log('🖱️ MENU mouseup'));
        this.menuBtn.addEventListener('touchend', () => console.log('👆 MENU touchend'));
        
        // Tutorial
        document.getElementById('tutorial-next').addEventListener('click', () => this.modals.hideTutorial());
        document.getElementById('tutorial-skip').addEventListener('click', () => this.modals.hideTutorial());
        
        // Result modal
        document.getElementById('result-continue').addEventListener('click', () => {
            this.modals.hideResult(() => {
                this.render();
                this.clearSolutionHelper();
            });
        });
        
        // Menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => this.modals.hideMenu());
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.game.newGame();
            this.modals.hideMenu();
            this.render();
            this.clearSolutionHelper();
            this.modals.showTutorialIfNeeded();
        });
        document.getElementById('refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.modals.hideMenu();
            this.modals.showTutorial();
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
            
            if (this.settings.solutionHelper) {
                setTimeout(() => this.evaluateSolutionHelper(), 0);
            } else {
                this.clearSolutionHelper();
            }
        });
        
        // Test mode: Jump to level
        this.jumpToLevelBtn.addEventListener('click', () => {
            const targetLevel = parseInt(document.getElementById('level-selector').value);
            this.game.jumpToLevel(targetLevel);
            this.modals.hideMenu();
            this.render();
            this.clearSolutionHelper();
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
    
    handleGo() {
        // Check if tutorial is active - don't submit/score during tutorial
        if (this.tutorialManager.isActive) {
            this.tutorialManager.advanceOnSubmit();
            return; // Exit early - tutorial handles completion
        }
        
        const result = this.game.submitSolution();
        
        if (result.valid) {
            this.playSuccessAnimation(result.matchingCards);
            this.modals.showResult('Success!', result.message, result.points);
        } else {
            this.playErrorAnimation();
            this.playBonkSound();
        }
        
        this.render();
    }
    
    handleReset() {
        // Block reset during tutorial
        if (this.tutorialManager.isActive) {
            console.log('🎓 Tutorial active - Reset button disabled');
            return;
        }
        
        this.game.clearSolution();
        this.render();
        this.clearSolutionHelper();
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
    
    handleCorrectPass() {
        // No points awarded, just reset the round
        this.game.correctPass();
        this.render();
        this.clearSolutionHelper();
        // Modal is already shown by handlePass(), no need to show result modal
    }
    
    handleConfirmedPass() {
        this.game.pass();
        this.render();
        this.clearSolutionHelper();
    }
    
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
    
    evaluateSolutionHelper() {
        if (!this.settings.solutionHelper) {
            console.log('Solution Helper: OFF');
            return;
        }
        
        console.log('=== SOLUTION HELPER EVALUATION ===');
        
        // Sort dice by X position (left-to-right) before evaluation
        const restrictionRow = (this.game.solutions[0] || []).sort((a, b) => a.x - b.x);
        const setNameRow = (this.game.solutions[1] || []).sort((a, b) => a.x - b.x);
        
        console.log('Restriction row (sorted L→R):', restrictionRow.map(d => d.value).join(' '));
        console.log('Set name row (sorted L→R):', setNameRow.map(d => d.value).join(' '));
        
        // If both rows are empty, clear helper
        if (restrictionRow.length === 0 && setNameRow.length === 0) {
            console.log('Both rows empty - clearing helper');
            this.clearSolutionHelper();
            return;
        }
        
        // Determine which row has restriction and which has set name
        let restriction = null;
        let setName = null;
        
        if (hasRestriction(restrictionRow)) {
            restriction = restrictionRow;
            setName = setNameRow;
            console.log('Restriction in row 0, set name in row 1');
        } else if (hasRestriction(setNameRow)) {
            restriction = setNameRow;
            setName = restrictionRow;
            console.log('Restriction in row 1, set name in row 0');
        } else {
            // No restriction, just a regular set name
            setName = restrictionRow.length > 0 ? restrictionRow : setNameRow;
            console.log('No restriction detected');
        }
        
        const cards = this.cardsContainer.querySelectorAll('.card');
        
        // Store original user states
        cards.forEach((cardEl) => {
            if (!cardEl.dataset.helperActive) {
                cardEl.dataset.userDimmed = cardEl.classList.contains('dimmed') ? 'true' : 'false';
                cardEl.dataset.userExcluded = cardEl.classList.contains('excluded') ? 'true' : 'false';
                cardEl.dataset.helperActive = 'true';
            }
        });
        
        // Evaluate restriction and set name together
        let cardsToFlip = [];
        
        if (restriction && restriction.length > 0) {
            console.log('Evaluating restriction:', restriction.map(d => d.value).join(' '));
            cardsToFlip = evaluateRestriction(restriction, this.game.cards);
            console.log('Cards to flip from restriction:', cardsToFlip);
        } else {
            console.log('No restriction to evaluate');
        }
        
        // If we have a set name, evaluate it against non-flipped cards
        if (setName && setName.length > 0) {
            console.log('Evaluating set name:', setName.map(d => d.value).join(' '));
            // Filter out flipped cards for set name evaluation
            const activeCardIndices = new Set(
                this.game.cards.map((_, idx) => idx).filter(idx => 
                    !cardsToFlip.includes(idx) && !this.game.cardStates[idx].flipped
                )
            );
            const activeCards = this.game.cards.filter((_, idx) => activeCardIndices.has(idx));
            
            // Evaluate set name against active (non-flipped) cards
            const matchingCards = evaluateExpression(setName, activeCards);
            
            // Map back to original card indices
            const activeCardsArray = Array.from(activeCardIndices);
            const finalMatchingCards = new Set(
                Array.from(matchingCards).map(activeIdx => activeCardsArray[activeIdx])
            );
            
            // Apply visual states
            console.log('Applying visual states with set name present');
            cards.forEach((cardEl, index) => {
                if (cardsToFlip.includes(index)) {
                    // Show as flipped (excluded) - highest priority
                    console.log(`Card ${index}: FLIPPED (excluded)`);
                    cardEl.classList.add('excluded');
                    cardEl.classList.remove('dimmed');
                } else if (finalMatchingCards.has(index)) {
                    // Matches set name - bright
                    console.log(`Card ${index}: MATCHES set name (bright)`);
                    cardEl.classList.remove('dimmed', 'excluded');
                } else {
                    // Doesn't match set name - dimmed
                    console.log(`Card ${index}: Does NOT match set name (dimmed)`);
                    cardEl.classList.add('dimmed');
                    cardEl.classList.remove('excluded');
                }
            });
        } else if (cardsToFlip.length > 0) {
            // Only restriction, no set name - just show flipped cards
            console.log('Applying visual states: ONLY restriction (no set name)');
            console.log('Cards to flip:', cardsToFlip);
            cards.forEach((cardEl, index) => {
                if (cardsToFlip.includes(index)) {
                    console.log(`Card ${index}: FLIPPED (excluded)`);
                    cardEl.classList.add('excluded');
                    cardEl.classList.remove('dimmed');
                } else {
                    console.log(`Card ${index}: NOT flipped (bright)`);
                    cardEl.classList.remove('dimmed', 'excluded');
                }
            });
        } else {
            console.log('No cards to flip, no set name - nothing to apply');
        }
        
        console.log('=== END SOLUTION HELPER ===\n');
    }
    
    clearSolutionHelper() {
        const cards = this.cardsContainer.querySelectorAll('.card');
        cards.forEach((cardEl) => {
            if (cardEl.dataset.helperActive) {
                const userDimmed = cardEl.dataset.userDimmed === 'true';
                const userExcluded = cardEl.dataset.userExcluded === 'true';
                
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
            this.render();
            this.clearSolutionHelper();
            this.modals.showTutorialIfNeeded();
        });
    }
    
    render() {
        const state = this.game.getState();
        
        // Show/hide timer display based on level config (Level 7+)
        const config = getLevelConfig(this.game.level);
        if (config && config.timeLimit) {
            this.timerDisplay.style.display = 'flex';
            // If timer isn't running, show the initial time
            if (this.game.timeRemaining === null) {
                this.timerValue.textContent = config.timeLimit;
            }
        } else {
            this.timerDisplay.style.display = 'none';
        }
        
        // Update status bar
        this.renderer.updateStatusBar(
            this.currentScoreEl,
            this.goalScoreEl,
            this.currentLevelEl,
            this.goalCardsEl,
            state
        );
        
        // Render cards
        this.renderer.renderCards(this.cardsContainer, state.cards, state.cardStates);
        
        // Render dice
        this.renderer.renderDice(this.diceContainer, state.dice, state.solutions);
        
        // Render solutions
        this.renderer.renderSolutions(this.solutionArea, state.solutions, state.restrictionsEnabled);
        
        // Set up wild cube click listeners
        this.setupWildCubeListeners();
    }
    
    /**
     * Set up click listeners for wild cubes in the solution area
     */
    setupWildCubeListeners() {
        // Find all wild cubes in solution area
        const wildCubes = this.solutionArea.querySelectorAll('.solution-die.wild');
        
        wildCubes.forEach(dieEl => {
            // Use a click timer to distinguish single-click from double-click
            let clickTimer = null;
            
            dieEl.addEventListener('click', (e) => {
                // Clear any pending single-click
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    return; // This is part of a double-click, ignore it
                }
                
                // Wait to see if this is a double-click
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    
                    // This is a confirmed single-click - show popover
                    const rowIndex = parseInt(dieEl.closest('.solution-row').dataset.row);
                    const dieIndex = parseInt(dieEl.dataset.index);
                    this.wildCubeManager.show(dieEl, rowIndex, dieIndex);
                }, 250); // Standard double-click threshold
            });
        });
    }
    
    /**
     * Show wild cube popover by rowIndex and dieIndex (for auto-show on drop)
     */
    showWildCubePopoverByIndex(rowIndex, dieIndex) {
        console.log('🎯 showWildCubePopoverByIndex called:', rowIndex, dieIndex);
        // Use requestAnimationFrame to ensure render is complete, then find element
        requestAnimationFrame(() => {
            const row = this.solutionArea.querySelector(`.solution-row[data-row="${rowIndex}"]`);
            if (row) {
                const dieEl = row.querySelector(`.solution-die[data-index="${dieIndex}"]`);
                console.log('   Found die element?', !!dieEl);
                if (dieEl) {
                    // Small delay to ensure DOM is fully painted
                    setTimeout(() => {
                        console.log('   Showing popover now');
                        this.wildCubeManager.show(dieEl, rowIndex, dieIndex);
                    }, 50);
                } else {
                    console.log('   ❌ Die element not found in DOM!');
                }
            } else {
                console.log('   ❌ Row not found in DOM!');
            }
        });
    }
    
    showTutorialIfNeeded() {
        this.modals.showTutorialIfNeeded();
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
            }
        }
        // If they decline, just continue with normal gameplay (already rendered)
    }
}
