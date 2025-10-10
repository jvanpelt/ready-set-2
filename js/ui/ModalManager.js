// Modal management - tutorials, menus, results, pass confirmations

import { getTutorialScenario } from '../tutorialScenarios.js';

export class ModalManager {
    constructor(game) {
        this.game = game;
        this.initElements();
    }
    
    initElements() {
        // Result
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.resultScore = document.getElementById('result-score');
        
        // Menu
        this.menuModal = document.getElementById('menu-modal');
        this.menuMainView = document.getElementById('menu-main-view');
        this.menuSettingsView = document.getElementById('menu-settings-view');
        this.menuBuilderView = document.getElementById('menu-builder-view');
        
        // Pass confirmation
        this.passModal = document.getElementById('pass-modal');
        this.passTitle = document.getElementById('pass-title');
        this.passMessage = document.getElementById('pass-message');
        this.passContinueBtn = document.getElementById('pass-continue');
        this.passCancelBtn = document.getElementById('pass-cancel');
        
        // Timeout modal (Level 7+)
        this.timeoutModal = document.getElementById('timeout-modal');
        this.timeoutOkBtn = document.getElementById('timeout-ok');
        
        // Interstitial screen
        this.interstitialScreen = document.getElementById('level-interstitial-screen');
        this.interstitialLevel = document.getElementById('interstitial-level');
        this.interstitialTitle = document.getElementById('interstitial-title');
        this.interstitialSymbol = document.getElementById('interstitial-symbol');
        this.interstitialFeatureName = document.getElementById('interstitial-feature-name');
        this.interstitialFeatureDesc = document.getElementById('interstitial-feature-desc');
        this.interstitialDescription = document.getElementById('interstitial-description');
        this.tutorialAcceptBtn = document.getElementById('tutorial-accept-btn');
        this.tutorialDeclineBtn = document.getElementById('tutorial-decline-btn');
        this.interstitialMenuBtn = document.getElementById('interstitial-menu-btn');
        
        // Level selector (test mode)
        this.levelSelector = document.getElementById('level-selector');
        
        // Hook up buttons
        this.passCancelBtn.addEventListener('click', () => this.hidePassModal());
        this.interstitialMenuBtn.addEventListener('click', () => {
            console.log('📋 Menu button clicked from interstitial');
            this.hideInterstitial();
            this.showMenu();
        });
    }
    
    /**
     * Show result modal (success or correct pass)
     */
    showResult(title, message, points) {
        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        this.resultScore.textContent = `+${points} points!`;
        this.resultScore.style.display = 'block';
        this.resultModal.classList.remove('hidden');
    }
    
    /**
     * Show tutorial completion modal (no points)
     */
    showTutorialComplete(onContinue) {
        this.resultTitle.textContent = '🎓 Tutorial Complete!';
        this.resultMessage.textContent = 'Great job! Now you\'ve got it. Let\'s play for real!';
        this.resultScore.style.display = 'none'; // Hide points for tutorial
        this.resultModal.classList.remove('hidden');
        
        // Override the continue button to call onContinue callback
        const continueBtn = document.getElementById('result-continue');
        const handler = () => {
            this.resultModal.classList.add('hidden');
            continueBtn.removeEventListener('click', handler);
            onContinue();
        };
        continueBtn.addEventListener('click', handler);
    }
    
