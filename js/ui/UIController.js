// Main UI controller - coordinates rendering, modals, and interactions

import { UIRenderer } from './UIRenderer.js';
import { DragDropHandler } from './DragDropHandler.js';
import { ModalManager } from './ModalManager.js';
import { evaluateExpression } from '../setTheory.js';
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
    }
    
    initElements() {
        // Game elements
        this.cardsContainer = document.getElementById('cards-container');
        this.diceContainer = document.getElementById('dice-container');
        this.solutionArea = document.getElementById('solution-area');
        this.addRowBtn = document.getElementById('add-row-btn');
        
        // Status bar
        this.currentScoreEl = document.getElementById('current-score');
        this.goalScoreEl = document.getElementById('goal-score');
        this.currentLevelEl = document.getElementById('current-level');
        this.goalCardsEl = document.getElementById('goal-cards');
        
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
        
        // Control buttons
        this.goBtn.addEventListener('click', () => this.handleGo());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.passBtn.addEventListener('click', () => this.handlePass());
        this.menuBtn.addEventListener('click', () => this.modals.showMenu());
        this.addRowBtn.addEventListener('click', () => this.handleAddRow());
        
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
        const state = this.game.getState();
        const solutionExists = hasPossibleSolution(
            state.cards,
            state.dice,
            state.goalCards
        );
        
        if (solutionExists) {
            this.modals.showPassWarning(() => this.handleConfirmedPass());
        } else {
            this.handleCorrectPass();
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
    
    handleAddRow() {
        if (this.game.addSolutionRow()) {
            this.render();
            this.evaluateSolutionHelper();
        }
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
        
        const solution = this.game.solutions.find(row => row.length > 0);
        if (!solution || solution.length === 0) {
            this.clearSolutionHelper();
            return;
        }
        
        const matchingCards = evaluateExpression(solution, this.game.cards);
        
        const cards = this.cardsContainer.querySelectorAll('.card');
        cards.forEach((cardEl, index) => {
            // Store original user states
            if (!cardEl.dataset.helperActive) {
                cardEl.dataset.userDimmed = cardEl.classList.contains('dimmed') ? 'true' : 'false';
                cardEl.dataset.userExcluded = cardEl.classList.contains('excluded') ? 'true' : 'false';
                cardEl.dataset.helperActive = 'true';
            }
            
            // Apply helper states
            if (matchingCards.has(index)) {
                cardEl.classList.remove('dimmed', 'excluded');
            } else {
                cardEl.classList.add('dimmed');
                cardEl.classList.remove('excluded');
            }
        });
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
    
    render() {
        const state = this.game.getState();
        
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
        this.renderer.renderSolutions(this.solutionArea, state.solutions);
        
        // Show/hide add row button
        if (state.canAddRow) {
            this.addRowBtn.classList.remove('hidden');
        } else {
            this.addRowBtn.classList.add('hidden');
        }
    }
    
    showTutorialIfNeeded() {
        this.modals.showTutorialIfNeeded();
    }
}
