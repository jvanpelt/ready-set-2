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
        this.lastScale = null;
        this.scaleCount = 0;
        
        console.log('🔧 AppScaler: Constructor called');
        console.log('  #app element:', this.app ? 'FOUND' : 'NOT FOUND');
        console.log('  #tutorial-instruction element:', this.tutorialInstruction ? 'FOUND' : 'NOT FOUND');
        
        this.init();
    }
    
    init() {
        console.log('🔧 AppScaler: init() called');
        
        // Measure natural height after initial render
        requestAnimationFrame(() => {
            console.log('🔧 AppScaler: requestAnimationFrame callback executing');
            this.measureNaturalHeight();
            this.updateScale();
        });
        
        // Watch for tutorial visibility changes
        this.observeTutorialChanges();
        
        // Recalculate on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            console.log('🔧 AppScaler: resize event fired');
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateScale();
            }, 100); // Debounce resize events
        });
        
        console.log('🔧 AppScaler: init() complete');
    }
    
    measureNaturalHeight() {
        console.log('📏 measureNaturalHeight() called');
        
        // Ensure scale is 1 before measuring
        this.app.style.transform = 'scale(1)';
        this.app.style.transformOrigin = 'top center';
        
        // Force reflow
        this.app.offsetHeight;
        
        // Measure
        const scrollHeight = this.app.scrollHeight;
        const offsetHeight = this.app.offsetHeight;
        const clientHeight = this.app.clientHeight;
        
        console.log('  scrollHeight:', scrollHeight);
        console.log('  offsetHeight:', offsetHeight);
        console.log('  clientHeight:', clientHeight);
        
        this.naturalHeight = scrollHeight;
        
        console.log('📏 App natural height SET TO:', this.naturalHeight + 'px');
    }
    
    updateScale() {
        this.scaleCount++;
        console.log(`🔍 updateScale() called (call #${this.scaleCount})`);
        
        if (!this.naturalHeight) {
            console.warn('⚠️ AppScaler: naturalHeight not set, skipping scale update');
            return;
        }
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const isTutorialVisible = !this.tutorialInstruction.classList.contains('hidden');
        const isMobile = viewportWidth <= LAYOUT.MOBILE_BREAKPOINT;
        const bodyPaddingTop = isMobile ? LAYOUT.BODY_PADDING_MOBILE : LAYOUT.BODY_PADDING_DESKTOP;
        
        console.log(`📱 Device: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${viewportWidth}x${viewportHeight})`);
        console.log(`👁️ Tutorial Visible: ${isTutorialVisible}`);
        console.log(`   Tutorial classList: ${this.tutorialInstruction.classList.toString()}`);
        
        let tutorialHeight = 0;
        let tutorialOffsetHeight = 0;
        let tutorialScrollHeight = 0;
        let availableHeight;
        
        if (isTutorialVisible) {
            // Measure actual rendered height of tutorial (includes padding, border, etc.)
            tutorialOffsetHeight = this.tutorialInstruction.offsetHeight;
            tutorialScrollHeight = this.tutorialInstruction.scrollHeight;
            tutorialHeight = tutorialOffsetHeight;
            
            console.log(`   Tutorial offsetHeight: ${tutorialOffsetHeight}px`);
            console.log(`   Tutorial scrollHeight: ${tutorialScrollHeight}px`);
            
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
        
        // Check if scale changed significantly
        const scaleChanged = this.lastScale === null || Math.abs(scale - this.lastScale) > 0.001;
        
        // Apply scale
        this.app.style.transform = `scale(${scale.toFixed(4)})`;
        this.app.style.transformOrigin = 'top center';
        
        console.log(`📐 SCALE CALCULATION:
  Viewport H: ${viewportHeight}px
  Body Padding: ${bodyPaddingTop}px
  Tutorial H: ${tutorialHeight}px
  Tutorial Gap: ${isTutorialVisible ? LAYOUT.TUTORIAL_GAP : 0}px
  ─────────────────────────
  Available H: ${availableHeight}px
  Natural H: ${this.naturalHeight}px
  ═════════════════════════
  Scale: ${scale.toFixed(4)}x ${scaleChanged ? '(CHANGED)' : '(SAME)'}
  Previous: ${this.lastScale ? this.lastScale.toFixed(4) : 'null'}x`);
        
        this.lastScale = scale;
    }
    
    observeTutorialChanges() {
        console.log('👀 Setting up MutationObserver for tutorial changes');
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const classList = this.tutorialInstruction.classList.toString();
                    const isHidden = this.tutorialInstruction.classList.contains('hidden');
                    console.log(`👀 MutationObserver: Tutorial class changed`);
                    console.log(`   New classList: "${classList}"`);
                    console.log(`   Is hidden: ${isHidden}`);
                    
                    // Small delay to let tutorial render/animation start
                    setTimeout(() => {
                        console.log('👀 MutationObserver: Triggering updateScale() after 50ms delay');
                        this.updateScale();
                    }, 50);
                }
            });
        });
        
        observer.observe(this.tutorialInstruction, { attributes: true });
        console.log('👀 MutationObserver active on #tutorial-instruction');
    }
    
    forceUpdate() {
        this.measureNaturalHeight();
        this.updateScale();
    }
}

