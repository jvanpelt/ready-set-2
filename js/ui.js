// UI rendering and interactions

import { evaluateExpression } from './setTheory.js';
import { hasPossibleSolution } from './solutionFinder.js';

export class UI {
    constructor(game, onUpdate) {
        this.game = game;
        this.onUpdate = onUpdate;
        this.draggedDie = null;
        this.draggedFromSolution = false;
        this.draggedIndex = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.currentDragElement = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.hasMoved = false;
        
        this.initElements();
        this.initEventListeners();
    }
    
    initElements() {
        this.cardsContainer = document.getElementById('cards-container');
        this.diceContainer = document.getElementById('dice-container');
        this.solutionArea = document.getElementById('solution-area');
        this.addRowBtn = document.getElementById('add-row-btn');
        
        this.currentScoreEl = document.getElementById('current-score');
        this.goalScoreEl = document.getElementById('goal-score');
        this.currentLevelEl = document.getElementById('current-level');
        this.goalCardsEl = document.getElementById('goal-cards');
        
        this.goBtn = document.getElementById('go-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.menuBtn = document.getElementById('menu-btn');
        
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.tutorialTitle = document.getElementById('tutorial-title');
        this.tutorialText = document.getElementById('tutorial-text');
        this.tutorialNext = document.getElementById('tutorial-next');
        this.tutorialSkip = document.getElementById('tutorial-skip');
        
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.resultScore = document.getElementById('result-score');
        this.resultContinue = document.getElementById('result-continue');
        
        this.menuModal = document.getElementById('menu-modal');
        this.menuMainView = document.getElementById('menu-main-view');
        this.menuSettingsView = document.getElementById('menu-settings-view');
        this.resumeBtn = document.getElementById('resume-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.tutorialBtn = document.getElementById('tutorial-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsBackBtn = document.getElementById('settings-back-btn');
        this.solutionHelperToggle = document.getElementById('solution-helper-toggle');
        
        this.passModal = document.getElementById('pass-modal');
        this.passTitle = document.getElementById('pass-title');
        this.passMessage = document.getElementById('pass-message');
        this.passContinueBtn = document.getElementById('pass-continue');
        this.passCancelBtn = document.getElementById('pass-cancel');
        
        // Load settings
        this.settings = this.game.storage.loadSettings();
        this.solutionHelperToggle.checked = this.settings.solutionHelper;
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
        
        // Button clicks
        this.goBtn.addEventListener('click', () => this.handleGo());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        this.passBtn.addEventListener('click', () => this.handlePass());
        this.menuBtn.addEventListener('click', () => this.showMenu());
        this.addRowBtn.addEventListener('click', () => this.handleAddRow());
        
        // Tutorial
        this.tutorialNext.addEventListener('click', () => this.hideTutorial());
        this.tutorialSkip.addEventListener('click', () => this.hideTutorial());
        
        // Result modal
        this.resultContinue.addEventListener('click', () => this.hideResult());
        
        // Menu modal
        this.resumeBtn.addEventListener('click', () => this.hideMenu());
        this.newGameBtn.addEventListener('click', () => {
            this.game.newGame();
            this.hideMenu();
            this.render();
            this.clearSolutionHelper(); // Clear helper for new game
            this.showTutorialIfNeeded();
        });
        this.tutorialBtn.addEventListener('click', () => {
            this.hideMenu();
            this.showTutorial();
        });
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.settingsBackBtn.addEventListener('click', () => this.hideSettings());
        this.solutionHelperToggle.addEventListener('change', (e) => {
            this.settings.solutionHelper = e.target.checked;
            this.game.storage.saveSettings(this.settings);
            // Re-evaluate if enabled
            if (this.settings.solutionHelper) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => this.evaluateSolutionHelper(), 0);
            } else {
                this.clearSolutionHelper();
            }
        });
        
        // Pass confirmation modal
        this.passCancelBtn.addEventListener('click', () => this.hidePassModal());
        
        // Drag and drop for dice
        this.initDragAndDrop();
    }
    
