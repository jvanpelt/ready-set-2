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
