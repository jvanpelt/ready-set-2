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
 * Generate SVG for Equals (=) - Two horizontal blue lines
 */
export function getEqualsSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Top line -->
            <rect x="15" y="22" width="30" height="4" fill="currentColor" rx="1" />
            <!-- Bottom line -->
            <rect x="15" y="34" width="30" height="4" fill="currentColor" rx="1" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Subset (⊆) - Curved C shape with horizontal line
 */
export function getSubsetSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- C-shaped curve -->
            <path d="M 35 15 Q 20 15, 20 30 Q 20 45, 35 45" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" />
            <!-- Bottom horizontal line -->
            <line x1="20" y1="48" x2="35" y2="48" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Universe (U) - V pointing down with underline
 */
export function getUniverseSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- V shape pointing down -->
            <path d="M 18 18 L 30 35 L 42 18" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            <!-- Horizontal line below -->
            <line x1="18" y1="42" x2="42" y2="42" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Null (∅) - Caret pointing up with underline
 */
export function getNullSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Caret/chevron pointing up -->
            <path d="M 18 32 L 30 18 L 42 32" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            <!-- Horizontal line below -->
            <line x1="18" y1="42" x2="42" y2="42" 
                  stroke="currentColor" 
                  stroke-width="3.5" 
                  stroke-linecap="round" />
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
        case '=':
            return getEqualsSVG();
        case '⊆':
            return getSubsetSVG();
        case 'U':
            return getUniverseSVG();
        case '∅':
            return getNullSVG();
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
    // Set constants (Universe and Null) - predefined sets like colors
    if (value === 'U' || value === '∅') {
        return 'set-constant';
    }
    // Restrictions (Equals and Subset) - constraints/comparisons
    if (value === '=' || value === '⊆') {
        return 'operator-restriction';
    }
    // Regular operators (Union, Intersection, Difference, Complement)
    return 'operator-regular';
}
