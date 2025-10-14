# Ready, Set 2 - TODO List

## 🔄 Current Status (Oct 14, 2025)
**Branch**: `main`  
**Version**: `3.13.0-wild-cube-fix`
**Task**: Home screen, intro tutorial, and UX polish completed! 🎉

**Recent Completion (Oct 9-14, 2025)**:
- ✅ **Home Screen Implementation**
  - Logo integration
  - Continue from Level X button (shows when game progress exists)
  - New Game button
  - How to Play button (shows intro tutorial)
  - Menu button with consistent styling
- ✅ **Intro Tutorial (Level 0)**
  - Non-interactive animated steps for concepts
  - Interactive cube dragging for hands-on learning
  - GSAP animations for visual polish (cards, goal, cubes)
  - Teaches: Universe, Goal, Cubes, Solution Area, OR vs AND operators
- ✅ **Solution Helper Rebrand**
  - Now "Guided Mode" (ON by default) / "Advanced Mode" (OFF)
  - Dynamic description text based on toggle state
  - Set to ON by default for new players
- ✅ **Interstitial Screen Redesign**
  - Green translucent aesthetic (matches game theme)
  - Fade-out transitions
  - Menu button on all interstitials
  - "New Game" now goes to Level 1 interstitial (not directly to gameplay)
- ✅ **Menu Modal Improvements**
  - X close button in upper right corner
  - Click backdrop to close/resume
  - Removed Resume button from menu list
  - Translucent background matching game aesthetic
- ✅ **Modal Design Refresh**
  - All modals use translucent blue-green background
  - White borders for definition
  - Consistent with home/interstitial aesthetic
