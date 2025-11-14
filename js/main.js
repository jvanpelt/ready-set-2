// Main entry point for the game

import { Game } from './game.js';
import { UIController } from './ui/UIController.js';
import { AppScaler } from './ui/AppScaler.js';
import { HomeScreenManager } from './ui/HomeScreenManager.js';
import DailyPuzzleManager from './DailyPuzzleManager.js';

// Display version (hardcoded for console, cache busting uses timestamps)
const VERSION = 'v4.18.3';
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎮 Ready, Set 2 - Version:', VERSION);
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
        
        // Initialize home screen
        console.log('🏠 Initializing HomeScreenManager...');
        const homeScreen = new HomeScreenManager(game);
        window.homeScreen = homeScreen; // Make accessible globally
        console.log('✅ HomeScreenManager initialized');
        
        // Initialize daily puzzle manager
        console.log('🎲 Initializing DailyPuzzleManager...');
        const settings = game.storage.loadSettings();
        const dailyPuzzleManager = new DailyPuzzleManager(game, ui, settings);
        window.dailyPuzzleManager = dailyPuzzleManager; // Make accessible globally
        console.log('✅ DailyPuzzleManager initialized');
        
        // Show home screen on load
        console.log('🏠 Showing home screen');
        homeScreen.show();
        
        // Check if first time playing (Level 1, new game) - only trigger after home screen is dismissed
        // We'll handle this in the HomeScreenManager's play button click
        
        // Make game accessible for debugging
        window.game = game;
        window.ui = ui;
        
        console.log('✅ Game initialization complete!');
    } catch (error) {
        console.error('❌ FATAL ERROR during initialization:', error);
        console.error('Stack trace:', error.stack);
    }
});

