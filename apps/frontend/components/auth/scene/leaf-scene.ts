import * as THREE from 'three';

import {
  applyPointerForce,
  DEFAULT_LEAF_ANIMATION_CONFIG,
  updateLeaves,
  type LeafState,
} from './leaf-animation';

import { getLeafViewportConfig, type LeafViewportConfig } from './leaf-config';

import { createLeaf } from './leaf-factory';

import { type LeafTextureCache, disposeLeafTextures } from './leaf-texture';

/**
 * ============================================
 * LEAF ASSETS
 * ============================================
 */

const LEAF_ASSETS = [
  '/leaves/leaf-01.webp',
  '/leaves/leaf-02.webp',
  '/leaves/leaf-03.webp',
  '/leaves/leaf-04.webp',
  '/leaves/leaf-05.webp',
];

/**
 * ============================================
 * SCENE
 * ============================================
 */

export class LeafScene {
  private container: HTMLElement;

  private scene: THREE.Scene;

  private camera: THREE.OrthographicCamera;

  private renderer: THREE.WebGLRenderer;

  private textureLoader: THREE.TextureLoader;

  private textureCache: LeafTextureCache = new Map<string, THREE.Texture>();

  private leaves: LeafState[] = [];

  private mouse = new THREE.Vector2(Infinity, Infinity);

  private previousMouse = new THREE.Vector2(Infinity, Infinity);

  private mouseVelocity = new THREE.Vector2(0, 0);

  private animationFrameId: number | null = null;

  private isAnimating = false;

  private animationConfig = DEFAULT_LEAF_ANIMATION_CONFIG;

  /**
   * Config viewport.
   */

  private viewportConfig: LeafViewportConfig;

  /**
   * ============================================
   * CONSTRUCTOR
   * ============================================
   */

  constructor(container: HTMLElement) {
    this.container = container;

    /**
     * Initial responsive config.
     */

    this.viewportConfig = getLeafViewportConfig(window.innerWidth);

    /**
     * ==========================================
     * SCENE
     * ==========================================
     */

    this.scene = new THREE.Scene();

    /**
     * ==========================================
     * CAMERA
     * ==========================================
     */

    const width = window.innerWidth;

    const height = window.innerHeight;

    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      100,
    );

    this.camera.position.z = 10;

    /**
     * ==========================================
     * RENDERER
     * ==========================================
     */

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.renderer.setSize(width, height);

    this.renderer.setClearColor(0x000000, 0);

    this.renderer.domElement.className = 'absolute inset-0 h-full w-full';

    /**
     * ==========================================
     * TEXTURE LOADER
     * ==========================================
     */

    this.textureLoader = new THREE.TextureLoader();

    /**
     * ==========================================
     * CREATE INITIAL LEAVES
     * ==========================================
     */

    this.createLeaves(this.viewportConfig.count);

    /**
     * ==========================================
     * EVENTS
     * ==========================================
     */

    this.bindEvents();

    /**
     * ==========================================
     * INITIAL RENDER
     * ==========================================
     */

