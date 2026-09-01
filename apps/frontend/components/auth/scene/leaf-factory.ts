import * as THREE from 'three';

import { createLeafState, type LeafState } from './leaf-animation';

import { loadLeafTexture, type LeafTextureCache } from './leaf-texture';

import type { LeafViewportConfig } from './leaf-config';

/**
 * ============================================
 * TYPES
 * ============================================
 */

interface CreateLeafOptions {
  assets: string[];

  viewportConfig: LeafViewportConfig;

  textureLoader: THREE.TextureLoader;

  textureCache: LeafTextureCache;
}

/**
 * ============================================
 * HELPERS
 * ============================================
 */

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * ============================================
 * CREATE LEAF
 * ============================================
 */

export function createLeaf({
  assets,
  viewportConfig,
  textureLoader,
  textureCache,
}: CreateLeafOptions): LeafState {
  /**
   * Random asset.
   */

  const asset = randomItem(assets);

  /**
   * Texture.
   */

  const texture = loadLeafTexture(asset, textureLoader, textureCache);

  /**
   * Random size.
   */

  const size = randomRange(viewportConfig.minSize, viewportConfig.maxSize);

  /**
   * Geometry.
   */

  const geometry = new THREE.PlaneGeometry(size, size);

  /**
   * Material.
   */

  const material = new THREE.MeshBasicMaterial({
    map: texture,

    opacity: 0.95,

    transparent: true,

    depthWrite: false,

    depthTest: false,

    side: THREE.DoubleSide,
  });

  /**
   * Mesh.
   */

  const mesh = new THREE.Mesh(geometry, material);

  /**
   * ==========================================
   * INITIAL POSITION
   * ==========================================
   */

  const width = window.innerWidth;

  const height = window.innerHeight;

  mesh.position.set(
    randomRange(-width / 2, width / 2),

    randomRange(-height / 2, height / 2),

    0,
  );

  /**
   * Random rotation.
   */

  mesh.rotation.z = randomRange(0, Math.PI * 2);

  /**
   * Create animation state.
   */

  return createLeafState(mesh);
}
