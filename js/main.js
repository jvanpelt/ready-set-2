// Main entry point for the game

import { Game } from './game.js';
import { UIController } from './ui/UIController.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new Game();
    
    // Create UI Controller instance (coordinates all UI modules)
    const ui = new UIController(game, () => {
        // Callback for updates if needed
    });
    
    // Initial render
    ui.render();
    
    // Show tutorial for first time players
    ui.showTutorialIfNeeded();
    
    // Make game accessible for debugging
    window.game = game;
    window.ui = ui;
});

