// Pure rendering logic - no side effects, just DOM updates

import { getSVGForOperator, getOperatorClass } from '../svgSymbols.js';

export class UIRenderer {
    constructor(game) {
        this.game = game;
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
    }
    
    /**
     * Render dice in the dice area
     */
    renderDice(diceContainer, dice, solutions) {
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
        
        dice.forEach((die) => {
            const dieEl = document.createElement('div');
            dieEl.className = 'die';
            dieEl.draggable = true;
            dieEl.dataset.type = die.type;
            dieEl.dataset.value = die.value;
            dieEl.dataset.id = die.id;
            if (die.name) dieEl.dataset.name = die.name;
            if (die.isRequired) dieEl.dataset.isRequired = 'true'; // Store in dataset for drag-and-drop
            
            // Check if this specific die instance is used
            if (usedDiceIds.includes(die.id)) {
                dieEl.classList.add('disabled');
                dieEl.draggable = false;
            }
            
            // Add required class if this die is required (Level 8+)
            if (die.isRequired) {
                dieEl.classList.add('required');
            }
            
            // Add content based on type
            if (die.type === 'color') {
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
            
            diceContainer.appendChild(dieEl);
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
                dieEl.dataset.index = dieIndex;
                
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
                
                // Add content
                if (die.type === 'color') {
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
