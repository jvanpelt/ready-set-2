# Ready, Set 2 - Set Theory Puzzle Game

A modern, vanilla JavaScript implementation of a set theory puzzle game inspired by the Academic Games On-Sets competition.

## About

This game teaches set theory concepts through interactive puzzles. Players use colored dice representing sets and operation dice to create expressions that match a specific number of cards on the game board.

## Game Mechanics

### Cards
- Each card displays 1-4 colored circles (red, blue, green, gold)
- Cards have either white or gray backgrounds (for visual variety)
- Players can tap cards to mark them:
  - First tap: Dims the card (note-taking)
  - Second tap: Excludes from universe (turns blue)
  - Third tap: Resets to normal

### Dice
- **Color Dice**: Represent sets of all cards containing that color
- **Operator Dice**: Set theory operations that combine or modify sets

### Operators by Level

**Level 1:**
- ∪ (Union): All cards with either color
- ∩ (Intersection): All cards with both colors

**Level 2:**
- − (Difference): Cards with first color but not second

**Level 3:**
- ′ (Complement): All cards NOT in the set

### Gameplay

1. Drag dice to the solution area to build a set theory expression
2. Create an expression that matches exactly 3 cards (default goal)
3. Click **GO!** to submit your solution
4. Earn points based on the complexity of your solution
5. Reach the goal score to advance to the next level

### Scoring

Points are awarded based on:
- Each die has a point value (operators typically worth more)
- Total points = sum of die values × number of dice used
- More complex solutions = higher scores!

### Controls

- **GO!**: Submit your solution
- **Reset**: Clear the solution area
- **Pass**: Generate a new puzzle (if stuck)
- **Menu**: Access game options

## Technical Details

Built with modern vanilla JavaScript (ES6+), featuring:
- **ES6 Modules**: Clean, modular code organization
- **CSS Grid & Flexbox**: Responsive layout
- **Native Drag & Drop API**: Intuitive dice manipulation
- **Web Audio API**: Sound effects
- **CSS Animations**: Smooth, performant transitions
- **LocalStorage Persistence**: Your progress is automatically saved
- **No external dependencies**: Pure web standards

### Game Persistence

The game automatically saves your progress to localStorage, including:
- Current level and score
- Active puzzle (cards, dice, solutions)
- Card states (dimmed/excluded)
- Highest level achieved

Simply close your browser and come back anytime - your game will be exactly where you left it!

## File Structure

```
/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── main.js             # Entry point
│   ├── game.js             # Game state management
│   ├── ui.js               # UI rendering & interactions
│   ├── setTheory.js        # Set theory evaluation engine
│   ├── levels.js           # Level configuration & generation
│   └── storage.js          # LocalStorage persistence
└── README.md               # This file
```

## How to Run

Simply open `index.html` in a modern web browser. No build process or server required!

## Browser Support

Requires a modern browser with support for:
- ES6 Modules
- CSS Grid & Flexbox
- Drag and Drop API
- Web Audio API (optional, for sounds)

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

Potential features for future versions:
- More operators (subset, equality, symmetric difference)
- Multiple solution rows
- Difficulty settings
- Achievements and statistics
- Local storage for progress
- Hints system
- Custom puzzle creator

## Credits

Inspired by the Academic Games On-Sets competition, which teaches set theory concepts through competitive gameplay.

Built with ❤️ using vanilla JavaScript and modern web standards.

