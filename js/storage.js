// Local storage management for game persistence

const STORAGE_VERSION = '1.0';
const STORAGE_KEY_PREFIX = 'readyset2_';

export class GameStorage {
    constructor() {
        this.keys = {
            version: `${STORAGE_KEY_PREFIX}version`,
            level: `${STORAGE_KEY_PREFIX}currentLevel`,
            highestLevel: `${STORAGE_KEY_PREFIX}highestLevel`,
            score: `${STORAGE_KEY_PREFIX}currentScore`,
            goalCards: `${STORAGE_KEY_PREFIX}goalCards`,
            cards: `${STORAGE_KEY_PREFIX}cards`,
            dice: `${STORAGE_KEY_PREFIX}dice`,
            solutions: `${STORAGE_KEY_PREFIX}solutions`,
            cardStates: `${STORAGE_KEY_PREFIX}cardStates`,
            tutorialShown: `${STORAGE_KEY_PREFIX}tutorialShown`, // DEPRECATED: Use tutorialsViewed instead
            tutorialsViewed: `${STORAGE_KEY_PREFIX}tutorialsViewed`, // NEW: Object tracking which level tutorials have been viewed
            isFirstGame: `${STORAGE_KEY_PREFIX}isFirstGame`,
            settings: `${STORAGE_KEY_PREFIX}settings`,
            timerStartTime: `${STORAGE_KEY_PREFIX}timerStartTime`,
            timerDuration: `${STORAGE_KEY_PREFIX}timerDuration`
        };
        
        this.checkVersion();
    }
    
    checkVersion() {
        const storedVersion = localStorage.getItem(this.keys.version);
        if (!storedVersion || storedVersion !== STORAGE_VERSION) {
            // Version mismatch or first time - keep highest level but reset current game
            const highestLevel = this.getHighestLevel();
            this.clear();
            if (highestLevel > 1) {
                this.saveHighestLevel(highestLevel);
            }
            localStorage.setItem(this.keys.version, STORAGE_VERSION);
        }
    }
    
