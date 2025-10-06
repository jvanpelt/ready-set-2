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
            
            dieEl.addEventListener('click', () => this.toggleColor(color));
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
            
            dieEl.addEventListener('click', () => this.toggleOperator(op.name));
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
     */
    toggleColor(color) {
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
        }
        
        this.updateColorUI();
    }
    
    /**
     * Toggle operator selection
     */
    toggleOperator(operator) {
        const opIndex = this.selectedOperators.indexOf(operator);
        
        if (opIndex > -1) {
            this.selectedOperators.splice(opIndex, 1);
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
        });
    }
    
    /**
     * Build dice array from selections
     */
    buildDiceArray() {
        const dice = [];
        
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
        this.selectedOperators.forEach((operatorName, index) => {
            const operator = Object.values(OPERATORS).find(op => op.name === operatorName);
            if (operator) {
                dice.push({
                    type: operator.type || 'operator',
                    value: operator.symbol,
                    name: operator.name,
                    id: `builder-op-${index}`
                });
            }
        });
        
        // Apply special flag to first applicable die
        const specialFlag = document.querySelector('input[name="special-flag"]:checked').value;
        if (specialFlag !== 'none' && dice.length > 0) {
            if (specialFlag === 'required') {
                dice[0].isRequired = true;
            } else if (specialFlag === 'wild') {
                // Replace first operator with wild
                const opIndex = dice.findIndex(d => d.type === 'operator');
                if (opIndex > -1) {
                    dice[opIndex] = {
                        type: 'wild',
                        value: '?',
                        name: 'WILD',
                        selectedOperator: null,
                        id: `builder-wild`
                    };
                }
            } else if (specialFlag === 'bonus') {
                dice[0].isBonus = true;
            }
        }
        
        return dice;
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
        document.getElementById('test-solution-btn').addEventListener('click', () => this.testSolutions());
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
        document.getElementById('save-scenario-btn').addEventListener('click', () => this.saveScenario());
        document.getElementById('load-scenario-btn').addEventListener('click', () => this.loadScenario());
    }
}
