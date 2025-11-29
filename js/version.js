/**
 * VERSION.js - Single source of truth for app version
 * 
 * Update this file when making changes that need cache busting.
 * This version is used for:
 * - Console logging
 * - Cache busting (converting to timestamp)
 * - Build tracking
 */

export const VERSION = 'v4.28.8';

// Convert version to a cache-busting number
// Format: MAJOR.MINOR.PATCH -> numeric timestamp-like value
export function getVersionNumber() {
    const match = VERSION.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (match) {
        const [, major, minor, patch] = match;
        // Create a number like: 4240001 for v4.24.1
        return parseInt(major) * 1000000 + parseInt(minor) * 1000 + parseInt(patch);
    }
    return Date.now(); // Fallback to timestamp if version format is wrong
}

// Use timestamp for development (always fresh)
export const CACHE_BUST = Date.now();

