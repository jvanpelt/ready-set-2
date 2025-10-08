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
        this.savedSolutionHelperState = null; // Store user's preference before tutorial
        
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
        
        // Set flag in Game to suppress timer timeout during tutorial
        this.game.isTutorialActive = true;
        console.log('⏰ Timer timeout suppressed during tutorial');
        
        // Save user's Solution Helper preference and force it ON for tutorial
        this.savedSolutionHelperState = this.ui.settings.solutionHelper;
        console.log('💡 Solution Helper: Saved user preference:', this.savedSolutionHelperState);
        this.ui.settings.solutionHelper = true;
        this.ui.solutionHelperToggle.checked = true;
        console.log('💡 Solution Helper: Forced ON for tutorial');
        
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
            this.skipBtn.style.display = 'inline-block'; // Keep Skip visible
            this.startValidationLoop(step.validation);
        } else if (step.nextTrigger === 'submit') {
            // Hide Next button and Skip button - user must submit
            this.nextBtn.style.display = 'none';
            this.skipBtn.style.display = 'none';
        } else {
            // Show Next button for manual progression (including 'auto' steps)
            this.nextBtn.style.display = 'block';
            this.skipBtn.style.display = 'inline-block'; // Keep Skip visible
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
            
            if (!result.valid) {
                // Solution is mathematically incorrect
                console.log('❌ Tutorial solution incorrect:', result.message);
                this.ui.playErrorAnimation();
                this.ui.playBonkSound();
                return; // Don't advance - let them try again
            }
            
            // Check if they used the expected dice (if specified)
            if (this.scenario.expectedSolution) {
                const usedCorrectDice = this.validateExpectedDice();
                if (!usedCorrectDice) {
                    console.log('❌ Tutorial: must use the specific dice being taught');
                    this.ui.playErrorAnimation();
                    this.ui.playBonkSound();
                    return; // Don't advance - let them try with the correct dice
                }
            }
            
            // Solution is correct AND uses the right dice - complete tutorial
            this.complete();
        }
    }
    
    validateExpectedDice() {
        // Check if the solution uses the exact dice specified in expectedSolution
        const expected = this.scenario.expectedSolution;
        
        console.log('🎓 Validating expected dice:');
        console.log('   Expected:', expected);
        
        // Handle two formats:
        // 1. Array (old format - levels 1-5): expectedSolution: ['red', '∪', 'blue']
        // 2. Object (new format - level 6+): expectedSolution: { restriction: [...], setName: [...] }
        
        if (Array.isArray(expected)) {
            // Old format: validate row 1 (set name)
            // For wild cubes, use selectedOperator; for others, use value
            const actual = this.game.solutions[1].map(die => 
                die.type === 'wild' ? die.selectedOperator : die.value
            );
            console.log('   Actual (set name):', actual);
            
            if (actual.length !== expected.length) {
                console.log('   ❌ Wrong number of dice');
                return false;
            }
            
            for (let i = 0; i < expected.length; i++) {
                if (actual[i] !== expected[i]) {
                    console.log(`   ❌ Mismatch at position ${i}: expected "${expected[i]}", got "${actual[i]}"`);
                    return false;
                }
            }
            
            console.log('   ✅ Dice match!');
            return true;
        } else {
            // New format: validate both restriction and set name
            let valid = true;
            
            // Validate restriction (row 0)
            if (expected.restriction) {
                // For wild cubes, use selectedOperator; for others, use value
                const actualRestriction = this.game.solutions[0].map(die => 
                    die.type === 'wild' ? die.selectedOperator : die.value
                );
                console.log('   Expected restriction:', expected.restriction);
                console.log('   Actual restriction:', actualRestriction);
                
                if (actualRestriction.length !== expected.restriction.length) {
                    console.log('   ❌ Wrong number of restriction dice');
                    valid = false;
                } else {
                    for (let i = 0; i < expected.restriction.length; i++) {
                        if (actualRestriction[i] !== expected.restriction[i]) {
                            console.log(`   ❌ Restriction mismatch at position ${i}: expected "${expected.restriction[i]}", got "${actualRestriction[i]}"`);
                            valid = false;
                        }
                    }
                }
            }
            
            // Validate set name (row 1)
            if (expected.setName) {
                // For wild cubes, use selectedOperator; for others, use value
                const actualSetName = this.game.solutions[1].map(die => 
                    die.type === 'wild' ? die.selectedOperator : die.value
                );
                console.log('   Expected set name:', expected.setName);
                console.log('   Actual set name:', actualSetName);
                
                if (actualSetName.length !== expected.setName.length) {
                    console.log('   ❌ Wrong number of set name dice');
                    valid = false;
                } else {
                    for (let i = 0; i < expected.setName.length; i++) {
                        if (actualSetName[i] !== expected.setName[i]) {
                            console.log(`   ❌ Set name mismatch at position ${i}: expected "${expected.setName[i]}", got "${actualSetName[i]}"`);
                            valid = false;
                        }
                    }
                }
            }
            
            if (valid) {
                console.log('   ✅ All dice match!');
            }
            
            return valid;
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
        
        // Clear tutorial flag in Game and handle expired timer
        this.game.isTutorialActive = false;
        console.log('⏰ Timer timeout re-enabled');
        
        // If timer expired during tutorial, start fresh round
        if (this.game.timeRemaining !== null && this.game.timeRemaining <= 0) {
            console.log('⏰ Timer expired during tutorial - starting fresh round');
            this.game.stopTimer();
            this.game.generateNewRound();
            this.ui.render();
        }
        
        // Restore user's Solution Helper preference
        if (this.savedSolutionHelperState !== null) {
            console.log('💡 Solution Helper: Restoring user preference:', this.savedSolutionHelperState);
            this.ui.settings.solutionHelper = this.savedSolutionHelperState;
            this.ui.solutionHelperToggle.checked = this.savedSolutionHelperState;
            this.game.storage.saveSettings(this.ui.settings);
            
            // Clear or evaluate based on restored state
            if (this.savedSolutionHelperState) {
                setTimeout(() => this.ui.evaluateSolutionHelper(), 0);
            } else {
                this.ui.clearSolutionHelper();
            }
            
            this.savedSolutionHelperState = null;
        }
        
        this.scenario = null;
        this.currentStep = 0;
    }
}
