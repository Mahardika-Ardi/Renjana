/**
 *
 * ### RESPONSIVE LEAF CONFIG
 */

export interface LeafViewportConfig {
  count: number;
  minSize: number;
  maxSize: number;
}

/**
 * HP
 */
const MOBILE_LEAF_CONFIG: LeafViewportConfig = {
  count: 70,
  minSize: 50,
  maxSize: 80,
};

/**
 * TABLET
 */
const TABLET_LEAF_CONFIG: LeafViewportConfig = {
  count: 100,
  minSize: 50,
  maxSize: 90,
};

/**
 * DESKTOP
 */
const DESKTOP_LEAF_CONFIG: LeafViewportConfig = {
  count: 180,
  minSize: 50,
  maxSize: 100,
};

/**
 *
 * ### GET VIEWPORT CONFIG
 *
 * < 640     → mobile
 * < 1024    → tablet
 * >= 1024   → desktop
 */

export function getLeafViewportConfig(width: number): LeafViewportConfig {
  if (width < 640) {
    return MOBILE_LEAF_CONFIG;
  }

  if (width < 1024) {
    return TABLET_LEAF_CONFIG;
  }

  return DESKTOP_LEAF_CONFIG;
}
