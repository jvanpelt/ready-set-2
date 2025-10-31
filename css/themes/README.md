# Ready, Set 2 - Theme System

This directory contains color scheme definitions for the game.

## Available Themes

### **default.css** (Original)
The original Ready, Set 2 color scheme with dark gray backgrounds, teal/cyan gradients, and vibrant card colors.

### **neon.css** (Tron / Electric)
Inspired by Tron's aesthetic with glowing cyan borders, electric blue highlights, and a dark space-like background.

### **parchment.css** (Vintage / Paper)
A warm, vintage look with beige paper tones, brown borders, and muted earth-tone accents.

### **flat.css** (Modern / Minimalist)
A darker, flatter design with reduced shadows and gradients for a modern, minimalist aesthetic.

## How to Use

In your HTML file (`index.html`), load the main `styles.css` first, then load **ONE** theme CSS file to override:

```html
<!-- Load main styles first -->
<link rel="stylesheet" href="css/styles.css">
<!-- Then load your chosen theme to override -->
<link rel="stylesheet" href="css/themes/default.css">
```

To switch themes, simply change which theme file you're loading:

```html
<!-- Use the Neon theme instead -->
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/themes/neon.css">
```

## Creating Custom Themes

All themes use the same CSS variable names. To create a new theme:

1. Copy one of the existing theme files as a starting point
2. Modify the color values to match your desired aesthetic
3. Save with a descriptive name (e.g., `css/themes/ocean.css`)
4. Load it in your HTML

Key variable categories:
- **Game Colors**: Card dot colors (red, blue, green, gold)
- **Backgrounds**: Body gradients, UI panel backgrounds
- **Cards & Dice**: Element colors and borders
- **Operators**: Color coding for different operator types
- **Special Effects**: Glows for required/bonus/wild cubes
- **UI Elements**: Buttons, modals, tutorials, status bars

## Notes

- All themes maintain the same game mechanics and functionality
- Only visual styling changes between themes
- Z-index layers and structural CSS remain in the main `styles.css`
- Each theme is self-contained and can be swapped instantly

