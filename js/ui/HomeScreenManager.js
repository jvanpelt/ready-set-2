// Home Screen management

export class HomeScreenManager {
    constructor(game) {
        this.game = game;
        this.homeScreen = document.getElementById('home-screen');
        this.continueBtn = document.getElementById('home-continue-btn');
        this.dailyPuzzleBtn = document.getElementById('home-daily-puzzle-btn');
        this.newGameBtn = document.getElementById('home-new-game-btn');
        this.howToPlayBtn = document.getElementById('home-how-to-play-btn');
        this.menuBtn = document.getElementById('home-menu-btn');
        this.currentLevelSpan = document.getElementById('home-current-level');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Continue button - resume current level
        this.continueBtn.addEventListener('click', () => {
            console.log('🏠 Continue button clicked');
            
            // Exit daily puzzle mode if active
            if (this.game.mode === 'daily') {
                console.log('⚠️ Was in daily mode, exiting...');
                if (window.dailyPuzzleManager) {
                    window.dailyPuzzleManager.exitDailyPuzzle();
                } else {
                    // Fallback if manager not available
                    this.game.mode = undefined;
                    this.game.saveState();
                }
            }
            
            // ALWAYS restore saved regular game state (not just when exiting daily mode)
            const savedState = this.game.storage.loadGameState();
            if (savedState && savedState.cards && savedState.cards.length > 0) {
                console.log('📂 Restoring saved regular game state');
                this.game.restoreFromSavedState(savedState);
            } else {
                console.log('⚠️ No saved state found, generating new round');
                this.game.generateNewRound();
            }
            
            this.hide();
            
            // Render with animation
            if (window.uiController) {
                window.uiController.render();
                window.uiController.renderer.animateCardsIn();
            }
        });
        
        // Daily Puzzle button - start daily puzzle mode
        this.dailyPuzzleBtn.addEventListener('click', () => {
            console.log('🎲 Daily Puzzle button clicked');
            
            // Cleanup tutorial if active
            if (window.uiController && window.uiController.tutorialManager.isActive) {
                console.log('🧹 Cleaning up tutorial before starting daily puzzle');
                window.uiController.tutorialManager.cleanup();
            }
            
            // Start daily puzzle mode
            if (window.dailyPuzzleManager) {
                window.dailyPuzzleManager.startDailyPuzzle();
            } else {
                console.error('❌ DailyPuzzleManager not initialized!');
            }
        });
        
        // New Game button - start from Level 1
        this.newGameBtn.addEventListener('click', () => {
            // DEBUG: console.log('🏠 New Game button clicked');
            
            // Cleanup tutorial if active
            if (window.uiController && window.uiController.tutorialManager.isActive) {
                // DEBUG: console.log('🧹 Cleaning up tutorial before starting new game');
                window.uiController.tutorialManager.cleanup();
            }
            
            this.hide();
            this.game.newGame();
            
            if (window.uiController) {
                window.uiController.render(); // Render WITHOUT animation first
                window.uiController.clearSolutionHelper();
                window.uiController.showFirstTimeInterstitial(); // Shows interstitial, will animate on dismiss
            }
        });
        
        // How to Play button - show intro tutorial
        this.howToPlayBtn.addEventListener('click', () => {
            // DEBUG: console.log('🏠 How to Play clicked - showing intro tutorial');
            this.hide(800); // Slower fade for intro tutorial
            
            if (window.uiController) {
                window.uiController.showIntroTutorial();
            }
        });
        
        // Menu button
        this.menuBtn.addEventListener('click', () => {
            // DEBUG: console.log('🏠 Menu button clicked from home screen');
            if (window.uiController && window.uiController.modals) {
                window.uiController.modals.showMenu();
            }
        });
    }
    
    show() {
        // DEBUG: console.log('🏠 Showing home screen');
        
        // Update level display
        this.currentLevelSpan.textContent = this.game.level;
        
        // Show Continue button if player has played before
        // Check if there's saved game data by looking at the loaded game state
        const savedState = this.game.storage.loadGameState();
        const hasSavedGame = savedState && savedState.cards && savedState.cards.length > 0;
        
        // DEBUG: console.log('🏠 Continue button check:', {
        //     hasSavedGame,
        //     level: this.game.level,
        //     cardsCount: savedState?.cards?.length || 0
        // });
        
        if (hasSavedGame) {
            // DEBUG: console.log(`🏠 ✅ Showing Continue button for Level ${this.game.level}`);
            this.continueBtn.classList.remove('hidden');
        } else {
            // DEBUG: console.log('🏠 ❌ Hiding Continue button (no saved game)');
            this.continueBtn.classList.add('hidden');
        }
        
        this.homeScreen.classList.remove('hidden');
    }
    
    hide(duration = 400) {
        // DEBUG: console.log(`🏠 Hiding home screen with fade (${duration}ms)`);
        
        // Set custom transition duration
        this.homeScreen.style.transition = `opacity ${duration}ms ease`;
        
        // First fade out
        this.homeScreen.classList.add('fade-out');
        
        // Then hide after transition completes
        setTimeout(() => {
            this.homeScreen.classList.add('hidden');
            this.homeScreen.classList.remove('fade-out');
            // Reset transition to default
            this.homeScreen.style.transition = '';
        }, duration);
    }
    
    isVisible() {
        return !this.homeScreen.classList.contains('hidden');
    }
}

