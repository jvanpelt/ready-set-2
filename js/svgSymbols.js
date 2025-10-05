// SVG symbols for operators (Venn diagrams)

/**
 * Generate SVG for Union (∪) - Two overlapping circles, both filled
 */
export function getUnionSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Left circle -->
            <circle cx="20" cy="30" r="18" fill="currentColor" opacity="0.7" />
            <!-- Right circle -->
            <circle cx="40" cy="30" r="18" fill="currentColor" opacity="0.7" />
            <!-- Outline for left circle -->
            <circle cx="20" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2" />
            <!-- Outline for right circle -->
            <circle cx="40" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Intersection (∩) - Two overlapping circles, only overlap filled
 */
export function getIntersectionSVG() {
    const uniqueId = `intersection-clip-${Math.random().toString(36).substr(2, 9)}`;
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Define a clip path for the intersection -->
                <clipPath id="${uniqueId}">
                    <circle cx="20" cy="30" r="18" />
                </clipPath>
            </defs>
            <!-- Left circle outline -->
            <circle cx="20" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2" />
            <!-- Right circle outline -->
            <circle cx="40" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2" />
            <!-- Filled intersection (right circle clipped by left) -->
            <circle cx="40" cy="30" r="18" fill="currentColor" opacity="0.7" clip-path="url(#${uniqueId})" />
        </svg>
    `.trim();
}

/**
 * Determine if a die should use an SVG symbol
 * @param {string} value - The die value (symbol)
 * @returns {string|null} - SVG HTML or null if should use text
 */
export function getSVGForOperator(value) {
    switch (value) {
        case '∪':
            return getUnionSVG();
        case '∩':
            return getIntersectionSVG();
        default:
            return null; // Use text for other operators
    }
}

/**
 * Get the CSS class for an operator die based on its type
 * @param {string} value - The die value (symbol)
 * @returns {string} - CSS class name
 */
export function getOperatorClass(value) {
    // Set names (Universe and Null)
    if (value === 'U' || value === '∅') {
        return 'operator-setname';
    }
    // Restrictions (Equals and Subset)
    if (value === '=' || value === '⊆') {
        return 'operator-restriction';
    }
    // Regular operators (Union, Intersection, Difference, Complement)
    return 'operator-regular';
}
