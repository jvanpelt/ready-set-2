// Drag and drop handling for dice (desktop and mobile)

export class DragDropHandler {
    constructor(game, diceContainer, solutionArea, onDrop, onWildCubeDrop = null, tutorialManager = null) {
        this.game = game;
        this.diceContainer = diceContainer;
        this.solutionArea = solutionArea;
        this.onDrop = onDrop; // Callback when dice are added/moved/removed
        this.onWildCubeDrop = onWildCubeDrop; // Callback when wild cube is dropped (for auto-showing popover)
        this.tutorialManager = tutorialManager; // For checking tutorial restrictions
        
        // Drag state
        this.draggedDie = null;
        this.draggedFromSolution = false;
        this.draggedRowIndex = null;
        this.draggedDieIndex = null;
        this.isDragging = false;
        this.currentDragElement = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.hasMoved = false;
        this.sourceDieElement = null;
        this.touchDragClone = null;
        
        this.init();
    }
    
    /**
     * Initialize all drag and drop event listeners
     */
    init() {
        const getEventCoords = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
            }
            return { clientX: e.clientX, clientY: e.clientY };
        };
        
        // === DICE AREA DRAG START (source dice) ===
        const handleDiceStart = (e) => {
            const die = e.target.closest('.die');
            if (die && !die.classList.contains('disabled')) {
                // Check if tutorial restricts dragging this die
                if (!this.isDieAllowedInTutorial(die)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                this.draggedDie = {
                    type: die.dataset.type,
                    value: die.dataset.value,
                    name: die.dataset.name,
                    id: die.dataset.id,
                    isRequired: die.dataset.isRequired === 'true', // Preserve required status
                    selectedOperator: die.dataset.selectedOperator || null // Preserve wild cube selection
                };
                this.draggedFromSolution = false;
                this.draggedRowIndex = null;
                die.classList.add('dragging');
                
                // For native drag-and-drop (desktop)
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', die.innerHTML);
                }
                
                this.sourceDieElement = die;
                
                // Create visual clone for touch dragging
                if (e.type === 'touchstart') {
                    const coords = getEventCoords(e);
                    const rect = die.getBoundingClientRect();
                    
                    this.touchDragClone = die.cloneNode(true);
                    this.touchDragClone.classList.add('touch-drag-clone');
                    this.touchDragClone.style.position = 'fixed';
                    this.touchDragClone.style.pointerEvents = 'none';
                    this.touchDragClone.style.zIndex = '10000';
                    this.touchDragClone.style.width = rect.width + 'px';
                    this.touchDragClone.style.height = rect.height + 'px';
                    this.touchDragClone.style.left = (coords.clientX - rect.width / 2) + 'px';
                    this.touchDragClone.style.top = (coords.clientY - rect.height / 2) + 'px';
                    this.touchDragClone.style.opacity = '0.8';
                    document.body.appendChild(this.touchDragClone);
                }
            }
        };
        
        this.diceContainer.addEventListener('dragstart', handleDiceStart);
        this.diceContainer.addEventListener('touchstart', handleDiceStart, { passive: false });
        
        // Update clone position during touch drag
        document.addEventListener('touchmove', (e) => {
            if (this.touchDragClone) {
                e.preventDefault();
                const coords = getEventCoords(e);
                const rect = this.touchDragClone.getBoundingClientRect();
                this.touchDragClone.style.left = (coords.clientX - rect.width / 2) + 'px';
                this.touchDragClone.style.top = (coords.clientY - rect.height / 2) + 'px';
            }
        }, { passive: false });
        
        const handleDiceEnd = (e) => {
            const die = e.target.closest('.die');
            if (die) {
                die.classList.remove('dragging');
            }
            if (this.sourceDieElement) {
                this.sourceDieElement.classList.remove('dragging');
                this.sourceDieElement = null;
            }
            if (this.touchDragClone) {
                this.touchDragClone.remove();
                this.touchDragClone = null;
            }
        };
        
        this.diceContainer.addEventListener('dragend', handleDiceEnd);
        this.diceContainer.addEventListener('touchend', handleDiceEnd);
        
        // === SOLUTION DICE DRAG (within solution area) ===
        const handleSolutionDragStart = (e) => {
            const solutionDie = e.target.closest('.solution-die');
            if (solutionDie && (e.button === 0 || e.type === 'touchstart')) {
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                const coords = getEventCoords(e);
                const row = solutionDie.closest('.solution-row');
                
                this.draggedRowIndex = parseInt(row.dataset.row);
                this.draggedDieIndex = parseInt(solutionDie.dataset.index);
                this.draggedDie = this.game.solutions[this.draggedRowIndex][this.draggedDieIndex];
                this.draggedFromSolution = true;
                this.isDragging = true;
                this.currentDragElement = solutionDie;
                this.hasMoved = false;
                
                this.dragStartPos = { x: coords.clientX, y: coords.clientY };
                
                const rect = solutionDie.getBoundingClientRect();
                this.dragOffset = {
                    x: coords.clientX - rect.left,
                    y: coords.clientY - rect.top
                };
                
                solutionDie.style.zIndex = '100';
            }
        };
        
        this.solutionArea.addEventListener('mousedown', handleSolutionDragStart);
        this.solutionArea.addEventListener('touchstart', handleSolutionDragStart, { passive: false });
        
        const handleSolutionDragMove = (e) => {
            if (this.isDragging && this.currentDragElement) {
                const coords = getEventCoords(e);
                
                const dx = Math.abs(coords.clientX - this.dragStartPos.x);
                const dy = Math.abs(coords.clientY - this.dragStartPos.y);
                
                if (dx > 5 || dy > 5) {
                    this.hasMoved = true;
                    if (!this.currentDragElement.classList.contains('dragging')) {
                        this.currentDragElement.classList.add('dragging');
                    }
                }
                
                if (this.hasMoved) {
                    if (e.type === 'touchmove') {
                        e.preventDefault();
                    }
                    
                    const row = this.currentDragElement.closest('.solution-row');
                    const rowRect = row.getBoundingClientRect();
                    
                    let x = coords.clientX - rowRect.left - this.dragOffset.x;
                    let y = coords.clientY - rowRect.top - this.dragOffset.y;
                    
                    const dieWidth = 80;
                    const dieHeight = 80;
                    x = Math.max(0, Math.min(x, rowRect.width - dieWidth - 20));
                    y = Math.max(0, Math.min(y, rowRect.height - dieHeight - 20));
                    
                    this.currentDragElement.style.left = `${x}px`;
                    this.currentDragElement.style.top = `${y}px`;
                }
            }
        };
        
        document.addEventListener('mousemove', handleSolutionDragMove);
        document.addEventListener('touchmove', handleSolutionDragMove, { passive: false });
        
        const handleSolutionDragEnd = (e) => {
            if (this.isDragging && this.currentDragElement) {
                if (this.hasMoved) {
                    const coords = e.changedTouches ? 
                        { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY } :
                        { clientX: e.clientX, clientY: e.clientY };
                    
                    const row = this.currentDragElement.closest('.solution-row');
                    const rowRect = row.getBoundingClientRect();
                    const rowIndex = this.draggedRowIndex;
                    
                    let x = coords.clientX - rowRect.left - this.dragOffset.x;
                    let y = coords.clientY - rowRect.top - this.dragOffset.y;
                    
                    const tempDie = this.game.solutions[rowIndex][this.draggedDieIndex];
                    tempDie.x = x;
                    tempDie.y = y;
                    
                    const snappedPos = this.smartSnapPosition(tempDie, rowIndex, rowRect);
                    this.game.updateDiePosition(rowIndex, this.draggedDieIndex, snappedPos.x, snappedPos.y);
                    
                    this.currentDragElement.classList.remove('dragging');
                    this.onDrop(); // Trigger re-render
                }
                
                this.currentDragElement.style.zIndex = '1';
                this.currentDragElement = null;
                this.isDragging = false;
                this.hasMoved = false;
            }
        };
        
        document.addEventListener('mouseup', handleSolutionDragEnd);
        document.addEventListener('touchend', handleSolutionDragEnd);
        
        // === DROP FROM DICE AREA TO SOLUTION (Desktop) ===
        this.solutionArea.addEventListener('dragover', (e) => {
            const row = e.target.closest('.solution-row');
            // Prevent dropping into disabled rows
            if (row && this.draggedDie && !this.draggedFromSolution && !row.dataset.disabled) {
                e.preventDefault();
                row.classList.add('drag-over');
            }
        });
        
        this.solutionArea.addEventListener('dragleave', (e) => {
            const row = e.target.closest('.solution-row');
            if (row && !row.contains(e.relatedTarget)) {
                row.classList.remove('drag-over');
            }
        });
        
        this.solutionArea.addEventListener('drop', (e) => {
            const row = e.target.closest('.solution-row');
            // Prevent dropping into disabled rows
            if (row && this.draggedDie && !this.draggedFromSolution && !row.dataset.disabled) {
                e.preventDefault();
                row.classList.remove('drag-over');
                
                const rowIndex = parseInt(row.dataset.row);
                const rowRect = row.getBoundingClientRect();
                
                let x = e.clientX - rowRect.left - 40;
                let y = e.clientY - rowRect.top - 40;
                
                this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                
                const newDieIndex = this.game.solutions[rowIndex].length - 1;
                const newDie = this.game.solutions[rowIndex][newDieIndex];
                const snappedPos = this.smartSnapPosition(newDie, rowIndex, rowRect);
                
                this.game.updateDiePosition(rowIndex, newDieIndex, snappedPos.x, snappedPos.y);
                
                // Check if wild cube without selection - auto-show popover (after render)
                const shouldShowWildPopover = newDie.type === 'wild' && !newDie.selectedOperator;
                
                this.draggedDie = null;
                this.onDrop(); // Render first!
                
                // Now show wild cube popover if needed (after DOM is updated)
                if (shouldShowWildPopover && this.onWildCubeDrop) {
                    console.log('🎯 Auto-showing wild cube popover (after render)');
                    this.onWildCubeDrop(rowIndex, newDieIndex);
                }
            }
        });
        
        // === DROP FROM DICE AREA TO SOLUTION (Mobile) ===
        document.addEventListener('touchend', (e) => {
            if (this.draggedDie && !this.draggedFromSolution && !this.isDragging) {
                const coords = e.changedTouches ? 
                    { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY } :
                    { clientX: e.clientX, clientY: e.clientY };
                
                const element = document.elementFromPoint(coords.clientX, coords.clientY);
                const row = element ? element.closest('.solution-row') : null;
                
                // Prevent dropping into disabled rows
                if (row && !row.dataset.disabled) {
                    e.preventDefault();
                    
                    const rowIndex = parseInt(row.dataset.row);
                    const rowRect = row.getBoundingClientRect();
                    
                    let x = coords.clientX - rowRect.left - 40;
                    let y = coords.clientY - rowRect.top - 40;
                    
                    this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                    
                    const newDieIndex = this.game.solutions[rowIndex].length - 1;
                    const newDie = this.game.solutions[rowIndex][newDieIndex];
                    const snappedPos = this.smartSnapPosition(newDie, rowIndex, rowRect);
                    
                    this.game.updateDiePosition(rowIndex, newDieIndex, snappedPos.x, snappedPos.y);
                    
                    // Check if wild cube without selection - auto-show popover (after render)
                    const shouldShowWildPopover = newDie.type === 'wild' && !newDie.selectedOperator;
                    console.log('🎲 Dropped die (mobile):', newDie.type, 'selectedOperator:', newDie.selectedOperator);
                    
                    this.draggedDie = null;
                    this.onDrop(); // Render first!
                    
                    // Now show wild cube popover if needed (after DOM is updated)
                    if (shouldShowWildPopover && this.onWildCubeDrop) {
                        console.log('🎯 Auto-showing wild cube popover (mobile, after render)');
                        this.onWildCubeDrop(rowIndex, newDieIndex);
                    }
                }
                
                if (this.sourceDieElement) {
                    this.sourceDieElement.classList.remove('dragging');
                    this.sourceDieElement = null;
                }
                if (this.touchDragClone) {
                    this.touchDragClone.remove();
                    this.touchDragClone = null;
                }
                this.draggedDie = null;
            }
        });
        
        // === DOUBLE-CLICK/TAP TO REMOVE ===
        this.solutionArea.addEventListener('dblclick', (e) => {
            const solutionDie = e.target.closest('.solution-die');
            if (solutionDie) {
                const row = solutionDie.closest('.solution-row');
                const rowIndex = parseInt(row.dataset.row);
                const dieIndex = parseInt(solutionDie.dataset.index);
                this.game.removeDieFromSolution(rowIndex, dieIndex);
                this.onDrop();
            }
        });
        
        // Double-tap detection for mobile
        let lastTap = 0;
        let lastTapTarget = null;
        
        this.solutionArea.addEventListener('touchend', (e) => {
            const solutionDie = e.target.closest('.solution-die');
            if (!solutionDie) return;
            if (this.hasMoved) return;
            
            const currentTime = Date.now();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0 && lastTapTarget === solutionDie) {
                e.preventDefault();
                
                const row = solutionDie.closest('.solution-row');
                const rowIndex = parseInt(row.dataset.row);
                const dieIndex = parseInt(solutionDie.dataset.index);
                this.game.removeDieFromSolution(rowIndex, dieIndex);
                this.onDrop();
                
                lastTap = 0;
                lastTapTarget = null;
            } else {
                lastTap = currentTime;
                lastTapTarget = solutionDie;
            }
        });
    }
    
    /**
     * Calculate horizontal overlap percentage between two dice
     */
    getOverlapPercentage(die1, die2) {
        const isMobile = window.innerWidth <= 768;
        const dieSize = isMobile ? 50 : 80;
        
        const x1Start = die1.x;
        const x1End = die1.x + dieSize;
        const x2Start = die2.x;
        const x2End = die2.x + dieSize;
        
        if (x1End <= x2Start || x2End <= x1Start) {
            return 0;
        }
        
        const overlapStart = Math.max(x1Start, x2Start);
        const overlapEnd = Math.min(x1End, x2End);
        const overlapWidth = overlapEnd - overlapStart;
        
        return (overlapWidth / dieSize) * 100;
    }
    
    /**
     * Smart snap: Find valid horizontal position with ≤20% overlap
     * Only adjusts horizontally, keeps y-position constant
     */
    smartSnapPosition(newDie, rowIndex, rowRect) {
        const isMobile = window.innerWidth <= 768;
        const dieSize = isMobile ? 50 : 80;
        const maxOverlapPercent = 20;
        const otherDice = this.game.solutions[rowIndex].filter(d => d !== newDie);
        
        if (otherDice.length === 0) {
            return {
                x: Math.max(0, Math.min(newDie.x, rowRect.width - dieSize - 20)),
                y: Math.max(0, Math.min(newDie.y, rowRect.height - dieSize - 20))
            };
        }
        
        const currentOverlaps = otherDice.map(other => this.getOverlapPercentage(newDie, other));
        const maxCurrentOverlap = Math.max(...currentOverlaps);
        
        if (maxCurrentOverlap <= maxOverlapPercent) {
            return {
                x: Math.max(0, Math.min(newDie.x, rowRect.width - dieSize - 20)),
                y: Math.max(0, Math.min(newDie.y, rowRect.height - dieSize - 20))
            };
        }
        
        const step = 5;
        const maxSteps = 50;
        
        for (let distance = step; distance <= maxSteps * step; distance += step) {
            const testDieRight = { ...newDie, x: newDie.x + distance };
            const rightOverlaps = otherDice.map(other => this.getOverlapPercentage(testDieRight, other));
            const maxRightOverlap = Math.max(...rightOverlaps);
            
            if (maxRightOverlap <= maxOverlapPercent && testDieRight.x + dieSize <= rowRect.width - 20) {
                return {
                    x: testDieRight.x,
                    y: Math.max(0, Math.min(newDie.y, rowRect.height - dieSize - 20))
                };
            }
            
            const testDieLeft = { ...newDie, x: newDie.x - distance };
            const leftOverlaps = otherDice.map(other => this.getOverlapPercentage(testDieLeft, other));
            const maxLeftOverlap = Math.max(...leftOverlaps);
            
            if (maxLeftOverlap <= maxOverlapPercent && testDieLeft.x >= 0) {
                return {
                    x: testDieLeft.x,
                    y: Math.max(0, Math.min(newDie.y, rowRect.height - dieSize - 20))
                };
            }
        }
        
        return {
            x: Math.max(0, Math.min(newDie.x, rowRect.width - dieSize - 20)),
            y: Math.max(0, Math.min(newDie.y, rowRect.height - dieSize - 20))
        };
    }
    
    /**
     * Check if a die is allowed to be dragged during tutorial
     * @param {HTMLElement} dieElement - The die DOM element
     * @returns {boolean} - True if allowed, false if restricted
     */
    isDieAllowedInTutorial(dieElement) {
        // If no tutorial is active, allow all dice
        if (!this.tutorialManager || !this.tutorialManager.isActive) {
            return true;
        }
        
        // Get current tutorial step
        const currentStep = this.tutorialManager.scenario?.walkthrough?.steps[this.tutorialManager.currentStep];
        
        if (!currentStep || !currentStep.highlight || !currentStep.highlight.dice) {
            // No dice specified on this step = lock ALL dice during tutorial
            return false;
        }
        
        // Get the allowed dice indices
        const allowedIndices = currentStep.highlight.dice;
        
        // Find this die's index in the dice array (cache the nodeList for performance)
        const dieIndex = parseInt(dieElement.dataset.index);
        
        // Check if this die's index is in the allowed list
        return allowedIndices.includes(dieIndex);
    }
}