    // Save entire game state
    saveGameState(gameState) {
        try {
            localStorage.setItem(this.keys.level, gameState.level);
            localStorage.setItem(this.keys.score, gameState.score);
            localStorage.setItem(this.keys.goalCards, gameState.goalCards);
            localStorage.setItem(this.keys.cards, JSON.stringify(gameState.cards));
            localStorage.setItem(this.keys.dice, JSON.stringify(gameState.dice));
            localStorage.setItem(this.keys.solutions, JSON.stringify(gameState.solutions));
            localStorage.setItem(this.keys.cardStates, JSON.stringify(gameState.cardStates));
            localStorage.setItem(this.keys.tutorialShown, gameState.tutorialShown);
            
            // Save timer state if active
            if (gameState.timerStartTime) {
                localStorage.setItem(this.keys.timerStartTime, gameState.timerStartTime);
                localStorage.setItem(this.keys.timerDuration, gameState.timerDuration);
            }
            
            // Update highest level
            this.saveHighestLevel(gameState.level);
            
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }
    
    // Load entire game state
    loadGameState() {
        try {
            const level = localStorage.getItem(this.keys.level);
            
            // If no saved game, return null
            if (!level) {
                return null;
            }
            
            const state = {
                level: parseInt(level) || 1,
                score: parseInt(localStorage.getItem(this.keys.score)) || 0,
                goalCards: parseInt(localStorage.getItem(this.keys.goalCards)) || 3,
                cards: JSON.parse(localStorage.getItem(this.keys.cards) || '[]'),
                dice: JSON.parse(localStorage.getItem(this.keys.dice) || '[]'),
                solutions: JSON.parse(localStorage.getItem(this.keys.solutions) || '[[]]'),
                cardStates: JSON.parse(localStorage.getItem(this.keys.cardStates) || '[]'),
                tutorialShown: localStorage.getItem(this.keys.tutorialShown) === 'true'
            };
            
            // Load timer state if present
            const timerStartTime = localStorage.getItem(this.keys.timerStartTime);
            const timerDuration = localStorage.getItem(this.keys.timerDuration);
            if (timerStartTime && timerDuration) {
                state.timerStartTime = parseInt(timerStartTime);
                state.timerDuration = parseInt(timerDuration);
            }
            
            return state;
        } catch (e) {
            console.error('Failed to load game state:', e);
            this.clear();
            return null;
        }
    }
    
    // Check if saved game exists
    hasSavedGame() {
        return localStorage.getItem(this.keys.level) !== null;
    }
    
    // Save highest level achieved
    saveHighestLevel(level) {
        const currentHighest = this.getHighestLevel();
        if (level > currentHighest) {
            localStorage.setItem(this.keys.highestLevel, level);
        }
    }
    
    // Get highest level achieved
    getHighestLevel() {
        return parseInt(localStorage.getItem(this.keys.highestLevel)) || 1;
    }
    
    // Check if first time playing
    isFirstGame() {
        const value = localStorage.getItem(this.keys.isFirstGame);
        if (value === null) {
            // First time ever
            localStorage.setItem(this.keys.isFirstGame, 'false');
            return true;
        }
        return false;
    }
    
    // Clear round state (keep level and score)
    clearRound() {
        localStorage.removeItem(this.keys.goalCards);
        localStorage.removeItem(this.keys.cards);
        localStorage.removeItem(this.keys.dice);
        localStorage.removeItem(this.keys.solutions);
        localStorage.removeItem(this.keys.cardStates);
        localStorage.removeItem(this.keys.timerStartTime);
        localStorage.removeItem(this.keys.timerDuration);
    }
    
    // Clear level state (keep highest level)
    clearLevel() {
        const highestLevel = this.getHighestLevel();
        this.clear();
        this.saveHighestLevel(highestLevel);
    }
    
    // Clear all game state
    clear() {
        Object.values(this.keys).forEach(key => {
            if (key !== this.keys.version && key !== this.keys.highestLevel) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // Reset everything (including highest level)
    reset() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        localStorage.setItem(this.keys.version, STORAGE_VERSION);
    }
    
    // Settings management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.keys.settings, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.keys.settings);
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        
        // Return default settings
        return {
            solutionHelper: false,
            testMode: false  // When enabled, use easy scores (50) for quick testing
        };
    }
    
    // Tutorial tracking methods
    /**
     * Check if tutorial has been viewed for a specific level
     * @param {number} level - Level number (1-10)
     * @returns {boolean} - True if tutorial was viewed
     */
    hasTutorialBeenViewed(level) {
        try {
            const viewed = localStorage.getItem(this.keys.tutorialsViewed);
            if (!viewed) return false;
            
            const tutorialsViewed = JSON.parse(viewed);
            return tutorialsViewed[level] === true;
        } catch (e) {
            console.error('Failed to check tutorial viewed status:', e);
            return false;
        }
    }
    
    /**
     * Mark tutorial as viewed for a specific level
     * @param {number} level - Level number (1-10)
     */
    markTutorialAsViewed(level) {
        try {
            let tutorialsViewed = {};
            
            const existing = localStorage.getItem(this.keys.tutorialsViewed);
            if (existing) {
                tutorialsViewed = JSON.parse(existing);
            }
            
            tutorialsViewed[level] = true;
            localStorage.setItem(this.keys.tutorialsViewed, JSON.stringify(tutorialsViewed));
            
            console.log(`✅ Tutorial for Level ${level} marked as viewed`);
            return true;
        } catch (e) {
            console.error('Failed to mark tutorial as viewed:', e);
            return false;
        }
    }
    
    /**
     * Clear all tutorial viewed statuses (for testing)
     */
    clearTutorialsViewed() {
        localStorage.removeItem(this.keys.tutorialsViewed);
        console.log('🗑️ Cleared all tutorial viewed statuses');
    }
}