    this.render();
  }

  /**
   * ============================================
   * MOUNT
   * ============================================
   */

  public mount(): void {
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * ============================================
   * DISPOSE
   * ============================================
   */

  public dispose(): void {
    this.stopAnimation();

    this.unbindEvents();

    /**
     * Dispose seluruh leaf.
     */

    this.removeAllLeaves();

    /**
     * Dispose texture cache.
     */

    disposeLeafTextures(this.textureCache);

    /**
     * Dispose renderer.
     */

    this.renderer.dispose();

    /**
     * Remove canvas.
     */

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * ============================================
   * CREATE LEAVES
   * ============================================
   */

  private createLeaves(count: number): void {
    for (let index = 0; index < count; index++) {
      this.createSingleLeaf();
    }
  }

  /**
   * ============================================
   * CREATE SINGLE LEAF
   * ============================================
   */

  private createSingleLeaf(): void {
    const leaf = createLeaf({
      assets: LEAF_ASSETS,

      viewportConfig: this.viewportConfig,

      textureLoader: this.textureLoader,

      textureCache: this.textureCache,
    });

    /**
     * Simpan leaf.
     */

    this.leaves.push(leaf);

    /**
     * Masukkan ke scene.
     */

    this.scene.add(leaf.mesh);
  }

  /**
   * ============================================
   * REMOVE SINGLE LEAF
   * ============================================
   */

  private removeSingleLeaf(): void {
    const leaf = this.leaves.pop();

    if (!leaf) {
      return;
    }

    /**
     * Dispose geometry.
     */

    leaf.mesh.geometry.dispose();

    /**
     * Dispose material.
     */

    if (Array.isArray(leaf.mesh.material)) {
      for (const material of leaf.mesh.material) {
        material.dispose();
      }
    } else {
      leaf.mesh.material.dispose();
    }

    /**
     * Remove dari scene.
     */

    this.scene.remove(leaf.mesh);
  }

  /**
   * ============================================
   * REMOVE ALL LEAVES
   * ============================================
   */

  private removeAllLeaves(): void {
    while (this.leaves.length > 0) {
      this.removeSingleLeaf();
    }
  }

  /**
   * ============================================
   * UPDATE LEAF COUNT
   * ============================================
   */

  private updateLeafCount(): void {
    const targetCount = this.viewportConfig.count;

    const currentCount = this.leaves.length;

    if (currentCount === targetCount) {
      return;
    }

    /**
     * ADD
     */

    if (currentCount < targetCount) {
      const amountToAdd = targetCount - currentCount;

      for (let index = 0; index < amountToAdd; index++) {
        this.createSingleLeaf();
      }

      return;
    }

    /**
     * REMOVE
     */

    const amountToRemove = currentCount - targetCount;

    for (let index = 0; index < amountToRemove; index++) {
      this.removeSingleLeaf();
    }
  }

  /**
   * ============================================
   * RESIZE
   * ============================================
   */

  private handleResize = (): void => {
    const oldWidth = this.renderer.domElement.clientWidth || window.innerWidth;

    const oldHeight =
      this.renderer.domElement.clientHeight || window.innerHeight;

    const newWidth = window.innerWidth;

    const newHeight = window.innerHeight;

    /**
     * UPDATE CAMERA
     */

    this.camera.left = -newWidth / 2;

    this.camera.right = newWidth / 2;

    this.camera.top = newHeight / 2;

    this.camera.bottom = -newHeight / 2;

    this.camera.updateProjectionMatrix();

    /**
     * UPDATE RENDERER
     */

    this.renderer.setSize(newWidth, newHeight);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    /**
     * MOVE EXISTING LEAVES
     */

    if (oldWidth > 0 && oldHeight > 0) {
      const widthRatio = newWidth / oldWidth;

      const heightRatio = newHeight / oldHeight;

      for (const leaf of this.leaves) {
        leaf.mesh.position.x *= widthRatio;

        leaf.mesh.position.y *= heightRatio;

        leaf.initialPosition.x *= widthRatio;

        leaf.initialPosition.y *= heightRatio;
      }
    }

    /**
     * UPDATE RESPONSIVE CONFIG
     */

    this.viewportConfig = getLeafViewportConfig(newWidth);

    /**
     * UPDATE LEAF COUNT
     */

    this.updateLeafCount();

    /**
     * RENDER
     */

    this.render();
  };

  /**
   * ============================================
   * POINTER MOVE
   * ============================================
   */

  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();

    /**
     * Browser → Three.js.
     */

    const mouseX = event.clientX - rect.left - rect.width / 2;

    const mouseY = -(event.clientY - rect.top - rect.height / 2);

    /**
     * Velocity.
     */

    if (Number.isFinite(this.previousMouse.x)) {
      this.mouseVelocity.set(
        mouseX - this.previousMouse.x,

        mouseY - this.previousMouse.y,
      );
    }

    /**
     * Update mouse.
     */

    this.mouse.set(mouseX, mouseY);

    /**
     * Previous mouse.
     */

    this.previousMouse.copy(this.mouse);

    /**
     * Pointer force.
     *
     * TIDAK DIUBAH.
     */

    for (const leaf of this.leaves) {
      applyPointerForce(
        leaf,
        this.mouse,
        this.mouseVelocity,
        this.animationConfig,
      );
    }

    /**
     * Start animation.
     */

    this.startAnimation();

    /**
     * Render.
     */

    this.render();
  };

  /**
   * ============================================
   * START ANIMATION
   * ============================================
   */

  private startAnimation(): void {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  /**
   * ============================================
   * STOP ANIMATION
   * ============================================
   */

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);

      this.animationFrameId = null;
    }

    this.isAnimating = false;
  }

  /**
   * ============================================
   * ANIMATION LOOP
   * ============================================
   */

  private animate = (): void => {
    /**
     * Logic animasi tetap menggunakan
     * updateLeaves() milikmu.
     */

    const hasMovement = updateLeaves(
      this.leaves,

      this.mouse,

      this.animationConfig.friction,

      this.animationConfig,
    );

    /**
     * Render.
     */

    this.render();

    /**
     * Continue animation.
     */

    if (hasMovement) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.stopAnimation();
    }
  };

  /**
   * ============================================
   * RENDER
   * ============================================
   */

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * ============================================
   * EVENTS
   * ============================================
   */

  private bindEvents(): void {
    window.addEventListener('pointermove', this.handlePointerMove, {
      passive: true,
    });

    window.addEventListener('resize', this.handleResize);
  }

  /**
   * ============================================
   * UNBIND EVENTS
   * ============================================
   */

  private unbindEvents(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);

    window.removeEventListener('resize', this.handleResize);
  }
}