    /**
     * Hide result modal and advance game state
     */
    async hideResult(onHide) {
        this.resultModal.classList.add('hidden');
        
        // Check if can advance to next level
        if (this.game.canAdvanceLevel() && this.game.getState().hasNextLevel) {
            const newLevel = this.game.level + 1;
            
            // Check if tutorial has been viewed for this level
            const tutorialViewed = this.game.storage.hasTutorialBeenViewed(newLevel);
            console.log(`🎓 Tutorial for Level ${newLevel} viewed: ${tutorialViewed}`);
            
            // FOR TESTING: Always show tutorial (ignore tutorialViewed status)
            // TODO: After testing, remove this comment block and use tutorialViewed check
            const shouldShowInterstitial = true; // tutorialViewed ? false : true;
            
            if (shouldShowInterstitial) {
                // Show interstitial screen and wait for user choice
                const wantsTutorial = await this.showInterstitialAsync(newLevel);
                
                // Start new level
                this.game.startNewLevel();
                onHide();
                
                // Start tutorial if requested
                if (wantsTutorial) {
                    const tutorialScenario = getTutorialScenario(newLevel);
                    if (tutorialScenario && window.uiController) {
                        window.uiController.tutorialManager.start(tutorialScenario);
                        
                        // Mark tutorial as viewed (COMMENTED OUT FOR TESTING)
                        // TODO: Uncomment this after testing complete
                        // this.game.storage.markTutorialAsViewed(newLevel);
                    }
                } else {
                    // User declined tutorial - nothing more to do
                    // Mark as viewed so they don't see it again (COMMENTED OUT FOR TESTING)
                    // TODO: Uncomment this after testing complete
                    // this.game.storage.markTutorialAsViewed(newLevel);
                }
            } else {
                // Tutorial already viewed, skip interstitial
                this.game.startNewLevel();
                onHide();
            }
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
        this.menuBuilderView.classList.add('hidden');
        
        // Update level indicator
        const menuLevelEl = document.getElementById('menu-current-level');
        if (menuLevelEl) {
            menuLevelEl.textContent = this.game.level;
        }
    }
    
    /**
     * Hide main menu
     */
    hideMenu() {
        this.menuModal.classList.add('hidden');
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
        this.menuBuilderView.classList.add('hidden');
    }
    
    /**
     * Show settings view within menu
     */
    showSettings() {
        this.menuMainView.classList.add('hidden');
        this.menuSettingsView.classList.remove('hidden');
        this.menuBuilderView.classList.add('hidden');
        // Update level selector to current level
        this.levelSelector.value = this.game.level.toString();
    }
    
    /**
     * Hide settings view, return to main menu
     */
    hideSettings() {
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
        this.menuBuilderView.classList.add('hidden');
    }
    
    /**
     * Show puzzle builder view within menu
     */
    showBuilder() {
        this.menuMainView.classList.add('hidden');
        this.menuSettingsView.classList.add('hidden');
        this.menuBuilderView.classList.remove('hidden');
    }
    
    /**
     * Hide builder view, return to main menu
     */
    hideBuilder() {
        this.menuMainView.classList.remove('hidden');
        this.menuSettingsView.classList.add('hidden');
        this.menuBuilderView.classList.add('hidden');
    }
    
    /**
     * Show pass confirmation warning
     */
    /**
     * Show "checking puzzle" loading state
     */
    showPassChecking() {
        this.passTitle.textContent = 'Checking puzzle...';
        this.passMessage.textContent = 'Analyzing if a solution is possible...';
        this.passContinueBtn.style.display = 'none';
        this.passCancelBtn.style.display = 'none';
        this.passModal.classList.remove('hidden');
    }
    
    /**
     * Show "no solution exists" confirmation
     */
    showPassNoSolution(onContinue) {
        this.passTitle.textContent = "You're right!";
        this.passMessage.textContent = 'No solution exists.';
        this.passContinueBtn.textContent = 'Continue';
        this.passContinueBtn.style.display = 'inline-block';
        this.passCancelBtn.style.display = 'none';
        
        this.passContinueBtn.onclick = () => {
            this.hidePassModal();
            onContinue();
        };
    }
    
    /**
     * Show "solution exists" warning
     */
    showPassWarning(onConfirm, onCancel) {
        this.passTitle.textContent = 'Are you sure?';
        this.passMessage.textContent = 'A valid solution exists! Are you sure you want to pass?';
        this.passContinueBtn.textContent = 'Continue';
        this.passContinueBtn.style.display = 'inline-block';
        this.passCancelBtn.style.display = 'inline-block';
        
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
    
    /**
     * Show interstitial screen when advancing to a new level
     * Returns a promise that resolves with true (tutorial) or false (skip)
     */
    showInterstitial(level, onChoice) {
        // Get level config
        const levelConfig = {
            1: { title: 'Welcome to Ready, Set 2!', symbol: '∪', feature: 'Union & Intersection', desc: 'Combine sets with OR and AND' },
            2: { title: 'Difference Operator', symbol: '−', feature: 'Difference', desc: 'Remove elements from a set' },
            3: { title: 'Complement Operator', symbol: '′', feature: 'Complement', desc: 'Get everything EXCEPT a color' },
            4: { title: 'More Operators!', symbol: '∪∩', feature: 'Duplicate Operators', desc: 'Build more complex expressions' },
            5: { title: 'Universe & Null Set', symbol: 'U', feature: 'Universe & Null', desc: 'All cards or no cards' },
            6: { title: 'Restrictions', symbol: '⊆', feature: 'Subset & Equals', desc: 'Modify the universe first' },
            7: { title: 'Beat the Clock!', symbol: '⏱️', feature: 'Timer', desc: 'Solve puzzles before time runs out' },
            8: { title: 'Required Cubes', symbol: '🟢', feature: 'Required Cubes', desc: 'Must use the green glowing cube' },
            9: { title: 'Wild Cubes', symbol: '❓', feature: 'Wild Cubes', desc: 'Choose which operator to use' },
            10: { title: 'Final Challenge', symbol: '⭐', feature: 'Bonus Cubes', desc: 'Free points for using special cubes' }
        };
        
        const config = levelConfig[level] || { title: `Level ${level}`, symbol: '?', feature: 'New Features', desc: 'Keep learning!' };
        
        // Check if tutorial exists for this level
        const hasTutorial = getTutorialScenario(level) !== null;
        
        // Populate content
        this.interstitialLevel.textContent = level;
        this.interstitialTitle.textContent = config.title;
        this.interstitialSymbol.textContent = config.symbol;
        this.interstitialFeatureName.textContent = config.feature;
        this.interstitialFeatureDesc.textContent = config.desc;
        this.interstitialDescription.textContent = `Welcome to Level ${level}! ${config.desc}`;
        
        // Show/hide tutorial button based on availability
        if (hasTutorial) {
            this.tutorialAcceptBtn.style.display = 'flex';
            this.tutorialDeclineBtn.innerHTML = 'I\'ll Figure It Out';
        } else {
            this.tutorialAcceptBtn.style.display = 'none';
            this.tutorialDeclineBtn.innerHTML = 'Continue';
        }
        
        // Set up button handlers
        const handleAccept = () => {
            this.hideInterstitial();
            onChoice(true);
        };
        
        const handleDecline = () => {
            this.hideInterstitial();
            onChoice(false);
        };
        
        this.tutorialAcceptBtn.onclick = handleAccept;
        this.tutorialDeclineBtn.onclick = handleDecline;
        
        // Hide game board, show interstitial
        document.getElementById('app').classList.add('hidden');
        this.interstitialScreen.classList.remove('hidden');
    }
    
    /**
     * Hide interstitial and show game board
     */
    hideInterstitial() {
        this.interstitialScreen.classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }
    
    /**
     * Show interstitial and wait for user choice (async version)
     */
    async showInterstitialAsync(level) {
        return new Promise((resolve) => {
            this.showInterstitial(level, resolve);
        });
    }
}
