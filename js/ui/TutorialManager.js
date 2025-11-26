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
        this.achievementCelebrated = false; // Track if we've celebrated this step's achievement
        this.entryPoint = null; // Track where tutorial was launched from: 'menu' or 'level-interstitial'
        this.savedSolutionHelperState = null; // Store user's preference before tutorial
        
        this.instructionEl = document.getElementById('tutorial-instruction');
        this.stepBadgeEl = document.getElementById('tutorial-step-badge');
        this.instructionTextEl = document.getElementById('tutorial-instruction-text');
        this.skipBtn = document.getElementById('tutorial-skip-btn');
        this.nextBtn = document.getElementById('tutorial-next-btn');
        
        // Game control buttons (for disabling during validation steps)
        this.goBtn = document.getElementById('go-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.skipBtn.addEventListener('click', () => this.skip());
        this.nextBtn.addEventListener('click', () => this.handleNextClick());
    }
    
    start(scenarioData, entryPoint = 'menu') {
        if (!scenarioData?.walkthrough?.enabled) return;
        
        console.log('🎓 Starting tutorial...');
        console.log('   Entry point:', entryPoint);
        
        this.scenario = scenarioData;
        this.currentStep = 0;
        this.isActive = true;
        this.entryPoint = entryPoint;
        
        // Timer behavior depends on the level
        if (this.game.level === 7) {
            // Level 7 tutorial: Timer should tick and can expire
            this.game.timer.startFresh();
            this.game.isTutorialActive = true;
        } else {
            // Other tutorials: Stop timer (will restart when tutorial completes)
            this.game.timer.stop(true);
            this.game.isTutorialActive = true;
        }
        
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
        
        // Disable GO and PASS for the entire tutorial
        // They'll only be enabled on the final "press GO" step
        if (this.goBtn) this.goBtn.disabled = true;
        if (this.passBtn) this.passBtn.disabled = true;
        
        // Start first step
        this.showStep(0);
        
        // Note: Puzzle ID display is now controlled by UIController.render()
        // based on tutorialManager.isActive state
    }
    
    showStep(stepIndex) {
        if (!this.scenario || stepIndex >= this.scenario.walkthrough.steps.length) {
            this.complete();
            return;
        }
        
        const step = this.scenario.walkthrough.steps[stepIndex];
        this.currentStep = stepIndex;
        
        console.log(`📚 Tutorial Step ${stepIndex + 1}/${this.scenario.walkthrough.steps.length}:`, step.message);
        
        // Clear any previous validation loop
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
        
        // Reset achievement celebration for new step
        this.achievementCelebrated = false;
        
        // Clear previous highlights
        this.clearHighlights();
        
        // Update instruction text
        this.stepBadgeEl.textContent = `Step ${stepIndex + 1}/${this.scenario.walkthrough.steps.length}`;
        this.instructionTextEl.innerHTML = step.message;
        
        // Apply new highlights
        if (step.highlight) {
            this.applyHighlights(step.highlight);
        }
        
        // Re-render to update dice draggable attributes based on new step
        // This ensures tutorial-disabled cubes are properly updated
        this.ui.render();
        
        // Show instruction (now always top-right, draggable)
        this.instructionEl.classList.remove('hidden');
        
        // Call onEnter callback if defined (for animations, etc.)
        if (typeof step.onEnter === 'function') {
            console.log('🎬 Running step onEnter callback');
            step.onEnter();
        }
        
        // Handle progression based on step type
        if (step.nextTrigger === 'validation') {
            // Disable Next button, wait for user to complete action
            // Keeping it visible (but disabled) helps prevent accidental Skip clicks
            this.nextBtn.style.display = 'block';
            this.nextBtn.disabled = true;
            this.skipBtn.style.display = 'inline-block';
            
            this.startValidationLoop(step.validation);
        } else if (step.nextTrigger === 'submit') {
            // Hide Next button and Skip button - user must submit
            this.nextBtn.style.display = 'none';
            this.nextBtn.disabled = true;
            this.skipBtn.style.display = 'none';
            
            // Enable GO for submit steps (final step where they press GO)
            if (this.goBtn) this.goBtn.disabled = false;
            // PASS stays disabled - tutorial has a specific solution
        } else {
            // Show Next button for manual progression (including 'auto' steps)
            this.nextBtn.style.display = 'block';
            this.nextBtn.disabled = false;
            this.skipBtn.style.display = 'inline-block';
            
            // GO and PASS stay disabled for auto steps
        }
    }
    
    handleNextClick() {
        const step = this.scenario?.walkthrough?.steps[this.currentStep];
        if (!step) return;
        
        // Don't allow Next if button is disabled
        if (this.nextBtn.disabled) return;
        
        // Allow Next for validation steps (when achievement is met and button is enabled)
        // Don't allow Next for submit steps (user must submit)
        if (step.nextTrigger !== 'submit') {
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
        // Check every 100ms if achievement is met
        // Keep checking continuously - achievement can be met, then un-met
        this.validationInterval = setInterval(() => {
            const isValid = validationFn(this.game);
            
            // Enable/disable Next button based on current state
            this.nextBtn.disabled = !isValid;
            
            // Only celebrate once when first achieved
            if (isValid && !this.achievementCelebrated) {
                this.achievementCelebrated = true;
                this.celebrateSuccess();
            }
            
            // Reset celebration flag if they break the achievement
            if (!isValid && this.achievementCelebrated) {
                this.achievementCelebrated = false;
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
            // Old format: Check BOTH rows, order-agnostic (player can arrange freely)
            // For wild cubes, use selectedOperator; for others, use value
            const allDice = [
                ...this.game.solutions[0].map(die => die.type === 'wild' ? die.selectedOperator : die.value),
                ...this.game.solutions[1].map(die => die.type === 'wild' ? die.selectedOperator : die.value)
            ];
            
            console.log('   All dice (both rows):', allDice);
            
            // Check if all expected dice are present (order doesn't matter)
            const hasAllExpected = expected.every(expectedDie => 
                allDice.includes(expectedDie)
            );
            
            // Check count matches (prevent extra dice)
            const countMatches = allDice.length === expected.length;
            
            if (hasAllExpected && countMatches) {
                console.log('   ✅ All expected dice present!');
                return true;
            }
            
            if (!hasAllExpected) {
                console.log('   ❌ Missing some expected dice');
            } else {
                console.log('   ❌ Wrong number of dice');
            }
            return false;
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
        
        // Start fresh timer if level needs one
        this.ui.handleTutorialComplete();
    }
    
    complete() {
        console.log('✅ Tutorial complete!');
        console.log('   Entry point was:', this.entryPoint);
        this.cleanup();
        
        // Route based on entry point
        if (this.entryPoint === 'level-interstitial') {
            // Entered from level interstitial - start the level with new puzzle
            console.log('   → Returning to gameplay (new puzzle)');
            this.ui.modals.showTutorialComplete(() => {
                console.log('   → Tutorial complete modal closed, resetting round');
                
                // Clear solution areas in DOM before resetting
                this.ui.dragDropHandler.clearAllSolutions();
                
                this.game.resetRound();
                this.ui.render();
                
                // Notify UIController to handle timer
                this.ui.handleTutorialComplete();
            });
        } else if (this.entryPoint === 'home-screen') {
            // Entered from home screen - return to home screen
            console.log('   → Returning to home screen');
            this.ui.modals.showTutorialComplete(() => {
                console.log('   → Tutorial complete modal closed, showing home screen');
                
                // Clear solution areas in DOM before showing home
                this.ui.dragDropHandler.clearAllSolutions();
                
                window.homeScreen.show();
            });
        } else if (this.entryPoint === 'menu-during-gameplay') {
            // Entered from menu during regular gameplay - restore saved game
            const savedState = this.game.storage.loadGameState();
            
            if (savedState && savedState.cards && savedState.cards.length > 0) {
                console.log('   → Restoring saved game state');
                this.ui.modals.showTutorialComplete(() => {
                    console.log('   → Tutorial complete modal closed, restoring state');
                    
                    // Clear solution areas in DOM before restoring
                    this.ui.dragDropHandler.clearAllSolutions();
                    
                    this.game.restoreFromSavedState(savedState);
                    this.ui.render();
                    console.log('✅ Game state restored');
                });
            } else {
                // Fallback: no saved state, go to home
                console.log('   → No saved state, returning to home screen');
                this.ui.modals.showTutorialComplete(() => {
                    window.homeScreen.show();
                });
            }
        } else {
            // Legacy fallback: 'menu' - treat as menu during gameplay
            console.log('   → Legacy menu entry point, restoring saved state');
            const savedState = this.game.storage.loadGameState();
            
            if (savedState && savedState.cards && savedState.cards.length > 0) {
                this.ui.modals.showTutorialComplete(() => {
                    this.ui.dragDropHandler.clearAllSolutions();
                    this.game.restoreFromSavedState(savedState);
                    this.ui.render();
                });
            } else {
                this.ui.modals.showTutorialComplete(() => {
                    window.homeScreen.show();
                });
            }
        }
    }
    
    cleanup() {
        console.log('🧹 TutorialManager.cleanup() called');
        this.isActive = false;
        
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
        
        this.clearHighlights();
        console.log('🧹 Hiding instruction element');
        this.instructionEl.classList.add('hidden');
        document.body.classList.remove('tutorial-active');
        
        // Re-enable all buttons
        if (this.goBtn) this.goBtn.disabled = false;
        if (this.passBtn) this.passBtn.disabled = false;
        if (this.resetBtn) this.resetBtn.disabled = false;
        
        // Clear tutorial flag in Game
        this.game.isTutorialActive = false;
        
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
