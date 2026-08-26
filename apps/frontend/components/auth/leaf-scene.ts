import * as THREE from 'three';

import {
  applyPointerForce,
  createLeafState,
  DEFAULT_LEAF_ANIMATION_CONFIG,
  updateLeaves,
  type LeafState,
} from './leaf-animation';

const LEAF_ASSETS = [
  '/leaves/leaf-01.svg',
  '/leaves/leaf-02.svg',
  '/leaves/leaf-03.svg',
  '/leaves/leaf-04.svg',
  '/leaves/leaf-05.svg',
];

const LEAF_COUNT = 85;

const MIN_LEAF_SIZE = 45;

const MAX_LEAF_SIZE = 100;

const LEAF_OPACITY = 0.95;

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class LeafScene {
  private container: HTMLElement;

  private scene: THREE.Scene;

  private camera: THREE.OrthographicCamera;

  private renderer: THREE.WebGLRenderer;

  private textureLoader: THREE.TextureLoader;

  private textureCache = new Map<string, THREE.Texture>();

  private leaves: LeafState[] = [];

  private mouse = new THREE.Vector2(Infinity, Infinity);

  private previousMouse = new THREE.Vector2(Infinity, Infinity);

  private mouseVelocity = new THREE.Vector2(0, 0);

  private animationFrameId: number | null = null;

  private isAnimating = false;

  private animationConfig = DEFAULT_LEAF_ANIMATION_CONFIG;

  constructor(container: HTMLElement) {
    this.container = container;

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

    this.camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
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
      antialias: true,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.renderer.setSize(window.innerWidth, window.innerHeight);

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
     * CREATE LEAVES
     * ==========================================
     */

    this.createLeaves();

    /**
     * ==========================================
     * EVENTS
     * ==========================================
     */

    this.bindEvents();

    /**
     * Initial render.
     */
    this.render();
  }

  /**
   * Mount renderer ke container.
   */
  public mount(): void {
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Cleanup seluruh Three.js scene.
   */
  public dispose(): void {
    this.stopAnimation();

    this.unbindEvents();

    /**
     * Dispose geometry dan material.
     */
    for (const leaf of this.leaves) {
      leaf.mesh.geometry.dispose();

      if (Array.isArray(leaf.mesh.material)) {
        for (const material of leaf.mesh.material) {
          material.dispose();
        }
      } else {
        leaf.mesh.material.dispose();
      }

      this.scene.remove(leaf.mesh);
    }

    this.leaves = [];

    /**
     * Dispose texture cache.
     */
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }

    this.textureCache.clear();

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
   * Load texture dengan cache.
   */
  private loadTexture(path: string): THREE.Texture {
    const cached = this.textureCache.get(path);

    if (cached) {
      return cached;
    }

    const texture = this.textureLoader.load(path);

    texture.colorSpace = THREE.SRGBColorSpace;

    this.textureCache.set(path, texture);

    return texture;
  }

  /**
   * Membuat seluruh daun.
   */
  private createLeaves(): void {
    for (let index = 0; index < LEAF_COUNT; index++) {
      /**
       * Pilih asset random.
       */
      const asset = randomItem(LEAF_ASSETS);

      /**
       * Texture di-cache.
       */
      const texture = this.loadTexture(asset);

      /**
       * Random size.
       */
      const size = randomRange(MIN_LEAF_SIZE, MAX_LEAF_SIZE);

      /**
       * Geometry.
       */
      const geometry = new THREE.PlaneGeometry(size, size);

      /**
       * Material.
       */
      const material = new THREE.MeshBasicMaterial({
        map: texture,

        opacity: LEAF_OPACITY,

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
       * ========================================
       * INITIAL POSITION
       * ========================================
       *
       * Posisi ini akan disimpan oleh
       * createLeafState().
       */

      mesh.position.set(
        randomRange(-window.innerWidth / 2, window.innerWidth / 2),
        randomRange(-window.innerHeight / 2, window.innerHeight / 2),
        0,
      );

      /**
       * Random rotation awal.
       */
      mesh.rotation.z = randomRange(0, Math.PI * 2);

      /**
       * Buat state.
       *
       * Di dalamnya posisi awal
       * langsung disimpan.
       */
      const leaf = createLeafState(mesh);

      this.leaves.push(leaf);

      this.scene.add(mesh);
    }
  }

  /**
   * Mouse movement.
   */
  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();

    /**
     * Browser coordinate →
     * Three.js coordinate.
     */

    const mouseX = event.clientX - rect.left - rect.width / 2;

    const mouseY = -(event.clientY - rect.top - rect.height / 2);

    /**
     * Hitung cursor velocity.
     */
    if (Number.isFinite(this.previousMouse.x)) {
      this.mouseVelocity.set(
        mouseX - this.previousMouse.x,

        mouseY - this.previousMouse.y,
      );
    }

    /**
     * Update posisi cursor.
     */
    this.mouse.set(mouseX, mouseY);

    /**
     * Simpan posisi cursor sebelumnya.
     */
    this.previousMouse.copy(this.mouse);

    /**
     * ========================================
     * POINTER FORCE
     * ========================================
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
     * Mulai animation loop.
     */
    this.startAnimation();

    /**
     * Render langsung.
     */
    this.render();
  };

  /**
   * Resize browser.
   */
  private handleResize = (): void => {
    const width = window.innerWidth;

    const height = window.innerHeight;

    /**
     * Update camera.
     */
    this.camera.left = -width / 2;

    this.camera.right = width / 2;

    this.camera.top = height / 2;

    this.camera.bottom = -height / 2;

    this.camera.updateProjectionMatrix();

    /**
     * Update renderer.
     */
    this.renderer.setSize(width, height);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.render();
  };

  /**
   * Mulai animation loop.
   */
  private startAnimation(): void {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  /**
   * Stop animation loop.
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);

      this.animationFrameId = null;
    }

    this.isAnimating = false;
  }

  /**
   * Animation loop.
   */
  private animate = (): void => {
    /**
     * Update seluruh daun.
     *
     * Tidak ada boundary.
     *
     * Daun boleh keluar viewport.
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
     * Kalau masih ada daun bergerak,
     * lanjutkan frame.
     */
    if (hasMovement) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      /**
       * Semua daun sudah berhenti.
       */
      this.stopAnimation();
    }
  };

  /**
   * Render Three.js.
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Bind event.
   */
  private bindEvents(): void {
    window.addEventListener('pointermove', this.handlePointerMove, {
      passive: true,
    });

    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Unbind event.
   */
  private unbindEvents(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);

    window.removeEventListener('resize', this.handleResize);
  }
}
