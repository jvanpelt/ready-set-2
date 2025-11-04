// Modal management - tutorials, menus, results, pass confirmations

import { getTutorialScenario } from '../tutorialScenarios.js';

export class ModalManager {
    constructor(game) {
        this.game = game;
        this.initElements();
        this.initBackdropHandlers();
    }
    
    initElements() {
        // Result
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.resultScore = document.getElementById('result-score');
        
        // Daily Puzzle Result
        this.dailyPuzzleResultModal = document.getElementById('daily-puzzle-result-modal');
        this.dailyPuzzleNumber = document.getElementById('daily-puzzle-number');
        this.dailyPuzzleScore = document.getElementById('daily-puzzle-score');
        this.dailyPuzzleCubeCount = document.getElementById('daily-puzzle-cube-count');
        this.dailyPuzzleEmoji = document.getElementById('daily-puzzle-emoji');
        this.dailyPuzzleShareBtn = document.getElementById('daily-puzzle-share-btn');
        this.dailyPuzzleDoneBtn = document.getElementById('daily-puzzle-done-btn');
        this.shareToast = document.getElementById('share-toast');
        
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
            // Don't hide interstitial - menu modal will layer on top with higher z-index
            this.showMenu();
        });
    }
    
    initBackdropHandlers() {
        // Click on menu modal backdrop to close
        this.menuModal.addEventListener('click', (e) => {
            // Only close if clicking the backdrop (not the modal content)
            if (e.target === this.menuModal) {
                this.hideMenu();
            }
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
        this.passContinueBtn.textContent = 'Pass';
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
        this.passContinueBtn.textContent = 'Pass';
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
        
        // Show interstitial (game board stays visible underneath)
        this.interstitialScreen.classList.remove('hidden');
    }
    
    /**
     * Hide interstitial and show game board
     */
    hideInterstitial() {
        console.log('🎯 Hiding interstitial with fade');
        // First fade out
        this.interstitialScreen.classList.add('fade-out');
        
        // Then hide after transition completes
        setTimeout(() => {
            this.interstitialScreen.classList.add('hidden');
            this.interstitialScreen.classList.remove('fade-out');
        }, 400); // Match CSS transition duration
    }
    
    /**
     * Show interstitial and wait for user choice (async version)
     */
    async showInterstitialAsync(level) {
        return new Promise((resolve) => {
            this.showInterstitial(level, resolve);
        });
    }
    
    /**
     * Show daily puzzle result modal
     * @param {Object} result - Result object with puzzleId, score, cubes, solution
     * @param {Function} onDone - Callback when user clicks Done
     */
    showDailyPuzzleResult(result, onDone) {
        console.log('🎉 Showing daily puzzle result:', result);
        
        // Populate modal
        this.dailyPuzzleNumber.textContent = result.puzzleId;
        this.dailyPuzzleScore.textContent = result.score;
        this.dailyPuzzleCubeCount.textContent = result.cubes;
        this.dailyPuzzleEmoji.textContent = this.generateEmojiSolution(result.solution);
        
        // Store result for sharing
        this.currentDailyResult = result;
        
        // Show modal
        this.dailyPuzzleResultModal.classList.remove('hidden');
        
        // Handle Share button
        this.dailyPuzzleShareBtn.onclick = () => this.shareDailyPuzzleResult();
        
        // Handle Done button
        this.dailyPuzzleDoneBtn.onclick = () => {
            this.hideDailyPuzzleResult();
            if (onDone) onDone();
        };
    }
    
    /**
     * Hide daily puzzle result modal
     */
    hideDailyPuzzleResult() {
        this.dailyPuzzleResultModal.classList.add('hidden');
        this.currentDailyResult = null;
    }
    
    /**
     * Generate emoji representation of solution
     * @param {Array} solution - Array of dice in solution rows
     * @returns {string} Emoji string
     */
    generateEmojiSolution(solution) {
        const emojiMap = {
            'red': '🔴',
            'blue': '🔵',
            'green': '🟢',
            'gold': '🟡',
            '∪': '➕',
            '∩': '✖️',
            '−': '➖',
            '′': '❌',
            'U': '🌐',
            '∅': '⭕',
            '=': '⚖️',
            '⊆': '⬅️'
        };
        
        const topRow = solution.topRow || [];
        const bottomRow = solution.bottomRow || [];
        
        let emoji = '';
        
        // Top row (restriction)
        if (topRow.length > 0) {
            emoji += topRow.map(die => emojiMap[die.value] || die.value).join('');
            emoji += '\n';
        }
        
        // Bottom row (set name)
        if (bottomRow.length > 0) {
            emoji += bottomRow.map(die => emojiMap[die.value] || die.value).join('');
        }
        
        return emoji;
    }
    
    /**
     * Share daily puzzle result (uses native share API on mobile, clipboard on desktop)
     */
    async shareDailyPuzzleResult() {
        if (!this.currentDailyResult) return;
        
        const result = this.currentDailyResult;
        const emoji = this.dailyPuzzleEmoji.textContent;
        
        // Format share text
        const shareText = `Ready, Set 2 🎲
Daily Puzzle #${result.puzzleId}

Score: ${result.score} (${result.cubes} cubes)

${emoji}

Play: https://jvanpelt.github.io/ready-set-2`;
        
        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ready, Set 2 - Daily Puzzle',
                    text: shareText
                });
                console.log('📤 Shared via native API');
                return;
            } catch (err) {
                // User cancelled or error occurred
                console.log('Share cancelled or failed:', err);
            }
        }
        
        // Fallback to clipboard (desktop)
        try {
            await navigator.clipboard.writeText(shareText);
            this.showShareToast();
            console.log('📋 Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard. Please try again.');
        }
    }
    
    /**
     * Show "Copied!" toast message
     */
    showShareToast() {
        this.shareToast.classList.remove('hidden');
        
        // Hide after animation completes
        setTimeout(() => {
            this.shareToast.classList.add('hidden');
        }, 2000);
    }
}
