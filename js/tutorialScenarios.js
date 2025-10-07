/**
 * Tutorial Scenarios - Hand-crafted first puzzles for each level
 * These are used when players choose "Show Me How" on the interstitial screen
 */

export const TUTORIAL_SCENARIOS = {
    1: {
        // Cards: 3 without red/blue, 5 with red or blue
        // 1=gold, 2=green, 3=green+gold (no red/blue)
        // 4=blue, 5=blue+gold, 8=red, 9=red+gold, 10=red+green (have red/blue)
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-1-red' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-1-blue' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-1-union' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-1-green' }
        ],
        goal: 5,
        expectedSolution: ['red', '∪', 'blue'], // Must use these exact dice
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome! Let\'s learn the <strong>Union</strong> operator. It means "either/or".',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>5 cards</strong>. Look at the goal number above.',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-union',
                    message: '<strong>Red Union Blue</strong> means "all cards with red OR blue (or both)".',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'drag-red',
                    message: 'First, drag the <strong>RED</strong> cube to the solution area.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Great! Now drag the <strong>UNION</strong> cube next to it. (It has two overlapping circles.)',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '∪');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Perfect! Finally, drag the <strong>BLUE</strong> cube to complete your solution.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Your solution says: "All cards with red OR blue". Count them - 5 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'submit',
                    message: 'Now click the <strong>GO!</strong> button to submit your solution!',
                    highlight: { goButton: true },
                    validation: (game) => false, // Will be completed by submission
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    2: {
        // Level 2: Difference operator (−)
        // Cards: Need a good example of A − B
        // Let's do: green − blue (cards with green but NOT blue)
        // 2=green, 3=green+gold, 6=green+blue, 10=green+red (4 have green)
        // 6=green+blue is the only one with both green AND blue
        // So green − blue = 2, 3, 10 (3 cards)
        cards: [1, 2, 3, 6, 8, 10, 12, 13],
        dice: [
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-2-green' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-2-diff' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-2-blue' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-2-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-2-union' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-2-intersect' }
        ],
        goal: 3,
        expectedSolution: ['green', '−', 'blue'], // Must use these exact dice
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 2! Let\'s learn the <strong>Difference</strong> operator.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-difference',
                    message: '<strong>Difference</strong> means "cards in A, but NOT in B". It subtracts B from A.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>3 cards</strong>. Let\'s build "Green Difference Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-example',
                    message: '<strong>Green Difference Blue</strong> = "All cards with green, but NOT blue". Think: green EXCEPT blue.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'drag-green',
                    message: 'First, drag the <strong>GREEN</strong> cube to the solution area.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'green');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-diff',
                    message: 'Great! Now drag the <strong>DIFFERENCE</strong> cube. (It has a minus sign.)',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '−');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Perfect! Finally, drag the <strong>BLUE</strong> cube to complete your solution.',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Your solution says: "Cards with green, but NOT blue". Count them - 3 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'submit',
                    message: 'Excellent! Now click <strong>GO!</strong> to submit your solution!',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    3: {
        // Level 3: Complement (Prime) operator
        // Example: gold' (all cards that are NOT gold)
        // Cards: 5 without gold (yellow), 3 with gold (yellow)
        // 1=gold, 5=blue+gold, 9=red+gold (3 with gold)
        // 2=green, 4=blue, 6=blue+green, 8=red, 10=red+green (5 without gold)
        cards: [1, 2, 4, 5, 6, 8, 9, 10],
        dice: [
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-3-yellow' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-3-prime' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-3-red' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-3-intersect' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-3-union' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-3-diff' }
        ],
        goal: 5,
        expectedSolution: ['gold', '′'], // Must use these exact dice
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 3! Meet the <strong>Complement</strong> operator. Think "Opposite Day."',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-complement',
                    message: '<strong>Complement</strong> (the prime symbol) means "NOT this". It\'s the opposite or inverse.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>5 cards</strong>. Let\'s build "Yellow Complement" (all cards that are NOT yellow).',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-yellow',
                    message: 'First, drag the <strong>YELLOW</strong> cube to the solution area.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'gold');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-prime',
                    message: 'Great! Now drag the <strong>COMPLEMENT</strong> cube. (It has the prime symbol ′)',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '′');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Your solution "Yellow Complement" means: "All cards that are NOT yellow". Count them - 5 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-power',
                    message: 'Complement is powerful! It gets tricky when combined with other operators. Experiment!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'submit',
                    message: 'Perfect! Now click <strong>GO!</strong> to submit your solution!',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    4: {
        // Level 4: Duplicate operators - use intersection twice!
        // Example: red ∩ blue ∩ green = cards with ALL THREE colors
        // Card 14 (bitwise: 1110 = 8+4+2) = red+blue+green (ONLY card with all three - no card 15!)
        // Bitwise encoding: bit3=red(8), bit2=blue(4), bit1=green(2), bit0=gold(1)
        // Cards: 1=gold, 2=green, 4=blue, 6=blue+green, 8=red, 10=red+green, 12=red+blue, 14=red+blue+green
        cards: [1, 2, 4, 6, 8, 10, 12, 14],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-4-red' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-4-intersect-1' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-4-blue' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-4-intersect-2' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-4-green' },
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-4-gold' }
        ],
        goal: 1,
        expectedSolution: ['red', '∩', 'blue', '∩', 'green'], // Must use all 5 dice!
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 4! Time to learn something powerful...',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'duplicate-operators',
                    message: 'Look at your dice! You have <strong>TWO Intersection operators</strong> (the ones with overlapping circles). You can use the same operator multiple times!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 5000
                },
                {
                    id: 'explain-double-intersect',
                    message: 'We can chain operators: <strong>Red ∩ Blue ∩ Green</strong> means "cards with red AND blue AND green".',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 5000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>1 card</strong>. Only one card has all three colors!',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Start with <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-intersect-1',
                    message: 'Now drag the first <strong>INTERSECTION</strong> cube.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].filter(die => die.value === '∩').length >= 1;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Add <strong>BLUE</strong>. Now we have "cards with red AND blue".',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-intersect-2',
                    message: 'Add the second <strong>INTERSECTION</strong> cube. We\'re not done yet!',
                    highlight: { dice: [3] },
                    validation: (game) => {
                        return game.solutions[1].filter(die => die.value === '∩').length >= 2;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-green',
                    message: 'Finally, add <strong>GREEN</strong>. Now we have all cards with red AND blue AND green!',
                    highlight: { dice: [4] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'green');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Perfect! You used <strong>5 cubes</strong> to find 1 very specific card. More cubes = more points!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'submit',
                    message: 'Duplicate operators unlock complex solutions. Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    5: {
        // Level 5: Universe and Null set (8 dice, padding concept)
        // Example: U − (Red ∪ Blue) = all cards without red or blue
        // Cards: 1=gold, 2=green, 3=green+gold (3 without red/blue), 4=blue, 8=red, 12=red+blue, 13=red+blue+gold, 14=red+blue+green (5 with red/blue)
        cards: [1, 2, 3, 4, 8, 12, 13, 14],
        dice: [
            { type: 'set-constant', value: 'U', name: 'UNIVERSE', id: 'tutorial-5-universe' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-5-diff' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-5-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-5-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-5-blue' },
            { type: 'set-constant', value: '∅', name: 'NULL', id: 'tutorial-5-null' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-5-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-5-green' }
        ],
        goal: 3,
        expectedSolution: ['U', '−', 'red', '∪', 'blue'], // Must use these 5 cubes!
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 5! Two new cubes: <strong>Universe</strong> and <strong>Null</strong>.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-universe',
                    message: '<strong>Universe (U)</strong> refers to ALL cards on the board. It\'s a reference to the entire set of cards.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-null',
                    message: '<strong>Null (∅)</strong> is an empty set with NO cards. Useful for padding!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-padding',
                    message: '<strong>Padding</strong> means using extra cubes that don\'t change the result. More cubes = MORE POINTS!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-grouping',
                    message: '<strong>Important: Grouping!</strong> When cubes touch, they form a group that acts as one unit. This changes how expressions are evaluated!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>3 cards</strong>. Let\'s build "Universe minus (Red or Blue)" = all cards with neither red nor blue.',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'drag-universe',
                    message: 'Start with <strong>UNIVERSE</strong> cube (U) - all 8 cards.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'U');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-diff',
                    message: 'Add <strong>DIFFERENCE</strong> cube (−) - we\'re subtracting something.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '−');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-red',
                    message: 'Add <strong>RED</strong> cube to the right of the Difference cube.',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Add <strong>UNION</strong> cube (∪) - place it <strong>close to RED</strong> so they touch! This groups them.',
                    highlight: { dice: [3] },
                    validation: (game) => {
                        // Check that union is in solution AND is close to red
                        const solution = game.solutions[1];
                        const hasUnion = solution.some(die => die.value === '∪');
                        if (!hasUnion) return false;
                        
                        // Find red and union dice
                        const redDie = solution.find(die => die.value === 'red');
                        const unionDie = solution.find(die => die.value === '∪');
                        
                        if (!redDie || !unionDie) return false;
                        
                        // Check if they're touching (using same logic as grouping detection)
                        const isMobile = window.innerWidth <= 768;
                        const dieSize = isMobile ? 50 : 80;
                        const touchThreshold = 15;
                        
                        const dx = Math.abs(redDie.x - unionDie.x);
                        const dy = Math.abs(redDie.y - unionDie.y);
                        
                        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Add <strong>BLUE</strong> cube - place it <strong>close to UNION</strong> so all three are grouped together!',
                    highlight: { dice: [4] },
                    validation: (game) => {
                        // Check that blue is in solution AND all three are close together
                        const solution = game.solutions[1];
                        const hasBlue = solution.some(die => die.value === 'blue');
                        if (!hasBlue) return false;
                        
                        // Find all three cubes
                        const redDie = solution.find(die => die.value === 'red');
                        const unionDie = solution.find(die => die.value === '∪');
                        const blueDie = solution.find(die => die.value === 'blue');
                        
                        if (!redDie || !unionDie || !blueDie) return false;
                        
                        // Helper to check if two dice are touching
                        const areTouching = (die1, die2) => {
                            const isMobile = window.innerWidth <= 768;
                            const dieSize = isMobile ? 50 : 80;
                            const touchThreshold = 15;
                            const dx = Math.abs(die1.x - die2.x);
                            const dy = Math.abs(die1.y - die2.y);
                            return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
                        };
                        
                        // Check if all three form a connected group
                        // Blue must touch union, and union must touch red (or blue touches red directly)
                        const blueUnionTouch = areTouching(blueDie, unionDie);
                        const unionRedTouch = areTouching(unionDie, redDie);
                        
                        return blueUnionTouch && unionRedTouch;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Perfect! The grouped cubes (Red ∪ Blue) act like a single unit. "U minus (Red or Blue)" = cards with neither! 5 cubes = MORE POINTS! ✓',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'submit',
                    message: 'Universe and Null let you use more cubes for higher scores! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    6: {
        // Level 6: Restrictions (simpler tutorial - just explain, don't force use)
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-6-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-6-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-6-blue' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-6-green' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-6-intersect' },
            { type: 'color', value: 'gold', name: 'GOLD', id: 'tutorial-6-gold' }
        ],
        goal: 5,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 6! <strong>Restrictions</strong> change everything. This is a game-changer!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-restrictions',
                    message: '<strong>Restrictions</strong> (Subset ⊆ and Equals =) modify the universe BEFORE you name a set.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-subset',
                    message: '<strong>Subset</strong>: "A ⊆ B" means cards in A must contain B. Violating cards flip out!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-equals',
                    message: '<strong>Equals</strong>: "A = B" means A and B must be the same. Non-matching cards flip out!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-rows',
                    message: 'Use the TOP row for restrictions, BOTTOM row for your set name. Try it in regular play!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'practice',
                    message: 'For now, let\'s practice a simple solution. Our goal is <strong>5 cards</strong>: "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong> to the solution.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>UNION</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Restrictions are powerful! Experiment in real play. Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    7: {
        // Level 7: Timer (simple explanation tutorial)
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-7-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-7-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-7-blue' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-7-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-7-green' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-7-diff' }
        ],
        goal: 5,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 7! Time to add some pressure... literally.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-timer',
                    message: 'From now on, you have a <strong>time limit</strong>! Watch the timer at the top of the screen.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-timeout',
                    message: 'If time runs out, the round ends. No points, but you can try again with a new puzzle!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-strategy',
                    message: 'Work quickly, but don\'t panic! Sometimes a simple solution is better than a complex one.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'practice',
                    message: 'Let\'s practice quickly. Goal: <strong>5 cards</strong>. Build "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>UNION</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Beat the clock! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    8: {
        // Level 8: Required cubes
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-8-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-8-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-8-blue' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-8-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-8-green' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-8-diff' }
        ],
        goal: 5,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 8! Time for <strong>bonus points</strong> with Required Cubes!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-required',
                    message: '<strong>Required cubes</strong> have a green border and glow. You MUST use them in your solution!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-value',
                    message: 'Required cubes are worth <strong>50 bonus points</strong>! But they can make puzzles harder.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-impossible',
                    message: 'Sometimes a required cube makes the puzzle impossible. That\'s when you use Pass!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'practice',
                    message: 'Let\'s practice. Goal: <strong>5 cards</strong>. Build "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>UNION</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Watch for that green glow! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    9: {
        // Level 9: Wild cubes
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-9-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-9-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-9-blue' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-9-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-9-green' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-9-diff' }
        ],
        goal: 5,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 9! Meet the <strong>Wild Cube</strong> - your flexible friend!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-wild',
                    message: '<strong>Wild cubes</strong> have a red border with a question mark. They can be ANY operator!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-selection',
                    message: 'When you drop a wild cube, choose which operator it becomes. Change it anytime!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-value',
                    message: 'Wild cubes are worth <strong>25 bonus points</strong>! Use them to find creative solutions.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'practice',
                    message: 'Let\'s practice. Goal: <strong>5 cards</strong>. Build "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>UNION</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Wild cubes give you options! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    10: {
        // Level 10: Bonus cubes
        cards: [1, 2, 3, 4, 5, 8, 9, 10],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-10-red' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-10-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-10-blue' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-10-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-10-green' },
            { type: 'operator', value: '−', name: 'DIFFERENCE', id: 'tutorial-10-diff' }
        ],
        goal: 5,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 10! You made it to the final level! Here\'s your reward...',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-bonus',
                    message: '<strong>Bonus cubes</strong> look like regular cubes but with a special glow. Free points!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-value',
                    message: 'Bonus cubes are worth <strong>50 bonus points</strong> - same as required cubes, but no restrictions!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'explain-rarity',
                    message: 'Bonus cubes are rare. When you get one, use it! Easy points.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'congrats',
                    message: 'You\'ve mastered all 10 levels! Now go for those high scores!',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'practice',
                    message: 'One last practice. Goal: <strong>5 cards</strong>. Build "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>UNION</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'You\'re a set theory master! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    }
};

export function getTutorialScenario(level) {
    return TUTORIAL_SCENARIOS[level] || null;
}
