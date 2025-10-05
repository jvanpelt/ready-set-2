// Modal management - tutorials, menus, results, pass confirmations

export class ModalManager {
    constructor(game) {
        this.game = game;
        this.initElements();
    }
    
    initElements() {
        // Tutorial
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.tutorialTitle = document.getElementById('tutorial-title');
        this.tutorialText = document.getElementById('tutorial-text');
        
        // Result
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.resultScore = document.getElementById('result-score');
        
        // Menu
        this.menuModal = document.getElementById('menu-modal');
        this.menuMainView = document.getElementById('menu-main-view');
        this.menuSettingsView = document.getElementById('menu-settings-view');
        
        // Pass confirmation
        this.passModal = document.getElementById('pass-modal');
        this.passTitle = document.getElementById('pass-title');
        this.passMessage = document.getElementById('pass-message');
        this.passContinueBtn = document.getElementById('pass-continue');
        this.passCancelBtn = document.getElementById('pass-cancel');
        
        // Timeout modal (Level 7+)
        this.timeoutModal = document.getElementById('timeout-modal');
        this.timeoutOkBtn = document.getElementById('timeout-ok');
        
        // Level selector (test mode)
        this.levelSelector = document.getElementById('level-selector');
        
        // Hook up cancel button
        this.passCancelBtn.addEventListener('click', () => this.hidePassModal());
    }
    
    /**
     * Show tutorial if needed
     */
    showTutorialIfNeeded() {
        if (this.game.shouldShowTutorial()) {
            this.showTutorial();
        }
    }
    
    /**
     * Show tutorial overlay
     */
    showTutorial() {
        const tutorial = this.game.getTutorial();
        this.tutorialTitle.textContent = tutorial.title;
        this.tutorialText.innerHTML = tutorial.text.replace(/\n/g, '<br>');
        this.tutorialOverlay.classList.remove('hidden');
    }
    
    /**
     * Hide tutorial overlay
     */
    hideTutorial() {
        this.tutorialOverlay.classList.add('hidden');
        this.game.markTutorialShown();
    }
    
    /**
     * Show result modal (success or correct pass)
     */
    showResult(title, message, points) {
        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        this.resultScore.textContent = `+${points} points!`;
        this.resultModal.classList.remove('hidden');
    }
    
    /**
     * Hide result modal and advance game state
     */
    hideResult(onHide) {
        this.resultModal.classList.add('hidden');
        
        // Check if can advance to next level
        if (this.game.canAdvanceLevel() && this.game.getState().hasNextLevel) {
            this.game.startNewLevel();
            onHide();
            this.showTutorialIfNeeded();
        } else {
            // Generate new round
            this.game.resetRound();
            onHide();
        }
    }
    
    /**
     * Show main menu
     */
    showMenu() {
        this.menuModal.classList.remove('hidden');
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    /**
     * Hide main menu
     */
    hideMenu() {
        this.menuModal.classList.add('hidden');
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    /**
     * Show settings view within menu
     */
    showSettings() {
        this.menuMainView.classList.add('hidden');
        this.menuSettingsView.classList.remove('hidden');
        // Update level selector to current level
        this.levelSelector.value = this.game.level.toString();
    }
    
    /**
     * Hide settings view, return to main menu
     */
    hideSettings() {
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
    }
    
    /**
     * Show pass confirmation warning
     */
    showPassWarning(onConfirm, onCancel) {
        this.passTitle.textContent = 'Are you sure?';
        this.passMessage.textContent = 'A valid solution exists! Are you sure you want to pass?';
        this.passContinueBtn.textContent = 'Continue';
        this.passModal.classList.remove('hidden');
        
        // Store cancel callback for use when hidePassModal is called
        this.passOnCancel = onCancel;
        
        // Update the continue button to confirm pass
        this.passContinueBtn.onclick = () => {
            this.hidePassModal();
            onConfirm();
        };
    }
    
    /**
     * Hide pass confirmation modal
     */
    hidePassModal() {
        this.passModal.classList.add('hidden');
        
        // Call cancel callback if provided
        if (this.passOnCancel) {
            this.passOnCancel();
            this.passOnCancel = null;
        }
        
        // Clear the onclick handler
        this.passContinueBtn.onclick = null;
    }
    
    /**
     * Show timeout modal (Level 7+)
     */
    showTimeout(onOk) {
        this.timeoutModal.classList.remove('hidden');
        
        // Update the OK button
        this.timeoutOkBtn.onclick = () => {
            this.hideTimeout();
            if (onOk) {
                onOk();
            }
        };
    }
    
    /**
     * Hide timeout modal
     */
    hideTimeout() {
        this.timeoutModal.classList.add('hidden');
        // Clear the onclick handler
        this.timeoutOkBtn.onclick = null;
    }
}
