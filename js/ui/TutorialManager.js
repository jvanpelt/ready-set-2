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
        
        this.skipBtn.addEventListener('click', () => this.skip());
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
        
        // Position instruction
        this.positionInstruction(step.highlight);
        
        // Show instruction
        this.instructionEl.classList.remove('hidden');
        
        // Handle progression
        if (step.nextTrigger === 'auto') {
            setTimeout(() => this.nextStep(), step.duration || 3000);
        } else if (step.nextTrigger === 'validation') {
            this.startValidationLoop(step.validation);
        } else if (step.nextTrigger === 'submit') {
            // Will be advanced by submit handler
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
    
    positionInstruction(highlight) {
        if (!highlight) {
            // Default: bottom center
            this.instructionEl.style.bottom = '20px';
            this.instructionEl.style.left = '50%';
            this.instructionEl.style.top = 'auto';
            this.instructionEl.style.transform = 'translateX(-50%)';
            return;
        }
        
        if (highlight.dice && highlight.dice.length > 0) {
            const die = document.querySelector(`.die:not(.solution-die)[data-index="${highlight.dice[0]}"]`);
            if (die) {
                const rect = die.getBoundingClientRect();
                let top = rect.top - this.instructionEl.offsetHeight - 15;
                
                // If too close to top, position below
                if (top < 80) {
                    top = rect.bottom + 15;
                }
                
                this.instructionEl.style.position = 'fixed';
                this.instructionEl.style.left = `${rect.left + rect.width/2}px`;
                this.instructionEl.style.top = `${top}px`;
                this.instructionEl.style.bottom = 'auto';
                this.instructionEl.style.transform = 'translateX(-50%)';
            }
        } else if (highlight.goButton) {
            const goBtn = document.getElementById('go-btn');
            if (goBtn) {
                const rect = goBtn.getBoundingClientRect();
                this.instructionEl.style.position = 'fixed';
                this.instructionEl.style.left = '50%';
                this.instructionEl.style.top = `${rect.top - this.instructionEl.offsetHeight - 15}px`;
                this.instructionEl.style.bottom = 'auto';
                this.instructionEl.style.transform = 'translateX(-50%)';
            }
        } else {
            // Default: bottom center
            this.instructionEl.style.bottom = '20px';
            this.instructionEl.style.left = '50%';
            this.instructionEl.style.top = 'auto';
            this.instructionEl.style.transform = 'translateX(-50%)';
        }
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
        // Quick visual feedback
        this.instructionEl.style.transform = 'translateX(-50%) scale(1.1)';
        setTimeout(() => {
            this.instructionEl.style.transform = 'translateX(-50%) scale(1)';
        }, 200);
    }
    
    nextStep() {
        this.showStep(this.currentStep + 1);
    }
    
    advanceOnSubmit() {
        // Called when user clicks GO during tutorial
        const currentStepData = this.scenario?.walkthrough?.steps[this.currentStep];
        if (currentStepData?.nextTrigger === 'submit') {
            this.complete();
        }
    }
    
    skip() {
        console.log('⏭️ Tutorial skipped');
        this.cleanup();
    }
    
    complete() {
        console.log('✅ Tutorial complete!');
        this.cleanup();
        // Could show completion modal here
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
