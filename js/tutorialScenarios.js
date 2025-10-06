/**
 * Tutorial Scenarios - Hand-crafted first puzzles for each level
 * These are used when players choose "Show Me How" on the interstitial screen
 */

export const TUTORIAL_SCENARIOS = {
    1: {
        cards: [3, 5, 6, 9, 10, 12, 13, 15], // Mix of red, blue, combos
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
    }
};

export function getTutorialScenario(level) {
    return TUTORIAL_SCENARIOS[level] || null;
}
