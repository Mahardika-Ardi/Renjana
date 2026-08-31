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
  count: 50,
  minSize: 30,
  maxSize: 50,
};

/**
 * TABLET
 */
const TABLET_LEAF_CONFIG: LeafViewportConfig = {
  count: 60,
  minSize: 35,
  maxSize: 45,
};

/**
 * DESKTOP
 */
const DESKTOP_LEAF_CONFIG: LeafViewportConfig = {
  count: 90,
  minSize: 50,
  maxSize: 110,
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
