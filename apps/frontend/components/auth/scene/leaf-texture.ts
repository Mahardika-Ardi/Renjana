import * as THREE from 'three';

export type LeafTextureCache = Map<string, THREE.Texture>;

/**
 * ============================================
 * LOAD TEXTURE
 * ============================================
 */

export function loadLeafTexture(
  path: string,
  textureLoader: THREE.TextureLoader,
  textureCache: LeafTextureCache,
): THREE.Texture {
  /**
   * Cek cache.
   */

  const cached = textureCache.get(path);

  if (cached) {
    return cached;
  }

  /**
   * Load texture.
   */

  const texture = textureLoader.load(path);

  /**
   * Warna texture.
   */

  texture.colorSpace = THREE.SRGBColorSpace;

  /**
   * Simpan ke cache.
   */

  textureCache.set(path, texture);

  return texture;
}

/**
 * ============================================
 * DISPOSE TEXTURE CACHE
 * ============================================
 */

export function disposeLeafTextures(textureCache: LeafTextureCache): void {
  for (const texture of textureCache.values()) {
    texture.dispose();
  }

  textureCache.clear();
}
