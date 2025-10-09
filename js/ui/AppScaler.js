/**
 * AppScaler - Scales #app to fit above the tutorial instruction bar
 * 
 * Strategy:
 * - Measure natural height of #app once on load
 * - When tutorial shows: measure tutorial element height dynamically
 * - Calculate: availableHeight = viewport height - tutorial height
 * - Apply transform: scale(availableHeight / naturalHeight) to #app
 */

import { LAYOUT } from '../constants.js';

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
        if (!this.naturalHeight) {
            console.warn('⚠️ AppScaler: naturalHeight not set, skipping scale update');
            return;
        }
        
        const viewportHeight = window.innerHeight;
        const isTutorialVisible = !this.tutorialInstruction.classList.contains('hidden');
        const isMobile = window.innerWidth <= LAYOUT.MOBILE_BREAKPOINT;
        const bodyPaddingTop = isMobile ? LAYOUT.BODY_PADDING_MOBILE : LAYOUT.BODY_PADDING_DESKTOP;
        
        console.log(`📱 Device Check: ${isMobile ? 'MOBILE' : 'DESKTOP'} (width: ${window.innerWidth}px)`);
        console.log(`👁️ Tutorial Visible: ${isTutorialVisible} (hidden class: ${this.tutorialInstruction.classList.contains('hidden')})`);
        
        let tutorialHeight = 0;
        let availableHeight;
        
        if (isTutorialVisible) {
            // Measure actual rendered height of tutorial (includes padding, border, etc.)
            tutorialHeight = this.tutorialInstruction.offsetHeight;
            // Add small gap between app and tutorial for breathing room
            availableHeight = viewportHeight - tutorialHeight - LAYOUT.TUTORIAL_GAP - bodyPaddingTop;
            // Align to top when tutorial is visible
            document.body.style.alignItems = 'flex-start';
        } else {
            // No tutorial - use full viewport minus body padding
            availableHeight = viewportHeight - bodyPaddingTop;
            // Center vertically when no tutorial
            document.body.style.alignItems = 'center';
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

