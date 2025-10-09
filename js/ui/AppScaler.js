/**
 * AppScaler - Scales #app to fit above the tutorial instruction bar
 * 
 * Strategy:
 * - Measure natural height of #app once on load
 * - When tutorial shows: measure tutorial element height dynamically
 * - Calculate: availableHeight = viewport height - tutorial height
 * - Apply transform: scale(availableHeight / naturalHeight) to #app
 */

export class AppScaler {
    constructor() {
        this.app = document.getElementById('app');
        this.tutorialInstruction = document.getElementById('tutorial-instruction');
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
        // Body padding-top: 20px on desktop, 8px on mobile (768px breakpoint)
        const isMobile = window.innerWidth <= 768;
        const bodyPaddingTop = isMobile ? 8 : 20;
        
        let tutorialHeight = 0;
        let availableHeight;
        
        if (isTutorialVisible) {
            // Measure actual rendered height of tutorial (includes padding, border, etc.)
            tutorialHeight = this.tutorialInstruction.offsetHeight;
            // Add small gap between app and tutorial for breathing room
            const gap = 15;
            availableHeight = viewportHeight - tutorialHeight - gap - bodyPaddingTop;
        } else {
            // No tutorial - use full viewport minus body padding
            availableHeight = viewportHeight - bodyPaddingTop;
        }
        
        // Calculate precise scale factor
        const scale = Math.min(1, availableHeight / this.naturalHeight);
        
        // Apply scale
        this.app.style.transform = `scale(${scale.toFixed(4)})`;
        this.app.style.transformOrigin = 'top center';
        
        console.log(`🔍 Scale Update:
  Viewport: ${viewportHeight}px
  Tutorial Height (measured): ${tutorialHeight}px
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

