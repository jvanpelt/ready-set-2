// Home Screen management

export class HomeScreenManager {
    constructor(game) {
        this.game = game;
        this.homeScreen = document.getElementById('home-screen');
        this.playBtn = document.getElementById('home-play-btn');
        this.howToPlayBtn = document.getElementById('home-how-to-play-btn');
        this.menuBtn = document.getElementById('home-menu-btn');
        this.currentLevelSpan = document.getElementById('home-current-level');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.playBtn.addEventListener('click', () => {
            console.log('🏠 Play button clicked');
            this.hide();
            
            // Check if first time playing
            const isFirstTime = this.game.level === 1 && !localStorage.getItem('rs2_tutorialShown_1');
            
            if (isFirstTime && window.uiController) {
                console.log('👋 First time player - showing Level 1 interstitial');
                window.uiController.showFirstTimeInterstitial();
            }
        });
        
        this.howToPlayBtn.addEventListener('click', () => {
            console.log('🏠 How to Play clicked - showing intro tutorial');
            this.hide();
            
            // Show intro tutorial when "How to Play" is clicked
            if (window.uiController) {
                window.uiController.showIntroTutorial();
            }
        });
        
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
        this.homeScreen.classList.remove('hidden');
    }
    
    hide() {
        console.log('🏠 Hiding home screen with fade');
        // First fade out
        this.homeScreen.classList.add('fade-out');
        
        // Then hide after transition completes
        setTimeout(() => {
            this.homeScreen.classList.add('hidden');
            this.homeScreen.classList.remove('fade-out');
        }, 400); // Match CSS transition duration
    }
    
    isVisible() {
        return !this.homeScreen.classList.contains('hidden');
    }
}

