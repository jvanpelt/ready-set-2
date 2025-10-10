// Home Screen management

export class HomeScreenManager {
    constructor(game) {
        this.game = game;
        this.homeScreen = document.getElementById('home-screen');
        this.playBtn = document.getElementById('home-play-btn');
        this.howToPlayBtn = document.getElementById('home-how-to-play-btn');
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
            console.log('🏠 How to Play clicked - forcing Level 1 tutorial');
            this.hide();
            
            // Always show Level 1 interstitial when "How to Play" is clicked
            if (window.uiController) {
                window.uiController.showFirstTimeInterstitial();
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
        console.log('🏠 Hiding home screen');
        this.homeScreen.classList.add('hidden');
    }
    
    isVisible() {
        return !this.homeScreen.classList.contains('hidden');
    }
}

