# Ready, Set 2 - TODO List

## 🔄 Current Status (Oct 8, 2025)
**Branch**: `feature/tutorial-below-status`  
**Task**: Redesigning tutorial instruction layout for mobile

**What we're doing**:
- Moving tutorial instruction below status bar (same vertical position)
- During tutorials: hide status bar, show tutorial instruction in its place
- Goal: Fit tutorials on smallest screens (375×667px) without scrolling
- No vertical layout scaling needed - simple swap/replace approach

**Latest commit**: `0b9508a` - Tutorial instruction moved, styled as green semi-transparent box

**Next steps**:
1. Test on localhost (port 8000 running)
2. Refine tutorial instruction styling/layout
3. Test at 375×667px to ensure GO button stays visible
4. Merge to main once layout feels right

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

- [ ] **Create placeholder start screen**
  - Design home/landing page UI
  - Add buttons:
    - New Game
    - Continue Game
    - Tutorial (Level 0)
    - Settings
  - Logo and branding
  - Smooth transitions to game

- [ ] **Implement Level Zero (onboarding tutorial)**
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

- [ ] **Solution Helper overhaul (rebrand as Easy/Hard mode)**
  - **Make Solution Helper ON by default** (currently OFF)
  - **Disable card tapping when Solution Helper is active**
    - Cards become read-only in Easy Mode
    - User cannot manually dim/flip cards
    - Make this very clear in UI
  - **Rebrand as Easy/Hard Mode toggle**
    - "Easy Mode" = Solution Helper ON (auto-preview)
    - "Hard Mode" = Solution Helper OFF (manual tracking)
    - More intuitive than "Solution Helper"
  - **Update Settings UI**
    - Toggle switch with clear labels
    - Description text explaining difference
    - Default to Easy Mode for new players

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
- None at this time! 🎉

### Recently Fixed
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

## 🎯 Current Sprint: Tutorial Testing (v3.1.x)
**Goal**: Polish and verify all 10 tutorial scenarios work correctly.

**Branch**: `feature/tutorial-scenarios`

**Testing workflow**:
1. Menu → Settings → Test Mode → Jump to Level [X]
2. Interstitial shows immediately
3. Choose "Show Me How"
4. Complete tutorial walkthrough
5. Verify card setup, dice, goal, instructions are correct
6. Move to next level and repeat

**When complete**: Merge to main and begin Phase 1 (Code Cleanup)
