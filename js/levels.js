// Level configuration and card generation

// All non-color dice (operators, set constants, and restrictions)
export const OPERATORS = {
    // Regular operators (set operations)
    UNION: { symbol: '∪', name: 'Union', points: 10 },
    INTERSECTION: { symbol: '∩', name: 'Intersection', points: 10 },
    DIFFERENCE: { symbol: '−', name: 'Difference', points: 10 },
    COMPLEMENT: { symbol: '′', name: 'Complement', points: 15 },
    // Set constants (predefined sets, like colors)
    UNIVERSE: { symbol: 'U', name: 'Universe', points: 15 },
    NULL: { symbol: '∅', name: 'Null Set', points: 15 },
    // Restrictions (constraints/comparisons)
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
        numDice: 8, // Increase from 6 to 8 dice
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL'],
        tutorial: {
            title: 'Level 5: Universe & Null',
            text: `Welcome to Level 5 with 2 new cubes and a new concept: padding!

• U (Universe) refers to the set of ALL cards
• Use it like other color cubes, combining with operators
• Example: U ∩ Red = all cards AND red cards = just red cards

• ∅ (Null) is an empty set containing NO cards
• Example: Green − ∅ = green minus null = just green

• Padding: Use Universe and Null to add extra cubes to your solution
• More cubes = MORE POINTS!
• Try padding your solutions to boost your scores!`
        }
    },
    {
        level: 6,
        goalScore: 5000,
        numDice: 8,
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 6: Restrictions',
            text: `Welcome to Level 6: RESTRICTIONS change everything!

**Two Solution Rows:**
• Top row (now unlocked): Restrictions
• Bottom row: Set name

**Subset (⊆):** Red ⊆ Blue means "all red cards must contain blue"
• Any red cards without blue are FLIPPED OUT of the universe
• Your set name only considers cards that remain

**Equals (=):** Red = Blue means "red and blue are identical"
• Cards with red-but-not-blue OR blue-but-not-red are flipped out
• Only cards with BOTH colors remain

**Double-tap cards** to manually flip them out of the universe!

Restrictions let you use ALL 8 cubes for MASSIVE points!`
        }
    },
    {
        level: 7,
        goalScore: 5000,
        numDice: 8,
        timeLimit: 180, // 3 minutes
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 7: Beat the Clock!',
            text: `New challenge: TIME LIMIT!

⏱️ You now have 3 MINUTES per puzzle!
• Timer counts down from 180 seconds
• Submit before time runs out!
• If time expires, the round ends and you start fresh

Work quickly but stay focused!`
        }
    },
    {
        level: 8,
        goalScore: 5000,
        numDice: 8,
        timeLimit: 180, // 3 minutes
        requiredCubeChance: 0.5, // 50% chance of required cube
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 8: Required Cubes!',
            text: `New challenge: REQUIRED CUBES!

🟩 REQUIRED CUBE (Green Border)
• When present, you MUST use it in your solution
• Worth 50 points!
• Only appears sometimes (50% chance)
• Your solution won't be valid without it

Keep an eye out for that green border!`
        }
    },
    {
        level: 9,
        goalScore: 7500,
        numDice: 8,
        timeLimit: 150, // 2.5 minutes - harder!
        requiredCubeChance: 0.33, // 33% chance of required cube
        wildCubeChance: 0.33, // 33% chance of wild cube (cannot have both)
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        tutorial: {
            title: 'Level 9: Wild Cubes!',
            text: `For once, we're making things easier!

🎴 WILD CUBE (Red Border with ?)
• Can be ANY operator (∪, ∩, −, ′)
• Click it in your solution to choose which operator
• Worth 25 points!
• 33% chance to appear

Try different operators until one works - or strategize!`
        }
    },
    {
        level: 10,
        goalScore: 10000,
        numDice: 8,
        timeLimit: 120, // 2 minutes - ultimate challenge!
        operators: ['UNION', 'INTERSECTION', 'DIFFERENCE', 'COMPLEMENT', 'UNIVERSE', 'NULL', 'EQUALS', 'SUBSET'],
        requiredCubeChance: 0.25,  // 25% chance of required cube
        wildCubeChance: 0.25,       // 25% chance of wild cube
        bonusCubeChance: 0.25,      // 25% chance of bonus cube (50 free points!)
        // 25% chance of no special cube
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
    // Excludes 0 and 8 (can't use single U or ∅ as solution)
    const goalArray = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];
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
    const numDice = config.numDice || 6; // Default to 6 dice, Level 5+ uses 8
    
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
    
    // Separate operators from special sets (Universe, Null)
    const regularOperators = config.operators.filter(op => !['UNIVERSE', 'NULL'].includes(op));
    const specialSets = config.operators.filter(op => ['UNIVERSE', 'NULL'].includes(op));
    
    // Add regular operator dice (2 dice)
    // Levels 1-3: Always get exactly 2 operators (no duplicates)
    // Level 4+: Can get duplicate operators
    if (level < 4) {
        // Select 2 random operators from available pool (no duplicates)
        const availableOps = [...regularOperators];
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
            const randomIndex = Math.floor(Math.random() * regularOperators.length);
            const selectedOp = regularOperators[randomIndex];
            dice.push({ 
                type: 'operator', 
                value: OPERATORS[selectedOp].symbol, 
                name: selectedOp 
            });
        }
    }
    
    // Level 5+: Add 2 special set dice (Universe and/or Null)
    if (numDice === 8 && specialSets.length > 0) {
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * specialSets.length);
            const selectedSet = specialSets[randomIndex];
            dice.push({ 
                type: 'operator', // U and ∅ are treated as operators in evaluation
                value: OPERATORS[selectedSet].symbol, 
                name: selectedSet 
            });
        }
    }
    
    // Level 8+: Randomly designate special cubes (required, wild, or bonus)
    // Only ONE special cube type per round (never multiple types together)
    const rnd = Math.random();
    
    if (config.requiredCubeChance && rnd < config.requiredCubeChance) {
        // Required cube: any dice can be required
        const randomIndex = Math.floor(Math.random() * dice.length);
        dice[randomIndex].isRequired = true;
    } else if (config.wildCubeChance && rnd < (config.requiredCubeChance || 0) + config.wildCubeChance) {
        // Wild cube: replace one of the operator dice (indices 4 or 5)
        const operatorIndex = 4 + Math.floor(Math.random() * 2); // Either 4 or 5
        dice[operatorIndex] = {
            type: 'wild',
            value: '?',
            name: 'WILD',
            selectedOperator: null // Will be set by user in UI
        };
    } else if (config.bonusCubeChance && rnd < (config.requiredCubeChance || 0) + (config.wildCubeChance || 0) + config.bonusCubeChance) {
        // Bonus cube: any dice can be bonus (Level 10)
        const randomIndex = Math.floor(Math.random() * dice.length);
        dice[randomIndex].isBonus = true;
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