- ✅ **Wild Cube Popover Fix**
  - Fixed positioning (moved outside #app to avoid scaling issues)
  - Auto-shows when wild cube dropped in solution area
  - Faster response time (100ms vs 250ms)
  - Selection now works correctly
- ✅ **Tutorial Cleanup System**
  - Restores game state when navigating away from tutorials
  - Cleans up highlights, timer, Solution Helper state
  - Called from Home button, New Game, Jump to Level
- ✅ **Workflow Documentation**
  - Created `WORKFLOW.md` to enforce merge approval process
  - Prevents accidental merges to main without user testing

**Known limitations**:
- Desktop drag cursor is native browser (no custom clone due to scaling complexity)
- Mobile drag works perfectly with custom touch implementation
- Debug logging present in wild cube code (cleanup pending)

**Next steps**:
1. Mobile device testing of recent changes
2. Clean up debug logging (optional)
3. Consider: Level score requirements, tutorial tracking, or theming

---

## 🎯 Previous Focus (Completed)
- [ ] **Testing and fixing tutorial scenarios (Levels 1-10)** - IN PROGRESS
  - [x] Level 1: Union
  - [x] Level 2: Difference
  - [x] Level 3: Complement (fixed card count)
  - [ ] Level 4: Duplicate operators (testing now)
  - [ ] Level 5: Universe & Null
  - [ ] Level 6: Restrictions
  - [ ] Level 7: Timer
  - [ ] Level 8: Required cubes
  - [ ] Level 9: Wild cubes
  - [ ] Level 10: Bonus cubes

---

## 🚀 Post-Tutorial Roadmap

### Phase 1: Code Cleanup
- [ ] **Refactor: Unify card and cube indexing systems**
  - Currently `levels.js` uses sequential array, `scenarioManager.js` uses bitwise
  - Standardize on bitwise encoding throughout
  - Update all card references in tutorials
  - Test thoroughly across all levels

- [ ] **Enable tutorial tracking (show once behavior)**
  - Uncomment all `markTutorialAsViewed()` calls in:
    - `ModalManager.js` (hideResult)
    - `UIController.js` (showFirstTimeInterstitial, showTutorialForLevel)
  - Test that tutorials only show once per level

- [ ] **Restore original level score requirements**
  - Currently set to 50 for testing
  - Restore to original values:
    - Level 1: 500
    - Level 2: 750
    - Level 3: 1000
    - Level 4: 1500
    - Level 5: 2500
    - Level 6: 5000
    - Level 7: 5000
    - Level 8: 5000
    - Level 9: 7500
    - Level 10: 10000

---

### Phase 2: Core Features

- [x] **Create placeholder start screen** ✅ COMPLETED
  - Design home/landing page UI
  - Add buttons:
    - New Game
    - Continue Game
    - Tutorial (Level 0)
    - Settings
  - Logo and branding
  - Smooth transitions to game

- [x] **Implement Level Zero (onboarding tutorial)** ✅ COMPLETED (renamed to "intro")
  - Interactive tutorial teaching fundamentals BEFORE Level 1
  - Concepts to cover:
    - What cards are (colored dots)
    - What the goal number means
    - What color cubes do
    - How to drag and submit
    - First simple solve (single color cube, no operators)
  - Keep it SHORT (2-3 minutes max)
  - Make it feel like success/accomplishment
  - Use existing tutorial system architecture

- [ ] **Complete Level 10 functionality**
  - Bonus cubes are partially implemented
  - Verify bonus cube mechanics work correctly
  - Test bonus cube interaction with other special cubes
  - Ensure proper scoring for bonus cubes
  - Verify UI display (bonus cube styling)

---

### Phase 3: UX Improvements

- [x] **Solution Helper overhaul (rebrand as Guided/Advanced mode)** ✅ COMPLETED
  - **Make Solution Helper ON by default** ✅ 
  - **Rebrand as Guided/Advanced Mode toggle** ✅
    - "Guided Mode" = Solution Helper ON (auto-highlights matching cards)
    - "Advanced Mode" = Solution Helper OFF (manual tracking)
    - More intuitive than "Solution Helper"
  - **Update Settings UI** ✅
    - Toggle switch with clear labels
    - Dynamic description text based on toggle state
    - Default to Guided Mode for new players
  - **Note**: Card tapping still enabled in both modes (not restricted)

- [ ] **Add "Always show tutorials" setting toggle**
  - New option in Settings modal
  - When enabled: show tutorial every time level is reached
  - When disabled: use tracked "viewed" status (show once)
  - Useful for:
    - Reviewing mechanics
    - Demo purposes
    - Testing

- [ ] **Remove or hide Test Mode level selector**
  - Current "Jump to Level" feature in Settings
  - Options:
    1. Remove entirely for production
    2. Hide behind dev mode flag
    3. Keep but require password/code
  - Decision TBD

---

### Phase 4: Polish & Launch

- [ ] **Final UI/UX polish**
  - Animation timing tweaks
  - Sound effect balance
  - Visual feedback improvements
  - Mobile responsiveness final check
  - Accessibility review

- [ ] **Code cleanup**
  - Remove commented-out code
  - Remove console.log statements (or use debug flag)
  - Add JSDoc comments where missing
  - Review CLAUDE.md for accuracy

- [ ] **Testing**
  - Full playthrough (Level 1-10)
  - Test on multiple devices
  - Test all special cube combinations
  - Test edge cases (timer expiry, pass system, etc.)

- [ ] **Deployment**
  - Merge `feature/tutorial-scenarios` to `main`
  - Update version number
  - Deploy to GitHub Pages
  - Update README with new features
  - Announce launch! 🎉

---

### Phase 5: Redesign & Theming

- [ ] **Design system audit**
  - Review current color palette
  - Assess typography choices
  - Evaluate spacing/layout system
  - Identify inconsistencies

- [ ] **Theme architecture**
  - Create CSS variables for all colors
  - Organize theme tokens (primary, secondary, accent, etc.)
  - Build theme switching mechanism
  - Support light/dark mode

- [ ] **Theme options**
  - **Default theme** (current look)
  - **Dark mode** (high contrast, OLED-friendly)
  - **Light mode** (bright, clean)
  - **Colorblind accessible themes**
    - Deuteranopia (red-green)
    - Protanopia (red-green)
    - Tritanopia (blue-yellow)
  - **High contrast** (accessibility)
  - Custom theme builder? (future)

- [ ] **Component updates**
  - Refactor CSS to use theme variables
  - Update cards to respect theme
  - Update cubes/dice to respect theme
  - Update UI chrome (buttons, modals, etc.)
  - Ensure all states work (hover, active, disabled)

- [ ] **Settings integration**
  - Add "Theme" section to Settings
  - Visual theme picker (show previews)
  - Save theme preference to localStorage
  - Apply theme on load
  - Smooth transitions between themes

- [ ] **Accessibility testing**
  - Test with screen readers
  - Verify keyboard navigation
  - Check color contrast ratios (WCAG AA/AAA)
  - Test with colorblind simulators
  - Get feedback from accessibility community

- [ ] **Documentation**
  - Document theme system for future development
  - Create style guide
  - Document accessibility features

---

## 📝 Notes

### Tutorial System Implementation
- ✅ All 10 level tutorials created
- ✅ Interactive walkthrough system
- ✅ Strict validation (must use correct dice)
- ✅ Drag restrictions (only highlighted dice)
- ✅ Per-level tracking infrastructure
- ✅ Skip button hidden on final step
- ✅ Reset/Pass buttons blocked during tutorials
- ✅ No points awarded for tutorial rounds

### Known Issues
- Debug console.log statements present in wild cube code (pending cleanup)
- Desktop drag uses native browser cursor (intentional due to scaling complexity)

### Recently Fixed (Oct 2025)
- ✅ **Wild cube popover positioning** (v3.13.0): Fixed by moving popover outside #app to avoid scaling issues. Also fixed missing data-index attribute and improved response time.
- ✅ **Modal backdrop scaling** (v3.12.x): Moved all modals outside #app so backdrops span full viewport correctly.
- ✅ **Tutorial state persistence** (v3.12.x): Added cleanup system to restore game state when navigating away from tutorials.
- ✅ **Continue button logic** (v3.12.x): Fixed to show when any saved game data exists, not just level > 1.
- ✅ **Solution area cube dragging bug** (v3.2.0): Fixed ID-based tracking for dice in solution area, replacing index-based approach. Cubes now maintain consistent identity during drag/reorder/removal operations.

### Future Considerations
- Replay tutorial option from menu
- Tutorial hints if stuck for too long
- Skip individual steps (vs skip entire tutorial)
- Tutorial completion rewards/badges
- Multi-language support for tutorials
- **Smart grouping indicators**: Only show visual grouping boxes around cubes that form valid logical patterns (e.g., `Red ∪ Blue`), not just physical proximity. Need to consider UX during construction vs completed expressions.
- **Background solution checking**: Run solution finder in Web Worker after 10-15s of inactivity, cache result for instant Pass feedback. Would improve UX but requires careful performance tuning.

---

## 🎯 Immediate Tasks

### High Priority
- [ ] **Mobile device testing** - Test all recent changes (home screen, modals, wild cube, interstitials) on physical devices
- [ ] **Debug logging cleanup** - Remove console.log statements from wild cube code (optional, doesn't affect functionality)

### Medium Priority  
- [ ] **Restore original level score requirements** - Currently set to 50 for testing, should be 500-10000
- [ ] **Enable tutorial tracking** - Uncomment markTutorialAsViewed() calls so tutorials show only once
- [ ] **Level 10 testing** - Verify bonus cubes work correctly

### Low Priority
- [ ] **Remove/hide Test Mode level selector** - Decide whether to keep Jump to Level feature in production
- [ ] **Add "Always show tutorials" toggle** - For users who want to replay tutorials
