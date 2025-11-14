// Local storage management for game persistence

const STORAGE_VERSION = '1.0';
const STORAGE_KEY_PREFIX = 'readyset2_';

export class GameStorage {
    constructor() {
        this.keys = {
            version: `${STORAGE_KEY_PREFIX}version`,
            // Regular game state (persistent across sessions)
            regularGame: `${STORAGE_KEY_PREFIX}regularGame`,
            // Daily puzzle state (temporary, cleared when exiting daily mode)
            dailyPuzzle: `${STORAGE_KEY_PREFIX}dailyPuzzle`,
            // Legacy keys (for backward compatibility)
            level: `${STORAGE_KEY_PREFIX}currentLevel`,
            highestLevel: `${STORAGE_KEY_PREFIX}highestLevel`,
            score: `${STORAGE_KEY_PREFIX}currentScore`,
            goalCards: `${STORAGE_KEY_PREFIX}goalCards`,
            cards: `${STORAGE_KEY_PREFIX}cards`,
            dice: `${STORAGE_KEY_PREFIX}dice`,
            solutions: `${STORAGE_KEY_PREFIX}solutions`,
            cardStates: `${STORAGE_KEY_PREFIX}cardStates`,
            tutorialShown: `${STORAGE_KEY_PREFIX}tutorialShown`,
            tutorialsViewed: `${STORAGE_KEY_PREFIX}tutorialsViewed`,
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
    
    // Save regular game state (persistent)
    saveGameState(gameState) {
        try {
            const state = {
                level: gameState.level,
                score: gameState.score,
                goalCards: gameState.goalCards,
                cards: gameState.cards,
                dice: gameState.dice,
                solutions: gameState.solutions,
                cardStates: gameState.cardStates,
                tutorialShown: gameState.tutorialShown,
                timerStartTime: gameState.timerStartTime,
                timerDuration: gameState.timerDuration
            };
            
            localStorage.setItem(this.keys.regularGame, JSON.stringify(state));
            
            // Update highest level
            this.saveHighestLevel(gameState.level);
            
            return true;
        } catch (e) {
            console.error('Failed to save regular game state:', e);
            return false;
        }
    }
    
    // Save daily puzzle state (temporary)
    saveDailyPuzzleState(gameState) {
        try {
            const state = {
                cards: gameState.cards,
                dice: gameState.dice,
                goalCards: gameState.goalCards,
                solutions: gameState.solutions,
                cardStates: gameState.cardStates,
                dailyPuzzle: gameState.dailyPuzzle
            };
            
            localStorage.setItem(this.keys.dailyPuzzle, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save daily puzzle state:', e);
            return false;
        }
    }
    
    // Load regular game state
    loadGameState() {
        try {
            // Try new format first (single JSON object)
            const regularGameData = localStorage.getItem(this.keys.regularGame);
            if (regularGameData) {
                return JSON.parse(regularGameData);
            }
            
            // Fall back to legacy format (multiple keys)
            const level = localStorage.getItem(this.keys.level);
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
            
            // Migrate to new format
            this.saveGameState(state);
            
            return state;
        } catch (e) {
            console.error('Failed to load regular game state:', e);
            return null;
        }
    }
    
    // Load daily puzzle state
    loadDailyPuzzleState() {
        try {
            const dailyPuzzleData = localStorage.getItem(this.keys.dailyPuzzle);
            if (!dailyPuzzleData) {
                return null;
            }
            return JSON.parse(dailyPuzzleData);
        } catch (e) {
            console.error('Failed to load daily puzzle state:', e);
            return null;
        }
    }
    
    // Clear daily puzzle state
    clearDailyPuzzleState() {
        localStorage.removeItem(this.keys.dailyPuzzle);
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
            solutionHelper: true,  // On by default - it's a great feature!
            testMode: false,  // When enabled, use easy scores (50) for quick testing
            theme: 'default'  // Default theme
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

