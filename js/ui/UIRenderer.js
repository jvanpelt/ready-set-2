// Pure rendering logic - no side effects, just DOM updates

import { getSVGForOperator, getOperatorClass } from '../svgSymbols.js';

export class UIRenderer {
    constructor(game) {
        this.game = game;
        this.shouldAnimate = false; // Don't animate on initial load
    }
    
    /**
     * Get fixed position for color circles on cards
     */
    getColorPosition(color) {
        // Fixed positions: red=top-left, blue=top-right, green=bottom-left, gold=bottom-right
        const positions = {
            'red': { row: 1, col: 1 },
            'blue': { row: 1, col: 2 },
            'green': { row: 2, col: 1 },
            'gold': { row: 2, col: 2 }
        };
        return positions[color] || { row: 1, col: 1 };
    }
    
    /**
     * Render all cards with their current states
     */
    renderCards(cardsContainer, cards, cardStates) {
        cardsContainer.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.index = index;
            
            // Apply states
            if (cardStates[index].dimmed) {
                cardEl.classList.add('dimmed');
            }
            if (cardStates[index].excluded) {
                cardEl.classList.add('excluded');
            }
            
            // Add circles in fixed positions based on color
            card.colors.forEach((color) => {
                const circle = document.createElement('div');
                circle.className = `circle ${color}`;
                const position = this.getColorPosition(color);
                circle.style.gridColumn = position.col;
                circle.style.gridRow = position.row;
                cardEl.appendChild(circle);
            });
            
            cardsContainer.appendChild(cardEl);
        });

        console.log('🎨 renderCards - Cards:', cards);
        
        // Animate cards in after rendering (only if shouldAnimate is true)
        if (this.shouldAnimate) {
            // Use requestAnimationFrame to ensure DOM has fully updated before animating
            requestAnimationFrame(() => {
                this.animateCardsIn();
            });
        }
    }
    
    /**
     * Animate cards "dealing in" from top with 3D rotation
     */
    animateCardsIn() {
        const cards = document.querySelectorAll('.card');
        console.log('🎬 animateCardsIn - Found cards:', cards.length);
        console.log('🎬 GSAP available?', typeof gsap !== 'undefined');
        if (cards.length === 0) return;
        
        // Temporarily disable CSS transitions to prevent interference with GSAP
        cards.forEach(card => card.style.transition = 'none');
        
        gsap.from(cards, {
            duration: 0.25,
            opacity: 0,
            rotationX: 45,
            rotationY: 90,
            rotationZ: 90,
            y: -100,
            ease: "power3.out",
            stagger: {
                each: 0.15,
                //from: "end"  // Start with last card (like dealing)
            },
            onStart: () => console.log('🎬 Cards animation STARTED'),
            onComplete: () => {
                console.log('🎬 Cards animation COMPLETE');
                // Re-enable CSS transitions after animation
                cards.forEach(card => card.style.transition = '');
            },
            clearProps: "transform,opacity"  // Clear inline styles after animation
        });
    }
    
    /**
     * Animate cards "flying out" with rotation - returns Promise
     */
    animateCardsOut() {
        return new Promise((resolve) => {
            const cards = document.querySelectorAll('.card');
            console.log('🎬 animateCardsOut - Found cards:', cards.length);
            if (cards.length === 0) {
                resolve();
                return;
            }
            
            // Temporarily disable CSS transitions
            cards.forEach(card => card.style.transition = 'none');
            
            gsap.to(cards, {
                duration: 0.25,
                opacity: 0,
                rotationX: 85,
                rotationZ: 145,
                y: -100,
                ease: "quad.in",
                stagger: {
                    each: 0.05,
                    from: "random"  // Random order for variety
                },
                onStart: () => console.log('🎬 Cards EXIT animation STARTED'),
                onComplete: () => {
                    console.log('🎬 Cards EXIT animation COMPLETE');
                    resolve();
                }
            });
        });
    }
    
    /**
     * Render dice in the dice area
     */
    renderDice(diceContainer, dice, solutions) {
        // Preserve existing dice rotations before clearing
        const existingRotations = {};
        const existingDice = diceContainer.querySelectorAll('.die');
        existingDice.forEach(dieEl => {
            const transform = window.getComputedStyle(dieEl).transform;
            if (transform && transform !== 'none') {
                const matrix = transform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(', ');
                    const rotation = Math.round(Math.atan2(parseFloat(values[1]), parseFloat(values[0])) * (180 / Math.PI));
                    const dieId = dieEl.dataset.id;
                    if (dieId && rotation !== 0) {
                        existingRotations[dieId] = rotation;
                    }
                }
            }
        });
        
        diceContainer.innerHTML = '';
        
        // Set data attribute for CSS grid layout (3x2 for 6 dice, 4x2 for 8 dice)
        diceContainer.dataset.diceCount = dice.length;
        
        // Track which dice IDs are used across all solution rows
        const usedDiceIds = [];
        solutions.forEach(row => {
            row.forEach(die => {
                if (die.id) {
                    usedDiceIds.push(die.id);
                }
            });
        });
        
        dice.forEach((die, index) => {
            const dieEl = document.createElement('div');
            dieEl.className = 'die';
            dieEl.draggable = true;
            dieEl.dataset.index = index; // For tutorial drag restrictions
            dieEl.dataset.type = die.type;
            dieEl.dataset.value = die.value;
            dieEl.dataset.id = die.id;
            if (die.name) dieEl.dataset.name = die.name;
            if (die.isRequired) dieEl.dataset.isRequired = 'true'; // Store in dataset for drag-and-drop
            if (die.isBonus) dieEl.dataset.isBonus = 'true'; // Store in dataset for drag-and-drop
            if (die.selectedOperator) dieEl.dataset.selectedOperator = die.selectedOperator; // Store wild cube selection
            
            // Check if this specific die instance is used
            if (usedDiceIds.includes(die.id)) {
                dieEl.classList.add('disabled');
                dieEl.draggable = false;
            }
            
            // Add required class if this die is required (Level 8+)
            if (die.isRequired) {
                dieEl.classList.add('required');
            }
            
            // Add bonus class if this die is bonus (Level 10)
            if (die.isBonus) {
                dieEl.classList.add('bonus');
            }
            
            // Add content based on type
            if (die.type === 'wild') {
                // Wild cube (Level 9+)
                dieEl.classList.add('wild');
                dieEl.textContent = '?';
            } else if (die.type === 'color') {
                dieEl.classList.add('color-circle');
                const circle = document.createElement('div');
                circle.className = `circle ${die.value}`;
                dieEl.appendChild(circle);
            } else {
                // Operator or special set
                dieEl.classList.add('operator');
                
                // Add type-specific styling class
                const operatorClass = getOperatorClass(die.value);
                dieEl.classList.add(operatorClass);
                
                // Check if we should use SVG
                const svg = getSVGForOperator(die.value);
                if (svg) {
                    dieEl.innerHTML = svg;
                } else {
                    dieEl.textContent = die.value;
                }
            }
            
            // Restore preserved rotation if this die had one before re-render
            if (existingRotations[die.id]) {
                dieEl.style.transform = `rotate(${existingRotations[die.id]}deg)`;
            }
            
            diceContainer.appendChild(dieEl);
        });
        
        // Animate dice in after rendering (only if shouldAnimate is true)
        if (this.shouldAnimate) {
            // Use requestAnimationFrame to ensure DOM has fully updated before animating
            requestAnimationFrame(() => {
                this.animateDiceIn();
            });
        }
    }
    
    /**
     * Animate dice "rolling in" from right with rotation
     */
    animateDiceIn() {
        const dice = document.querySelectorAll('.die:not(.solution-die)');
        console.log('🎲 animateDiceIn - Found dice:', dice.length);
        console.log('🎲 GSAP available?', typeof gsap !== 'undefined');
        if (dice.length === 0) return;
        
        // Temporarily disable CSS transitions to prevent interference with GSAP
        dice.forEach(die => die.style.transition = 'none');
        
        // First, set random final rotations for each die (-7° to +7°)
        dice.forEach(die => {
            const randomRot = Math.floor(Math.random() * 14) - 7;
            console.log('🎲 Setting rotation:', randomRot, 'for', die);
            gsap.set(die, { rotation: randomRot });
        });
        
        // Then animate FROM off-screen with heavy rotation
        dice.forEach((die, index) => {
            const startRotation = (Math.random() < 0.5) ? 40 : -40; // Random direction
            const isLastDie = (index === dice.length - 1);
            
            gsap.from(die, {
                duration: 0.25 + (index * 0.05),
                delay: 0.3 + (index * 0.12),  // Reduced from 0.5s base to 0.3s, tighter stagger
                opacity: 0,
                x: 100,
                rotation: `+=${startRotation}`,  // Adds to final rotation
                ease: "power3.out",
                onStart: () => console.log('🎲 Dice animation STARTED for index:', index),
                onComplete: () => {
                    console.log('🎲 Dice animation COMPLETE for index:', index);
                    // Re-enable CSS transitions after last die finishes
                    if (isLastDie) {
                        dice.forEach(d => d.style.transition = '');
                    }
                },
                clearProps: isLastDie ? "transform,opacity" : ""  // Clear props on last die
            });
        });
    }
    
    /**
     * Animate dice "flying out" to the right with rotation - returns Promise
     */
    animateDiceOut() {
        return new Promise((resolve) => {
            const dice = document.querySelectorAll('.die:not(.solution-die)');
            console.log('🎲 animateDiceOut - Found dice:', dice.length);
            if (dice.length === 0) {
                resolve();
                return;
            }
            
            // Temporarily disable CSS transitions
            dice.forEach(die => die.style.transition = 'none');
            
            // Animate all dice out with random timing
            let completed = 0;
            dice.forEach((die, index) => {
                const rotation = (Math.random() < 0.5) ? 60 : -60; // Random spin direction
                const duration = Math.random() * 0.15 + 0.2; // 0.2-0.35s
                const delay = Math.random() * 0.15 + 0.1; // 0.1-0.25s
                
                gsap.to(die, {
                    duration: duration,
                    delay: delay,
                    opacity: 0,
                    x: 150,
                    rotation: `+=${rotation}`,
                    ease: "quad.in",
                    onStart: () => console.log('🎲 Dice EXIT animation STARTED for index:', index),
                    onComplete: () => {
                        console.log('🎲 Dice EXIT animation COMPLETE for index:', index);
                        completed++;
                        if (completed === dice.length) {
                            console.log('🎲 All dice EXIT animations COMPLETE');
                            resolve();
                        }
                    }
                });
            });
        });
    }
    
    /**
     * Animate solution dice fading out - returns Promise
     */
    animateSolutionDiceOut() {
        return new Promise((resolve) => {
            const solutionDice = document.querySelectorAll('.solution-die');
            console.log('🎯 animateSolutionDiceOut - Found solution dice:', solutionDice.length);
            if (solutionDice.length === 0) {
                resolve();
                return;
            }
            
            // Simple fade out for solution dice
            gsap.to(solutionDice, {
                duration: 0.3,
                opacity: 0,
                ease: "power2.in",
                onStart: () => console.log('🎯 Solution dice EXIT animation STARTED'),
                onComplete: () => {
                    console.log('🎯 Solution dice EXIT animation COMPLETE');
                    resolve();
                }
            });
        });
    }
    
    /**
     * Render solution rows with dice
     * Row 0 (top): Restrictions (disabled until Level 6)
     * Row 1 (bottom): Set name (always enabled)
     */
    renderSolutions(solutionArea, solutions, restrictionsEnabled) {
        solutionArea.innerHTML = '';
        
        solutions.forEach((solution, rowIndex) => {
            const row = document.createElement('div');
            row.className = 'solution-row';
            row.dataset.row = rowIndex;
            
            // Row 0 is for restrictions (disabled until Level 6)
            if (rowIndex === 0 && !restrictionsEnabled) {
                row.classList.add('disabled');
                row.dataset.disabled = 'true';
                
                // Add placeholder label
                const label = document.createElement('div');
                label.className = 'solution-row-label';
                label.textContent = 'Restrictions (Level 6+)';
                row.appendChild(label);
            }
            
            // Render dice in this row
            solution.forEach((die, dieIndex) => {
                const dieEl = document.createElement('div');
                dieEl.className = 'solution-die';
                dieEl.dataset.id = die.id;  // Use unique ID instead of array index
                dieEl.dataset.index = dieIndex; // Add index for wild cube popover lookup
                
                // Position absolutely within row
                dieEl.style.position = 'absolute';
                dieEl.style.left = `${die.x}px`;
                dieEl.style.top = `${die.y}px`;
                
                // Apply rotation
                const rotation = die.rotation || 0;
                dieEl.style.transform = `rotate(${rotation}deg)`;
                
                // Add required class if this die is required (Level 8+)
                if (die.isRequired) {
                    dieEl.classList.add('required');
                }
                
                // Add bonus class if this die is bonus (Level 10)
                if (die.isBonus) {
                    dieEl.classList.add('bonus');
                }
                
                // Add content
                if (die.type === 'wild') {
                    // Wild cube (Level 9+)
                    dieEl.classList.add('wild');
                    // Display selected operator or '?' if none selected
                    const displayValue = die.selectedOperator || '?';
                    console.log('🎨 Rendering wild cube in solution:', die.selectedOperator, '→', displayValue);
                    const svg = getSVGForOperator(displayValue);
                    if (svg) {
                        dieEl.innerHTML = svg;
                    } else {
                        dieEl.textContent = displayValue;
                    }
                } else if (die.type === 'color') {
                    dieEl.classList.add('color-circle');
                    const circle = document.createElement('div');
                    circle.className = `circle ${die.value}`;
                    dieEl.appendChild(circle);
                } else {
                    dieEl.classList.add('operator');
                    
                    // Add type-specific styling class
                    const operatorClass = getOperatorClass(die.value);
                    dieEl.classList.add(operatorClass);
                    
                    // Check if we should use SVG
                    const svg = getSVGForOperator(die.value);
                    if (svg) {
                        dieEl.innerHTML = svg;
                    } else {
                        dieEl.textContent = die.value;
                    }
                }
                
                row.appendChild(dieEl);
            });
            
            // Render grouping indicators
            this.renderGroups(row, solution);
            
            solutionArea.appendChild(row);
        });
    }
    
    /**
     * Render visual grouping indicators
     */
    renderGroups(row, solution) {
        const groups = this.detectGroups(solution);
        
        // Only show indicators for groups with 2+ dice
        groups.forEach(group => {
            if (group.length > 1) {
                const indicator = document.createElement('div');
                indicator.className = 'solution-group-indicator';
                
                // Check if group is syntactically valid
                const isValid = this.isGroupValid(group);
                if (isValid) {
                    indicator.classList.add('valid');
                } else {
                    indicator.classList.add('invalid');
                }
                
                // Calculate bounding box
                const bounds = this.getGroupBounds(group);
                indicator.style.left = `${bounds.x - 5}px`;
                indicator.style.top = `${bounds.y - 5}px`;
                indicator.style.width = `${bounds.width + 10}px`;
                indicator.style.height = `${bounds.height + 10}px`;
                
                row.appendChild(indicator);
            }
        });
    }
    
    /**
     * Check if a group of dice forms a valid sub-expression
     */
    isGroupValid(group) {
        if (group.length === 0) return false;
        if (group.length === 1) return true; // Single die is always valid
        
        // Sort group left-to-right to evaluate in reading order
        const sortedGroup = [...group].sort((a, b) => a.x - b.x);
        
        // Binary operators (infix: operand → operator → operand)
        const binaryOperators = ['∪', '∩', '−', '=', '⊆'];
        // Postfix operators (operand → operator)
        const postfixOperators = ['′'];
        
        // Special case: Check for postfix COMPLEMENT at the end
        const lastDie = sortedGroup[sortedGroup.length - 1];
        if (postfixOperators.includes(lastDie.value) && sortedGroup.length === 2) {
            // Valid pattern: operand → COMPLEMENT (e.g., RED′)
            const firstDie = sortedGroup[0];
            return !binaryOperators.includes(firstDie.value) && !postfixOperators.includes(firstDie.value);
        }
        
        // Standard validation: alternating pattern for binary operators
        // Check for valid alternating pattern: operand → operator → operand → ...
        for (let i = 0; i < sortedGroup.length; i++) {
            const die = sortedGroup[i];
            const isOperator = binaryOperators.includes(die.value);
            
            // Even indices (0, 2, 4...) should be operands (colors/sets)
            // Odd indices (1, 3, 5...) should be operators
            const shouldBeOperator = i % 2 === 1;
            
            if (isOperator !== shouldBeOperator) {
                return false; // Wrong type at this position
            }
        }
        
        // Must have odd length (operand, operator, operand, ...)
        // e.g., length 3 = valid, length 2 = invalid (unless it's the postfix case handled above)
        return sortedGroup.length % 2 === 1;
    }
    
    /**
     * Detect groups of dice that are touching
     */
    detectGroups(solution) {
        // Group dice that are touching or overlapping
        const groups = [];
        const visited = new Set();
        
        solution.forEach((die, index) => {
            if (visited.has(index)) return;
            
            const group = [die];
            visited.add(index);
            
            // Find all dice touching this one (recursively)
            const checkTouching = (currentIndex) => {
                solution.forEach((otherDie, otherIndex) => {
                    if (visited.has(otherIndex)) return;
                    
                    if (this.areDiceTouching(solution[currentIndex], otherDie)) {
                        group.push(otherDie);
                        visited.add(otherIndex);
                        checkTouching(otherIndex);
                    }
                });
            };
            
            checkTouching(index);
            groups.push(group);
        });
        
        return groups;
    }
    
    /**
     * Check if two dice are touching based on distance
     */
    areDiceTouching(die1, die2) {
        const isMobile = window.innerWidth <= 768;
        const dieSize = isMobile ? 50 : 80;
        const touchThreshold = 15; // Dice are "touching" if within 15px
        
        const dx = Math.abs(die1.x - die2.x);
        const dy = Math.abs(die1.y - die2.y);
        
        // Check if bounding boxes overlap or are very close
        return dx < dieSize + touchThreshold && dy < dieSize + touchThreshold;
    }
    
    /**
     * Get bounding box for a group of dice
     */
    getGroupBounds(group) {
        // Use responsive die size (50px on mobile, 80px on desktop)
        const isMobile = window.innerWidth <= 768;
        const dieSize = isMobile ? 50 : 80;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        group.forEach(die => {
            minX = Math.min(minX, die.x);
            minY = Math.min(minY, die.y);
            maxX = Math.max(maxX, die.x + dieSize);
            maxY = Math.max(maxY, die.y + dieSize);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    /**
     * Update status bar elements
     */
    updateStatusBar(currentScoreEl, goalScoreEl, currentLevelEl, goalCardsEl, state) {
        currentScoreEl.textContent = state.score;
        goalScoreEl.textContent = state.goalScore;
        currentLevelEl.textContent = state.level;
        goalCardsEl.textContent = state.goalCards;
    }
}
