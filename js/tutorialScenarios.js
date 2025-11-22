/**
 * Tutorial Scenarios - Hand-crafted first puzzles for each level
 * These are used when players choose "Show Me How" on the interstitial screen
 */

import { isSolutionSyntaxValid } from './utils/validation.js';

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
                    message: 'The 8 cards up top are called the <strong>UNIVERSE</strong>. Each card has a unique combination of colored dots.',
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
                    message: 'Use <strong>CUBES</strong> to build a solution. Each cube has a color or operator symbol.',
                    highlight: { dice: [0, 1, 2, 3] },
                    nextTrigger: 'auto',
                    onEnter: () => {
                        setTimeout(() => IntroAnimations.animateCubes(), 100);
                    }
                },
                {
                    id: 'solution-helper',
                    message: 'When the "Solution Helper" is enabled, like during tutorials, it will highlight the cards that match your current solution.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'set-name',
                    message: 'Drag cubes to the <strong>SOLUTION AREA</strong> to create a "set name" - a formula that selects a set of cards. Your solution is read <strong>left-to-right</strong>, just like a math equation.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-red-or-blue',
                    message: 'Try it! Add <strong>"red OR blue"</strong> to the solution area. You can drag the cubes in any order and rearrange them however you like!',
                    highlight: { dice: [0, 1, 2] }, // Highlight red, blue, and OR
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
                    message: '<strong>RED ∪ BLUE</strong> (read left-to-right) selects cards with red dots OR blue dots. That\'s 5 cards - still too many!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'swap-and',
                    message: 'Now try a solution of <strong>"red AND blue"</strong>. Tip: Double-tap cubes to easily remove them from your solution.',
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
                    message: 'Perfect! <strong>RED AND BLUE</strong> finds only cards with BOTH colors. That\'s exactly 3 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'press-go',
                    message: 'When you have a solution, press <strong>GO</strong> to check it. Ready to try Level 1?',
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
        expectedSolution: ['green', '−', 'blue'], // Must use these exact dice
        
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
                    id: 'identify-goal',
                    message: 'Our goal is <strong>3 cards</strong>. Let\'s build "Green minus Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'build-green-minus-blue',
                    message: '<strong>Green minus Blue</strong> = "All cards with green, but NOT blue". Add <strong>GREEN - BLUE</strong> to the solution area to match the goal.',
                    highlight: { dice: [0, 1, 2] }, // Enable GREEN, MINUS, BLUE
                    validation: (game) => {
                        const { isSolutionSyntaxValid } = require('./utils/validation.js');
                        const allDice = [...game.solutions[0], ...game.solutions[1]];
                        
                        // Check for exact cubes: green, −, blue
                        const values = allDice.map(die => die.value);
                        const hasGreen = values.includes('green');
                        const hasMinus = values.includes('−');
                        const hasBlue = values.includes('blue');
                        const exactCount = values.length === 3;
                        
                        // Check syntax validity
                        const validSyntax = isSolutionSyntaxValid(allDice, false);
                        
                        return hasGreen && hasMinus && hasBlue && exactCount && validSyntax;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'submit',
                    message: 'Perfect! Your solution "Green MINUS Blue" finds 3 cards. Now click <strong>GO!</strong> to submit!',
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
                    message: 'Welcome to Level 3! Meet the <strong>prime</strong> operator. Think "Opposite Day."',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-complement',
                    message: '<strong>prime</strong> (the prime symbol) means "NOT this". It\'s the opposite or inverse.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>5 cards</strong>. Let\'s build "Yellow Complement" (all cards that are NOT yellow).',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-yellow',
                    message: 'First, drag the <strong>YELLOW</strong> cube to the solution area.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'gold');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-prime',
                    message: 'Great! Now drag the <strong>prime</strong> cube. (It looks like an apostrophe.)',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === '′');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Your solution "Yellow Complement" means: "All cards that are NOT yellow". Count them - 5 cards! ✓',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-power',
                    message: 'Complement is powerful! It gets tricky when combined with other operators. Experiment!',
                    highlight: null,
                    nextTrigger: 'auto'
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
                    nextTrigger: 'auto'
                },
                {
                    id: 'duplicate-operators',
                    message: 'Look at your dice! You have <strong>TWO Intersection operators</strong> (the ones with overlapping circles). You can use the same operator multiple times!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-double-intersect',
                    message: 'We can chain operators: <strong>Red AND Blue AND Green</strong> means "cards with red AND blue AND green".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>1 card</strong>. Only one card has all three colors!',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-red',
                    message: 'Start with <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-intersect-1',
                    message: 'Now drag the first <strong>AND</strong> cube.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[0].filter(die => die.value === '∩').length >= 1;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Add <strong>BLUE</strong>. Now we have "cards with red AND blue".',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'blue');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-intersect-2',
                    message: 'Add the second <strong>AND</strong> cube. We\'re not done yet!',
                    highlight: { dice: [3] },
                    validation: (game) => {
                        return game.solutions[0].filter(die => die.value === '∩').length >= 2;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-green',
                    message: 'Finally, add <strong>GREEN</strong>. Now we have all cards with red AND blue AND green!',
                    highlight: { dice: [4] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'green');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Perfect! You used <strong>5 cubes</strong> to find 1 very specific card. More cubes = more points!',
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
        expectedSolution: ['U', '−', 'red', '∪', 'blue'], // Must use these 5 cubes!
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 5! Two new cubes: <strong>universe</strong> and <strong>null</strong>.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-universe',
                    message: '<strong>universe</strong> refers to ALL cards on the board. It\'s a reference to the entire set of cards.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-null',
                    message: '<strong>Null (∅)</strong> is an empty set with NO cards. Useful for padding!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-padding',
                    message: '<strong>Padding</strong> means using extra cubes that don\'t change the result. More cubes = MORE POINTS!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-grouping',
                    message: '<strong>Important: Grouping!</strong> When cubes touch, they form a group that acts as one unit. This changes how expressions are evaluated!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'identify-goal',
                    message: 'Our goal is <strong>3 cards</strong>. Let\'s build "universe minus (Red OR Blue)" = all cards with neither red nor blue.',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-universe',
                    message: 'Start with <strong>UNIVERSE</strong> cube (U) - all 8 cards.',
                    highlight: { dice: [0] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'U');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-diff',
                    message: 'Add <strong>minus</strong> cube - we\'re subtracting something.',
                    highlight: { dice: [1] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === '−');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-red',
                    message: 'Add <strong>RED</strong> cube to the right of the Difference cube.',
                    highlight: { dice: [2] },
                    validation: (game) => {
                        return game.solutions[0].some(die => die.value === 'red');
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Add <strong>OR</strong> cube - place it <strong>close to RED</strong> so they touch! This groups them.',
                    highlight: { dice: [3] },
                    validation: (game) => {
                        // Check that union is in solution AND is close to red
                        const solution = game.solutions[0];
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
                        const solution = game.solutions[0];
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
                    message: 'Perfect! The grouped cubes (Red OR Blue) act like a single unit. "universe minus (Red OR Blue)" = cards with neither! 5 cubes = MORE POINTS! ✓',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'universe and null let you use more cubes for higher scores! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    6: {
        // Level 6: Restrictions - demonstrate Red ⊆ Blue
        // Cards: 1=yellow, 2=green, 4=blue, 6=blue+green, 8=red, 12=red+blue, 13=red+blue+yellow, 14=red+blue+green
        // Red ⊆ Blue removes: card 8 (red only, no blue)
        // Remaining: 7 cards (1,2,4,6,12,13,14)
        // Goal: 5 cards = green ∪ yellow = cards 1,2,6,13,14
        cards: [1, 2, 4, 6, 8, 12, 13, 14],
        dice: [
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-6-red' },
            { type: 'restriction', value: '⊆', name: 'SUBSET', id: 'tutorial-6-subset' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-6-blue' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-6-green' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-6-union' },
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-6-yellow' }
        ],
        goal: 5,
        expectedSolution: {
            restriction: ['red', '⊆', 'blue'],
            setName: ['green', '∪', 'gold']
        },
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 6! <strong>Restrictions</strong> are a game-changer!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-two-rows',
                    message: 'Notice you have <strong>two solution rows</strong> now. TOP = Restrictions, BOTTOM = Set Name.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-subset',
                    message: '<strong>subset</strong>: "A subset B" means cards in A must also be in B. Cards that violate this are <strong>removed from the universe</strong>.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-important',
                    message: '<strong>Key point</strong>: Restrictions ONLY affect cards mentioned in the restriction. Other cards are unaffected!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>5 cards</strong>. Let\'s build "Red subset Blue" to remove red-only cards, then name the remaining set.',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-red-restriction',
                    message: 'Drag <strong>RED</strong> to the <strong>TOP ROW</strong> (Restrictions).',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[0].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-subset',
                    message: 'Drag <strong>subset</strong> to the TOP ROW.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[0].some(die => die.value === '⊆'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue-restriction',
                    message: 'Drag <strong>BLUE</strong> to the TOP ROW.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[0].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-effect',
                    message: '"Red subset Blue" means: red cards must contain blue. Cards with ONLY red will be <strong>flipped and removed from play</strong>.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-setname-needed',
                    message: '<strong>Important</strong>: Restrictions alone aren\'t enough! You must ALSO provide a set name in the BOTTOM ROW.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-green',
                    message: 'Now for the set name. Drag <strong>GREEN</strong> to the <strong>BOTTOM ROW</strong>.',
                    highlight: { dice: [3] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'green'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>OR</strong> to the BOTTOM ROW.',
                    highlight: { dice: [4] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-yellow',
                    message: 'Drag <strong>YELLOW</strong> to the BOTTOM ROW.',
                    highlight: { dice: [5] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'gold'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'explain-result',
                    message: 'Perfect! After removing red-only cards, we name the set "Green OR Yellow" = 5 cards. 6 cubes total = big points!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Restrictions unlock massive scores by using more cubes! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    7: {
        // Level 7: Timer + Grouping matters (Green ∪ (Red ∩ Red))
        // Cards: 1=yellow, 2=green, 4=blue, 5=blue+yellow, 8=red, 10=red+green, 12=red+blue, 14=red+blue+green
        // Solution: Green ∪ (Red ∩ Red) = Green ∪ Red = 5 cards (2,8,10,12,14)
        // Without grouping: (Green ∪ Red) ∩ Red = just Red = 4 cards (8,10,12,14) (WRONG!)
        // Teaches: Grouping changes evaluation order + padding trick
        cards: [1, 2, 4, 5, 8, 10, 12, 14],
        dice: [
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-7-green' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-7-union' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-7-red-1' },
            { type: 'operator', value: '∩', name: 'INTERSECTION', id: 'tutorial-7-intersect' },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-7-red-2' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-7-blue' }
        ],
        goal: 5,
        expectedSolution: ['green', '∪', 'red', '∩', 'red'],
        
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
                    message: 'From now on, you have a <strong>time limit</strong>! Watch the timer at the top of the screen.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-timeout',
                    message: 'If time runs out, the round ends. No points, but you can try again!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-padding',
                    message: 'But while we\'re here, a trick! <strong>Red AND Red = Red</strong> uses 2 extra cubes for the same result as a single <strong>Red</strong> cube.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>5 cards</strong>. Let\'s build "Green OR Red AND Red" and see what happens.',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-green',
                    message: 'Drag <strong>GREEN</strong> to the <strong>BOTTOM ROW</strong>. Keep it spaced out - don\'t group the cubes!',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'green'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>OR</strong> next to it. Keep them spaced apart.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-red-1',
                    message: 'Drag the first <strong>RED</strong>. Keep spacing them out.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-intersect',
                    message: 'Drag <strong>AND</strong>. Still keeping them apart.',
                    highlight: { dice: [3] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∩'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-red-2',
                    message: 'Drag the second <strong>RED</strong>. All 5 cubes, nicely spaced!',
                    highlight: { dice: [4] },
                    validation: (game) => game.solutions[1].filter(die => die.value === 'red').length >= 2,
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-helper',
                    message: '<strong>Wait!</strong> Look at Solution Helper - it highlights 4 cards, not 5! Something\'s wrong...',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-problem-1',
                    message: 'Without grouping, this evaluates as "Green OR Red" first, then "... AND Red".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-problem-2',
                    message: 'This means "All green or red cards that intersect with red cards" - which displays only red cards!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-fix',
                    message: 'We need to group "Red AND Red" together so it\'s treated as ONE unit: "Green OR (Red AND Red)".',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'group-them',
                    message: 'Move the <strong>Red-Intersect-Red cubes close together</strong> so they touch and form a group!',
                    highlight: { dice: [2, 3, 4] },
                    validation: (game) => {
                        // Check that Red, Intersect, Red are all grouped together
                        const solution = game.solutions[0];
                        const redDice = solution.filter(die => die.value === 'red');
                        const intersectDie = solution.find(die => die.value === '∩');
                        
                        if (redDice.length < 2 || !intersectDie) return false;
                        
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
                        const red1TouchesIntersect = areTouching(redDice[0], intersectDie);
                        const red2TouchesIntersect = areTouching(redDice[1], intersectDie);
                        
                        return red1TouchesIntersect && red2TouchesIntersect;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'success',
                    message: 'Perfect! Now Solution Helper shows 5 cards! "Green OR (Red AND Red)" = Green OR Red = 5 cards!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'lesson',
                    message: '<strong>Grouping changes order of operations!</strong> Use it to boost your score with padding.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'This works at ANY level! Beat the clock! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
                    nextTrigger: 'submit'
                }
            ]
        }
    },
    
    8: {
        // Level 8: Required cubes - Complement is required!
        // Cards: [4, 8, 0, 9, 3, 1, 10, 13] = blue, red, blank, red+yellow, green+yellow, yellow, red+green, red+blue+yellow
        // Progression teaches required cube + order of operations + grouping:
        // 1. Yellow ∪ Blue (ungrouped) = 5 → Error (no required)
        // 2. Yellow ∪ Blue ∪ ′ (ungrouped) = 3 → Wrong count
        // 3. Yellow ∪ (Blue′) (grouped) = 7 → Wrong count
        // 4. (Yellow′) ∪ Blue (grouped) = 5 → Success!
        cards: [4, 8, 0, 9, 3, 1, 10, 13],
        dice: [
            { type: 'color', value: 'gold', name: 'YELLOW', id: 'tutorial-8-yellow' },
            { type: 'operator', value: '∪', name: 'UNION', id: 'tutorial-8-union' },
            { type: 'color', value: 'blue', name: 'BLUE', id: 'tutorial-8-blue' },
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-8-prime', isRequired: true },
            { type: 'color', value: 'red', name: 'RED', id: 'tutorial-8-red' },
            { type: 'color', value: 'green', name: 'GREEN', id: 'tutorial-8-green' }
        ],
        goal: 5,
        expectedSolution: ['gold', '′', '∪', 'blue'],
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 8! <strong>Required Cubes</strong> - worth big points, but mandatory!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-required',
                    message: '<strong>Required cubes</strong> have a green border and glow, and are worth  <strong>50 bonus points</strong>.',
                    highlight: { dice: [3] },
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>5 cards</strong>. Let\'s try building a solution. Start with "Yellow OR Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-yellow',
                    message: 'Drag <strong>YELLOW</strong> to the <strong>BOTTOM ROW</strong>. Keep cubes spaced apart.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'gold'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union-1',
                    message: 'Drag <strong>OR</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue-1',
                    message: 'Drag <strong>BLUE</strong>. This should match our goal, 5 cards!',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'blue'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-helper-1',
                    message: 'Perfect! Solution Helper shows 5 cards. But wait... we forgot the required cube!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'add-prime-1',
                    message: 'Add the <strong>prime</strong> cube at the end (keep it spaced out).',
                    highlight: { dice: [3] },
                    validation: (game) => game.solutions[1].some(die => die.value === '′'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-helper-2',
                    message: 'Hmm... now it only matches 3 cards! "Yellow OR Blue prime" evaluated left-to-right doesn\'t work.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'group-blue-prime',
                    message: 'Try grouping Complement with BLUE. Move them close together so they touch!',
                    highlight: { dice: [2, 3] },
                    validation: (game) => {
                        const solution = game.solutions[1];
                        const blueDie = solution.find(die => die.value === 'blue');
                        const primeDie = solution.find(die => die.value === '′');
                        
                        if (!blueDie || !primeDie) return false;
                        
                        const isMobile = window.innerWidth <= 768;
                        const dieSize = isMobile ? 50 : 80;
                        const touchThreshold = 15;
                        const dx = Math.abs(blueDie.x - primeDie.x);
                        const dy = Math.abs(blueDie.y - primeDie.y);
                        
                        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-helper-3',
                    message: 'Now "Yellow OR (Blue prime)" matches 7 cards! Too many. The grouping changes everything!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'group-yellow-prime',
                    message: 'Try grouping Complement with YELLOW instead. Move them close together!',
                    highlight: { dice: [0, 3] },
                    validation: (game) => {
                        const solution = game.solutions[1];
                        const yellowDie = solution.find(die => die.value === 'gold');
                        const primeDie = solution.find(die => die.value === '′');
                        
                        if (!yellowDie || !primeDie) return false;
                        
                        const isMobile = window.innerWidth <= 768;
                        const dieSize = isMobile ? 50 : 80;
                        const touchThreshold = 15;
                        const dx = Math.abs(yellowDie.x - primeDie.x);
                        const dy = Math.abs(yellowDie.y - primeDie.y);
                        
                        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'success',
                    message: 'Perfect! "(Yellow prime) OR Blue" = 5 cards! Grouping with Yellow was the key!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'lesson',
                    message: 'Required cubes force creative solutions. Position and grouping matter! 50 bonus points await!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Watch for that green glow in real play! Click <strong>GO!</strong>',
                    highlight: { goButton: true },
                    validation: (game) => false,
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
            { type: 'operator', value: '′', name: 'COMPLEMENT', id: 'tutorial-9-prime' }
        ],
        goal: 1, // Red ∩ Green = 1 card (card 10: red+green)
        expectedSolution: ['red', '∩', 'green'], // Wild cube set to Intersection
        
        walkthrough: {
            enabled: true,
            steps: [
                {
                    id: 'intro',
                    message: 'Welcome to Level 9! Meet the <strong>Wild Cube</strong> - your flexible friend!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-wild',
                    message: '<strong>Wild cubes</strong> have a red border with a question mark. They can be ANY operator!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-selection',
                    message: 'When you drop a wild cube, a menu appears. Pick which operator it should be. Change it anytime by clicking it!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-value',
                    message: 'Wild cubes are worth <strong>25 bonus points</strong>! Great for creative solutions.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'goal',
                    message: 'Goal: <strong>1 card</strong>. Let\'s use the wild cube to build a solution!',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong> to the <strong>BOTTOM ROW</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-wild',
                    message: 'Drag the <strong>WILD CUBE</strong> (the one with the ?). A menu will pop up!',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[1].some(die => die.type === 'wild'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'select-difference',
                    message: 'In the menu, select <strong>minus</strong>.',
                    highlight: null,
                    validation: (game) => {
                        const wildDie = game.solutions[1].find(die => die.type === 'wild');
                        return wildDie && wildDie.selectedOperator === '−';
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-green',
                    message: 'Drag <strong>GREEN</strong> to complete the solution.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[1].some(die => die.value === 'green'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-wrong',
                    message: 'Hmm... "Red minus Green" doesn\'t match our goal. Let\'s try a different operator!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-change',
                    message: '<strong>Click the wild cube</strong> to change which operator it represents!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'select-intersect',
                    message: 'Select <strong>AND</strong> from the menu.',
                    highlight: null,
                    validation: (game) => {
                        const wildDie = game.solutions[1].find(die => die.type === 'wild');
                        return wildDie && wildDie.selectedOperator === '∩';
                    },
                    nextTrigger: 'validation'
                },
                {
                    id: 'check-correct',
                    message: 'Perfect! "Red AND Green" matches our goal! Different operator, different result!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'lesson',
                    message: 'Wild cubes give you flexibility to experiment. Click them anytime to change! 25 bonus points!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'submit',
                    message: 'Click the wild cube to change operators anytime! Click <strong>GO!</strong>',
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
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-bonus',
                    message: '<strong>Bonus cubes</strong> look like regular cubes but with a special glow. Free points!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-value',
                    message: 'Bonus cubes are worth <strong>50 bonus points</strong> - same as required cubes, but no restrictions!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'explain-rarity',
                    message: 'Bonus cubes are rare. When you get one, use it! Easy points.',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'congrats',
                    message: 'You\'ve mastered all 10 levels! Now go for those high scores!',
                    highlight: null,
                    nextTrigger: 'auto'
                },
                {
                    id: 'practice',
                    message: 'One last practice. Goal: <strong>5 cards</strong>. Build "Red Union Blue".',
                    highlight: { goal: true },
                    nextTrigger: 'auto'
                },
                {
                    id: 'drag-red',
                    message: 'Drag <strong>RED</strong>.',
                    highlight: { dice: [0] },
                    validation: (game) => game.solutions[0].some(die => die.value === 'red'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-union',
                    message: 'Drag <strong>OR</strong>.',
                    highlight: { dice: [1] },
                    validation: (game) => game.solutions[0].some(die => die.value === '∪'),
                    nextTrigger: 'validation'
                },
                {
                    id: 'drag-blue',
                    message: 'Drag <strong>BLUE</strong>.',
                    highlight: { dice: [2] },
                    validation: (game) => game.solutions[0].some(die => die.value === 'blue'),
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
