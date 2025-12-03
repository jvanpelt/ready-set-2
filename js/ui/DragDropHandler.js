// Drag and drop handling for dice (desktop and mobile)
import { LAYOUT, getDieSize } from '../constants.js';

export class DragDropHandler {
    constructor(game, diceContainer, solutionArea, onDrop, onWildCubeDrop = null, tutorialManager = null) {
        this.game = game;
        this.diceContainer = diceContainer;
        this.solutionArea = solutionArea;
        this.onDrop = onDrop; // Callback when dice are added/moved/removed
        this.onWildCubeDrop = onWildCubeDrop; // Callback when wild cube is dropped (for auto-showing popover)
        this.tutorialManager = tutorialManager; // Kept for reference (restrictions now handled via draggable attribute)
        this.app = document.getElementById('app'); // For cloning within scaled container
        
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
            
            // Check if die is actually draggable FIRST (tutorial restrictions, etc.)
            if (die && die.draggable === false) {
                console.log('🚫 Die is not draggable, ignoring drag attempt');
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (die && !die.classList.contains('disabled')) {
                
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                // Extract current rotation from element (set by entrance animation)
                const transform = window.getComputedStyle(die).transform;
                let rotation = 0;
                if (transform && transform !== 'none') {
                    const matrix = transform.match(/matrix\(([^)]+)\)/);
                    if (matrix) {
                        const values = matrix[1].split(', ');
                        // Calculate rotation from matrix: atan2(b, a)
                        rotation = Math.round(Math.atan2(parseFloat(values[1]), parseFloat(values[0])) * (180 / Math.PI));
                    }
                }
                
                this.draggedDie = {
                    type: die.dataset.type,
                    value: die.dataset.value,
                    name: die.dataset.name,
                    id: die.dataset.id,
                    rotation: rotation, // Preserve rotation from entrance animation
                    isRequired: die.dataset.isRequired === 'true', // Preserve required status
                    isBonus: die.dataset.isBonus === 'true', // Preserve bonus status
                    selectedOperator: die.dataset.selectedOperator || null // Preserve wild cube selection
                };
                this.draggedFromSolution = false;
                this.draggedRowIndex = null;
                die.classList.add('dragging');
                
                // For native drag-and-drop (desktop) - pure browser behavior
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', die.innerHTML);
                    // No custom drag image - let browser handle it naturally
                }
                
                this.sourceDieElement = die;
                
                // Create visual clone for touch dragging
                if (e.type === 'touchstart') {
                    // Clean up any orphaned clones first (defensive cleanup)
                    const orphanedClones = document.querySelectorAll('.touch-drag-clone');
                    orphanedClones.forEach(clone => clone.remove());
                    
                    const coords = getEventCoords(e);
                    const appScale = this.getAppScale();
                    
                    // Get the visual size of the original die
                    const dieRect = die.getBoundingClientRect();
                    const visualWidth = dieRect.width;
                    const visualHeight = dieRect.height;
                    
                    // Cache element references for use during drag (avoid repeated DOM queries)
                    this.cachedDiceAreaElement = document.querySelector('.dice-area');
                    
                    console.log('🎲 Creating drag clone:');
                    console.log('  App scale:', appScale);
                    console.log('  Original die visual size:', visualWidth, 'x', visualHeight);
                    console.log('  Original die offset size:', die.offsetWidth, 'x', die.offsetHeight);
                    
                    this.touchDragClone = die.cloneNode(true);
                    this.touchDragClone.classList.add('touch-drag-clone');
                    // Remove tutorial highlight to prevent layout issues from box-shadow
                    this.touchDragClone.classList.remove('tutorial-highlight');
                    
                    // Use fixed positioning in viewport (not affected by #app's transform)
                    this.touchDragClone.style.position = 'fixed';
                    this.touchDragClone.style.pointerEvents = 'none';
                    this.touchDragClone.style.zIndex = '10000';
                    
                    // Set explicit size to match visual size of original
                    this.touchDragClone.style.width = visualWidth + 'px';
                    this.touchDragClone.style.height = visualHeight + 'px';
                    
                    console.log('  Clone style.width set to:', this.touchDragClone.style.width);
                    
                    // Position in viewport, centered on finger
                    this.touchDragClone.style.left = (coords.clientX - visualWidth / 2) + 'px';
                    this.touchDragClone.style.top = (coords.clientY - visualHeight / 2) + 'px';
                    this.touchDragClone.style.opacity = '0.8';
                    
                    document.body.appendChild(this.touchDragClone);
                    
                    // Check actual rendered size after append
                    setTimeout(() => {
                        const cloneRect = this.touchDragClone.getBoundingClientRect();
                        console.log('  Clone ACTUAL rendered size:', cloneRect.width, 'x', cloneRect.height);
                    }, 0);
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
                
                // Clone is position: fixed in viewport, so use viewport coordinates directly
                const halfWidth = this.touchDragClone.offsetWidth / 2;
                const halfHeight = this.touchDragClone.offsetHeight / 2;
                
                // Get bounds for vertical constraints (use cached element if available)
                const diceAreaElement = this.cachedDiceAreaElement || document.querySelector('.dice-area');
                const diceAreaRect = diceAreaElement.getBoundingClientRect();
                const solutionAreaRect = this.solutionArea.getBoundingClientRect();
                
                // Calculate position
                let left = coords.clientX - halfWidth;
                let top = coords.clientY - halfHeight;
                
                // Constrain Y to stay within game bounds (top of .dice-area to bottom of solution area)
                const minTop = diceAreaRect.top;
                const maxTop = solutionAreaRect.bottom - this.touchDragClone.offsetHeight;
                top = Math.max(minTop, Math.min(top, maxTop));
                
                this.touchDragClone.style.left = left + 'px';
                this.touchDragClone.style.top = top + 'px';
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
                // Check if dragging is disabled by tutorial
                if (this.tutorialManager?.isActive) {
                    const currentStep = this.tutorialManager.scenario?.walkthrough?.steps[this.tutorialManager.currentStep];
                    if (currentStep?.disableDragging) {
                        console.log('🚫 Solution dragging disabled during tutorial');
                        e.preventDefault();
                        return;
                    }
                }
                
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                // Cache element references for use during drag (avoid repeated DOM queries)
                this.cachedDiceAreaElement = document.querySelector('.dice-area');
                
                const coords = getEventCoords(e);
                const row = solutionDie.closest('.solution-row');
                const rowRect = row.getBoundingClientRect();
                
                this.draggedRowIndex = parseInt(row.dataset.row);
                this.draggedDieId = solutionDie.dataset.id;  // Use ID instead of index
                // Find die by ID in the array
                this.draggedDie = this.game.solutions[this.draggedRowIndex].find(d => d.id === this.draggedDieId);
                this.draggedFromSolution = true;
                this.isDragging = true;
                this.currentDragElement = solutionDie;
                this.hasMoved = false;
                
                this.dragStartPos = { x: coords.clientX, y: coords.clientY };
                
                // Convert screen coordinates to app space
                const appScale = this.getAppScale();
                const mouseInRow = {
                    x: (coords.clientX - rowRect.left) / appScale,
                    y: (coords.clientY - rowRect.top) / appScale
                };
                
                // Die's current position in CSS (unscaled coordinates)
                const dieX = parseFloat(solutionDie.style.left) || 0;
                const dieY = parseFloat(solutionDie.style.top) || 0;
                
                // Store original position for animating back on invalid drop
                this.originalDiePosition = { x: dieX, y: dieY };
                
                this.dragOffset = {
                    x: mouseInRow.x - dieX,
                    y: mouseInRow.y - dieY
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
                
                if (dx > LAYOUT.DRAG_THRESHOLD || dy > LAYOUT.DRAG_THRESHOLD) {
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
                    const appScale = this.getAppScale();
                    
                    // Get bounds for vertical constraints and highlighting (use cached element)
                    const diceAreaElement = this.cachedDiceAreaElement || document.querySelector('.dice-area');
                    const diceAreaRect = diceAreaElement ? diceAreaElement.getBoundingClientRect() : null;
                    const solutionAreaRect = this.solutionArea.getBoundingClientRect();
                    
                    // Convert mouse position to unscaled space (relative to current row)
                    let x = ((coords.clientX - rowRect.left) / appScale) - this.dragOffset.x;
                    let y = ((coords.clientY - rowRect.top) / appScale) - this.dragOffset.y;
                    
                    // Constrain Y to stay within game bounds (top of .dice-area to bottom of solution area)
                    if (diceAreaRect) {
                        // Convert bounds to row-relative coordinates
                        const minY = (diceAreaRect.top - rowRect.top) / appScale;
                        const maxY = (solutionAreaRect.bottom - rowRect.top) / appScale - getDieSize();
                        
                        // Clamp Y position
                        y = Math.max(minY, Math.min(y, maxY));
                    }
                    
                    // X is unconstrained (can move freely horizontally)
                    this.currentDragElement.style.left = `${x}px`;
                    this.currentDragElement.style.top = `${y}px`;
                    
                    // Allow die to be visible outside row during drag
                    row.style.overflow = 'visible';
                    
                    // Visual feedback: highlight valid drop zones
                    // Temporarily hide dragged element so we can detect what's underneath
                    this.currentDragElement.style.pointerEvents = 'none';
                    
                    const elementUnderCursor = document.elementFromPoint(coords.clientX, coords.clientY);
                    const targetRow = elementUnderCursor ? elementUnderCursor.closest('.solution-row') : null;
                    const diceArea = elementUnderCursor ? (elementUnderCursor.closest('#dice-container') || elementUnderCursor.closest('.dice-area')) : null;
                    
                    // Restore pointer events
                    this.currentDragElement.style.pointerEvents = '';
                    
                    // Remove all previous highlights
                    document.querySelectorAll('.solution-row.drag-over').forEach(r => r.classList.remove('drag-over'));
                    if (diceAreaElement) diceAreaElement.classList.remove('drag-over');
                    
                    // Add highlight to current target
                    if (targetRow && !targetRow.dataset.disabled) {
                        targetRow.classList.add('drag-over');
                    } else if (diceArea && diceAreaElement) {
                        diceAreaElement.classList.add('drag-over');
                    }
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
                    
                    // Temporarily hide the dragged element so elementFromPoint can see what's underneath
                    this.currentDragElement.style.pointerEvents = 'none';
                    
                    // Detect what's under the drop point (now we can see through the dragged die)
                    const elementUnderDrop = document.elementFromPoint(coords.clientX, coords.clientY);
                    const targetRow = elementUnderDrop ? elementUnderDrop.closest('.solution-row') : null;
                    const diceAreaUnderDrop = elementUnderDrop ? (elementUnderDrop.closest('#dice-container') || elementUnderDrop.closest('.dice-area')) : null;
                    
                    // Restore pointer events
                    this.currentDragElement.style.pointerEvents = '';
                    
                    const sourceRowIndex = this.draggedRowIndex;
                    const sourceRow = this.currentDragElement.closest('.solution-row');
                    
                    // Guard: Make sure we have valid source row data
                    if (sourceRowIndex === null || sourceRowIndex === undefined || !this.game.solutions[sourceRowIndex]) {
                        console.warn('⚠️ Invalid drag state - resetting');
                        this.resetDragState();
                        return;
                    }
                    
                    // Find die by ID in source row
                    const dieIndex = this.game.solutions[sourceRowIndex].findIndex(d => d.id === this.draggedDieId);
                    if (dieIndex === -1) {
                        console.warn('⚠️ Could not find die with ID:', this.draggedDieId, '- resetting drag state');
                        this.resetDragState();
                        return;
                    }
                    
                    // CASE 1: Dropped on dice area - slide back to ghost position
                    if (diceAreaUnderDrop) {
                        console.log('🎲 Dropped on dice area - sliding back to ghost');
                        this.currentDragElement.classList.remove('dragging');
                        this.animateDieBackToDiceArea(this.currentDragElement, sourceRowIndex, dieIndex);
                    }
                    // CASE 2: Dropped on a different row - move between rows
                    else if (targetRow && parseInt(targetRow.dataset.row) !== sourceRowIndex && !targetRow.dataset.disabled) {
                        const targetRowIndex = parseInt(targetRow.dataset.row);
                        const targetRowRect = targetRow.getBoundingClientRect();
                        const appScale = this.getAppScale();
                        
                        console.log(`🔄 Moving die from row ${sourceRowIndex} to row ${targetRowIndex}`);
                        
                        // Calculate position in target row
                        let x = ((coords.clientX - targetRowRect.left) / appScale) - 40;
                        let y = ((coords.clientY - targetRowRect.top) / appScale) - 40;
                        
                        // Get the die object before removing
                        const die = this.game.solutions[sourceRowIndex][dieIndex];
                        
                        // Remove from source row
                        this.game.removeDieFromSolution(sourceRowIndex, dieIndex);
                        
                        // Add to target row
                        this.game.addDieToSolution(die, targetRowIndex, x, y);
                        
                        // Snap to valid position in target row
                        const newDieIndex = this.game.solutions[targetRowIndex].length - 1;
                        const newDie = this.game.solutions[targetRowIndex][newDieIndex];
                        const snappedPos = this.smartSnapPosition(newDie, targetRowIndex, targetRowRect, appScale);
                        this.game.updateDiePosition(targetRowIndex, newDieIndex, snappedPos.x, snappedPos.y);
                        
                        this.currentDragElement.classList.remove('dragging');
                        this.onDrop(); // Trigger re-render
                    }
                    // CASE 3: Dropped in same row - reposition within row
                    else if (targetRow && parseInt(targetRow.dataset.row) === sourceRowIndex) {
                        const rowRect = sourceRow.getBoundingClientRect();
                        const appScale = this.getAppScale();
                        
                        // Convert mouse position to unscaled space
                        let x = ((coords.clientX - rowRect.left) / appScale) - this.dragOffset.x;
                        let y = ((coords.clientY - rowRect.top) / appScale) - this.dragOffset.y;
                        
                        const tempDie = this.game.solutions[sourceRowIndex][dieIndex];
                        tempDie.x = x;
                        tempDie.y = y;
                        
                        const snappedPos = this.smartSnapPosition(tempDie, sourceRowIndex, rowRect, appScale);
                        this.game.updateDiePosition(sourceRowIndex, dieIndex, snappedPos.x, snappedPos.y);
                        
                        this.currentDragElement.classList.remove('dragging');
                        this.onDrop(); // Trigger re-render
                    }
                    // CASE 4: Dropped elsewhere (outside solution/dice area) - animate back to original position
                    else {
                        console.log('⚠️ Dropped outside valid areas - animating back to original position');
                        this.currentDragElement.classList.remove('dragging');
                        
                        // Smoothly animate back to original position
                        gsap.to(this.currentDragElement, {
                            duration: 0.3,
                            left: this.originalDiePosition.x + 'px',
                            top: this.originalDiePosition.y + 'px',
                            ease: 'power2.out'
                        });
                        
                        // No need to re-render since we're just returning to original position
                    }
                }
                
                // Clear all drag-over highlights
                document.querySelectorAll('.solution-row.drag-over').forEach(r => r.classList.remove('drag-over'));
                const diceAreaElement = document.querySelector('.dice-area');
                if (diceAreaElement) diceAreaElement.classList.remove('drag-over');
                
                // Reset row overflow to default
                document.querySelectorAll('.solution-row').forEach(r => r.style.overflow = '');
                
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
                const appScale = this.getAppScale();
                
                // Convert drop position to unscaled space
                let x = ((e.clientX - rowRect.left) / appScale) - 40;
                let y = ((e.clientY - rowRect.top) / appScale) - 40;
                
                this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                
                const newDieIndex = this.game.solutions[rowIndex].length - 1;
                const newDie = this.game.solutions[rowIndex][newDieIndex];
                const snappedPos = this.smartSnapPosition(newDie, rowIndex, rowRect, appScale);
                
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
                    const appScale = this.getAppScale();
                    
                    // Convert drop position to unscaled space
                    let x = ((coords.clientX - rowRect.left) / appScale) - 40;
                    let y = ((coords.clientY - rowRect.top) / appScale) - 40;
                    
                    this.game.addDieToSolution(this.draggedDie, rowIndex, x, y);
                    
                    const newDieIndex = this.game.solutions[rowIndex].length - 1;
                    const newDie = this.game.solutions[rowIndex][newDieIndex];
                    const snappedPos = this.smartSnapPosition(newDie, rowIndex, rowRect, appScale);
                    
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
                const dieId = solutionDie.dataset.id;
                const dieIndex = this.game.solutions[rowIndex].findIndex(d => d.id === dieId);
                
                if (dieIndex !== -1) {
                    // Animate die back to dice area
                    this.animateDieBackToDiceArea(solutionDie, rowIndex, dieIndex);
                }
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
                const dieId = solutionDie.dataset.id;  // Use ID instead of index
                // Find die by ID
                const dieIndex = this.game.solutions[rowIndex].findIndex(d => d.id === dieId);
                if (dieIndex !== -1) {
                    // Reset ALL drag state before removing die
                    // This prevents state from getting stuck after double-tap removal
                    this.resetDragState();
                    
                    this.game.removeDieFromSolution(rowIndex, dieIndex);
                    this.onDrop();
                }
                
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
    smartSnapPosition(newDie, rowIndex, rowRect, appScale = 1) {
        const dieSize = getDieSize();
        const maxOverlapPercent = LAYOUT.MAX_OVERLAP_PERCENT;
        const otherDice = this.game.solutions[rowIndex].filter(d => d !== newDie);
        
        // Convert row dimensions to unscaled space
        const unscaledRowWidth = rowRect.width / appScale;
        const unscaledRowHeight = rowRect.height / appScale;
        
        if (otherDice.length === 0) {
            return {
                x: Math.max(0, Math.min(newDie.x, unscaledRowWidth - dieSize - 20)),
                y: Math.max(0, Math.min(newDie.y, unscaledRowHeight - dieSize - 20))
            };
        }
        
        const currentOverlaps = otherDice.map(other => this.getOverlapPercentage(newDie, other));
        const maxCurrentOverlap = Math.max(...currentOverlaps);
        
        if (maxCurrentOverlap <= maxOverlapPercent) {
            return {
                x: Math.max(0, Math.min(newDie.x, unscaledRowWidth - dieSize - 20)),
                y: Math.max(0, Math.min(newDie.y, unscaledRowHeight - dieSize - 20))
            };
        }
        
        const step = LAYOUT.SNAP_STEP;
        const maxSteps = LAYOUT.SNAP_MAX_STEPS;
        
        for (let distance = step; distance <= maxSteps * step; distance += step) {
            const testDieRight = { ...newDie, x: newDie.x + distance };
            const rightOverlaps = otherDice.map(other => this.getOverlapPercentage(testDieRight, other));
            const maxRightOverlap = Math.max(...rightOverlaps);
            
            if (maxRightOverlap <= maxOverlapPercent && testDieRight.x + dieSize <= unscaledRowWidth - 20) {
                return {
                    x: testDieRight.x,
                    y: Math.max(0, Math.min(newDie.y, unscaledRowHeight - dieSize - 20))
                };
            }
            
            const testDieLeft = { ...newDie, x: newDie.x - distance };
            const leftOverlaps = otherDice.map(other => this.getOverlapPercentage(testDieLeft, other));
            const maxLeftOverlap = Math.max(...leftOverlaps);
            
            if (maxLeftOverlap <= maxOverlapPercent && testDieLeft.x >= 0) {
                return {
                    x: testDieLeft.x,
                    y: Math.max(0, Math.min(newDie.y, unscaledRowHeight - dieSize - 20))
                };
            }
        }
        
        return {
            x: Math.max(0, Math.min(newDie.x, unscaledRowWidth - dieSize - 20)),
            y: Math.max(0, Math.min(newDie.y, unscaledRowHeight - dieSize - 20))
        };
    }
    
    /**
     * Animate a die back to its ghost position in the dice area
     * Used for both drag-to-dice-area and double-click removal
     */
    animateDieBackToDiceArea(solutionDie, rowIndex, dieIndex) {
        const dieFromSolution = this.game.solutions[rowIndex][dieIndex];
        const ghostDie = document.querySelector(`.die[data-id="${dieFromSolution.id}"]`);
        
        if (ghostDie) {
            const ghostRect = ghostDie.getBoundingClientRect();
            const draggedRect = solutionDie.getBoundingClientRect();
            const appScale = this.getAppScale();
            
            // Current element is 80px, will scale to 100px (1.25x)
            const currentSize = 80;
            const targetSize = 100;
            const sizeIncrease = targetSize - currentSize;
            const cornerShift = sizeIncrease / 2;
            
            // Calculate offset to slide (accounting for scale change)
            const deltaX = (ghostRect.left - draggedRect.left) / appScale + cornerShift;
            const deltaY = (ghostRect.top - draggedRect.top) / appScale + cornerShift;
            
            // Get current position
            const currentX = parseFloat(solutionDie.style.left) || 0;
            const currentY = parseFloat(solutionDie.style.top) || 0;
            
            // Get target rotation from die data
            const targetRotation = dieFromSolution?.rotation || 0;
            
            // Animate to ghost position with rotation and scale
            gsap.to(solutionDie, {
                duration: 0.3,
                left: (currentX + deltaX) + 'px',
                top: (currentY + deltaY) + 'px',
                rotation: targetRotation,
                scale: 1.25,
                transformOrigin: 'center center',
                ease: 'power2.out',
                onComplete: () => {
                    // Reset drag state before removing to prevent stuck state
                    this.resetDragState();
                    this.game.removeDieFromSolution(rowIndex, dieIndex);
                    this.onDrop();
                }
            });
        } else {
            // Fallback: no animation, just remove
            this.game.removeDieFromSolution(rowIndex, dieIndex);
            this.onDrop();
        }
    }
    
    // ========================================
    // HELPER METHODS (refactored to DRY up code)
    // ========================================
    
    /**
     * Get the current scale of #app element
     * Replaces ~50 lines of duplicated scale detection code
     */
    getAppScale() {
        const transform = window.getComputedStyle(this.app).transform;
        if (transform && transform !== 'none') {
            return new DOMMatrix(transform).a; // Scale x value
        }
        return 1;
    }
    
    /**
     * Convert screen coordinates to app coordinates (accounting for scale)
     * @param {number} screenX - clientX from event
     * @param {number} screenY - clientY from event
     * @param {number} appScale - Optional cached scale value
     * @returns {{x: number, y: number}} - Coordinates in #app space
     */
    screenToApp(screenX, screenY, appScale = this.getAppScale()) {
        const appRect = this.app.getBoundingClientRect();
        return {
            x: (screenX - appRect.left) / appScale,
            y: (screenY - appRect.top) / appScale
        };
    }
    
    /**
     * Clear all dice from solution areas (both rows) in the DOM
     * Used when transitioning out of tutorials
     * Note: Only clears DOM - game state should be cleared separately by game logic
     */
    clearAllSolutions() {
        console.log('🧹 Clearing solution areas (DOM only)');
        
        // Clear both solution rows in the DOM
        const solutionRows = this.solutionArea.querySelectorAll('.solution-row');
        solutionRows.forEach(row => {
            const dice = row.querySelectorAll('.die');
            dice.forEach(die => die.remove());
        });
        
        console.log('✅ Solution areas cleared (DOM)');
    }
    
    /**
     * Reset all drag state to prevent stuck state after operations like double-tap removal
     * This ensures subsequent drag operations work correctly
     */
    resetDragState() {
        console.log('🔄 Resetting drag state');
        
        // Reset all drag-related flags
        this.draggedDie = null;
        this.draggedFromSolution = false;
        this.draggedRowIndex = null;
        this.draggedDieIndex = null;
        this.draggedDieId = null;
        this.isDragging = false;
        this.hasMoved = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.originalDiePosition = null;
        this.cachedDiceAreaElement = null;
        
        // Clean up any DOM elements
        if (this.currentDragElement) {
            this.currentDragElement.classList.remove('dragging');
            this.currentDragElement.style.zIndex = '';
            this.currentDragElement = null;
        }
        
        if (this.sourceDieElement) {
            this.sourceDieElement.classList.remove('dragging');
            this.sourceDieElement = null;
        }
        
        if (this.touchDragClone) {
            this.touchDragClone.remove();
            this.touchDragClone = null;
        }
        
        // Clear all drag-over highlights
        document.querySelectorAll('.solution-row.drag-over').forEach(r => r.classList.remove('drag-over'));
        const diceAreaElement = document.querySelector('.dice-area');
        if (diceAreaElement) diceAreaElement.classList.remove('drag-over');
        
        // Reset row overflow
        document.querySelectorAll('.solution-row').forEach(r => r.style.overflow = '');
    }
}
