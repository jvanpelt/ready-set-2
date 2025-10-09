/**
 * AppScaler - Scales #app to fit above the tutorial instruction bar
 * 
 * Strategy:
 * - Measure natural height of #app once on load
 * - When tutorial shows: scale to fit in (viewport height - 180px)
 * - Apply transform: scale() to #app
 */

export class AppScaler {
    constructor() {
        this.app = document.getElementById('app');
        this.tutorialInstruction = document.getElementById('tutorial-instruction');
        this.tutorialHeight = 180; // Fixed height from CSS
        this.naturalHeight = null;
        
        this.init();
    }
    
    init() {
        // Measure natural height after initial render
        requestAnimationFrame(() => {
            this.measureNaturalHeight();
            this.updateScale();
        });
        
        // Watch for tutorial visibility changes
        this.observeTutorialChanges();
        
        // Recalculate on window resize
        window.addEventListener('resize', () => this.updateScale());
    }
    
    measureNaturalHeight() {
        // Ensure scale is 1 before measuring
        this.app.style.transform = 'scale(1)';
        this.app.style.transformOrigin = 'top center';
        
        // Force reflow
        this.app.offsetHeight;
        
        // Measure
        this.naturalHeight = this.app.scrollHeight;
        
        console.log('📏 App natural height:', this.naturalHeight + 'px');
    }
    
    updateScale() {
        if (!this.naturalHeight) return;
        
        const viewportHeight = window.innerHeight;
        const isTutorialVisible = !this.tutorialInstruction.classList.contains('hidden');
        
        let availableHeight;
        if (isTutorialVisible) {
            // Tutorial is showing - scale to fit above it
            availableHeight = viewportHeight - this.tutorialHeight;
        } else {
            // No tutorial - use full viewport
            availableHeight = viewportHeight;
        }
        
        // Calculate scale factor with slight buffer to maximize space usage
        const rawScale = availableHeight / this.naturalHeight;
        const adjustedScale = rawScale * 1.05; // 5% more to fill space better
        const scale = Math.min(1, adjustedScale);
        
        // Apply scale
        this.app.style.transform = `scale(${scale.toFixed(4)})`;
        this.app.style.transformOrigin = 'top center';
        
        console.log(`🔍 Scale Update:
  Viewport: ${viewportHeight}px
  Tutorial: ${isTutorialVisible ? this.tutorialHeight : 0}px
  Available: ${availableHeight}px
  Natural: ${this.naturalHeight}px
  Scale: ${scale.toFixed(4)}x`);
    }
    
    observeTutorialChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    // Small delay to let tutorial animation start
                    setTimeout(() => this.updateScale(), 50);
                }
            });
        });
        
        observer.observe(this.tutorialInstruction, { attributes: true });
    }
    
    forceUpdate() {
        this.measureNaturalHeight();
        this.updateScale();
    }
}

