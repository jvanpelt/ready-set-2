// Main UI controller - coordinates rendering, modals, and interactions

import { UIRenderer } from './UIRenderer.js';
import { DragDropHandler } from './DragDropHandler.js';
import { ModalManager } from './ModalManager.js';
import { evaluateExpression, hasRestriction, evaluateRestriction } from '../setTheory.js';
import { hasPossibleSolution } from '../solutionFinder.js';

export class UIController {
    constructor(game, onUpdate) {
        this.game = game;
        this.onUpdate = onUpdate;
        
        // Initialize sub-components
        this.renderer = new UIRenderer(game);
        this.modals = new ModalManager(game);
        
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
            }
        );
        
        // Wire up timer callbacks (Level 7+)
        this.game.onTimerTick = (timeRemaining) => this.updateTimer(timeRemaining);
        this.game.onTimeout = () => this.handleTimeout();
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
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.modals.hideMenu();
            this.modals.showTutorial();
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.modals.showSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.modals.hideSettings());
        
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
        
        // Pass confirmation modal
        document.getElementById('pass-cancel').addEventListener('click', () => this.modals.hidePassModal());
    }
    
    handleGo() {
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
        this.game.clearSolution();
        this.render();
        this.clearSolutionHelper();
    }
    
    handlePass() {
        console.log('🔍 handlePass() called - checking for possible solution...');
        
        // Prevent duplicate processing
        if (this.isProcessingPass) {
            console.log('⚠️ Already processing Pass - ignoring duplicate click');
            return;
        }
        
        this.isProcessingPass = true;
        console.log('🔒 Set isProcessingPass = true');
        
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
                console.log('⚠️ Showing pass warning modal');
                this.modals.showPassWarning(
                    // onConfirm callback
                    () => {
                        this.handleConfirmedPass();
                        this.isProcessingPass = false;
                        console.log('🔓 Set isProcessingPass = false (after confirmed pass)');
                    },
                    // onCancel callback
                    () => {
                        this.isProcessingPass = false;
                        console.log('🔓 Set isProcessingPass = false (after cancel)');
                    }
                );
                // Don't reset flag here - wait for user to confirm or cancel
            } else {
                console.log('✅ Correct pass - no solution exists');
                this.handleCorrectPass();
                this.isProcessingPass = false;
                console.log('🔓 Set isProcessingPass = false (after correct pass)');
            }
        } catch (error) {
            console.error('❌ Error in handlePass:', error);
            this.isProcessingPass = false;
            console.log('🔓 Set isProcessingPass = false (after error)');
        }
    }
    
    handleCorrectPass() {
        const result = this.game.correctPass();
        this.render();
        this.clearSolutionHelper();
        this.modals.showResult('Excellent!', result.message, result.points);
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
        if (!this.settings.solutionHelper) return;
        
        const restrictionRow = this.game.solutions[0] || [];
        const setNameRow = this.game.solutions[1] || [];
        
        // If both rows are empty, clear helper
        if (restrictionRow.length === 0 && setNameRow.length === 0) {
            this.clearSolutionHelper();
            return;
        }
        
        // Determine which row has restriction and which has set name
        let restriction = null;
        let setName = null;
        
        if (hasRestriction(restrictionRow)) {
            restriction = restrictionRow;
            setName = setNameRow;
        } else if (hasRestriction(setNameRow)) {
            restriction = setNameRow;
            setName = restrictionRow;
        } else {
            // No restriction, just a regular set name
            setName = restrictionRow.length > 0 ? restrictionRow : setNameRow;
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
            cardsToFlip = evaluateRestriction(restriction, this.game.cards);
        }
        
        // If we have a set name, evaluate it against non-flipped cards
        if (setName && setName.length > 0) {
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
            cards.forEach((cardEl, index) => {
                if (cardsToFlip.includes(index)) {
                    // Show as flipped (excluded) - highest priority
                    cardEl.classList.add('excluded');
                    cardEl.classList.remove('dimmed');
                } else if (finalMatchingCards.has(index)) {
                    // Matches set name - bright
                    cardEl.classList.remove('dimmed', 'excluded');
                } else {
                    // Doesn't match set name - dimmed
                    cardEl.classList.add('dimmed');
                    cardEl.classList.remove('excluded');
                }
            });
        } else if (cardsToFlip.length > 0) {
            // Only restriction, no set name - just show flipped cards
            cards.forEach((cardEl, index) => {
                if (cardsToFlip.includes(index)) {
                    cardEl.classList.add('excluded');
                    cardEl.classList.remove('dimmed');
                } else {
                    cardEl.classList.remove('dimmed', 'excluded');
                }
            });
        }
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
        
        // Show/hide timer display based on level (Level 7+)
        if (this.game.level >= 7 && this.game.timeRemaining !== null) {
            this.timerDisplay.style.display = 'flex';
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
    }
    
    showTutorialIfNeeded() {
        this.modals.showTutorialIfNeeded();
    }
}
