# Grouped Restriction Refactor Plan

## Current Problems

1. **Performance**: Multiple `detectGroups()` calls per evaluation (expensive)
2. **Recursion**: No depth limit - malformed input could cause infinite loops
3. **Duplication**: Left/right nested restriction detection logic is duplicated
4. **Untested**: Edge cases with Universe/Null in groups

## Proposed Solutions

### 1. Add Recursion Depth Limit

```javascript
export function evaluateRestriction(restriction, cards, depth = 0) {
    const MAX_DEPTH = 5; // Reasonable limit for nested restrictions
    
    if (depth > MAX_DEPTH) {
        console.warn('⚠️ Max recursion depth reached in evaluateRestriction');
        return [];
    }
    
    // ... rest of logic, passing depth + 1 to recursive calls
}
```

### 2. Extract Nested Restriction Helper

```javascript
/**
 * Check if a side has nested restriction groups and evaluate them
 * @returns {Object} { cards: Set, flips: Array }
 */
function evaluateSideWithNesting(sideDice, cards, depth) {
    const groups = detectGroups(sideDice);
    const validGroups = groups.filter(g => isValidGroup(g, sideDice));
    const hasRestrictionGroup = validGroups.some(group => 
        group.some(idx => sideDice[idx].value === '=' || sideDice[idx].value === '⊆')
    );
    
    if (hasRestrictionGroup) {
        const flips = evaluateRestriction(sideDice, cards, depth + 1);
        const flippedSet = new Set(flips);
        const passingCards = new Set();
        cards.forEach((card, index) => {
            if (!flippedSet.has(index)) {
                passingCards.add(index);
            }
        });
        return { cards: passingCards, flips };
    } else {
        return { cards: evaluateExpression(sideDice, cards), flips: [] };
    }
}
```

### 3. Cache Group Detection

Consider caching `detectGroups()` results at the top level to avoid redundant calls:

```javascript
// At top of evaluateRestriction
const allGroups = detectGroups(restriction);
const validGroups = allGroups.filter(g => isValidGroup(g, restriction));

// Pass this down or store in a parameter to avoid re-detecting
```

### 4. Comprehensive Test Cases

Create test scenarios for:

**Set Names:**
- `red ∪ blue` - Basic
- `(red ∪ blue) ∩ green` - Grouped on left
- `red ∪ (blue ∩ green)` - Grouped on right
- `U ∩ (red ∪ blue)` - Universe with group
- `(red ∪ U) ∩ blue` - Universe in group

**Restrictions:**
- `red = blue` - Basic
- `red ⊆ (blue = green)` - Grouped on right (FIXED)
- `(red ∪ blue) ⊆ green` - Set name group on left
- `U = (blue = green)` - Universe with restriction group
- `(red = blue) ⊆ (green = gold)` - Double nested (if even valid pattern)

**Edge Cases:**
- Single nested: `(blue = green)` alone
- Empty sides (malformed)
- Multiple groups in one side

## Testing Approach

1. **Unit Tests**: Test `evaluateSideWithNesting` helper independently
2. **Integration Tests**: Test full `evaluateRestriction` with all scenarios above
3. **Performance Test**: Time evaluation with 3-level nesting vs current
4. **Recursion Test**: Verify depth limit prevents infinite loops

## Priority

- **High**: Recursion depth limit (safety)
- **Medium**: Extract helper (maintainability)
- **Low**: Cache optimization (only if performance is actually slow)

## Recommendation

Before refactoring, let's:
1. Add recursion depth limit (5 minutes)
2. Create comprehensive test cases in console (10 minutes)
3. Run tests to verify no regressions
4. Then decide if helper extraction is worth it based on test results

