// Level configuration and card generation

export const OPERATORS = {
    UNION: { symbol: '∪', name: 'Union', points: 10 },
    INTERSECTION: { symbol: '∩', name: 'Intersection', points: 10 },
    DIFFERENCE: { symbol: '−', name: 'Difference', points: 10 },
    COMPLEMENT: { symbol: '′', name: 'Complement', points: 15 },
    UNIVERSE: { symbol: 'U', name: 'Universe', points: 15 },
    NULL: { symbol: '∅', name: 'Null Set', points: 15 },
    EQUALS: { symbol: '=', name: 'Equals', points: 20 },
    SUBSET: { symbol: '⊆', name: 'Subset', points: 20 },
};

export const COLORS = ['red', 'blue', 'green', 'gold'];

export const LEVEL_CONFIG = [
    {
        level: 1,
        goalScore: 500,
        operators: ['UNION', 'INTERSECTION'],
        tutorial: {
            title: 'Welcome to Level 1!',
            text: `Learn the basics of set theory!
            
• Each card shows colored circles
• Dice represent colors or operations
• Create an expression that matches the goal number of cards
• ∪ (Union) = all cards with either color
• ∩ (Intersection) = all cards with both colors

Drag dice to the solution area and click GO!`
        }
    },
    {
        level: 2,
        goalScore: 750,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE'],
        tutorial: {
            title: 'Level 2: Difference',
            text: `New operator unlocked!
            
• − (Difference) = cards with first color but NOT second color
• Example: Red − Blue = cards with red circles but no blue
• More complex solutions = more points!`
        }
    },
    {
        level: 3,
        goalScore: 1000,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT'],
        tutorial: {
            title: 'Level 3: Complement',
            text: `Advanced operations!
            
• ′ (Prime/Complement) = all cards NOT in the set
• Example: Red′ = all cards without red
• Use complements for tricky puzzles!`
        }
    },
    {
        level: 4,
        goalScore: 1500,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT'],
        tutorial: {
            title: 'Level 4: Master the Basics',
            text: `You're getting the hang of it!
            
• All basic operators available
• Puzzles getting more challenging
• Keep building those complex expressions!`
        }
    },
    {
        level: 5,
        goalScore: 2500,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL'],
        tutorial: {
            title: 'Level 5: Special Sets',
            text: `New special set dice!
            
• U (Universe) = all cards on the board
• ∅ (Null Set) = no cards at all
• Use these in complex expressions!`
        }
    },
    {
        level: 6,
        goalScore: 5000,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 6: Restrictions',
            text: `Advanced restrictions unlocked!
            
• = (Equals) = sets must be identical
• ⊆ (Subset) = first set contained in second
• Higher points for restriction expressions!`
        }
    },
    {
        level: 7,
        goalScore: 5000,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 7: Expert Mode',
            text: `All operators available!
            
• Combine everything you've learned
• Find the most efficient solutions
• Maximum points await!`
        }
    },
    {
        level: 8,
        goalScore: 5000,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 8: Challenge',
            text: `Expert level challenges!
            
• Watch for special dice
• Think creatively about solutions
• You've got this!`
        }
    },
    {
        level: 9,
        goalScore: 7500,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 9: Master Class',
            text: `Nearly at the top!
            
• Most challenging puzzles yet
• Special dice may appear
• Push for those high scores!`
        }
    },
    {
        level: 10,
        goalScore: 10000,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 10: Ultimate Challenge',
            text: `The final level!
            
• Master all set theory concepts
• Achieve the highest scores
• Prove your mastery!`
        }
    }
];

// All 16 possible card combinations (power set of 4 colors)
const ALL_CARD_COMBINATIONS = [
    [],                                    // Empty (no colors)
    ['red'],                               // Single colors
    ['blue'],
    ['green'],
    ['gold'],
    ['red', 'blue'],                       // Two colors
    ['red', 'green'],
    ['red', 'gold'],
    ['blue', 'green'],
    ['blue', 'gold'],
    ['green', 'gold'],
    ['red', 'blue', 'green'],             // Three colors
    ['red', 'blue', 'gold'],
    ['red', 'green', 'gold'],
    ['blue', 'green', 'gold'],
    ['red', 'blue', 'green', 'gold']      // All colors
];

// Generate a random goal number using weighted distribution
export function generateGoal() {
    // Weighted array favoring 2, 3, and 4
    const goalArray = [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];
    const rndm = Math.floor(Math.random() * goalArray.length);
    return goalArray[rndm];
}

// Generate a random card configuration by selecting unique combinations
export function generateCardConfig(numCards = 8) {
    // Shuffle all 16 combinations
    const shuffled = [...ALL_CARD_COMBINATIONS].sort(() => Math.random() - 0.5);
    
    // Take the first numCards combinations
    return shuffled.slice(0, numCards).map(colors => ({ colors: [...colors] }));
}

// Generate dice for a level
export function generateDiceForLevel(level) {
    const config = LEVEL_CONFIG[level - 1];
    if (!config) return [];
    
    const dice = [];
    
    // Always generate exactly 4 color dice
    // Each color can appear 0, 1, or 2 times (max 2 of any color)
    const colorCounts = { red: 0, blue: 0, green: 0, gold: 0 };
    
    for (let i = 0; i < 4; i++) {
        // Get colors that haven't reached the limit of 2
        const availableColors = COLORS.filter(color => colorCounts[color] < 2);
        
        // Randomly select from available colors
        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        colorCounts[color]++;
        dice.push({ type: 'color', value: color });
    }
    
    // Add operator dice based on level
    // Levels 1-3: Always get exactly 2 operators (no duplicates)
    // Level 4+: Can get duplicate operators
    if (level < 4) {
        // Select 2 random operators from available pool (no duplicates)
        const availableOps = [...config.operators];
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * availableOps.length);
            const selectedOp = availableOps.splice(randomIndex, 1)[0];
            dice.push({ 
                type: 'operator', 
                value: OPERATORS[selectedOp].symbol, 
                name: selectedOp 
            });
        }
    } else {
        // Level 4+: Can get duplicates, randomly select 2
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * config.operators.length);
            const selectedOp = config.operators[randomIndex];
            dice.push({ 
                type: 'operator', 
                value: OPERATORS[selectedOp].symbol, 
                name: selectedOp 
            });
        }
    }
    
    return dice;
}

// Get level configuration
export function getLevelConfig(level) {
    return LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[0];
}

// Check if there are more levels
export function hasNextLevel(level) {
    return level < LEVEL_CONFIG.length;
}

