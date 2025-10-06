/**
 * WildCubeManager - Handles wild cube operator selection popover
 */
export class WildCubeManager {
    constructor(game, onSelectionChange) {
        this.game = game;
        this.onSelectionChange = onSelectionChange; // Callback to re-render after selection
        
        this.backdrop = document.getElementById('wild-popover-backdrop');
        this.popover = document.getElementById('wild-popover');
        
        this.currentDieElement = null;
        this.currentRowIndex = null;
        this.currentDieIndex = null;
        
        this.initializePopoverButtons();
        this.setupEventListeners();
    }
    
    initializePopoverButtons() {
        // Create operator buttons
        const operators = [
            { symbol: '∪', value: 'UNION' },
            { symbol: '∩', value: 'INTERSECTION' },
            { symbol: '−', value: 'DIFFERENCE' },
            { symbol: '′', value: 'COMPLEMENT' }
        ];
        
        operators.forEach(op => {
            const btn = document.createElement('button');
            btn.className = 'wild-popover-btn';
            btn.dataset.operator = op.value;
            btn.textContent = op.symbol;
            btn.title = op.value;
            this.popover.appendChild(btn);
        });
    }
    
    setupEventListeners() {
        // Backdrop click closes popover
        this.backdrop.addEventListener('click', () => {
            this.hide();
        });
        
        // Operator button clicks
        this.popover.addEventListener('click', (e) => {
            const btn = e.target.closest('.wild-popover-btn');
            if (btn) {
                const operator = btn.dataset.operator;
                this.selectOperator(operator);
            }
        });
    }
    
    /**
     * Show the popover next to a wild cube
     */
    show(dieElement, rowIndex, dieIndex) {
        this.currentDieElement = dieElement;
        this.currentRowIndex = rowIndex;
        this.currentDieIndex = dieIndex;
        
        // Show backdrop and popover
        this.backdrop.classList.add('active');
        this.popover.classList.add('active');
        
        // Position the popover
        this.positionPopover(dieElement);
    }
    
    /**
     * Position popover smartly to stay in viewport
     */
    positionPopover(dieElement) {
        const dieRect = dieElement.getBoundingClientRect();
        const popoverRect = this.popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = dieRect.right + 10; // Default: right of die
        let top = dieRect.top;
        
        // Check if popover would go off right edge
        if (left + popoverRect.width > viewportWidth - 10) {
            // Position to left of die instead
            left = dieRect.left - popoverRect.width - 10;
        }
        
        // Check if still off right edge (die is too far right)
        if (left < 10) {
            // Center it horizontally below die
            left = dieRect.left + (dieRect.width / 2) - (popoverRect.width / 2);
            top = dieRect.bottom + 10;
        }
        
        // Check if popover would go off bottom edge
        if (top + popoverRect.height > viewportHeight - 10) {
            // Position above die instead
            top = dieRect.top - popoverRect.height - 10;
        }
        
        // Ensure it doesn't go off top edge
        if (top < 10) {
            top = 10;
        }
        
        // Ensure it doesn't go off left edge
        if (left < 10) {
            left = 10;
        }
        
        this.popover.style.left = `${left}px`;
        this.popover.style.top = `${top}px`;
    }
    
    /**
     * Select an operator for the wild cube
     */
    selectOperator(operator) {
        if (this.currentRowIndex !== null && this.currentDieIndex !== null) {
            // Update the die in the game state
            const die = this.game.solutions[this.currentRowIndex][this.currentDieIndex];
            die.selectedOperator = operator;
            
            // Save state
            this.game.saveState();
            
            // Hide popover
            this.hide();
            
            // Trigger re-render
            if (this.onSelectionChange) {
                this.onSelectionChange();
            }
        }
    }
    
    /**
     * Hide the popover
     */
    hide() {
        this.backdrop.classList.remove('active');
        this.popover.classList.remove('active');
        
        this.currentDieElement = null;
        this.currentRowIndex = null;
        this.currentDieIndex = null;
    }
}
