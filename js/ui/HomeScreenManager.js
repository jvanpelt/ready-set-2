// Home Screen management

import { UI_VIEWS, GAMEPLAY_MODES, MODALS } from '../constants.js';

export class HomeScreenManager {
    constructor(game) {
        this.game = game;
        this.homeScreen = document.getElementById('home-screen');
        this.continueBtn = document.getElementById('home-continue-btn');
        this.dailyPuzzleBtn = document.getElementById('home-daily-puzzle-btn');
        this.freePlayBtn = document.getElementById('home-free-play-btn');
        this.newGameBtn = document.getElementById('home-new-game-btn');
        this.howToPlayBtn = document.getElementById('home-how-to-play-btn');
        this.menuBtn = document.getElementById('home-menu-btn');
        this.currentLevelSpan = document.getElementById('home-current-level');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Continue button - resume current level via interstitial
        this.continueBtn.addEventListener('click', async () => {
            console.log('🏠 Continue button clicked');
            
            // If coming from daily puzzle, animate out old content first
            if (this.game.mode === 'daily') {
                console.log('🎬 Animating out daily puzzle content...');
                if (window.uiController) {
                    await Promise.all([
                        window.uiController.renderer.animateCardsOut(),
                        window.uiController.renderer.animateDiceOut()
                    ]);
                }
            }
            
            // Enter regular game mode (handles all state restoration)
            this.game.enterRegularMode();
            
            if (window.uiController) {
                // Transition to level interstitial state
                window.uiController.stateManager.setState({
                    view: UI_VIEWS.LEVEL_INTERSTITIAL,
                    data: { level: this.game.level }
                });
                
                // Render and show interstitial for current level
                window.uiController.render();
                window.uiController.clearSolutionHelper();
                
                // Show interstitial (this will hide home screen with proper z-index layering)
                await window.uiController.showTutorialForLevel(this.game.level);
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
        
        // Free Play button - start Free Play mode (Level 10 difficulty, cumulative scoring)
        this.freePlayBtn.addEventListener('click', async () => {
            console.log('🎮 Free Play button clicked');
            
            // Cleanup tutorial if active
            if (window.uiController && window.uiController.tutorialManager.isActive) {
                console.log('🧹 Cleaning up tutorial before starting Free Play');
                window.uiController.tutorialManager.cleanup();
            }
            
            // If coming from daily puzzle, animate out old content first
            if (this.game.mode === 'daily') {
                console.log('🎬 Animating out daily puzzle content...');
                if (window.uiController) {
                    await Promise.all([
                        window.uiController.renderer.animateCardsOut(),
                        window.uiController.renderer.animateDiceOut()
                    ]);
                }
            }
            
            // Enter Free Play mode
            this.game.enterFreePlayMode();
            
            if (window.uiController) {
                // Transition to gameplay state
                window.uiController.stateManager.setState({
                    view: UI_VIEWS.GAMEPLAY,
                    mode: GAMEPLAY_MODES.FREEPLAY
                });
                
                // Render and animate in
                window.uiController.render();
                window.uiController.clearSolutionHelper();
                
                // Animate in cards and dice
                await Promise.all([
                    window.uiController.renderer.animateCardsIn(),
                    window.uiController.renderer.animateDiceIn()
                ]);
            }
        });
        
        // New Game button - start from Level 1
        this.newGameBtn.addEventListener('click', async () => {
            // DEBUG: console.log('🏠 New Game button clicked');
            
            this.game.newGame();
            
            if (window.uiController) {
                // Transition to level interstitial
                window.uiController.stateManager.setState({
                    view: UI_VIEWS.LEVEL_INTERSTITIAL,
                    data: { level: 1 }
                });
                
                window.uiController.render(); // Render WITHOUT animation first
                window.uiController.clearSolutionHelper();
                window.uiController.showFirstTimeInterstitial(); // Shows interstitial, will animate on dismiss
            }
        });
        
        // How to Play button - show intro tutorial
        this.howToPlayBtn.addEventListener('click', async () => {
            // DEBUG: console.log('🏠 How to Play clicked - showing intro tutorial');
            
            if (window.uiController) {
                // Transition to tutorial mode
                window.uiController.stateManager.setState({
                    view: UI_VIEWS.GAMEPLAY,
                    mode: GAMEPLAY_MODES.TUTORIAL
                });
                
                window.uiController.showIntroTutorial('home-screen');
            }
        });
        
        // Menu button
        this.menuBtn.addEventListener('click', () => {
            // DEBUG: console.log('🏠 Menu button clicked from home screen');
            if (window.uiController && window.uiController.stateManager) {
                window.uiController.stateManager.openModal(MODALS.MENU);
            }
        });
    }
    
    show() {
        // Notify state manager if available
        if (window.uiController && window.uiController.stateManager) {
            window.uiController.stateManager.setState({
                view: UI_VIEWS.HOME
            });
        }
        
        // Update level display
        this.currentLevelSpan.textContent = this.game.level;
        
        // Show Continue button if player has played before
        // Check if there's saved game data by looking at the loaded game state
        const savedState = this.game.storage.loadGameState();
        const hasSavedGame = savedState && savedState.cards && savedState.cards.length > 0;
        
        // Check if player has beaten the game (completed level 10)
        const hasBeatenGame = this.game.storage.hasGameBeenCompleted();
        
        // Free Play is available if player has ever beaten the game
        if (hasBeatenGame) {
            this.freePlayBtn.classList.remove('hidden');
        } else {
            this.freePlayBtn.classList.add('hidden');
        }
        
        // Continue button shows if there's a saved game in progress
        // (independent of whether they've beaten the game before)
        if (hasSavedGame) {
            this.continueBtn.classList.remove('hidden');
        } else {
            this.continueBtn.classList.add('hidden');
        }
        
        // Update New Game button text based on whether player has started
        if (hasSavedGame || hasBeatenGame) {
            this.newGameBtn.textContent = '🚀 New Career';
        } else {
            this.newGameBtn.textContent = '🚀 Start Career';
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