    initDragAndDrop() {
        // Helper to get coordinates from mouse or touch event (defined here for dice dragging too)
        const getEventCoords = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
            }
            return { clientX: e.clientX, clientY: e.clientY };
        };
        
        // Dice container - source dice (Mouse AND Touch)
        const handleDiceStart = (e) => {
            const die = e.target.closest('.die');
            if (die && !die.classList.contains('disabled')) {
                // Prevent default on touch to stop scrolling
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                this.draggedDie = {
                    type: die.dataset.type,
                    value: die.dataset.value,
                    name: die.dataset.name,
                    id: die.dataset.id
                };
                this.draggedFromSolution = false;
                this.draggedRowIndex = null;
                die.classList.add('dragging');
                
                // For native drag-and-drop (desktop)
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', die.innerHTML);
                }
                
                // Store for touch dragging
                this.sourceDieElement = die;
            }
        };
        
        this.diceContainer.addEventListener('dragstart', handleDiceStart);
        this.diceContainer.addEventListener('touchstart', handleDiceStart, { passive: false });
        
        const handleDiceEnd = (e) => {
            const die = e.target.closest('.die');
            if (die) {
                die.classList.remove('dragging');
            }
            if (this.sourceDieElement) {
                this.sourceDieElement.classList.remove('dragging');
                this.sourceDieElement = null;
            }
        };
        
        this.diceContainer.addEventListener('dragend', handleDiceEnd);
        this.diceContainer.addEventListener('touchend', handleDiceEnd);
        
        // Mouse/Touch-based drag and drop for solution dice
        const handleDragStart = (e) => {
            const solutionDie = e.target.closest('.solution-die');
            if (solutionDie && (e.button === 0 || e.type === 'touchstart')) { // Left click or touch
                // Prevent default to stop scrolling on touch
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                const coords = getEventCoords(e);
                
                const row = solutionDie.closest('.solution-row');
                this.draggedRowIndex = parseInt(row.dataset.row);
                this.draggedDieIndex = parseInt(solutionDie.dataset.index);
                this.draggedDie = this.game.solutions[this.draggedRowIndex][this.draggedDieIndex];
                this.draggedFromSolution = true;
                this.isDragging = true;
                this.currentDragElement = solutionDie;
                this.hasMoved = false;
                
                // Store start position to detect movement
                this.dragStartPos = { x: coords.clientX, y: coords.clientY };
                
                // Calculate offset from die's top-left
                const rect = solutionDie.getBoundingClientRect();
                this.dragOffset = {
                    x: coords.clientX - rect.left,
                    y: coords.clientY - rect.top
                };
                
                solutionDie.style.zIndex = '100';
            }
        };
        
        this.solutionArea.addEventListener('mousedown', handleDragStart);
        this.solutionArea.addEventListener('touchstart', handleDragStart, { passive: false });
        
        const handleDragMove = (e) => {
            if (this.isDragging && this.currentDragElement) {
                const coords = getEventCoords(e);
                
                // Check if moved more than threshold (5px)
                const dx = Math.abs(coords.clientX - this.dragStartPos.x);
                const dy = Math.abs(coords.clientY - this.dragStartPos.y);
                
                if (dx > 5 || dy > 5) {
                    this.hasMoved = true;
                    if (!this.currentDragElement.classList.contains('dragging')) {
                        this.currentDragElement.classList.add('dragging');
                    }
                }
                
                if (this.hasMoved) {
                    // Prevent default to stop scrolling during drag
                    if (e.type === 'touchmove') {
                        e.preventDefault();
                    }
                    
                    const row = this.currentDragElement.closest('.solution-row');
                    const rowRect = row.getBoundingClientRect();
                    
                    // Calculate position relative to row
                    let x = coords.clientX - rowRect.left - this.dragOffset.x;
                    let y = coords.clientY - rowRect.top - this.dragOffset.y;
                    
                    // Keep within bounds
                    const dieWidth = 80;
                    const dieHeight = 80;
                    x = Math.max(0, Math.min(x, rowRect.width - dieWidth - 20));
                    y = Math.max(0, Math.min(y, rowRect.height - dieHeight - 20));
                    
                    this.currentDragElement.style.left = `${x}px`;
                    this.currentDragElement.style.top = `${y}px`;
                }
            }
        };
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        
        const handleDragEnd = (e) => {
            if (this.isDragging && this.currentDragElement) {
                // Only update position if actually moved
                if (this.hasMoved) {
                    const coords = e.changedTouches ? 
                        { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY } :
                        { clientX: e.clientX, clientY: e.clientY };
                    
                    const row = this.currentDragElement.closest('.solution-row');
                    const rowRect = row.getBoundingClientRect();
                    
                    // Final position
                    let x = coords.clientX - rowRect.left - this.dragOffset.x;
                    let y = coords.clientY - rowRect.top - this.dragOffset.y;
                    
                    const dieWidth = 80;
                    const dieHeight = 80;
                    x = Math.max(0, Math.min(x, rowRect.width - dieWidth - 20));
                    y = Math.max(0, Math.min(y, rowRect.height - dieHeight - 20));
                    
                    // Update position in game state
                    this.game.updateDiePosition(this.draggedRowIndex, this.draggedDieIndex, x, y);
                    
                    this.currentDragElement.classList.remove('dragging');
                    
                    // Re-render to update grouping
                    this.render();
                    
                    // Update solution helper AFTER render (so it doesn't get overwritten)
                    this.evaluateSolutionHelper();
                }
                
                this.currentDragElement.style.zIndex = '1';
                this.currentDragElement = null;
                this.isDragging = false;
                this.hasMoved = false;
            }
        };
        
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);
        
        // Drop dice from dice area to solution (Desktop - native drag and drop)
        this.solutionArea.addEventListener('dragover', (e) => {
            const row = e.target.closest('.solution-row');
            if (row && this.draggedDie && !this.draggedFromSolution) {
                e.preventDefault();
                row.classList.add('drag-over');
            }
        });
        
        this.solutionArea.addEventListener('dragleave', (e) => {
            const row = e.target.closest('.solution-row');
            if (row && !row.contains(e.relatedTarget)) {
                row.classList.remove('drag-over');
            }
        });
        
        this.solutionArea.addEventListener('drop', (e) => {
            const row = e.target.closest('.solution-row');
            if (row && this.draggedDie && !this.draggedFromSolution) {
                e.preventDefault();
                row.classList.remove('drag-over');
                
                const rowIndex = parseInt(row.dataset.row);
                const rowRect = row.getBoundingClientRect();
                
                // Calculate drop position relative to row (center die on cursor)
                let x = e.clientX - rowRect.left - 40; // 40 = half of die width (80px)
                let y = e.clientY - rowRect.top - 40;  // 40 = half of die height (80px)
                
                // Apply same boundary constraints as when dragging within solution area
                const dieWidth = 80;
                const dieHeight = 80;
                x = Math.max(0, Math.min(x, rowRect.width - dieWidth - 20));
                y = Math.max(0, Math.min(y, rowRect.height - dieHeight - 20));
                
                this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                this.draggedDie = null;
                this.render();
                this.evaluateSolutionHelper();
            }
        });
        
        // Touch drop handler (Mobile)
        document.addEventListener('touchend', (e) => {
            // Only handle if dragging from dice area (not moving within solution)
            if (this.draggedDie && !this.draggedFromSolution && !this.isDragging) {
                const coords = e.changedTouches ? 
                    { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY } :
                    { clientX: e.clientX, clientY: e.clientY };
                
                // Check if touch ended over a solution row
                const element = document.elementFromPoint(coords.clientX, coords.clientY);
                const row = element ? element.closest('.solution-row') : null;
                
                if (row) {
                    e.preventDefault();
                    
                    const rowIndex = parseInt(row.dataset.row);
                    const rowRect = row.getBoundingClientRect();
                    
                    // Calculate drop position relative to row (center die on cursor)
                    let x = coords.clientX - rowRect.left - 40; // 40 = half of die width (80px)
                    let y = coords.clientY - rowRect.top - 40;  // 40 = half of die height (80px)
                    
                    // Apply same boundary constraints
                    const dieWidth = 80;
                    const dieHeight = 80;
                    x = Math.max(0, Math.min(x, rowRect.width - dieWidth - 20));
                    y = Math.max(0, Math.min(y, rowRect.height - dieHeight - 20));
                    
                    this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                    this.draggedDie = null;
                    this.render();
                    this.evaluateSolutionHelper();
                }
                
                // Clean up
                if (this.sourceDieElement) {
                    this.sourceDieElement.classList.remove('dragging');
                    this.sourceDieElement = null;
                }
                this.draggedDie = null;
            }
        });
        
        // Double-click on solution die to remove
        this.solutionArea.addEventListener('dblclick', (e) => {
            const solutionDie = e.target.closest('.solution-die');
            if (solutionDie) {
                const row = solutionDie.closest('.solution-row');
                const rowIndex = parseInt(row.dataset.row);
                const dieIndex = parseInt(solutionDie.dataset.index);
                this.game.removeDieFromSolution(rowIndex, dieIndex);
                this.render();
                this.evaluateSolutionHelper();
            }
        });
    }
    
    handleGo() {
        const result = this.game.submitSolution();
        
        if (result.valid) {
            this.playSuccessAnimation(result.matchingCards);
            this.showResult('Success!', result.message, result.points);
        } else {
            this.playErrorAnimation();
            this.playBonkSound();
        }
        
        this.render();
    }
    
    handleReset() {
        this.game.clearSolution();
        this.render();
        this.clearSolutionHelper(); // Clear helper when solution is cleared
    }
    
    handlePass() {
        // Check if a solution exists
        const state = this.game.getState();
        const solutionExists = hasPossibleSolution(
            state.cards,
            state.dice,
            state.goalCards
        );
        
        if (solutionExists) {
            // Warn the user that a solution exists
            this.showPassWarning();
        } else {
            // User is correct! No solution exists
            this.handleCorrectPass();
        }
    }
    
    handleCorrectPass() {
        const result = this.game.correctPass();
        this.render();
        this.clearSolutionHelper();
        this.showResult('Excellent!', result.message, result.points);
    }
    
    handleConfirmedPass() {
        // User confirmed they want to pass despite solution existing
        this.game.pass();
        this.render();
        this.clearSolutionHelper();
    }
    
    handleAddRow() {
        if (this.game.addSolutionRow()) {
            this.render();
            this.evaluateSolutionHelper(); // Re-evaluate in case dice moved to new row
        }
    }
    
    playSuccessAnimation(matchingCards) {
        // Highlight matching cards
        matchingCards.forEach(index => {
            const card = this.cardsContainer.querySelector(`[data-index="${index}"]`);
            if (card) {
                card.classList.add('matched');
                setTimeout(() => card.classList.remove('matched'), 1000);
            }
        });
    }
    
    playErrorAnimation() {
        // Shake all solution rows
        const rows = this.solutionArea.querySelectorAll('.solution-row');
        rows.forEach(row => {
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 300);
            
            // Shake dice in row
            const solutionDice = row.querySelectorAll('.solution-die');
            solutionDice.forEach(die => {
                die.classList.add('shake');
                setTimeout(() => die.classList.remove('shake'), 300);
            });
        });
    }
    
    playBonkSound() {
        // Simple audio context beep for "bonk"
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
    
    showTutorialIfNeeded() {
        if (this.game.shouldShowTutorial()) {
            this.showTutorial();
        }
    }
    
    showTutorial() {
        const tutorial = this.game.getTutorial();
        this.tutorialTitle.textContent = tutorial.title;
        this.tutorialText.innerHTML = tutorial.text.replace(/\n/g, '<br>');
        this.tutorialOverlay.classList.remove('hidden');
    }
    
    hideTutorial() {
        this.tutorialOverlay.classList.add('hidden');
        this.game.markTutorialShown();
    }
    
    showResult(title, message, points) {
        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        this.resultScore.textContent = `+${points} points!`;
        this.resultModal.classList.remove('hidden');
    }
    
    hideResult() {
        this.resultModal.classList.add('hidden');
        
        // Check if can advance to next level
        if (this.game.canAdvanceLevel() && this.game.getState().hasNextLevel) {
            this.game.startNewLevel();
            this.render();
            this.clearSolutionHelper(); // Clear helper for new level
            this.showTutorialIfNeeded();
        } else {
            // Generate new round
            this.game.resetRound();
            this.render();
            this.clearSolutionHelper(); // Clear helper for new round
        }
    }
    
    showMenu() {
        this.menuModal.classList.remove('hidden');
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    hideMenu() {
        this.menuModal.classList.add('hidden');
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    showSettings() {
        this.menuMainView.classList.add('hidden');
        this.menuSettingsView.classList.remove('hidden');
    }
    
    hideSettings() {
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    showPassWarning() {
        this.passTitle.textContent = 'Are you sure?';
        this.passMessage.textContent = 'A valid solution exists! Are you sure you want to pass?';
        this.passContinueBtn.textContent = 'Continue';
        this.passModal.classList.remove('hidden');
        
        // Update the continue button to confirm pass
        this.passContinueBtn.onclick = () => {
            this.hidePassModal();
            this.handleConfirmedPass();
        };
    }
    
    hidePassModal() {
        this.passModal.classList.add('hidden');
        // Clear the onclick handler
        this.passContinueBtn.onclick = null;
    }
    
    evaluateSolutionHelper() {
        if (!this.settings.solutionHelper) return;
        
        // Get the current solution from the first row
        const solution = this.game.solutions.find(row => row.length > 0);
        if (!solution || solution.length === 0) {
            this.clearSolutionHelper();
            return;
        }
        
        // Evaluate the expression
        const matchingCards = evaluateExpression(solution, this.game.cards);
        
        // Update card states to reflect matching
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
                // Card matches - make it visible
                cardEl.classList.remove('dimmed', 'excluded');
            } else {
                // Card doesn't match - dim it
                cardEl.classList.add('dimmed');
                cardEl.classList.remove('excluded');
            }
        });
    }
    
    clearSolutionHelper() {
        const cards = this.cardsContainer.querySelectorAll('.card');
        cards.forEach((cardEl) => {
            if (cardEl.dataset.helperActive) {
                // Restore user states
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
                
                // Clear helper flags
                delete cardEl.dataset.helperActive;
                delete cardEl.dataset.userDimmed;
                delete cardEl.dataset.userExcluded;
            }
        });
    }
    
    render() {
        const state = this.game.getState();
        
        // Update status bar
        this.currentScoreEl.textContent = state.score;
        this.goalScoreEl.textContent = state.goalScore;
        this.currentLevelEl.textContent = state.level;
        this.goalCardsEl.textContent = state.goalCards;
        
        // Render cards
        this.renderCards(state.cards, state.cardStates);
        
        // Render dice
        this.renderDice(state.dice, state.solutions);
        
        // Render solutions
        this.renderSolutions(state.solutions);
        
        // Show/hide add row button
        if (state.canAddRow) {
            this.addRowBtn.classList.remove('hidden');
        } else {
            this.addRowBtn.classList.add('hidden');
        }
    }
    
    renderCards(cards, cardStates) {
        this.cardsContainer.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.index = index;
            
            // Apply states
            if (cardStates[index].dimmed) {
                cardEl.classList.add('dimmed');
            }
            if (cardStates[index].excluded) {
                cardEl.classList.add('excluded');
            }
            
            // Add circles in fixed positions based on color
            card.colors.forEach((color) => {
                const circle = document.createElement('div');
                circle.className = `circle ${color}`;
                const position = this.getColorPosition(color);
                circle.style.gridColumn = position.col;
                circle.style.gridRow = position.row;
                cardEl.appendChild(circle);
            });
            
            this.cardsContainer.appendChild(cardEl);
        });
    }
    
    getColorPosition(color) {
        // Fixed positions: red=top-left, blue=top-right, green=bottom-left, gold=bottom-right
        const positions = {
            'red': { row: 1, col: 1 },
            'blue': { row: 1, col: 2 },
            'green': { row: 2, col: 1 },
            'gold': { row: 2, col: 2 }
        };
        return positions[color] || { row: 1, col: 1 };
    }
    
    renderDice(dice, solutions) {
        this.diceContainer.innerHTML = '';
        
        // Track which dice IDs are used across all solution rows
        const usedDiceIds = [];
        solutions.forEach(row => {
            row.forEach(die => {
                if (die.id) {
                    usedDiceIds.push(die.id);
                }
            });
        });
        
        dice.forEach((die) => {
            const dieEl = document.createElement('div');
            dieEl.className = 'die';
            dieEl.draggable = true;
            dieEl.dataset.type = die.type;
            dieEl.dataset.value = die.value;
            dieEl.dataset.id = die.id;
            if (die.name) dieEl.dataset.name = die.name;
            
            // Check if this specific die instance is used
            if (usedDiceIds.includes(die.id)) {
                dieEl.classList.add('disabled');
                dieEl.draggable = false;
            }
            
            if (die.type === 'color') {
                dieEl.classList.add('color-circle');
                const circle = document.createElement('div');
                circle.className = `circle ${die.value}`;
                dieEl.appendChild(circle);
            } else {
                dieEl.classList.add('operator');
                dieEl.textContent = die.value;
            }
            
            this.diceContainer.appendChild(dieEl);
        });
    }
    
    renderSolutions(solutions) {
        // Remove existing rows except the button
        const existingRows = this.solutionArea.querySelectorAll('.solution-row');
        existingRows.forEach(row => row.remove());
        
        // Create rows for each solution
        solutions.forEach((solution, rowIndex) => {
            const row = document.createElement('div');
            row.className = 'solution-row';
            row.dataset.row = rowIndex;
            
            solution.forEach((die, dieIndex) => {
                const dieEl = document.createElement('div');
                dieEl.className = 'solution-die';
                dieEl.dataset.index = dieIndex;
                
                // Position die
                dieEl.style.left = `${die.x}px`;
                dieEl.style.top = `${die.y}px`;
                
                // Use saved rotation
                const rotation = die.rotation || this.getRandomRotation();
                dieEl.style.transform = `rotate(${rotation}deg)`;
                
                if (die.type === 'color') {
                    const circle = document.createElement('div');
                    circle.className = `circle ${die.value}`;
                    dieEl.appendChild(circle);
                } else {
                    dieEl.textContent = die.value;
                }
                
                row.appendChild(dieEl);
            });
            
            // Detect and render groups
            this.renderGroups(row, solution);
            
            // Insert before the add button
            this.solutionArea.insertBefore(row, this.addRowBtn);
        });
    }
    
    renderGroups(row, solution) {
        // Remove old group indicators
        row.querySelectorAll('.solution-group-indicator').forEach(el => el.remove());
        
        if (solution.length < 2) return;
        
        // Find groups of touching dice
        const groups = this.detectGroups(solution);
        
        // Render group indicators
        groups.forEach(group => {
            if (group.length > 1) {
                const indicator = document.createElement('div');
                indicator.className = 'solution-group-indicator';
                
                // Calculate bounding box
                const bounds = this.getGroupBounds(group);
                indicator.style.left = `${bounds.x - 5}px`;
                indicator.style.top = `${bounds.y - 5}px`;
                indicator.style.width = `${bounds.width + 10}px`;
                indicator.style.height = `${bounds.height + 10}px`;
                
                row.appendChild(indicator);
            }
        });
    }
    
    detectGroups(solution) {
        // Group dice that are touching or overlapping
        const groups = [];
        const visited = new Set();
        
        solution.forEach((die, index) => {
            if (visited.has(index)) return;
            
            const group = [die];
            visited.add(index);
            
            // Find all dice touching this one (recursively)
            const checkTouching = (currentIndex) => {
                solution.forEach((otherDie, otherIndex) => {
                    if (visited.has(otherIndex)) return;
                    
                    if (this.areDiceTouching(solution[currentIndex], otherDie)) {
                        group.push(otherDie);
                        visited.add(otherIndex);
                        checkTouching(otherIndex);
                    }
                });
            };
            
            checkTouching(index);
            groups.push(group);
        });
        
        return groups;
    }
    
    areDiceTouching(die1, die2) {
        const dieSize = 80;
        const touchThreshold = 15; // Dice are "touching" if within 15px
        
        const dx = Math.abs(die1.x - die2.x);
        const dy = Math.abs(die1.y - die2.y);
        
        // Check if bounding boxes overlap or are very close
        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
    }
    
    getGroupBounds(group) {
        const dieSize = 80;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        group.forEach(die => {
            minX = Math.min(minX, die.x);
            minY = Math.min(minY, die.y);
            maxX = Math.max(maxX, die.x + dieSize);
            maxY = Math.max(maxY, die.y + dieSize);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    getRandomRotation() {
        // Random rotation between -8 and +8 degrees
        return (Math.random() * 16) - 8;
    }
}

