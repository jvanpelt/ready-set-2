/**
 * Tutorial Scenarios - Hand-crafted first puzzles for each level
 * These are used when players choose "Show Me How" on the interstitial screen
 */

import { isSolutionSyntaxValid } from './utils/validation.js';
import { isValidRestriction } from './setTheory.js';
import { 
    getComplementSVG, 
    getUniverseSVG, 
    getNullSVG, 
    getMinusSVG, 
    getUnionSVG, 
    getIntersectionSVG,
    getEqualsSVG,
    getSubsetSVG
} from './svgSymbols.js';

// ═══════════════════════════════════════════════════════════════════════════
// INTRO TUTORIAL - Now Interactive! 
// Players learn by doing, not watching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animation helper functions for intro tutorial (currently unused - interactive mode)
 * Keeping this code in case we want to add visual polish later
 */
const IntroAnimations = {
    /**
     * Step 2: Wave of card animations
     */
    animateCards() {
        const cards = document.querySelectorAll('.card');
        
        // Kill any existing animations
        gsap.killTweensOf(cards);
        
        // Animate each card with overlapping timing
        cards.forEach((card, i) => {
            // Instantly set glow and scale
            gsap.set(card, { filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.75))'});
            
            const tl = gsap.timeline({ delay: i * 0.15 });
            tl.to(card, {duration: 0.4, scale: 1.1, ease: 'power2.inOut'}),
            tl.to(card, {
                scale: 1,
                filter: 'drop-shadow(0 0 0px rgb(255, 215, 0))',
                duration: 0.4,
                delay: 0.2,  // Hold at full glow for 0.2s
                ease: 'power2.inOut'
            });
        });
    },
    
    /**
     * Step 3: Goal pulse
     */
    animateGoal() {
        const goalDisplay = document.querySelector('.goal-display');
        if (!goalDisplay) {
            console.warn('⚠️ Goal display not found'); // KEEP: Error condition
            return;
        }
        
        gsap.killTweensOf(goalDisplay);
        gsap.to(goalDisplay, {
            scale: 1.1,
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
            duration: 0.4,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    },
    
    /**
     * Step 4: Rotate cubes with elastic ease
     */
    animateCubes() {
        const dice = document.querySelectorAll('.die:not(.solution-die)');
        
        if (dice.length === 0) {
            console.warn('⚠️ No dice found'); // KEEP: Error condition
            return;
        }
        
        gsap.killTweensOf(dice);
        
        dice.forEach((die, i) => {
            const tl = gsap.timeline({ delay: i * 0.15 });
            tl.to(die, { rotation: 30, duration: 0.2, ease: 'sine.in' })
              .to(die, { rotation: "-20", duration: 0.2, ease: 'sine.inOut' }, 0.225)
              .to(die, { 
                  rotation: 0, 
                  duration: 1.5,
                  ease: 'elastic.out(6, 0.2)'
              }, 0.5);
        });
    },
    
    /**
     * Step 6: Animate RED cube to solution row 1
     */
    animateRedToSolution() {
        
        const redCube = document.querySelector('.die[data-id="intro-red"]');
        const solutionRow = document.querySelector('.solution-row[data-row="1"]');
        const app = document.getElementById('app');
        
        if (!redCube || !solutionRow || !app) {
            console.warn('⚠️ RED cube, solution row, or #app not found');
            return;
        }
        
        console.log('✅ Found RED cube:', redCube);
        console.log('✅ Found #app:', app);
        
        // Clone the red cube
        const clone = redCube.cloneNode(true);
        clone.id = 'test-clone-red';
        clone.classList.remove('tutorial-highlight')
        // Keep all original classes - don't change the look!
        
        // Get positions relative to #app
        const appRect = app.getBoundingClientRect();
        const redRect = redCube.getBoundingClientRect();
        const solutionRect = solutionRow.getBoundingClientRect();
        
        // Extract scale from transform matrix
        const appStyle = window.getComputedStyle(app);
        const transform = appStyle.transform;
        let scale = 1;
        if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                const values = matrix[1].split(',').map(parseFloat);
                scale = values[0]; // First value is scaleX
            }
        }
        
        // Calculate START position (RED cube) in visual coordinates
        const startLeftVisual = redRect.left - appRect.left;
        const startTopVisual = redRect.top - appRect.top;
        
        // Calculate END position (solution row) in visual coordinates
        const endLeftVisual = solutionRect.left - appRect.left;
        const endTopVisual = solutionRect.top - appRect.top;
        
        // Add offset using cube width (scales properly)
        const cubeWidthUnscaled = redRect.width / scale;
        const offsetLeft = cubeWidthUnscaled * 0.15; // 15% of cube width from left edge
        
        // Convert both to unscaled coordinates
        const startLeft = startLeftVisual / scale;
        const startTop = startTopVisual / scale;
        const endLeft = endLeftVisual / scale + offsetLeft;
        const endTop = endTopVisual / scale;
        
        console.log('📍 RED cube rect:', redRect);
        console.log('📍 Solution row rect:', solutionRect);
        console.log('📍 #app scale:', scale);
        console.log('📍 Cube width (unscaled):', cubeWidthUnscaled);
        console.log('📍 Start position (unscaled): left=' + startLeft + ', top=' + startTop);
        console.log('📍 End position (unscaled): left=' + endLeft + ', top=' + endTop);
        
        // Set up clone styling
        clone.style.position = 'absolute';
        clone.style.zIndex = '99999';
        clone.style.pointerEvents = 'none';
        
        // Append to #app
        app.appendChild(clone);
        
        // Use GSAP to animate from start to end
        gsap.set(clone, {
            left: startLeft + 'px',
            top: startTop + 'px'
        });
        
        gsap.to(clone, {
            duration: 1,
            //delay: 0.3,
            left: endLeft + 'px',
            top: endTop + 'px',
            ease: 'sine.inOut',
            onStart: () => console.log('✅ Animation started'),
            onComplete: () => console.log('✅ Animation complete')
        });
        
        console.log('✅ Clone appended and animating from RED cube to solution row');
    },
    
    /**
     * Step 7: Animate OR and BLUE cubes to solution
     */
    animateOrAndBlue() {
        console.log('🎬 animateOrAndBlue() - DISABLED for testing');
        return; // Temporarily disabled while testing step 6
        
        const orCube = document.querySelector('.die[data-id="intro-union"]');
        const blueCube = document.querySelector('.die[data-id="intro-blue"]');
        const solutionRow = document.querySelector('.solution-row[data-row="1"]');
        
        console.log('OR cube:', orCube);
        console.log('BLUE cube:', blueCube);
        console.log('Solution row:', solutionRow);
        
        if (!orCube || !blueCube || !solutionRow) {
            console.warn('⚠️ OR/BLUE cubes or solution row not found');
            return;
        }
        
        // Helper to get position relative to #app
        const getPositionInApp = (element) => {
            let el = element;
            let left = 0;
            let top = 0;
            while (el && el.id !== 'app') {
                left += el.offsetLeft;
                top += el.offsetTop;
                el = el.offsetParent;
            }
            return { left, top };
        };
        
        // Create clones
        const orClone = orCube.cloneNode(true);
        const blueClone = blueCube.cloneNode(true);
        [orClone, blueClone].forEach(clone => {
            clone.style.position = 'absolute';
            clone.style.pointerEvents = 'none';
            clone.style.zIndex = '9999';
            document.getElementById('app').appendChild(clone);
        });
        
        // Get positions
        const orPos = getPositionInApp(orCube);
        const bluePos = getPositionInApp(blueCube);
        const solutionPos = getPositionInApp(solutionRow);
        
        // Position OR clone
        gsap.set(orClone, {
            left: orPos.left,
            top: orPos.top,
            width: orCube.offsetWidth,
            height: orCube.offsetHeight
        });
        
        // Animate OR cube
        gsap.to(orClone, {
            duration: 0.6,
            left: solutionPos.left + 80,
            top: solutionPos.top,
            ease: 'power2.inOut',
            onComplete: () => orClone.remove()
        });
        
        // Position BLUE clone and animate (starts halfway through OR animation)
        gsap.set(blueClone, {
            left: bluePos.left,
            top: bluePos.top,
            width: blueCube.offsetWidth,
            height: blueCube.offsetHeight
        });
        
        gsap.to(blueClone, {
            duration: 0.6,
            delay: 0.3, // Start halfway through OR animation
            left: solutionPos.left + 160,
            top: solutionPos.top,
            ease: 'power2.inOut',
            onComplete: () => blueClone.remove()
        });
    },
    
    /**
     * Step 8: Animate OR back, AND to solution
     */
    animateAndReplaceOr() {
        console.log('🎬 animateAndReplaceOr() - DISABLED for testing');
        return; // Temporarily disabled while testing step 6
        
        const andCube = document.querySelector('.die[data-id="intro-intersect"]');
        const solutionRow = document.querySelector('.solution-row[data-row="1"]');
        
        console.log('AND cube:', andCube);
        console.log('Solution row:', solutionRow);
        
        if (!andCube || !solutionRow) {
            console.warn('⚠️ AND cube or solution row not found');
            return;
        }
        
        // Helper to get position relative to #app
        const getPositionInApp = (element) => {
            let el = element;
            let left = 0;
            let top = 0;
            while (el && el.id !== 'app') {
                left += el.offsetLeft;
                top += el.offsetTop;
                el = el.offsetParent;
            }
            return { left, top };
        };
        
        // Create AND clone
        const andClone = andCube.cloneNode(true);
        andClone.style.position = 'absolute';
        andClone.style.pointerEvents = 'none';
        andClone.style.zIndex = '9999';
        document.getElementById('app').appendChild(andClone);
        
        const andPos = getPositionInApp(andCube);
        const solutionPos = getPositionInApp(solutionRow);
        
        // Position AND clone
        gsap.set(andClone, {
            left: andPos.left,
            top: andPos.top,
            width: andCube.offsetWidth,
            height: andCube.offsetHeight
        });
        
        // Animate AND to solution
        gsap.to(andClone, {
            duration: 0.7,
            left: solutionPos.left + 80,
            top: solutionPos.top,
            ease: 'power2.inOut',
            onComplete: () => andClone.remove()
        });
    },
    
    /**
     * Step 9: Pulse GO button
     */
    animateGoButton() {
        console.log('🎬 animateGoButton() called');
        const goBtn = document.getElementById('go-btn');
        console.log('GO button:', goBtn);
        
        if (!goBtn) {
            console.warn('⚠️ GO button not found');
            return;
        }
        
        gsap.killTweensOf(goBtn);
        gsap.to(goBtn, {
            scale: 1.1,
            duration: 0.5,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: 2,
            onStart: () => console.log('✅ GO button animation started'),
            onComplete: () => console.log('✅ GO button animation complete')
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════

export const TUTORIAL_SCENARIOS = {
    intro: {
        // Intro Tutorial: Now INTERACTIVE! Players learn by doing.
        // Goal: Teach vocabulary and basic operators through hands-on practice
        // Cards chosen so RED AND BLUE = 3 (matches goal)
        // Bitwise: 1=gold, 2=green, 3=green+gold, 4=blue, 8=red, 12=red+blue, 13=red+blue+gold, 14=red+blue+green
        // RED = [8,12,13,14] = 4 cards
        // BLUE = [4,12,13,14] = 4 cards
        // RED OR BLUE = [4,8,12,13,14] = 5 cards (wrong!)
        // RED AND BLUE = [12,13,14] = 3 cards (correct!)
        cards: [1, 2, 3, 4, 8, 12, 13, 14],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'intro-red' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'intro-blue' },
            { type: 'operator', value: '∪', name: 'OR', id: 'intro-union' },
            { type: 'operator', value: '∩', name: 'AND', id: 'intro-intersect' }
        ],
        goal: 3,
        expectedSolution: ['red', '∩', 'blue'],
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'welcome',
                    message: '<strong>Ready, Set!</strong> is a game of set theory. Let\'s start with the basics.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'universe',
                    message: 'The 8 <strong>CARDS</strong> up top are called the <strong>UNIVERSE</strong>. Each card has a unique combination of colored dots.',
                    highlight: null,
                    nextTrigger: 'auto',
                    onEnter: () => {
                        setTimeout(() => IntroAnimations.animateCards(), 100);
                    }
                },
                {
                    id: 'goal',
                    message: 'In this example, your goal is to select exactly <strong>3 cards</strong> from the UNIVERSE.',
                    highlight: { goal: true },
                    nextTrigger: 'auto',
                    onEnter: () => {
                        setTimeout(() => IntroAnimations.animateGoal(), 100);
                    }
                },
                {
                    id: 'cubes',
                    message: 'Use <strong>CUBES</strong> to build a solution. Each cube has a <strong>color</strong> or <strong>operator</strong> symbol, with more introduced in later levels.',
                    highlight: { dice: [0, 1, 2, 3] },
                    nextTrigger: 'auto',
                    onEnter: () => {
                        setTimeout(() => IntroAnimations.animateCubes(), 100);
                    }
                },
                {
                    id: 'operator',
                    message: `You\'ll start off with two operator cubes: Union or <strong>"OR"</strong> ${getUnionSVG(35,35)} and Intersection or <strong>"AND"</strong> ${getIntersectionSVG(35,35)}.`,
                    highlight: { dice: [0, 1, 2, 3] },
                    nextTrigger: 'auto',
                    onEnter: () => {
                        setTimeout(() => IntroAnimations.animateCubes(), 100);
                    }
                },
                {
                    id: 'set-name',
                    message: 'You\'ll drag cubes to the <strong>SOLUTION AREA</strong> to create a "<strong>set name</strong>" &ndash; a formula that names, or selects, a set of cards.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'left-to-right',
                    message: 'Your solution is read <strong>left-to-right</strong>, like a math equation. Just as "three plus two" is written as "3 + 2", not "3 2 +". The order matters.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-red-or-blue',
                    message: 'Try it! Add the "Red" cube, "OR" cube, and "Blue" cube to the top row in the solution area.',
                    highlight: { solutionArea: true, shake: true, fadeOut: true },
                    validation: (game) => {
                        // Check if solution contains EXACTLY red, OR, blue (in any row, any order)
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        
                        // Must be valid syntax (prevents 'red blue ∪' or '∪ red blue' etc.)
                        if (!isSolutionSyntaxValid(allDice, false)) return false;
                        
                        // Must have red, ∪, and blue
                        const values = allDice.map(d => d.value);
                        return values.includes('red') && values.includes('∪') && values.includes('blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'or-result',
                    message: '<strong>Red Or Blue</strong> selects cards with red dots OR blue dots. That\'s 5 cards, which doesn\'t match the goal.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'swap-and',
                    message: 'Now try a solution of <strong>"Red AND Blue"</strong>. Tip: Double-tap cubes to easily remove them from your solution.',
                    highlight: { dice: [0, 1, 3] }, // Highlight red, blue, and AND
                    validation: (game) => {
                        // Check if solution contains EXACTLY red, AND, blue (in any row, any order)
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(d => d.value);
                        
                        // Must have red, ∩, and blue
                        if (!(values.includes('red') && values.includes('∩') && values.includes('blue'))) {
                            return false;
                        }
                        
                        // Must be a valid solution (correct syntax AND matches goal of 3 cards)
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'and-success',
                    message: 'Perfect! "<strong>Red And Blue</strong>" finds only cards with BOTH colors. That\'s exactly 3 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'solution-helper',
                    message: 'A few quick tips: The "Solution Helper" feature highlights cards that match your current solution.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'solution-helper-setting',
                    message: 'Solution Helper is enabled by default, and during all tutorials. It can be disabled in the Settings menu when you\'re ready for <strong>hard mode</strong>!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'pass-button',
                    message: 'Lastly, in game play, cards and cubes are randomly generated, so some puzzles will have <strong>NO</strong> solution! Use <strong>Pass</strong> when you need to.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'press-go',
                    message: 'When you have a solution, press <strong>GO</strong> to check it. Ready to play??',
                    highlight: { goButton: true },
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
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
                    message: 'Welcome! Let\'s learn the <strong>OR</strong> operator. It means "either/or".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>5 cards</strong>. check out the goal number.',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-union',
                    message: '<strong>Red OR Blue</strong> means "all cards with red OR blue (or both)".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-red',
                    message: 'First, drag the <strong>RED</strong> cube to the solution area.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Great! Now drag the <strong>OR</strong> cube next to it. (It has two overlapping circles.)',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === '∪');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Perfect! Finally, drag the <strong>BLUE</strong> cube to complete your solution.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Your solution says: "All cards with red OR blue". Count them - 5 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto'
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
        // No expectedSolution - allow exploration with any MINUS solution
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 2! Let\'s learn the <strong>minus</strong> operator.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-difference',
                    message: '<strong>Minus</strong> means "cards in A, but NOT in B". It subtracts B from A.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-with-minus',
                    message: 'Our goal is <strong>3 cards</strong>. Try a 3 cube solution like "Green minus Blue", or explore other ways to use <strong>MINUS</strong>!',
                    highlight: { dice: [0, 1, 2, 3, 4, 5] }, // Enable all dice
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use the MINUS operator (the concept we're teaching)
                        const hasMinus = values.includes('−');
                        if (!hasMinus) {
                            return false;
                        }
                        
                        // Must use exactly 3 cubes (simple solution first)
                        if (allDice.length !== 3) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'get-more-complex',
                    message: 'Perfect! Your solution finds 3 cards. Now let\'s try something a bit more complex.',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'auto'
                },
                {
                    id: 'complex-with-minus',
                    message: 'Try a 5 cube solution using more colors and operators, making sure to use <strong>MINUS</strong>! If you\'re stuck, try the <strong>OR</strong> operator.',
                    highlight: { dice: [0, 1, 2, 3, 4, 5] }, // Enable all dice
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use the MINUS operator (the concept we're teaching)
                        const hasMinus = values.includes('−');
                        if (!hasMinus) {
                            return false;
                        }
                        
                        // Must use exactly 5 cubes (simple solution first)
                        if (allDice.length !== 5) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Perfect! Try to maximize your score by using the most cubes possible! Click <strong>GO!</strong> to continue.',
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

        
        cards: [4, 6, 7, 8, 9, 10, 11, 14],
        dice: [
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-3-yellow' },
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-3-yellow-2' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-3-prime' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-3-red' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-3-green' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-3-intersect' }
        ],
        goal: 5,
        //expectedSolution: ['gold', '′'], // Must use these exact dice
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 3, where we meet the <strong>complement</strong> operator.',
                    highlight: { dice: [1] },
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-complement',
                    message: '<strong>Complement</strong> goes by many names, like "Not" or "Prime". It means "the opposite," as in "Yellow Prime" means "Not Yellow."',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>5 cards</strong>. Let\'s try "Yellow Prime" &mdash; all cards that are NOT yellow. Who knows, the other colors might work too?',
                    highlight: { goal: true, dice: [1, 2] },
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use the MINUS operator (the concept we're teaching)
                        const hasPrime = values.includes('′');
                        if (!hasPrime) {
                            return false;
                        }
                        
                        // Must use exactly 2 cubes (simple solution first)
                        if (allDice.length !== 2) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-grouping',
                    message: 'Complement is powerful, but it gets tricky when combined with other operators. This makes us think it\'s a good time to explain grouping.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-grouping-order',
                    message: 'When cubes touch, they form a group that acts as a unit in your solution. Groups are evaluated first, just like parentheses change the order of operations in algebra.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-grouping-boxes',
                    message: 'Experiment with different combinations. You\'ll see that valid groups are wrapped in a green box in your solution.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-grouping-with-prime',
                    message: 'Try adding red, green, AND, and PRIME to the solution area. Notice how "red and (green prime)" is different than "(red and green) prime"',
                    highlight: { dice: [1, 2, 3, 5] },
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use the MINUS operator (the concept we're teaching)
                        const hasPrime = values.includes('′');
                        if (!hasPrime) {
                            return false;
                        }

                        // Must use exactly 4 cubes (simple solution first)
                        if (allDice.length !== 4) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Awesome! Now click <strong>GO!</strong> to submit your solution!',
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
                    message: 'Welcome to Level 4, where we are changing some rules. Now you can be dealt the same operator multiple times.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-double-intersect',
                    message: 'We can chain operators: <strong>Red AND Blue AND Green</strong> means "cards with red AND blue AND green dots."',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-with-double-and',
                    message: 'Our goal is <strong>1 card</strong>. Try using <strong>both AND operators</strong> to find the card with all three colors!',
                    highlight: { goal: true, dice: [0, 1, 2, 3, 4] }, // Enable all dice except yellow
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use TWO intersection operators (the concept we're teaching)
                        const andCount = values.filter(v => v === '∩').length;
                        if (andCount !== 2) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Perfect! You used <strong>5 cubes</strong> to find 1 very specific card. And you know, more cubes equals more points!',
                    highlight: null,
                    nextTrigger: 'auto'
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
        // No expectedSolution - allow exploration with any UNIVERSE solution

        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: `Welcome to Level 5! We\'re introducing two new cubes: <strong>Universe</strong> ${getUniverseSVG(25,25)} and <strong>Null</strong> ${getNullSVG(25,25)}.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-universe',
                    message: `The <strong>Universe</strong> ${getUniverseSVG(25,25)} cube refers to ALL cards in the universe. If you place it alone in your solution, you\'ll see all cards stay highlighted.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-null',
                    message: `<strong>Null</strong> ${getNullSVG(25,25)} is an empty set with NO cards. If you place it alone in your solution, you\'ll see all cards are dimmed.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'padding-and-restrictions',
                    message: 'Universe and Null are useful for padding your solution, or for use with restrictions in later levels.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-padding',
                    message: '<strong>Padding</strong> means using extra cubes that don\'t change the result, e.g. "Universe And Red" is the same as "Red"!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-with-universe',
                    message: 'Our goal is <strong>3 cards</strong>. Try building a 5 cube solution using <strong>UNIVERSE</strong>.',
                    highlight: { goal: true, dice: [0, 1, 2, 3, 4, 5, 6, 7] }, // Enable all dice
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-with-universe',
                    message: 'If you get stuck, try using "Universe ___ (Blue OR Red)" in your solution. Try different operators in that blank spot, or create your own solution!',
                    highlight: { goal: true, dice: [0, 1, 2, 3, 4, 5, 6, 7] }, // Enable all dice
                    validation: (game) => {
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        const values = allDice.map(die => die.value);
                        
                        // Must use UNIVERSE (the new concept)
                        const hasUniverse = values.includes('U');
                        if (!hasUniverse) {
                            return false;
                        }

                        // Must use exactly 5 cubes (simple solution first)
                        if (allDice.length !== 5) {
                            return false;
                        }
                        
                        // Must be a valid solution that matches the goal
                        const result = game.validateSolution();
                        return result.valid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Perfect! Grouping, UNIVERSE, and NULL let you use more cubes for higher scores! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    6: {
        // Level 6: Restrictions - Modified from Daily Puzzle #780
        // Cards (bitwise): blue=4, green+red=10, green+gold=3, empty=0, blue+green=6, blue+green+gold=7, blue+gold=5, red+blue+green=14
        // Goal: 2 cards
        // Includes both SUBSET and EQUALS restriction cubes for player experimentation
        cards: [4, 10, 3, 0, 6, 7, 5, 14],
        dice: [
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-6-green' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-6-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-6-blue-1' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-6-blue-2' },
            { type: 'restriction', value: '⊆', name: 'SUBSET', id: 'tutorial-6-subset' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-6-intersection' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-6-red' },
            { type: 'restriction', value: '=', name: 'EQUALS', id: 'tutorial-6-equals' }
        ],
        goal: 3,
        expectedSolution: null, // Multiple valid solutions possible
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 6! <strong>Restrictions</strong> are a game changer! First, notice you have <strong>two solution rows</strong> now.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-two-rows',
                    message: 'Typically we put restrictions in the top row, and set names in the bottom. Do what you like, just don\'t put them in the <strong>same</strong> row!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-subset',
                    message: `<strong>Subset</strong> ${getSubsetSVG(25,25)}: "A subset B" means cards with A must be contained in B.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-subset-example',
                    message: `For example, "Red Subset Blue" means cards with red must also contain blue. Cards with ONLY red will be <strong>flipped and removed from the Universe</strong>.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-equals',
                    message: `<strong>Equals</strong> ${getEqualsSVG(25,25)}: "Red Equals Blue" means cards with red must contain blue, and cards with blue must also contain red.`,
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-important',
                    message: 'Go ahead and try some restrictions, just to see what they do! You can use Subset, Equals, or both in your solution.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>3 cards</strong>. Let\'s try building a full solution, starting with something like "Red Subset Blue" to remove cards with red but not blue.',
                    highlight: { goal: true },
                    validation: (game) => {
                        // Check if either row contains a valid restriction
                        const topRow = game.solutions[0];
                        const bottomRow = game.solutions[1];
                        
                        // Check if top row has a valid restriction
                        const topRowValid = isValidRestriction(topRow);
                        
                        // Check if bottom row has a valid restriction
                        const bottomRowValid = isValidRestriction(bottomRow);
                        
                        // At least one row must have a valid restriction
                        return topRowValid || bottomRowValid;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-setname-needed',
                    message: '<strong>Important</strong>: Restrictions alone aren\'t enough! You must ALSO provide a set name in your solution.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-one-cube-setname',
                    message: 'Hint: now that we are using restrictions, we can use single-cube set names!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'create-set-name',
                    message: 'Now, if you haven\'t, add a set name to complete your solution! Any valid set name will work.',
                    highlight: { dice: [0, 1, 2, 3, 6] }, // All non-restriction dice
                    validation: (game) => {
                        // Check if solution is valid AND contains a restriction
                        const validationResult = game.validateSolution();
                        if (!validationResult.valid) return false;
                        
                        // Ensure at least one row contains a restriction
                        const topRow = game.solutions[0];
                        const bottomRow = game.solutions[1];
                        const hasRestriction = topRow.some(die => die.value === '=' || die.value === '⊆') ||
                                              bottomRow.some(die => die.value === '=' || die.value === '⊆');
                        
                        return hasRestriction;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Lots to learn here! Solutions with Restrictions are powerful tools, but they require lots of practice to master.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Restrictions can also unlock massive scores by using more cubes! Click <strong>GO</strong> to play!',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    7: {
        // Level 7: Timer introduction (8 cubes)
        // Simple lesson: Timer pressure, apply what you've learned
        // Cards: 1=gold, 2=green, 4=blue, 5=blue+gold, 8=red, 10=red+green, 12=red+blue, 14=red+blue+green
        // Example solutions:
        //   - green ∪ gold = [1, 2, 5, 10, 14] = 5 cards
        //   - red ∪ blue ∪ green = [2, 4, 5, 8, 10, 12, 14] = 7 cards (uses 5 cubes)
        cards: [1, 2, 4, 5, 8, 10, 12, 14],
        dice: [
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-7-green' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-7-union' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-7-red' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-7-intersect' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-7-blue' },
            { type: 'color', value: 'gold', name: 'GOLD', id: 'tutorial-7-gold' },
            { type: 'operator', value: '−', name: 'MINUS', id: 'tutorial-7-minus' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-7-complement' }
        ],
        goal: 5,
        expectedSolution: null, // Multiple valid solutions
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 7! Time to add some pressure... literally.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-timer',
                    message: 'From now on, you have a <strong>time limit</strong>! Watch the timer at the bottom of the screen.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-timeout',
                    message: 'If time runs out, the round ends. No points, but you can try again! It\'ll warn you with an orange border on the timer with 30 seconds left.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>5 cards</strong>. Use what you\'ve learned to find a solution. Beat the clock!',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Build any valid solution and click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    8: {
        // Level 8: Required cubes - Complement is required!
        // Cards: [5, 7, 11, 10, 6, 4, 12, 1] = blue+green, blue+green+gold, red+green+gold, red+green, blue+green, blue, red+blue, gold
        // Only 2 valid solutions (both use required Prime):
        // 1. red ′ ∩ gold = 3 cards
        // 2. ∅ ′ ∩ red = 3 cards
        // Tutorial teaches that Prime must be used and grouped properly with intersection
        cards: [5, 7, 11, 10, 6, 4, 12, 1],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-8-red' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-8-green-1' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-8-green-2' },
            { type: 'color', value: 'gold', name: 'GOLD', id: 'tutorial-8-gold' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-8-intersection' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-8-prime', isRequired: true },
            { type: 'set-constant', value: 'U', name: 'UNIVERSE', id: 'tutorial-8-universe' },
            { type: 'set-constant', value: '∅', name: 'NULL', id: 'tutorial-8-null' }
        ],
        goal: 3,
        //expectedSolution: ['red', '′', '∩', 'gold'],
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 8 where we introduce <strong>Required Cubes</strong>, marked with a green glow. They are worth <strong>50 bonus points</strong>, and they\'re <strong>mandatory</strong>!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>3 cards</strong>. Let\'s try building a solution. This one might be tricky, but give it a try before you hit Next.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'hint-one',
                    message: 'There are only two valid solutions, and they both use And, Red, and the required Prime cube.',
                    highlight: { dice: [0] },
                    nextTrigger: 'auto'
                },
                {
                    id: 'hint-two',
                    message: 'You could play "Red Prime And Yellow" to name a set of 3 cards, but there\'s another option worth more points...',
                    highlight: { dice: [1] },
                    nextTrigger: 'auto'
                },
                {
                    id: 'hint-three',
                    message: '"Null Prime And Red" is the better option, since Null is worth more points than Yellow.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'hint-four',
                    message: 'Remember, "Null Prime" is the same as "Universe", and "Universe And Red" is the same as "Red". So, "Null Prime And Red" is the same as plain old "Red".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Watch for that glowing green cube in real play! Click <strong>GO!</strong> to play now!',
                    highlight: { goButton: true },
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    9: {
        // Level 9: Wild cubes - try different operators
        // Cards: [1, 2, 3, 4, 5, 8, 10, 12] = yellow, green, green+yellow, blue, blue+yellow, red, red+green, red+blue
        // Wrong: Red − Green = ? cards
        // Correct: Red ∩ Green = ? cards (goal TBD - test in Puzzle Builder)
        // Teaches: Wild cube can be changed by clicking it
        cards: [1, 2, 3, 4, 5, 8, 10, 12],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-9-red' },
            { type: 'wild', value: null, name: 'WILD', id: 'tutorial-9-wild' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-9-green' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-9-blue' },
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-9-yellow' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-9-prime' },
            { type: 'operator', value: '⊆', name: 'SUBSET', id: 'tutorial-9-subset' },
            { type: 'set-constant', value: '∅', name: 'NULL', id: 'tutorial-9-null' }
        ],
        goal: 1, // Red ∩ Green = 1 card (card 10: red+green)
        expectedSolution: ['red', '∩', 'green'], // Wild cube set to Intersection
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 9! Meet the <strong>Wild Cube</strong>! I bet you can guess which cube it is.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-wild',
                    message: 'We\'re deep into the game, so let\'s keep this simple. The Wild cube can be changed to <strong>ANY</strong> operator...',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-selection',
                    message: 'When you drop a wild cube, a menu appears, allowing you to choose which operator it should be. Change it anytime by clicking it again.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-value',
                    message: 'If you haven\'t tried it yet, go ahead. A suggestion: add "Red Wild Green", then change Wild to different operators to see what happens.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'wild-bonus',
                    message: 'The bonus cube is not required, but as a reward we\'ll give you 50 bonus points for using it. Nothing wild about that!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'That\'s pretty much it. Once you have a solution, press <strong>GO!</strong> to get back to the game!',
                    highlight: { goal: true },
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    10: {
        // Level 10: Bonus cubes - 8-cube solution demonstration
        // From Daily Puzzle #6 (5+3 pattern) - modified to replace blue+green with blue+green+gold
        // Solution: "red ∩ green = gold" (top) + "green − ∅" (bottom) = 2 cards
        // Bitwise cards: 5=blue+gold, 9=red+gold, 7=blue+green+gold, 12=red+blue, 8=red, 14=red+blue+green, 15=all, 11=red+green+gold
        cards: [5, 9, 7, 12, 8, 14, 15, 11],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-10-red' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-10-intersect' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-10-green-1' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-10-green-2' },
            { type: 'restriction', value: '=', name: 'EQUALS', id: 'tutorial-10-equals' },
            { type: 'color', value: 'gold', name: 'GOLD', id: 'tutorial-10-gold' },
            { type: 'operator', value: '−', name: 'MINUS', id: 'tutorial-10-minus' },
            { type: 'set-constant', value: '∅', name: 'NULL', id: 'tutorial-10-null', isBonus: true }
        ],
        goal: 2,
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 10! You made it to the final level! And we know that goal score is pretty steap. But here\'s your reward...',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true,
                    disableDraggingQuiet: true
                },
                {
                    id: 'explain-bonus',
                    message: '<strong>Bonus cubes</strong> look like regular cubes but with a special glow. Free points!',
                    highlight: null,
                    disableDragging: true,
                    disableDraggingQuiet: true,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-value',
                    message: 'Bonus cubes are worth <strong>50 bonus points</strong> - same as required cubes, but no restrictions!',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true,
                    disableDraggingQuiet: true
                },
                {
                    id: 'explain-rarity',
                    message: 'Bonus cubes are rare. When you get one, use it! Easy points.',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true,
                    disableDraggingQuiet: true
                },
                {
                    id: 'preview-solution',
                    message: 'Before we wrap up we wanted to show you something, so we\'re going to move some cubes around.',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true,
                    disableDraggingQuiet: true
                },
                {
                    id: 'show-solution',
                    message: 'This is a solution that uses all cubes. But you can\'t <strong>SEE</strong> the solution in the universe of cards. Because Solution Helper is OFF',
                    highlight: null,
                    disableDragging: true,
                    disableDraggingQuiet: true,
                    onEnter: () => {
                        // Auto-build the 8-cube solution to demonstrate
                        // Top row (5 cubes): red ∩ green = ∅
                        // Bottom row (3 cubes): gold − green
                        const game = window.game;
                        const ui = window.uiController;
                        
                        game.solutions = [[], []];
                        
                        // Calculate dynamic positioning based on screen size
                        const solutionRow = document.querySelector('.solution-row');
                        const rowWidth = solutionRow ? solutionRow.offsetWidth : 640;
                        const dieSize = window.LAYOUT ? window.LAYOUT.getDieSize() : (window.innerWidth < 768 ? 70 : 100);
                        
                        // Top row has 5 cubes
                        const topRowCount = 5;
                        const topRowDiceWidth = topRowCount * dieSize;
                        const topRowAvailableSpace = rowWidth - topRowDiceWidth;
                        const calculatedSpacing = topRowAvailableSpace / (topRowCount + 1); // Equal spacing including margins
                        const spacing = Math.min(calculatedSpacing, 15); // Cap at 15px for tighter layout
                        
                        // Calculate positions for top row (centered with even spacing)
                        const topRowTotalWidth = topRowDiceWidth + (spacing * (topRowCount - 1));
                        const topRowStartX = (rowWidth - topRowTotalWidth) / 2;
                        
                        const topRowPositions = [];
                        for (let i = 0; i < topRowCount; i++) {
                            topRowPositions.push(topRowStartX + (i * (dieSize + spacing)));
                        }
                        
                        // Bottom row has 3 cubes - use same spacing, but centered
                        const bottomRowCount = 3;
                        const bottomRowDiceWidth = bottomRowCount * dieSize;
                        const bottomRowTotalWidth = bottomRowDiceWidth + (spacing * (bottomRowCount - 1));
                        const bottomRowStartX = (rowWidth - bottomRowTotalWidth) / 2;
                        
                        const bottomRowPositions = [];
                        for (let i = 0; i < bottomRowCount; i++) {
                            bottomRowPositions.push(bottomRowStartX + (i * (dieSize + spacing)));
                        }
                        
                        // Top row (restriction): red ∩ green = ∅
                        game.addDieToSolution(game.dice[0], 0, topRowPositions[0], 10); // red
                        game.addDieToSolution(game.dice[1], 0, topRowPositions[1], 10); // ∩
                        game.addDieToSolution(game.dice[2], 0, topRowPositions[2], 10); // green
                        game.addDieToSolution(game.dice[4], 0, topRowPositions[3], 10); // =
                        game.addDieToSolution(game.dice[7], 0, topRowPositions[4], 10); // ∅ (bonus)
                        
                        // Bottom row (set name): gold − green
                        game.addDieToSolution(game.dice[5], 1, bottomRowPositions[0], 10); // gold
                        game.addDieToSolution(game.dice[6], 1, bottomRowPositions[1], 10); // −
                        game.addDieToSolution(game.dice[3], 1, bottomRowPositions[2], 10); // green
                        
                        // Capture source positions BEFORE render (while dice are still in dice area)
                        const diceContainer = document.querySelector('.dice-container');
                        const sourcePositions = {};
                        game.solutions.flat().forEach(die => {
                            const sourceDie = diceContainer.querySelector(`[data-id="${die.id}"]`);
                            if (sourceDie) {
                                sourcePositions[die.id] = sourceDie.getBoundingClientRect();
                            }
                        });
                        
                        ui.render();
                        
                        // Animate solution dice from captured source positions
                        requestAnimationFrame(() => {
                            const solutionDice = document.querySelectorAll('.solution-die');
                            
                            solutionDice.forEach((solutionDie, index) => {
                                const dieId = solutionDie.dataset.id;
                                const sourceRect = sourcePositions[dieId];
                                
                                if (sourceRect) {
                                    // Get solution position
                                    const solutionRect = solutionDie.getBoundingClientRect();
                                    
                                    // Calculate offset from source to target
                                    const deltaX = sourceRect.left - solutionRect.left;
                                    const deltaY = sourceRect.top - solutionRect.top;

                                    // Get the die's final position from inline styles
                                    const finalLeft = parseInt(solutionDie.style.left) || 0;
                                    const finalTop = parseInt(solutionDie.style.top) || 0;
                                    
                                    // Calculate starting position (final position + offset to source)
                                    const startLeft = finalLeft + deltaX;
                                    const startTop = finalTop + deltaY;
                                    
                                    // Animate from source position to final position
                                    // Note: Using left/top (not x/y) to match UIRenderer's positioning method
                                    gsap.fromTo(solutionDie, { left: startLeft, top: startTop, opacity: 0 }, { left: finalLeft, top: finalTop, opacity: 1, duration: 0.6, delay: Math.random() * 0.2, ease: 'power2.out' } );
                                }
                            });
                        });
                        
                        // Trigger solution helper evaluation
                        setTimeout(() => ui.evaluateSolutionHelper(), 50);
                    },
                    nextTrigger: 'auto'
                },
                {
                    id: 'manual-verification',
                    message: 'So let\'s learn to interpret solutions manually.',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true
                },
                {
                    id: 'explain-restriction',
                    message: 'The top row is a restriction: "Red AND Green EQUALS Null" means "red and green is the same as nothing". Depressing.',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true
                },
                {
                    id: 'double-tap-to-flip',
                    message: 'Double-tap the cards that have both red and green <strong>on the same card</strong> to flip them over and show they\'re out of play.',
                    highlight: null,
                    disableDragging: true,
                    validation: (game) => {
                        // Cards with both red AND green: indices 5, 6, 7
                        // 14 (red+blue+green), 15 (all), 11 (red+green+gold)
                        const redAndGreenIndices = [5, 6, 7];
                        
                        // Check if EXACTLY the three correct cards are flipped (no more, no less)
                        const allCorrectlyFlipped = redAndGreenIndices.every(i => 
                            game.cardStates[i] && game.cardStates[i].flipped
                        );
                        
                        const noExtrasFlipped = game.cardStates.every((state, i) => {
                            // If this card should be flipped, skip check
                            if (redAndGreenIndices.includes(i)) return true;
                            // Otherwise, it should NOT be flipped
                            return !state.flipped;
                        });
                        
                        return allCorrectlyFlipped && noExtrasFlipped;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'dim-cards-without-gold',
                    message: 'Now dim all the cards that don\'t have yellow.',
                    highlight: null,
                    validation: (game) => {
                        const redAndGreenIndices = [5, 6, 7]; // From previous step
                        
                        // Check 1: Cards from restriction should still be flipped (not dimmed)
                        const restrictionCardsStillFlipped = redAndGreenIndices.every(i =>
                            game.cardStates[i] && game.cardStates[i].flipped && !game.cardStates[i].dimmed
                        );
                        
                        // Check 2: Cards without gold should be dimmed
                        const cardsWithoutGoldDimmed = game.cardStates.every((state, i) => {
                            // Skip restriction cards (already checked)
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (!card.gold) {
                                return state.dimmed && !state.flipped;
                            }
                            return true; // Cards with gold checked separately
                        });
                        
                        // Check 3: Cards with gold but NO green (final answer) should be visible
                        const finalAnswerCardsVisible = game.cardStates.every((state, i) => {
                            // Skip restriction cards
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (card.gold && !card.green) {
                                return !state.dimmed && !state.flipped; // Must be visible
                            }
                            return true; // Other cards checked separately
                        });
                        
                        // Check 4: Cards with gold AND green can be visible or dimmed (allows working ahead)
                        const cardsWithGoldAndGreenOk = game.cardStates.every((state, i) => {
                            // Skip restriction cards
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (card.gold && card.green) {
                                return !state.flipped; // Can be dimmed or visible, just not flipped
                            }
                            return true; // Other cards already checked
                        });
                        
                        return restrictionCardsStillFlipped && cardsWithoutGoldDimmed && 
                               finalAnswerCardsVisible && cardsWithGoldAndGreenOk;
                    },
                    nextTrigger: 'validation',
                    disableDragging: true
                },
                {
                    id: 'dim-cards-with-green',
                    message: 'Now dim any cards with green to subtract them from the universe.',
                    highlight: null,
                    validation: (game) => {
                        const redAndGreenIndices = [5, 6, 7]; // From step 1
                        
                        // Check 1: Cards from restriction should still be flipped (not dimmed)
                        const restrictionCardsStillFlipped = redAndGreenIndices.every(i =>
                            game.cardStates[i] && game.cardStates[i].flipped && !game.cardStates[i].dimmed
                        );
                        
                        // Check 2: Cards without gold should still be dimmed (from previous step)
                        const cardsWithoutGoldStillDimmed = game.cardStates.every((state, i) => {
                            // Skip restriction cards
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (!card.gold) {
                                return state.dimmed && !state.flipped;
                            }
                            return true; // Cards with gold checked separately
                        });
                        
                        // Check 3: Cards with gold AND green should NOW be dimmed
                        const cardsWithGoldAndGreenDimmed = game.cardStates.every((state, i) => {
                            // Skip restriction cards
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (card.gold && card.green) {
                                return state.dimmed && !state.flipped;
                            }
                            return true; // Other cards checked separately
                        });
                        
                        // Check 4: Cards with gold but NO green should be visible
                        const finalCardsVisible = game.cardStates.every((state, i) => {
                            // Skip restriction cards
                            if (redAndGreenIndices.includes(i)) return true;
                            
                            const card = game.cards[i];
                            if (card.gold && !card.green) {
                                return !state.dimmed && !state.flipped;
                            }
                            return true; // Other cards checked separately
                        });
                        
                        return restrictionCardsStillFlipped && cardsWithoutGoldStillDimmed && 
                               cardsWithGoldAndGreenDimmed && finalCardsVisible;
                    },
                    nextTrigger: 'validation',
                    disableDragging: true
                },
                {
                    id: 'final-message',
                    message: 'Perfect! Manual verification is key to mastering hard mode! And there\'s a rumor that daily puzzles all have 8 cube solutions...',
                    highlight: null,
                    nextTrigger: 'auto',
                    disableDragging: true
                },
                {
                    id: 'submit',
                    message: 'You\'re a set theory master! Click <strong>GO!</strong> to conquer Level 10!',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit',
                    disableDragging: true
                }
            ]
        }
    }
};

export function getTutorialScenario(level) {
    return TUTORIAL_SCENARIOS[level] || null;
}
