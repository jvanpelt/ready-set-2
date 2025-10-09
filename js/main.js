// Main entry point for the game

import { Game } from './game.js';
import { UIController } from './ui/UIController.js';
import { AppScaler } from './ui/AppScaler.js';

// Extract and log version from script tag
const scriptTag = document.querySelector('script[src*="main.js"]');
const version = scriptTag ? new URLSearchParams(scriptTag.src.split('?')[1]).get('v') : 'unknown';
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎮 Ready, Set 2 - Version:', version);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded - initializing game');
    
    try {
        // Create game instance
        console.log('📦 Creating Game instance...');
        const game = new Game();
        console.log('✅ Game instance created');
        
        // Create UI Controller instance (coordinates all UI modules)
        console.log('🎨 Creating UIController instance...');
        const ui = new UIController(game, () => {
            // Callback for updates if needed
        });
        console.log('✅ UIController instance created');
        
        // Make UI controller globally accessible for modal callbacks
        window.uiController = ui;
        
        // Initial render
        console.log('🖼️ Rendering initial UI...');
        ui.render();
        console.log('✅ Initial render complete');
        
        // Initialize app scaler (scales #app to fit above tutorial bar)
        console.log('📐 Initializing AppScaler...');
        const appScaler = new AppScaler();
        window.appScaler = appScaler; // Make accessible globally
        console.log('✅ AppScaler initialized');
        
        // Check if first time playing (Level 1, new game)
        const isFirstTime = game.level === 1 && !localStorage.getItem('rs2_tutorialShown_1');
        
        if (isFirstTime) {
            // Show Level 1 interstitial for new players
            console.log('👋 First time player - showing Level 1 interstitial');
            ui.showFirstTimeInterstitial();
        } else {
            // Show tutorial for returning players
            console.log('📚 Checking for tutorial...');
            ui.showTutorialIfNeeded();
            console.log('✅ Tutorial check complete');
        }
        
        // Make game accessible for debugging
        window.game = game;
        window.ui = ui;
        
        console.log('✅ Game initialization complete!');
    } catch (error) {
        console.error('❌ FATAL ERROR during initialization:', error);
        console.error('Stack trace:', error.stack);
    }
});

