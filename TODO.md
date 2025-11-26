# Ready, Set 2 - TODO List

## 🔄 Current Status (Nov 26, 2025)
**Branch**: `main`  
**Version**: `4.28.4` (Level 10 tutorial complete)
**Status**: All tutorials complete! Ready for production features 🎉

---

## 🎯 Active Priorities

### High Priority
- [ ] **Fix daily puzzle scoring** - Reported issue with scoring calculation
- [ ] **Full playthrough testing (Level 1-10)**
  - Verify all special cube mechanics work correctly
  - Test timer behavior (Level 7+)
  - Test required cubes (Level 8+)
  - Test wild cubes (Level 9+)
  - Test bonus cubes (Level 10)
  - Verify scoring calculations are accurate

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

## 🚀 Major Initiatives

### iOS App Development (Est: 1-2 weeks)
- [ ] Research and choose wrapper approach (Capacitor vs WKWebView)
- [ ] Set up development environment (Xcode, CocoaPods if needed)
- [ ] Install and configure Capacitor (if chosen)
- [ ] Create iOS project and configure bundle ID, app name, icons
- [ ] Test game in iOS simulator - verify all features work
- [ ] Configure viewport, status bar, safe areas for iOS
- [ ] Implement offline asset bundling (all files local)
- [ ] Test touch interactions, gestures, drag-and-drop on device
- [ ] Configure localStorage persistence for game saves
- [ ] Create app icons (all required sizes for iOS)
- [ ] Create launch screen/splash screen
- [ ] Test on multiple iOS devices (iPhone, iPad, different sizes)
- [ ] Optimize performance (check frame rates, animation smoothness)
- [ ] Set up TestFlight for beta testing
- [ ] Prepare App Store listing (description, screenshots, keywords)
- [ ] Submit to App Store for review

### Daily Puzzle Mode (Est: 2-3 weeks) - IN PROGRESS 🚧
**Branch**: `feature/daily-puzzle`  
**Progress**: Core generation & testing complete, now implementing production features

#### ✅ Completed (Phase 1: Generation & Testing)
- ✅ Design puzzle data structure (cards, solution, difficulty rating, date)
- ✅ Create puzzle difficulty rating system (beginner/intermediate/advanced based on shortest solution)
- ✅ Create solution template library (274 templates covering 3-8 cube patterns)
- ✅ Build automated puzzle generator with template instantiation
- ✅ Create validation suite (verify solvability, score range, no duplicates)
- ✅ Generate test puzzle collection (454 validated test puzzles)
- ✅ Create DailyPuzzleManager class to handle puzzle loading and state
- ✅ Design Daily Puzzle UI (home screen button, special mode indicator)
- ✅ Implement daily puzzle game mode (no level progression, single puzzle)
- ✅ Test mode with random puzzle loading for validation
- ✅ Fix all missing restriction/set name patterns (comprehensive pattern coverage)
- ✅ Systematic pattern validation (all 13 restriction + 9 set name patterns covered)

#### 🔄 In Progress (Phase 2: Production Features)
- [ ] **Show score in modal/interstitial after submission** (HIGH PRIORITY)
  - Design results screen UI
  - Show player's score, cube count, solution complexity
  - Option to share or continue
- [ ] **Implement sharing system** (HIGH PRIORITY)
  - Text-friendly format (SMS/iMessage compatible)
  - Share score WITHOUT spoiling solution
  - Include puzzle number, score, and emoji grid?
  - Consider: "Ready, Set 2 🎲 Puzzle #94 | Score: 180 | 🟦🟦🟩🟨"

#### 📋 Next Up (Phase 3: Production Data)
- [ ] Generate production daily puzzle collection (target: 365-1000 puzzles)
  - Remove test data/metadata
  - Ensure no duplicates across full set
  - Balance difficulty distribution
- [ ] Export puzzles to compressed/obfuscated format
  - Minify JSON
  - Obfuscate solution data (so players can't peek)
  - Consider compression/encoding
- [ ] Implement date-based puzzle indexing (deterministic daily selection)
  - Associate each puzzle with date/timestamp
  - Handle timezone consistency (all users see same puzzle globally)
  - Day-of-year indexing with leap year handling
- [ ] Track daily puzzle completion status in localStorage
  - Mark puzzles as completed
  - Store scores and solve times
- [ ] Implement streak tracking (days played consecutively)
- [ ] Add countdown timer to next puzzle (midnight reset)
- [ ] Test date boundary transitions (midnight rollover, timezone handling)

#### 🔮 Future Enhancements
- [ ] Manually playtest 50-100 production puzzles for quality assurance
- [ ] Design system for puzzle content updates (monthly batch updates?)
- [ ] Leaderboard/global statistics (optional, requires backend)

### Free Play Mode (Est: 1 week) - Details TBD
- [ ] Define free play mode requirements and constraints (unlimited puzzles? time limits? scoring?)
- [ ] Decide if free play uses existing random generation or curated puzzles
- [ ] Design free play UI (home screen entry point, mode selection)
- [ ] Determine difficulty selection system (player chooses beginner/intermediate/advanced?)
- [ ] Implement game mode logic (endless rounds? practice mode? no progression?)
- [ ] Create FreePlayManager class to handle state and puzzle generation
- [ ] Design scoring system (cumulative? per-puzzle? high score tracking?)
- [ ] Implement statistics tracking (puzzles played, average score, etc.)
- [ ] Test and balance difficulty progression if applicable

### Post-Level 10 Content (Est: 3-5 days) - Details TBD
- [ ] Define what happens after completing level 10 (endless mode? prestige? new content?)
- [ ] Design completion/victory screen UI
- [ ] Determine if levels should be replayable or locked after completion
- [ ] Implement level selection screen (if levels are replayable)
- [ ] Design progression/achievement system (stars? badges? statistics?)
- [ ] Determine unlock criteria for free play/daily puzzle (finish level 10? earlier?)
- [ ] Create congratulations/end game content and messaging
- [ ] Implement way to replay tutorials/training

---

## 🚀 Future Features (Not Scheduled)

### Additional Ideas
- **Tutorial replay from menu** - Allow players to review mechanics anytime
- **Tutorial completion badges** - Rewards for completing each tutorial
- **"Always show tutorials" toggle** - For users who want to see them every time
- **Multi-language support** - Internationalization for tutorials and UI
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

### November 2025 - Tutorial System Complete 🎓
- ✅ Level 10 tutorial with animated cube placement
- ✅ Manual card verification teaching (flip & dim)
- ✅ Solution area dragging disabled during tutorials
- ✅ Smooth fade transitions for tutorial-disabled dice
- ✅ Cumulative validation for multi-step card manipulation
- ✅ 8-cube solution demonstration with staggered animation
- ✅ All 10 levels now have polished, interactive tutorials

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

### Tutorials Complete ✅
- ✅ Intro (Level 0): Universe, Goal, Cubes, Solution Area, OR vs AND
- ✅ Level 1: Union (OR)
- ✅ Level 2: Difference (MINUS)
- ✅ Level 3: Complement (PRIME/NOT)
- ✅ Level 4: Duplicate operators
- ✅ Level 5: Universe & Null
- ✅ Level 6: Restrictions (EQUALS, SUBSET)
- ✅ Level 7: Timer
- ✅ Level 8: Required cubes (Prime cube)
- ✅ Level 9: Wild cubes & Subset restriction
- ✅ Level 10: Bonus cubes & Manual card verification
  - Animated 8-cube solution demonstration
  - Teaches manual card flipping/dimming
  - Solution Helper disabled for hands-on learning
  - All dragging disabled (focus on card interaction)

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

_Last Updated: November 26, 2025_
