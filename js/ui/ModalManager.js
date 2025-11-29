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
        
        // Daily Puzzle Result (now an interstitial screen)
        this.dailyPuzzleResultScreen = document.getElementById('daily-puzzle-result-screen');
        this.dailyPuzzleNumber = document.getElementById('daily-puzzle-number');
        this.dailyPuzzleScore = document.getElementById('daily-puzzle-score');
        this.dailyPuzzleCubeCount = document.getElementById('daily-puzzle-cube-count');
        this.dailyPuzzleEmoji = document.getElementById('daily-puzzle-emoji');
        this.dailyPuzzleShareBtn = document.getElementById('daily-puzzle-share-btn');
        this.dailyPuzzleDoneBtn = document.getElementById('daily-puzzle-done-btn');
        this.shareToast = document.getElementById('share-toast');
        
        // Daily Puzzle Interstitial
        this.dailyInterstitialScreen = document.getElementById('daily-puzzle-interstitial-screen');
        this.dailyInterstitialNumber = document.getElementById('daily-interstitial-puzzle-number');
        this.dailyInterstitialShortest = document.getElementById('daily-shortest');
        this.dailyInterstitialLongest = document.getElementById('daily-longest');
        this.dailyInterstitialSolutionCount = document.getElementById('daily-solution-count');
        this.dailyInterstitialDifficulty = document.getElementById('daily-difficulty');
        this.dailyInterstitialDescription = document.getElementById('daily-interstitial-description');
        this.dailyPuzzleStartBtn = document.getElementById('daily-puzzle-start-btn');
        this.dailyInterstitialMenuBtn = document.getElementById('daily-interstitial-menu-btn');
        
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
                
                // Start new level (this generates new round and starts timer)
                this.game.startNewLevel();
                
                // STOP timer immediately - we're showing tutorial/interstitial
                if (this.game.timer) {
                    console.log('⏱️ Stopping timer for interstitial/tutorial');
                    this.game.timer.stop(true); // Clear data - fresh timer will start after tutorial
                }
                
                onHide();
                
                // Start tutorial if requested
                if (wantsTutorial) {
                    // Level 1 uses the intro tutorial, other levels use their own
                    const scenarioKey = newLevel === 1 ? 'intro' : newLevel;
                    const tutorialScenario = getTutorialScenario(scenarioKey);
                    if (tutorialScenario && window.uiController) {
                        window.uiController.tutorialManager.start(tutorialScenario, 'level-interstitial');
                        
                        // Mark tutorial as viewed
                        this.game.storage.markTutorialAsViewed(newLevel);
                        // Timer will be started when tutorial completes (in TutorialManager.complete())
                    }
                } else {
                    // User declined tutorial
                    // Mark tutorial as viewed so they don't see it again
                    this.game.storage.markTutorialAsViewed(newLevel);
                    
                    // Notify UIController to handle timer
                    if (window.uiController) {
                        window.uiController.handleLevelAdvanced();
                    }
                }
            } else {
                // Tutorial already viewed, skip interstitial
                this.game.startNewLevel();
                onHide();
                
                // Notify UIController to handle timer
                if (window.uiController) {
                    window.uiController.handleLevelAdvanced();
                }
            }
        } else {
            // Generate new round (same level, keep score)
            this.game.resetRound();
            onHide();
            
            // Notify UIController to handle timer
            if (window.uiController) {
                window.uiController.handleNewRoundAfterSubmit();
            }
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
    showTimeout(onOk, isTutorial = false) {
        this.timeoutModal.classList.remove('hidden');
        
        // Update message if this is a tutorial timeout
        const messageEl = this.timeoutModal.querySelector('p');
        if (isTutorial) {
            messageEl.textContent = "Time ran out during the lesson! Let's try the real thing...";
        } else {
            messageEl.textContent = "Time expired! Starting a new puzzle...";
        }
        
        // Update the OK button
        this.timeoutOkBtn.onclick = () => {
            console.log('🖱️ Timeout modal OK button clicked');
            this.hideTimeout();
            console.log('🖱️ Modal hidden, calling callback...');
            if (onOk) {
                onOk();
            } else {
                console.log('⚠️ No onOk callback provided to modal');
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
        
        // Check if tutorial exists for this level (Level 1 uses 'intro')
        const scenarioKey = level === 1 ? 'intro' : level;
        const hasTutorial = getTutorialScenario(scenarioKey) !== null;
        
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
     * Show daily puzzle result interstitial screen
     * @param {Object} result - Result object with puzzleId, score, cubes, solution
     * @param {Function} onDone - Callback when user clicks Done
     */
    showDailyPuzzleResult(result, onDone) {
        console.log('🎉 Showing daily puzzle result:', result);
        
        // Populate interstitial
        this.dailyPuzzleNumber.textContent = result.puzzleId;
        this.dailyPuzzleScore.textContent = result.score;
        this.dailyPuzzleCubeCount.textContent = result.cubes;
        this.dailyPuzzleEmoji.textContent = this.generateEmojiSolution(result.solution);
        
        // Store result for sharing
        this.currentDailyResult = result;
        
        // Show interstitial screen
        this.dailyPuzzleResultScreen.classList.remove('hidden');
        
        // Handle Share button
        this.dailyPuzzleShareBtn.onclick = () => this.shareDailyPuzzleResult();
        
        // Handle Done button
        this.dailyPuzzleDoneBtn.onclick = () => {
            this.hideDailyPuzzleResult();
            if (onDone) onDone();
        };
    }
    
    /**
     * Hide daily puzzle result interstitial screen
     */
    hideDailyPuzzleResult() {
        console.log('🎯 Hiding daily puzzle result with fade');
        // First fade out
        this.dailyPuzzleResultScreen.classList.add('fade-out');
        
        // Then hide after transition completes
        setTimeout(() => {
            this.dailyPuzzleResultScreen.classList.add('hidden');
            this.dailyPuzzleResultScreen.classList.remove('fade-out');
            this.currentDailyResult = null;
        }, 400); // Match CSS transition duration
    }
    
    /**
     * Show daily puzzle interstitial screen
     * @param {Object} puzzleData - Puzzle data including puzzleId, shortestSolution, longestSolution, solutionCount
     * @returns {Promise} Resolves when user clicks Start
     */
    async showDailyPuzzleInterstitial(puzzleData) {
        return new Promise((resolve) => {
            const { puzzleId, shortestSolution, longestSolution, solutionCount } = puzzleData;
            
            // Populate content
            this.dailyInterstitialNumber.textContent = puzzleId;
            this.dailyInterstitialShortest.textContent = shortestSolution || 2;
            this.dailyInterstitialLongest.textContent = longestSolution || 8;
            this.dailyInterstitialSolutionCount.textContent = solutionCount || '?';
            
            // Calculate difficulty based on shortest solution
            let difficulty = 'Easy';
            if (shortestSolution >= 5) difficulty = 'Medium';
            if (shortestSolution >= 7) difficulty = 'Hard';
            this.dailyInterstitialDifficulty.textContent = difficulty;
            
            // Update description
            this.dailyInterstitialDescription.textContent = 
                `Today's puzzle has ${solutionCount || 'many'} possible solutions. The shortest uses ${shortestSolution || 2} cubes. Good luck!`;
            
            // Handle Start button
            const handleStart = () => {
                this.hideDailyPuzzleInterstitial();
                resolve();
            };
            
            // Handle Menu button
            const handleMenu = () => {
                this.hideDailyPuzzleInterstitial();
                if (window.uiController) {
                    window.uiController.modals.showMenu();
                }
            };
            
            this.dailyPuzzleStartBtn.onclick = handleStart;
            this.dailyInterstitialMenuBtn.onclick = handleMenu;
            
            // Show interstitial
            this.dailyInterstitialScreen.classList.remove('hidden');
        });
    }
    
    /**
     * Hide daily puzzle interstitial screen
     */
    hideDailyPuzzleInterstitial() {
        console.log('🎯 Hiding daily puzzle interstitial with fade');
        // First fade out
        this.dailyInterstitialScreen.classList.add('fade-out');
        
        // Then hide after transition completes
        setTimeout(() => {
            this.dailyInterstitialScreen.classList.add('hidden');
            this.dailyInterstitialScreen.classList.remove('fade-out');
        }, 400); // Match CSS transition duration
    }
    
    /**
     * Generate emoji representation of solution (abstracted to avoid spoilers)
     * Shows cube types used but not structure/order
     * @param {Array} solution - Array of dice in solution rows
     * @returns {string} Emoji string
     */
    generateEmojiSolution(solution) {
        const topRow = solution.topRow || [];
        const bottomRow = solution.bottomRow || [];
        const allDice = [...topRow, ...bottomRow];
        
        // Count each type of cube
        let colorCount = 0;
        let operatorCount = 0;
        let restrictionCount = 0;
        let setConstantCount = 0;
        
        allDice.forEach(die => {
            const value = die.value;
            
            // Color cubes
            if (['red', 'blue', 'green', 'gold'].includes(value)) {
                colorCount++;
            }
            // Operators (including prime)
            else if (['∪', '∩', '−', '′'].includes(value)) {
                operatorCount++;
            }
            // Restrictions
            else if (['=', '⊆'].includes(value)) {
                restrictionCount++;
            }
            // Set constants
            else if (['U', '∅'].includes(value)) {
                setConstantCount++;
            }
        });
        
        // Build emoji string grouped by type (with spaces between each)
        // Order: set names, restrictions, operators, colors
        let emojis = [];
        
        // Set constants (white circles) - FIRST
        if (setConstantCount > 0) {
            for (let i = 0; i < setConstantCount; i++) {
                emojis.push('⚪');
            }
        }
        
        // Restrictions (blue circles) - SECOND
        if (restrictionCount > 0) {
            for (let i = 0; i < restrictionCount; i++) {
                emojis.push('🔵');
            }
        }
        
        // Operators (red circles) - THIRD
        if (operatorCount > 0) {
            for (let i = 0; i < operatorCount; i++) {
                emojis.push('🔴');
            }
        }
        
        // Colors (gold circles) - FOURTH
        if (colorCount > 0) {
            for (let i = 0; i < colorCount; i++) {
                emojis.push('🟡');
            }
        }
        
        return emojis.join(' ');
    }
    
    /**
     * Share daily puzzle result (uses native share API on mobile, clipboard on desktop)
     */
    async shareDailyPuzzleResult() {
        if (!this.currentDailyResult) return;
        
        const result = this.currentDailyResult;
        const emoji = this.dailyPuzzleEmoji.textContent;
        
        // Format share text
        const shareText = `Ready, Set! 🎲
Daily Puzzle #${result.puzzleId}

Score: ${result.score} | ${result.cubes} cubes
${emoji}`;
        
        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ready, Set 2 - Daily Puzzle',
                    text: shareText
                });
                console.log('📤 Shared via native API');
            } catch (err) {
                // User cancelled or error occurred - this is normal, just log it
                console.log('Share cancelled or failed:', err);
            }
            // Always return after attempting native share (don't fall through to clipboard)
            return;
        }
        
        // Fallback to clipboard (desktop only - when native share not available)
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
