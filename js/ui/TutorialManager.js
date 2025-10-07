import { ScenarioManager } from '../scenarioManager.js';

export class TutorialManager {
    constructor(game, uiController) {
        this.game = game;
        this.ui = uiController;
        this.scenarioManager = new ScenarioManager(game);
        
        this.scenario = null;
        this.currentStep = 0;
        this.isActive = false;
        this.validationInterval = null;
        
        this.instructionEl = document.getElementById('tutorial-instruction');
        this.stepBadgeEl = document.getElementById('tutorial-step-badge');
        this.instructionTextEl = document.getElementById('tutorial-instruction-text');
        this.skipBtn = document.getElementById('tutorial-skip-btn');
        this.nextBtn = document.getElementById('tutorial-next-btn');
        
        this.skipBtn.addEventListener('click', () => this.skip());
        this.nextBtn.addEventListener('click', () => this.handleNextClick());
        
        // Make instruction box draggable
        this.initDraggable();
    }
    
    initDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const dragStart = (e) => {
            // Only drag from the badge or text area, not buttons
            if (e.target.tagName === 'BUTTON') return;
            
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
            
            isDragging = true;
            this.instructionEl.style.cursor = 'grabbing';
        };
        
        const dragEnd = () => {
            isDragging = false;
            this.instructionEl.style.cursor = 'move';
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            // Override positioning
            this.instructionEl.style.top = `${20 + yOffset}px`;
            this.instructionEl.style.right = `${20 - xOffset}px`;
            this.instructionEl.style.left = 'auto';
            this.instructionEl.style.bottom = 'auto';
            this.instructionEl.style.transform = 'none';
        };
        
        this.instructionEl.addEventListener('mousedown', dragStart);
        this.instructionEl.addEventListener('mouseup', dragEnd);
        this.instructionEl.addEventListener('mousemove', drag);
        
        this.instructionEl.addEventListener('touchstart', dragStart, { passive: true });
        this.instructionEl.addEventListener('touchend', dragEnd);
        this.instructionEl.addEventListener('touchmove', drag, { passive: false });
    }
    
    start(scenarioData) {
        if (!scenarioData?.walkthrough?.enabled) return;
        
        console.log('🎓 Starting tutorial...');
        
        this.scenario = scenarioData;
        this.currentStep = 0;
        this.isActive = true;
        
        // Load the tutorial scenario
        this.scenarioManager.loadScenario(scenarioData);
        
        // Re-render UI
        this.ui.render();
        
        // Add tutorial-active class to body
        document.body.classList.add('tutorial-active');
        
        // Start first step
        this.showStep(0);
    }
    
    showStep(stepIndex) {
        if (!this.scenario || stepIndex >= this.scenario.walkthrough.steps.length) {
            this.complete();
            return;
        }
        
        const step = this.scenario.walkthrough.steps[stepIndex];
        this.currentStep = stepIndex;
        
        console.log(`📚 Tutorial Step ${stepIndex + 1}/${this.scenario.walkthrough.steps.length}:`, step.message);
        
        // Clear previous highlights
        this.clearHighlights();
        
        // Update instruction text
        this.stepBadgeEl.textContent = `Step ${stepIndex + 1}/${this.scenario.walkthrough.steps.length}`;
        this.instructionTextEl.innerHTML = step.message;
        
        // Apply new highlights
        if (step.highlight) {
            this.applyHighlights(step.highlight);
        }
        
        // Show instruction (now always top-right, draggable)
        this.instructionEl.classList.remove('hidden');
        
        // Handle progression based on step type
        if (step.nextTrigger === 'validation') {
            // Hide Next button, wait for user to complete action
            this.nextBtn.style.display = 'none';
            this.startValidationLoop(step.validation);
        } else if (step.nextTrigger === 'submit') {
            // Hide Next button, wait for GO button click
            this.nextBtn.style.display = 'none';
        } else {
            // Show Next button for manual progression (including 'auto' steps)
            this.nextBtn.style.display = 'block';
        }
    }
    
    handleNextClick() {
        const step = this.scenario?.walkthrough?.steps[this.currentStep];
        if (!step) return;
        
        // Only allow Next for non-validation, non-submit steps
        if (step.nextTrigger !== 'validation' && step.nextTrigger !== 'submit') {
            this.nextStep();
        }
    }
    
    applyHighlights(highlight) {
        if (!highlight) return;
        
        if (highlight.dice) {
            highlight.dice.forEach(index => {
                const die = document.querySelector(`.die:not(.solution-die)[data-index="${index}"]`);
                if (die) die.classList.add('tutorial-highlight');
            });
        }
        
        if (highlight.goButton) {
            const goBtn = document.getElementById('go-btn');
            if (goBtn) goBtn.classList.add('tutorial-highlight');
        }
        
        if (highlight.goal) {
            const goalEl = document.getElementById('goal');
            if (goalEl) goalEl.parentElement.classList.add('tutorial-highlight');
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }
    
    startValidationLoop(validationFn) {
        // Check every 100ms if user completed the step
        this.validationInterval = setInterval(() => {
            if (validationFn(this.game)) {
                clearInterval(this.validationInterval);
                this.validationInterval = null;
                this.celebrateSuccess();
                setTimeout(() => this.nextStep(), 800);
            }
        }, 100);
    }
    
    celebrateSuccess() {
        // Quick visual feedback with glow effect
        this.stepBadgeEl.style.animation = 'none';
        setTimeout(() => {
            this.stepBadgeEl.style.animation = 'tutorialPulse 0.5s ease';
        }, 10);
    }
    
    nextStep() {
        this.showStep(this.currentStep + 1);
    }
    
    advanceOnSubmit() {
        // Called when user clicks GO during tutorial
        const currentStepData = this.scenario?.walkthrough?.steps[this.currentStep];
        if (currentStepData?.nextTrigger === 'submit') {
            // Validate solution before completing tutorial
            const result = this.game.validateSolution();
            
            if (result.valid) {
                // Solution is correct, complete tutorial
                this.complete();
            } else {
                // Solution is incorrect, show error but stay in tutorial
                console.log('❌ Tutorial solution incorrect:', result.message);
                this.ui.playErrorAnimation();
                this.ui.playBonkSound();
                // Don't advance - let them try again
            }
        }
    }
    
    skip() {
        console.log('⏭️ Tutorial skipped');
        this.cleanup();
        // Reset to a fresh round after skipping tutorial
        this.game.resetRound();
        this.ui.render();
    }
    
    complete() {
        console.log('✅ Tutorial complete!');
        this.cleanup();
        // Show completion modal, then reset to fresh round
        this.ui.modals.showTutorialComplete(() => {
            this.game.resetRound();
            this.ui.render();
        });
    }
    
    cleanup() {
        this.isActive = false;
        
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
        
        this.clearHighlights();
        this.instructionEl.classList.add('hidden');
        document.body.classList.remove('tutorial-active');
        
        this.scenario = null;
        this.currentStep = 0;
    }
}
