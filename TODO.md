# Ready, Set 2 - TODO List

## 🔄 Current Status (Oct 21, 2025)
**Branch**: `main`  
**Version**: `3.19.0-fix-universe-single`
**Status**: Core game complete, testing and polish phase 🎉

---

## 🎯 Active Priorities

### High Priority
- [ ] **Full playthrough testing (Level 1-10)** - In progress
  - Verify all special cube mechanics work correctly
  - Test timer behavior (Level 7+)
  - Test required cubes (Level 8+)
  - Test wild cubes (Level 9+)
  - Test bonus cubes (Level 10)
  - Verify scoring calculations are accurate

### Medium Priority  
- [ ] **Create new Level 10 tutorial** 
  - Walk player through a complex solution
  - Demonstrate advanced techniques
  - Showcase bonus cube usage
  - Should feel like a finale/graduation moment

### Low Priority
- [ ] **Pre-launch: Disable unearned levels in Jump to Level**
  - Keep Jump to Level feature in Settings
  - Only show levels that have been unlocked through gameplay
  - Helps preserve progression for new players

---

## 📝 Known Issues

### Recently Fixed (Oct 21, 2025)
- ✅ **Universe/Null single cube validation** (v3.19.0): Single Universe or Null cubes are now accepted as valid set names, especially important after restrictions
- ✅ **UI polish** (v3.18.5): Button padding, status bar spacing, modal labels, level badge removal, consistent button sizing
- ✅ **Solution Helper validation** (v3.18.x): Robust syntax checking, handles wild cubes, postfix operators, two-row validation
- ✅ **Restriction row indicators** (v3.17.x): Blue border for restrictions, red border for invalid syntax
- ✅ **Wild cube double-click removal** (v3.16.x): Manual double-click detection working on desktop and mobile
- ✅ **Entrance/Exit animations** (v3.15.x): Cards dealing, dice rolling in/out with GSAP
- ✅ **Group indicator validation** (v3.15.x): Visual distinction for valid vs invalid groups

---

## 🚀 Post-Launch Ideas

### Future Features (Not Scheduled)
- **Tutorial replay from menu** - Allow players to review mechanics anytime
- **Tutorial completion badges** - Rewards for completing each tutorial
- **"Always show tutorials" toggle** - For users who want to see them every time
- **Multi-language support** - Internationalization for tutorials and UI
- **Theme system** - Dark mode, colorblind-friendly themes, accessibility options
- **Smart grouping indicators** - Only show visual grouping around valid logical patterns
- **Background solution checking** - Web Worker to check for solutions after inactivity

### Theming & Accessibility (Phase 5)
- **Design system audit** - Review colors, typography, spacing
- **Theme architecture** - CSS variables, theme switching
- **Theme options** - Dark mode, light mode, colorblind modes, high contrast
- **Accessibility testing** - Screen readers, keyboard navigation, WCAG compliance
- **Documentation** - Style guide, accessibility features documentation

---

## 📊 Recent Accomplishments

### October 2025 - Major Features Completed
- ✅ Home screen with Continue/New Game/How to Play
- ✅ Intro tutorial (Level 0) with animations and interactive steps
- ✅ Solution Helper rebranded as Guided/Advanced Mode
- ✅ Interstitial screen redesign with green translucent aesthetic
- ✅ Menu modal improvements (X button, backdrop click)
- ✅ Modal design refresh (translucent backgrounds)
- ✅ Wild cube popover fixes (positioning, auto-show, selection)
- ✅ Tutorial cleanup system (restores game state)
- ✅ Entrance/exit animations (cards dealing, dice rolling)
- ✅ Group indicator validation (solid vs dotted borders)
- ✅ Restriction row visual feedback (blue borders)
- ✅ Invalid syntax feedback (red borders)
- ✅ Two-row validation (can't have two set names)
- ✅ Comprehensive syntax validation (wild cubes, postfix operators)
- ✅ Independent restriction/set name evaluation
- ✅ UI polish (buttons, spacing, colors, labels)

### Settings & Features
- ✅ Solution Helper ON by default (Guided Mode)
- ✅ Test Mode available (low score requirements for testing)
- ✅ Jump to Level feature in Settings
- ✅ Tutorial tracking system (can skip, won't be forced to repeat)
- ✅ Level score requirements restored (500-10000)

---

## 🎮 Tutorial System

### Tutorials Complete
- ✅ Intro (Level 0): Universe, Goal, Cubes, Solution Area, OR vs AND
- ✅ Level 1: Union (OR)
- ✅ Level 2: Difference (MINUS)
- ✅ Level 3: Complement (PRIME/NOT)
- ✅ Level 4: Duplicate operators
- ✅ Level 5: Universe & Null
- ✅ Level 6: Restrictions (EQUALS, SUBSET)
- ✅ Level 7: Timer
- ✅ Level 8: Required cubes
- ✅ Level 9: Wild cubes
- ✅ Level 10: Bonus cubes (needs new tutorial)

### Tutorial Features
- ✅ Interactive walkthrough system
- ✅ Strict validation (must use correct dice)
- ✅ Drag restrictions (only highlighted dice)
- ✅ Per-level tracking
- ✅ Skip button (hidden on final step)
- ✅ Reset/Pass buttons blocked during tutorials
- ✅ No points awarded for tutorial rounds
- ✅ Cleanup system restores game state

---

## 🛠️ Technical Notes

### Code Architecture
- **Dual card encoding systems** preserved and documented
  - `levels.js`: Human-readable color arrays
  - `scenarioManager.js`: Bitwise integers for performance
- **GSAP animations** for entrance/exit effects
- **Solution Helper** with independent restriction/set name validation
- **Tutorial system** with interactive and animated steps
- **Responsive design** with `AppScaler` for mobile

### Debug & Testing
- Debug logging cleaned up (commented out noisy logs)
- Test Mode available for development (low score requirements)
- Cache busting with version numbers in script tags
- Safari Web Inspector for iOS debugging

---

## 📚 Documentation Files
- `WORKFLOW.md` - Git workflow and merge approval process
- `.cursorrules` - Cursor AI rules and preferences
- `CLAUDE.md` - Project context for AI assistants
- `TODO.md` - This file (task tracking)

---

_Last Updated: October 21, 2025_
