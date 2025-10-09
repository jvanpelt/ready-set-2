# Major Refactor Plan - Version 1

**Date**: October 9, 2025  
**Branch**: `feature/major-refactor`  
**Focus**: Code duplication, magic numbers, dual encoding documentation

---

## 🎯 Goals
1. Unify card/cube indexing systems
2. Reduce code duplication
3. Remove code smell and unused code
4. Improve performance and maintainability
5. Better code organization

---

## 🔍 Issues Found

### 🚨 HIGH PRIORITY

#### 1. **Scale Detection Repetition** (DragDropHandler.js)
**Issue**: Scale detection code is repeated 6+ times across different handlers
```javascript
// This pattern appears everywhere:
const computedStyle = window.getComputedStyle(this.app);
const transform = computedStyle.transform;
let appScale = 1;
if (transform && transform !== 'none') {
    const matrix = new DOMMatrix(transform);
    appScale = matrix.a;
}
```

**Solution**: Create a `getAppScale()` helper method
```javascript
getAppScale() {
    const transform = window.getComputedStyle(this.app).transform;
    if (transform && transform !== 'none') {
        return new DOMMatrix(transform).a;
    }
    return 1;
}
```

**Impact**: Reduces ~50 lines of duplicated code

---

#### 2. **Card Indexing Inconsistency** (levels.js vs scenarioManager.js)
**Issue**: Two different systems for representing cards
- `levels.js`: Uses 0-15 sequential numbering
- `scenarioManager.js`: Uses bitwise encoding (red=1, blue=2, green=4, gold=8)
- Tutorials use one system, puzzle builder uses another
- Converting between them is confusing and error-prone

**Current State**:
- `levels.js` CARD_POOL: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`
- `scenarioManager.js` decodeCard: Bitwise (e.g., 5 = red+green, 10 = blue+gold)

**Solution Options**:
A. **Keep bitwise, convert levels.js** - More compact for storage
B. **Keep sequential, convert scenarioManager.js** - More intuitive
C. **Abstract it** - Create a CardEncoder utility that both use

**Recommendation**: Option C - Create abstraction layer
- Keep bitwise for storage (compact JSON)
- Create CardEncoder.toIndex() and CardEncoder.fromBitwise()
- Update both systems to use the encoder

---

#### 3. **Coordinate Conversion Repetition** (DragDropHandler.js)
**Issue**: Mouse-to-app coordinate conversion repeated everywhere
```javascript
// Repeated pattern:
const mouseInAppScaled = {
    x: coords.clientX - appRect.left,
    y: coords.clientY - appRect.top
};
let x = (mouseInAppScaled.x / appScale) - offset;
```

**Solution**: Create helper methods
```javascript
screenToApp(screenX, screenY, appScale = this.getAppScale()) {
    const appRect = this.app.getBoundingClientRect();
    return {
        x: (screenX - appRect.left) / appScale,
        y: (screenY - appRect.top) / appScale
    };
}
```

---

### ⚠️ MEDIUM PRIORITY

#### 4. **Long Methods** (Multiple files)
- `DragDropHandler.init()`: ~500 lines - should be split into smaller methods
- `UIController.showSuccessModal()`: Complex logic could be extracted
- `solutionFinder.hasPossibleSolution()`: Very long, could be modularized

**Solution**: Extract sub-functions for logical blocks

---

#### 5. **Magic Numbers**
**Examples**:
- `dieSize = isMobile ? 50 : 80` - repeated in multiple places
- `gap = 15` - hardcoded spacing
- `maxOverlapPercent = 20` - snap threshold

**Solution**: Create constants file or configuration object
```javascript
export const LAYOUT_CONSTANTS = {
    DIE_SIZE_DESKTOP: 80,
    DIE_SIZE_MOBILE: 50,
    TUTORIAL_GAP: 15,
    MAX_OVERLAP_PERCENT: 20,
    MOBILE_BREAKPOINT: 768
};
```

---

#### 6. **Console Logs in Production**
**Issue**: Lots of console.log statements throughout codebase
- Some are helpful for debugging
- Others are noise in production

**Solution**: 
- Create a Logger utility with levels (DEBUG, INFO, WARN, ERROR)
- Can be toggled in settings or by environment
- Or just clean up and remove non-essential logs

---

#### 7. **Unused Code**
Need to scan for:
- Commented-out code blocks
- Unused imports
- Dead code paths
- Unused CSS classes

---

### 💡 LOW PRIORITY (Nice to Have)

#### 8. **CSS Organization**
- styles.css is 1400+ lines
- Could be split into modules (layout.css, components.css, animations.css)
- Or convert to CSS modules/scoped styles

#### 9. **Error Handling**
- Some try-catch blocks could be more specific
- Some error messages could be more helpful
- Add user-friendly error messages vs developer logs

#### 10. **Type Safety**
- Consider JSDoc types for better IDE support
- Or gradual migration to TypeScript (future consideration)

---

## 📋 Refactor Checklist

### Phase 1: Foundation (Do First)
- [ ] Create helper utilities (getAppScale, screenToApp, etc.)
- [ ] Create LAYOUT_CONSTANTS configuration
- [ ] Unify card indexing system (CardEncoder utility)

### Phase 2: DragDropHandler Cleanup
- [ ] Extract getAppScale() method
- [ ] Extract screenToApp() method
- [ ] Refactor init() - split into smaller methods
- [ ] Consolidate coordinate conversion logic

### Phase 3: General Cleanup
- [ ] Review and clean up console.logs
- [ ] Remove unused code
- [ ] Extract long methods
- [ ] Fix magic numbers

### Phase 4: Testing
- [ ] Test all drag-and-drop scenarios
- [ ] Test tutorials with new card encoding
- [ ] Test puzzle builder
- [ ] Mobile testing

---

## 🎯 Success Criteria
- [ ] No duplicated scale detection code
- [ ] Single source of truth for card encoding
- [ ] All methods < 100 lines
- [ ] No magic numbers in logic code
- [ ] Game works identically to before (no regressions)

---

## 📊 Estimated Impact
- **Lines Removed**: ~200-300
- **Complexity Reduction**: High
- **Maintainability**: Significantly improved
- **Performance**: Marginal improvement (fewer calculations)
- **Risk**: Medium (lots of changes, needs thorough testing)


