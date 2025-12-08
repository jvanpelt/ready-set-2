// SVG symbols for operators (Venn diagrams)

/**
 * Generate SVG for Union (∪) - Two overlapping circles, both filled
 */
export function getUnionSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getIntersectionSVG(width = 60, height = 60) {
    const uniqueId = `intersection-clip-${Math.random().toString(36).substr(2, 9)}`;
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getEqualsSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getSubsetSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getMinusSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Horizontal bar -->
            <rect x="10" y="27" width="40" height="6" fill="currentColor" rx="1" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Complement/Prime (′) - Apostrophe-style mark
 */
export function getComplementSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getUniverseSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
export function getNullSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
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
 * Generate SVG for Wild cube (?) - Elegant serif-style question mark
 */
export function getWildSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M31.6,40.7h-4v-1.9c0-1.9.2-3.6.7-5,.5-1.4,1.1-2.7,1.8-3.9.7-1.2,1.4-2.4,2.2-3.6.7-1.2,1.3-2.7,1.8-4.3.5-1.6.7-3.6.7-5.9s-.6-5-1.9-6.3c-1.2-1.3-2.8-1.9-4.8-1.9s-3.1.4-3.9,1.1c-.9.7-1.3,1.6-1.3,2.8s.1,1.4.4,1.9c.2.4.5.9.8,1.4.3.5.4,1.2.4,2.1,0,1.4-.4,2.4-1.2,3-.8.6-1.8.9-2.9.9s-2.5-.5-3.5-1.5c-.9-1-1.4-2.5-1.4-4.4s.6-3.9,1.8-5.5c1.2-1.6,2.9-2.8,5-3.6,2.1-.9,4.6-1.3,7.3-1.3s4.8.4,7.1,1.1c2.2.7,4,1.9,5.4,3.6,1.4,1.6,2.1,3.8,2.1,6.5s-.4,4.4-1.3,6.2c-.8,1.8-1.9,3.4-3.2,4.9-1.3,1.5-2.5,2.9-3.8,4.2-1.3,1.3-2.3,2.6-3.2,4-.9,1.3-1.3,2.8-1.3,4.5v1.2ZM29.7,55.1c-1.7,0-3.1-.4-3.9-1.3-.9-.8-1.3-2-1.3-3.6s.4-2.8,1.3-3.8c.9-1,2.2-1.5,3.9-1.5s3,.5,3.9,1.5c.9,1,1.3,2.2,1.3,3.8,0,1.6-.5,2.8-1.3,3.6-.8.8-2.1,1.2-3.9,1.2Z"/>
        </svg>
    `.trim();
}

/**
 * Generate SVG for Bonus cube (★) - Filled star
 */
export function getBonusSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- 5-pointed star -->
            <polygon points="30,8 35,22 50,22 38,32 43,47 30,38 17,47 22,32 10,22 25,22" 
                     fill="currentColor" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Required cube indicator - Checkmark/target
 */
export function getRequiredSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Target/bullseye -->
            <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="4" />
            <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" stroke-width="3" />
            <circle cx="30" cy="30" r="4" fill="currentColor" />
        </svg>
    `.trim();
}

/**
 * Generate SVG for Timer (⏱️) - Clock face
 */
export function getTimerSVG(width = 60, height = 60) {
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <!-- Clock face -->
            <circle cx="30" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="4" />
            <!-- Clock hands -->
            <line x1="30" y1="32" x2="30" y2="18" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
            <line x1="30" y1="32" x2="40" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
            <!-- Top button -->
            <rect x="27" y="8" width="6" height="5" rx="1" fill="currentColor" />
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
