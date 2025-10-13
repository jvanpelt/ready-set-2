// Home Screen management

export class HomeScreenManager {
    constructor(game) {
        this.game = game;
        this.homeScreen = document.getElementById('home-screen');
        this.continueBtn = document.getElementById('home-continue-btn');
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
            this.hide();
        });
        
        // New Game button - start from Level 1
        this.newGameBtn.addEventListener('click', () => {
            console.log('🏠 New Game button clicked');
            
            // Cleanup tutorial if active
            if (window.uiController && window.uiController.tutorialManager.isActive) {
                console.log('🧹 Cleaning up tutorial before starting new game');
                window.uiController.tutorialManager.cleanup();
            }
            
            this.hide();
            this.game.newGame();
            
            if (window.uiController) {
                window.uiController.render();
                window.uiController.clearSolutionHelper();
                window.uiController.showFirstTimeInterstitial();
            }
        });
        
        // How to Play button - show intro tutorial
        this.howToPlayBtn.addEventListener('click', () => {
            console.log('🏠 How to Play clicked - showing intro tutorial');
            this.hide(800); // Slower fade for intro tutorial
            
            if (window.uiController) {
                window.uiController.showIntroTutorial();
            }
        });
        
        // Menu button
        this.menuBtn.addEventListener('click', () => {
            console.log('🏠 Menu button clicked from home screen');
            if (window.uiController && window.uiController.modals) {
                window.uiController.modals.showMenu();
            }
        });
    }
    
    show() {
        console.log('🏠 Showing home screen');
        
        // Update level display
        this.currentLevelSpan.textContent = this.game.level;
        
        // Show Continue button if player has played before
        // Check if there's saved game data by looking at the loaded game state
        const savedState = this.game.storage.loadGameState();
        const hasSavedGame = savedState && savedState.cards && savedState.cards.length > 0;
        
        console.log('🏠 Continue button check:', {
            hasSavedGame,
            level: this.game.level,
            cardsCount: savedState?.cards?.length || 0
        });
        
        if (hasSavedGame) {
            console.log(`🏠 ✅ Showing Continue button for Level ${this.game.level}`);
            this.continueBtn.classList.remove('hidden');
        } else {
            console.log('🏠 ❌ Hiding Continue button (no saved game)');
            this.continueBtn.classList.add('hidden');
        }
        
        this.homeScreen.classList.remove('hidden');
    }
    
    hide(duration = 400) {
        console.log(`🏠 Hiding home screen with fade (${duration}ms)`);
        
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

