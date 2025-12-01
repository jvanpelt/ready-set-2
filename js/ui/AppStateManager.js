import { UI_VIEWS, GAMEPLAY_MODES, MODALS } from '../constants.js';

/**
 * AppStateManager
 * 
 * Central state tracker for the entire application.
 * Tracks current view, gameplay mode, and modal sub-state.
 * Fires events when state changes so other systems can respond.
 * 
 * State Model:
 * {
 *   view: 'home' | 'level-interstitial' | 'daily-intro' | 'daily-result' | 'gameplay'
 *   mode: null | 'regular' | 'tutorial' | 'daily'  (only when view='gameplay')
 *   modal: null | 'menu' | 'settings' | 'pass' | 'result' | 'timeout' | 'puzzle-builder'
 *   data: {}  (optional contextual data like level number, puzzle info, etc.)
 * }
 */
export class AppStateManager {
    constructor() {
        // Current state
        this.currentState = {
            view: null,
            mode: null,
            modal: null,
            data: {}
        };
        
        // Previous state (for debugging and potential "back" functionality)
        this.previousState = null;
        
        // Event listeners
        this.listeners = [];
        
        console.log('🎭 AppStateManager initialized');
    }
    
    /**
     * Get current state (returns a copy to prevent external mutation)
     */
    getState() {
        return {
            view: this.currentState.view,
            mode: this.currentState.mode,
            modal: this.currentState.modal,
            data: { ...this.currentState.data }
        };
    }
    
    /**
     * Set new state and fire change event
     * @param {Object} newState - Partial state object (only include properties that are changing)
     *   @param {string} [newState.view] - Primary view
     *   @param {string} [newState.mode] - Gameplay mode (only relevant for gameplay view)
     *   @param {string|null} [newState.modal] - Modal overlay (or null to close modal)
     *   @param {Object} [newState.data] - Contextual data
     */
    setState(newState) {
        const oldState = this.getState();
        
        // Merge new state with current state
        const mergedState = {
            view: newState.view !== undefined ? newState.view : this.currentState.view,
            mode: newState.mode !== undefined ? newState.mode : this.currentState.mode,
            modal: newState.modal !== undefined ? newState.modal : this.currentState.modal,
            data: newState.data !== undefined ? { ...this.currentState.data, ...newState.data } : this.currentState.data
        };
        
        // Check if anything actually changed
        const hasChanged = 
            mergedState.view !== oldState.view ||
            mergedState.mode !== oldState.mode ||
            mergedState.modal !== oldState.modal;
        
        if (!hasChanged) {
            console.log(`🎭 State unchanged, skipping transition:`, mergedState);
            return;
        }
        
        // Validate state
        if (mergedState.view && !Object.values(UI_VIEWS).includes(mergedState.view)) {
            console.error(`❌ Invalid view: ${mergedState.view}`);
            return;
        }
        
        if (mergedState.mode && !Object.values(GAMEPLAY_MODES).includes(mergedState.mode)) {
            console.error(`❌ Invalid mode: ${mergedState.mode}`);
            return;
        }
        
        if (mergedState.modal && !Object.values(MODALS).includes(mergedState.modal)) {
            console.error(`❌ Invalid modal: ${mergedState.modal}`);
            return;
        }
        
        // Update state
        this.previousState = oldState;
        this.currentState = mergedState;
        
        console.log(`🎭 State changed:`, {
            from: oldState,
            to: mergedState
        });
        
        // Fire event to all listeners
        this.emit('stateChanged', {
            from: oldState,
            to: mergedState
        });
    }
    
    /**
     * Convenience method: Open a modal
     */
    openModal(modalName) {
        this.setState({ modal: modalName });
    }
    
    /**
     * Convenience method: Close current modal
     */
    closeModal() {
        this.setState({ modal: null });
    }
    
    /**
     * Register a listener for state changes
     * @param {string} event - Event name (currently only 'stateChanged')
     * @param {Function} callback - Function to call when event fires
     */
    on(event, callback) {
        if (event === 'stateChanged') {
            this.listeners.push(callback);
        }
    }
    
    /**
     * Fire an event to all listeners
     */
    emit(event, data) {
        if (event === 'stateChanged') {
            this.listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Error in state change listener:', error);
                }
            });
        }
    }
    
    /**
     * Debug helper: Log current state
     */
    logState() {
        console.log('🎭 Current State:', this.getState());
    }
}

