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
            <circle cx="20" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="3" />
            <!-- Outline for right circle -->
            <circle cx="40" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="3" />
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
            <circle cx="20" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="3" />
            <!-- Right circle outline -->
            <circle cx="40" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="3" />
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
            <rect x="10" y="22" width="40" height="6" fill="currentColor" rx="1" />
            <!-- Bottom line -->
            <rect x="10" y="34" width="40" height="6" fill="currentColor" rx="1" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Subset (⊆) - Curved C shape with horizontal line
 */
export function getSubsetSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Wrap in group to position together -->
            <g transform="translate(5, 8)">
                <!-- C-shaped curve -->
                <path d="M47.4801,6.5788h-27.2407c-9.1486,0-13.377,2.9421-13.377,7.3808,0,4.7609,4.2284,7.5956,13.377,7.5956h27.2407v6.5797h-26.6861C6.3773,28.1349,0,22.411,0,13.7474,0,5.4018,6.0309,0,20.7253,0h26.7548v6.5788Z"
                      fill="currentColor"
                      stroke-linecap="round" />
                <!-- Bottom horizontal line -->
                <rect y="34" width="48" height="6" fill="currentColor" />
            </g>
        </svg>
    `.trim();
}

/**
 * Generate SVG for Minus (−) - Single horizontal red bar
 */
export function getMinusSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Horizontal bar -->
            <rect x="10" y="27" width="40" height="6" fill="currentColor" rx="1" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Complement/Prime (′) - Apostrophe-style mark
 */
export function getComplementSVG() {
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Short apostrophe mark in upper area -->
            <line x1="35" y1="15" x2="28" y2="28" 
                  stroke="currentColor" 
                  stroke-width="6" 
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
            <path d="M 10 10 L 30 35 L 50 10" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="6" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            <!-- Horizontal line below -->
            <line x1="10" y1="48" x2="50" y2="48" 
                  stroke="currentColor" 
                  stroke-width="6" 
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
            <path d="M 10 32 L 30 10 L 50 32" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="6" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            <!-- Horizontal line below -->
            <line x1="10" y1="48" x2="50" y2="48" 
                  stroke="currentColor" 
                  stroke-width="6" 
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
        case '−':
            return getMinusSVG();
        case '′':
            return getComplementSVG();
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
