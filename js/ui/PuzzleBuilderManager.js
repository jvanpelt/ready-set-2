import { ScenarioManager } from '../scenarioManager.js';
import { hasPossibleSolution } from '../solutionFinder.js';
import { OPERATORS } from '../levels.js';

/**
 * PuzzleBuilderManager - Manages the Puzzle Builder UI
 */
export class PuzzleBuilderManager {
    constructor(game, uiController) {
        this.game = game;
        this.uiController = uiController;
        this.scenarioManager = new ScenarioManager(game);
        
        this.selectedCards = [];
        this.selectedColors = [];
        this.selectedOperators = [];
        this.selectedSpecialFlags = {
            required: null,
            wild: null,
            bonus: null
        };
        
        // Track which specific die gets special flag
        // Format: { type: 'color'|'operator', value: 'red'|'UNION'|etc, index: 0-based }
        this.specialFlagTarget = null;
        
        this.initializeUI();
        this.setupEventListeners();
    }
    
    initializeUI() {
        console.log('🛠️ Initializing Puzzle Builder UI');
        this.renderCardPalette();
        this.renderColorSelector();
        this.renderOperatorSelector();
        this.renderSpecialFlags();
    }
    
    /**
     * Render all 16 possible cards
     */
    renderCardPalette() {
        const palette = document.getElementById('card-palette');
        const allCards = this.scenarioManager.getAllPossibleCards();
        
        palette.innerHTML = '';
        
        allCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'palette-card';
            cardEl.dataset.index = card.index;
            
            // Create dot grid (2x2)
            // Top-left (red), top-right (blue), bottom-left (green), bottom-right (gold)
            const positions = ['red', 'blue', 'green', 'gold'];
            positions.forEach(color => {
                const dot = document.createElement('div');
                dot.className = 'circle';
                if (card[color]) {
                    dot.classList.add(color);
                } else {
                    dot.style.opacity = '0';
                }
                cardEl.appendChild(dot);
            });
            
            cardEl.addEventListener('click', () => this.toggleCard(card.index));
            palette.appendChild(cardEl);
        });
    }
    
    /**
     * Render color dice selector
     */
    renderColorSelector() {
        const selector = document.getElementById('color-selector');
        const colors = ['red', 'blue', 'green', 'gold'];
        
        selector.innerHTML = '';
        
        colors.forEach(color => {
            const dieEl = document.createElement('div');
            dieEl.className = 'selector-die color-circle';
            dieEl.dataset.color = color;
            
            const circle = document.createElement('div');
            circle.className = `circle ${color}`;
            dieEl.appendChild(circle);
            
            dieEl.addEventListener('click', (e) => this.toggleColor(color, e));
            selector.appendChild(dieEl);
        });
    }
    
    /**
     * Render operator dice selector
     */
    renderOperatorSelector() {
        const selector = document.getElementById('operator-selector');
        const operators = [
            { name: 'UNION', symbol: '∪' },
            { name: 'INTERSECTION', symbol: '∩' },
            { name: 'DIFFERENCE', symbol: '−' },
            { name: 'COMPLEMENT', symbol: '′' },
            { name: 'UNIVERSE', symbol: 'U' },
            { name: 'NULL', symbol: '∅' },
            { name: 'EQUALS', symbol: '=' },
            { name: 'SUBSET', symbol: '⊆' }
        ];
        
        selector.innerHTML = '';
        
        operators.forEach(op => {
            const dieEl = document.createElement('div');
            dieEl.className = 'selector-die operator';
            dieEl.dataset.operator = op.name;
            dieEl.textContent = op.symbol;
            dieEl.title = op.name;
            
            dieEl.addEventListener('click', (e) => this.toggleOperator(op.name, e));
            selector.appendChild(dieEl);
        });
    }
    
    /**
     * Render special flags selector
     */
    renderSpecialFlags() {
        const selector = document.getElementById('special-flags');
        
        selector.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="radio" name="special-flag" value="none" checked>
                    <span>None</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="radio" name="special-flag" value="required">
                    <span>Required Cube (green glow, MUST use)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="radio" name="special-flag" value="wild">
                    <span>Wild Cube (red glow, can be any operator)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="radio" name="special-flag" value="bonus">
                    <span>Bonus Cube (free 50pts)</span>
                </label>
                <p style="margin-top: 10px; font-size: 12px; opacity: 0.7; font-style: italic;">
                    💡 Shift+Click a die to choose which cube gets the special flag
                </p>
            </div>
        `;
    }
    
    /**
     * Toggle card selection
     */
    toggleCard(index) {
        const cardIndex = this.selectedCards.indexOf(index);
        
        if (cardIndex > -1) {
            // Deselect
            this.selectedCards.splice(cardIndex, 1);
        } else {
            // Select (max 8)
            if (this.selectedCards.length < 8) {
                this.selectedCards.push(index);
            } else {
                alert('Maximum 8 cards selected. Deselect one first.');
                return;
            }
        }
        
        this.updateCardUI();
    }
    
    /**
     * Toggle color selection
     * Shift+Click to mark as special flag target
     */
    toggleColor(color, event) {
        // Shift+Click: Mark this die for special flag
        if (event && event.shiftKey) {
            console.log(`🔍 Shift+Click detected on color: ${color}`);
            const specialFlag = document.querySelector('input[name="special-flag"]:checked').value;
            console.log(`   Current special flag: ${specialFlag}`);
            if (specialFlag !== 'none') {
                // Find the index of this color in selectedColors
                const colorIndex = this.selectedColors.indexOf(color);
                console.log(`   Color index in selectedColors: ${colorIndex}`);
                if (colorIndex > -1) {
                    this.specialFlagTarget = { type: 'color', value: color, index: colorIndex };
                    console.log(`🎯 Special flag "${specialFlag}" will be applied to: ${color} (index ${colorIndex})`);
                    console.log(`   specialFlagTarget:`, this.specialFlagTarget);
                    this.updateColorUI();
                    this.updateOperatorUI();
                } else {
                    alert('This color die is not selected. Add it first, then Shift+Click to mark as special.');
                }
                return;
            } else {
                alert('Please select a special flag type first (Required/Wild/Bonus), then Shift+Click a die.');
            }
        }
        
        const colorCount = this.selectedColors.filter(c => c === color).length;
        
        if (colorCount === 0) {
            // Add first
            if (this.selectedColors.length < 4) {
                this.selectedColors.push(color);
            } else {
                alert('Maximum 4 color dice. Deselect one first.');
                return;
            }
        } else if (colorCount === 1) {
            // Add second (max 2 of same color)
            if (this.selectedColors.length < 4) {
                this.selectedColors.push(color);
            } else {
                alert('Maximum 4 color dice. Deselect one first.');
                return;
            }
        } else {
            // Remove all of this color
            this.selectedColors = this.selectedColors.filter(c => c !== color);
            // Clear special flag if this was the target
            if (this.specialFlagTarget && this.specialFlagTarget.type === 'color' && this.specialFlagTarget.value === color) {
                this.specialFlagTarget = null;
            }
        }
        
        this.updateColorUI();
    }
    
    /**
     * Toggle operator selection
     * Shift+Click to mark as special flag target
     */
    toggleOperator(operator, event) {
        // Shift+Click: Mark this die for special flag
        if (event && event.shiftKey) {
            console.log(`🔍 Shift+Click detected on operator: ${operator}`);
            const specialFlag = document.querySelector('input[name="special-flag"]:checked').value;
            console.log(`   Current special flag: ${specialFlag}`);
            if (specialFlag !== 'none') {
                // Find the index of this operator in selectedOperators
                const opIndex = this.selectedOperators.indexOf(operator);
                console.log(`   Operator index in selectedOperators: ${opIndex}`);
                if (opIndex > -1) {
                    this.specialFlagTarget = { type: 'operator', value: operator, index: opIndex };
                    console.log(`🎯 Special flag "${specialFlag}" will be applied to: ${operator} (index ${opIndex})`);
                    console.log(`   specialFlagTarget:`, this.specialFlagTarget);
                    this.updateColorUI();
                    this.updateOperatorUI();
                } else {
                    alert('This operator is not selected. Add it first, then Shift+Click to mark as special.');
                }
                return;
            } else {
                alert('Please select a special flag type first (Required/Wild/Bonus), then Shift+Click a die.');
            }
        }
        
        const opIndex = this.selectedOperators.indexOf(operator);
        
        if (opIndex > -1) {
            this.selectedOperators.splice(opIndex, 1);
            // Clear special flag if this was the target
            if (this.specialFlagTarget && this.specialFlagTarget.type === 'operator' && this.specialFlagTarget.value === operator) {
                this.specialFlagTarget = null;
            }
        } else {
            this.selectedOperators.push(operator);
        }
        
        this.updateOperatorUI();
    }
    
    /**
     * Update card palette UI
     */
    updateCardUI() {
        document.querySelectorAll('.palette-card').forEach(cardEl => {
            const index = parseInt(cardEl.dataset.index);
            if (this.selectedCards.includes(index)) {
                cardEl.classList.add('selected');
            } else {
                cardEl.classList.remove('selected');
            }
        });
        
        document.getElementById('selected-card-count').textContent = this.selectedCards.length;
    }
    
    /**
     * Update color selector UI
     */
    updateColorUI() {
        document.querySelectorAll('#color-selector .selector-die').forEach(dieEl => {
            const color = dieEl.dataset.color;
            const count = this.selectedColors.filter(c => c === color).length;
            
            dieEl.classList.toggle('selected', count > 0);
            
            // Check if this die is the special flag target
            const isSpecialTarget = this.specialFlagTarget && 
                                   this.specialFlagTarget.type === 'color' && 
                                   this.specialFlagTarget.value === color;
            
            // Add special flag visual indicator
            let flagEmoji = dieEl.querySelector('.flag-emoji');
            if (isSpecialTarget) {
                dieEl.style.boxShadow = '0 0 15px 3px #4CAF50';
                dieEl.style.border = '3px solid #4CAF50';
                
                // Add flag emoji if not already there
                if (!flagEmoji) {
                    flagEmoji = document.createElement('div');
                    flagEmoji.className = 'flag-emoji';
                    flagEmoji.textContent = '🚩';
                    flagEmoji.style.cssText = 'position: absolute; top: -5px; right: -5px; font-size: 16px; pointer-events: none;';
                    dieEl.style.position = 'relative';
                    dieEl.appendChild(flagEmoji);
                }
            } else {
                dieEl.style.boxShadow = '';
                dieEl.style.border = '';
                if (flagEmoji) {
                    flagEmoji.remove();
                }
            }
            
            // Show count if > 1
            let countLabel = dieEl.querySelector('.count-label');
            if (count > 1) {
                if (!countLabel) {
                    countLabel = document.createElement('div');
                    countLabel.className = 'count-label';
                    countLabel.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #4CAF50; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;';
                    dieEl.style.position = 'relative';
                    dieEl.appendChild(countLabel);
                }
                countLabel.textContent = count;
            } else if (countLabel) {
                countLabel.remove();
            }
        });
        
        document.getElementById('selected-color-count').textContent = this.selectedColors.length;
    }
    
    /**
     * Update operator selector UI
     */
    updateOperatorUI() {
        document.querySelectorAll('#operator-selector .selector-die').forEach(dieEl => {
            const operator = dieEl.dataset.operator;
            const count = this.selectedOperators.filter(op => op === operator).length;
            dieEl.classList.toggle('selected', count > 0);
            
            // Check if this die is the special flag target
            const isSpecialTarget = this.specialFlagTarget && 
                                   this.specialFlagTarget.type === 'operator' && 
                                   this.specialFlagTarget.value === operator;
            
            // Add special flag visual indicator
            let flagEmoji = dieEl.querySelector('.flag-emoji');
            if (isSpecialTarget) {
                dieEl.style.boxShadow = '0 0 15px 3px #4CAF50';
                dieEl.style.border = '3px solid #4CAF50';
                
                // Add flag emoji if not already there
                if (!flagEmoji) {
                    flagEmoji = document.createElement('div');
                    flagEmoji.className = 'flag-emoji';
                    flagEmoji.textContent = '🚩';
                    flagEmoji.style.cssText = 'position: absolute; top: -5px; right: -5px; font-size: 16px; pointer-events: none;';
                    dieEl.style.position = 'relative';
                    dieEl.appendChild(flagEmoji);
                }
            } else {
                dieEl.style.boxShadow = '';
                dieEl.style.border = '';
                if (flagEmoji) {
                    flagEmoji.remove();
                }
            }
        });
    }
    
    /**
     * Build dice array from selections
     */
    buildDiceArray() {
        const dice = [];
        
        console.log('🎲 Building dice array...');
        console.log('   Selected colors:', this.selectedColors);
        console.log('   Selected operators:', this.selectedOperators);
        
        // Add color dice
        this.selectedColors.forEach((color, index) => {
            dice.push({
                type: 'color',
                value: color,
                name: color.toUpperCase(),
                id: `builder-color-${index}`
            });
        });
        
        // Add operator dice
        this.selectedOperators.forEach((operatorKey, index) => {
            console.log('   Looking for operator:', operatorKey);
            const operator = OPERATORS[operatorKey]; // Use key directly instead of searching
            console.log('   Found:', operator);
            if (operator) {
                // Determine type based on which category it belongs to
                let type = 'operator';
                if (operatorKey === 'UNIVERSE' || operatorKey === 'NULL') {
                    type = 'set-constant';
                } else if (operatorKey === 'EQUALS' || operatorKey === 'SUBSET') {
                    type = 'restriction';
                }
                
                dice.push({
                    type: type,
                    value: operator.symbol,
                    name: operatorKey, // Use the key as the name for consistency
                    id: `builder-op-${index}`
                });
            }
        });
        
        // Apply special flag to targeted die (or first die if no target specified)
        const specialFlag = document.querySelector('input[name="special-flag"]:checked').value;
        console.log(`   Special flag selected: ${specialFlag}`);
        console.log(`   Special flag target:`, this.specialFlagTarget);
        
        if (specialFlag !== 'none' && dice.length > 0) {
            let targetDieIndex = -1;
            
            // If user Shift+Clicked a specific die, find it in the dice array
            if (this.specialFlagTarget) {
                console.log(`   🎯 Looking for special flag target in dice array...`);
                const target = this.specialFlagTarget;
                
                if (target.type === 'color') {
                    // Find the Nth occurrence of this color in the dice array
                    let occurrenceCount = 0;
                    for (let i = 0; i < dice.length; i++) {
                        if (dice[i].type === 'color' && dice[i].value === target.value) {
                            if (occurrenceCount === target.index) {
                                targetDieIndex = i;
                                break;
                            }
                            occurrenceCount++;
                        }
                    }
                } else if (target.type === 'operator') {
                    // target.index is the position in selectedOperators array
                    // We need to find that same operator at that position in the dice array
                    // Colors come first, then operators
                    const colorCount = this.selectedColors.length;
                    const operatorDiceStartIndex = colorCount;
                    targetDieIndex = operatorDiceStartIndex + target.index;
                    
                    console.log(`   Color dice count: ${colorCount}`);
                    console.log(`   Target operator index: ${target.index}`);
                    console.log(`   Calculated dice array index: ${targetDieIndex}`);
                    
                    // Verify it's the right die
                    if (targetDieIndex < dice.length && dice[targetDieIndex].name === target.value) {
                        console.log(`   ✅ Found ${target.value} at dice[${targetDieIndex}]`);
                    } else {
                        console.warn(`   ⚠️ Expected ${target.value} at dice[${targetDieIndex}], found:`, dice[targetDieIndex]);
                        targetDieIndex = -1; // Reset to use default
                    }
                }
            }
            
            // If no target specified or not found, default to first die
            if (targetDieIndex === -1) {
                targetDieIndex = 0;
            }
            
            // Apply the special flag
            if (specialFlag === 'required') {
                dice[targetDieIndex].isRequired = true;
                console.log(`✅ Applied "required" flag to die #${targetDieIndex}: ${dice[targetDieIndex].value}`);
            } else if (specialFlag === 'wild') {
                // Replace target die with wild
                if (dice[targetDieIndex].type === 'operator') {
                    dice[targetDieIndex] = {
                        type: 'wild',
                        value: '?',
                        name: 'WILD',
                        selectedOperator: null,
                        id: `builder-wild`
                    };
                    console.log(`✅ Replaced die #${targetDieIndex} with WILD`);
                } else {
                    console.warn('⚠️ Wild flag can only be applied to operator dice. Skipping.');
                }
            } else if (specialFlag === 'bonus') {
                dice[targetDieIndex].isBonus = true;
                console.log(`✅ Applied "bonus" flag to die #${targetDieIndex}: ${dice[targetDieIndex].value}`);
            }
        }
        
        return dice;
    }
    
    /**
     * Play the current scenario
     */
    playScenario() {
        console.log('🎮 Loading scenario for play...');
        
        if (this.selectedCards.length !== 8) {
            alert('Please select exactly 8 cards.');
            return;
        }
        
        if (this.selectedColors.length !== 4) {
            alert('Please select exactly 4 color dice.');
            return;
        }
        
        if (this.selectedOperators.length < 2) {
            alert('Please select at least 2 operators.');
            return;
        }
        
        const goal = parseInt(document.getElementById('goal-selector').value);
        console.log('📊 Goal selected:', goal);
        const dice = this.buildDiceArray();
        console.log('📦 Final dice array:', dice);
        
        const scenario = this.scenarioManager.createScenario(
            this.selectedCards,
            dice,
            goal,
            { name: 'Test Scenario' }
        );
        
        // Load scenario into game
        this.scenarioManager.loadScenario(scenario);
        
        // Close menu and refresh UI
        this.uiController.modals.hideMenu();
        this.uiController.render();
        
        console.log('✅ Scenario loaded! You can now play test it.');
    }
    
    /**
     * Test if solutions exist
     */
    async testSolutions() {
        console.log('🧪 Testing for solutions...');
        
        if (this.selectedCards.length !== 8) {
            this.showResults('error', 'Please select exactly 8 cards.');
            return;
        }
        
        if (this.selectedColors.length !== 4) {
            this.showResults('error', 'Please select exactly 4 color dice.');
            return;
        }
        
        if (this.selectedOperators.length < 2) {
            this.showResults('error', 'Please select at least 2 operators.');
            return;
        }
        
        const goal = parseInt(document.getElementById('goal-selector').value);
        const dice = this.buildDiceArray();
        const cards = this.scenarioManager.cardsFromIndices(this.selectedCards);
        
        console.log('   Cards:', cards.length);
        console.log('   Dice:', dice.length);
        console.log('   Goal:', goal);
        
        // Run solution finder
        const solutionExists = hasPossibleSolution(cards, dice, goal);
        
        if (solutionExists) {
            this.showResults('success', `✅ Solution exists! At least one valid solution was found.`);
        } else {
            this.showResults('error', `❌ No solution exists. This puzzle is impossible with the given dice.`);
        }
    }
    
    /**
     * Show test results
     */
    showResults(type, message) {
        const resultsEl = document.getElementById('test-results');
        resultsEl.className = `builder-results ${type}`;
        resultsEl.classList.remove('hidden');
        resultsEl.innerHTML = `<h4>${message}</h4>`;
    }
    
    /**
     * Export scenario as JSON
     */
    exportJSON() {
        if (this.selectedCards.length !== 8) {
            alert('Please select exactly 8 cards.');
            return;
        }
        
        const goal = parseInt(document.getElementById('goal-selector').value);
        const dice = this.buildDiceArray();
        
        const scenario = this.scenarioManager.createScenario(
            this.selectedCards,
            dice,
            goal,
            { name: prompt('Scenario name:', 'Custom Scenario') || 'Untitled' }
        );
        
        const json = this.scenarioManager.exportToJSON(scenario);
        
        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            alert('✅ Scenario JSON copied to clipboard!');
            console.log('📋 Exported scenario:', json);
        }).catch(err => {
            // Fallback: show in console
            console.log('📋 Exported scenario:', json);
            alert('Scenario exported to console (check developer tools)');
        });
    }
    
    /**
     * Save scenario to browser storage
     */
    saveScenario() {
        if (this.selectedCards.length !== 8) {
            alert('Please select exactly 8 cards.');
            return;
        }
        
        const goal = parseInt(document.getElementById('goal-selector').value);
        const dice = this.buildDiceArray();
        const name = prompt('Scenario name:', 'Test Scenario');
        
        if (!name) return;
        
        const scenario = this.scenarioManager.createScenario(
            this.selectedCards,
            dice,
            goal,
            { name }
        );
        
        this.scenarioManager.saveScenarioToStorage(scenario, name);
        alert(`✅ Scenario "${name}" saved!`);
    }
    
    /**
     * Load scenario from browser storage
     */
    loadScenario() {
        const scenarios = this.scenarioManager.loadScenariosFromStorage();
        const names = Object.keys(scenarios);
        
        if (names.length === 0) {
            alert('No saved scenarios found.');
            return;
        }
        
        const name = prompt(`Enter scenario name to load:\n\nAvailable:\n${names.join('\n')}`);
        
        if (!name || !scenarios[name]) {
            alert('Scenario not found.');
            return;
        }
        
        const scenario = scenarios[name];
        
        // Load into builder
        this.selectedCards = [...scenario.cards];
        this.selectedColors = [];
        this.selectedOperators = [];
        
        // Parse dice
        scenario.dice.forEach(die => {
            if (die.type === 'color') {
                this.selectedColors.push(die.value);
            } else if (die.type === 'operator' || die.type === 'set-constant' || die.type === 'restriction') {
                this.selectedOperators.push(die.name);
            }
        });
        
        // Set goal
        document.getElementById('goal-selector').value = scenario.goal;
        
        // Update UI
        this.updateCardUI();
        this.updateColorUI();
        this.updateOperatorUI();
        
        alert(`✅ Loaded scenario: ${name}`);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('play-scenario-btn').addEventListener('click', () => this.playScenario());
        document.getElementById('test-solution-btn').addEventListener('click', () => this.testSolutions());
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
        document.getElementById('save-scenario-btn').addEventListener('click', () => this.saveScenario());
        document.getElementById('load-scenario-btn').addEventListener('click', () => this.loadScenario());
    }
}
