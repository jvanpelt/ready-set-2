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
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome! Let\'s learn <strong>Union (∪)</strong>. It means "either/or".',
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
                    message: '<strong>Red ∪ Blue</strong> means "all cards with red OR blue (or both)".',
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
                    message: 'Great! Now drag the <strong>UNION (∪)</strong> cube next to it.',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '∪');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Perfect! Finally, drag the <strong>BLUE</strong> cube to complete "red ∪ blue".',
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
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 2! Let\'s learn the <strong>Difference (−)</strong> operator.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-difference',
                    message: '<strong>A − B</strong> means "cards in A, but NOT in B". It subtracts B from A.',
                    highlight: null,
                    nextTrigger: 'auto',
                    duration: 4000
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>3 cards</strong>. Let\'s build "green − blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    duration: 3000
                },
                {
                    id: 'explain-example',
                    message: '<strong>Green − Blue</strong> = "All cards with green, but NOT blue". Think: green EXCEPT blue.',
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
                    message: 'Great! Now drag the <strong>DIFFERENCE (−)</strong> cube.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[1].some(die => die.value === '−');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Perfect! Finally, drag the <strong>BLUE</strong> cube to complete "green − blue".',
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
    }
};

export function getTutorialScenario(level) {
    return TUTORIAL_SCENARIOS[level] || null;
}
