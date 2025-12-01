/**
 * Game Constants
 * Centralized configuration for magic numbers and layout values
 */

export const LAYOUT = {
    // Die sizes
    DIE_SIZE_DESKTOP: 80,
    DIE_SIZE_MOBILE: 50,
    
    // Spacing
    TUTORIAL_GAP: 15,
    BODY_PADDING_DESKTOP: 20,
    BODY_PADDING_MOBILE: 8,
    
    // Drag and drop
    MAX_OVERLAP_PERCENT: 20,
    DRAG_THRESHOLD: 5,  // pixels before drag is considered "moved"
    SNAP_STEP: 5,
    SNAP_MAX_STEPS: 50,
    
    // Breakpoints
    MOBILE_BREAKPOINT: 768,
};

export const GAME = {
    TOTAL_CARDS: 16,
    BOARD_SIZE: 8,
    MAX_DICE_LEVEL_1_4: 6,
    MAX_DICE_LEVEL_5_PLUS: 8,
};

export const COLORS = {
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    GOLD: 'gold',
};

export const OPERATORS = {
    UNION: '∪',
    INTERSECTION: '∩',
    DIFFERENCE: '−',
    COMPLEMENT: '′',
    UNIVERSE: 'U',
    NULL: '∅',
    SUBSET: '⊆',
    EQUALS: '=',
};

// Helper function: Get die size based on viewport
export function getDieSize() {
    return window.innerWidth <= LAYOUT.MOBILE_BREAKPOINT 
        ? LAYOUT.DIE_SIZE_MOBILE 
        : LAYOUT.DIE_SIZE_DESKTOP;
}

// Helper function: Check if mobile
export function isMobile() {
    return window.innerWidth <= LAYOUT.MOBILE_BREAKPOINT;
}

// UI State Constants
export const UI_VIEWS = {
    HOME: 'home',
    LEVEL_INTERSTITIAL: 'level-interstitial',
    DAILY_INTRO: 'daily-intro',
    DAILY_RESULT: 'daily-result',
    GAMEPLAY: 'gameplay',
};

export const GAMEPLAY_MODES = {
    REGULAR: 'regular',
    TUTORIAL: 'tutorial',
    DAILY: 'daily',
};

export const MODALS = {
    NONE: null,
    MENU: 'menu',
    PASS: 'pass',
    RESULT: 'result',
    TIMEOUT: 'timeout',
};

