'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LEAF_ASSETS = [
  '/leaves/leaf-01.svg',
  '/leaves/leaf-02.svg',
  '/leaves/leaf-03.svg',
  '/leaves/leaf-04.svg',
  '/leaves/leaf-05.svg',
];

const LEAF_COUNT = 75;

const MIN_LEAF_SIZE = 45;
const MAX_LEAF_SIZE = 100;

const LEAF_OPACITY = 0.95;

/**
 * Jarak maksimum cursor untuk
 * mempengaruhi daun.
 */
const MOUSE_RADIUS = 150;

/**
 * Seberapa kuat daun terdorong.
 */
const PUSH_STRENGTH = 0.2;

/**
 * Semakin besar friction,
 * semakin lama daun meluncur.
 *
 * 0.92 = cukup lembut
 * 0.85 = lebih cepat berhenti
 * 0.97 = lebih lama meluncur
 */
const FRICTION = 0.97;

/**
 * Kecepatan maksimum daun.
 *
 * Ini mencegah daun terlempar
 * terlalu jauh ketika cursor
 * bergerak sangat cepat.
 */
const MAX_VELOCITY = 4;

type LeafObject = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  velocity: THREE.Vector2;
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export default function LeafBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    /**
     * ==================================================
     * SCENE
     * ==================================================
     */

    const scene = new THREE.Scene();

    /**
     * ==================================================
     * ORTHOGRAPHIC CAMERA
     *
     * Kamera 2D.
     * Tidak ada perspective/depth.
     * ==================================================
     */

    const camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      100,
    );

    camera.position.z = 10;

    /**
     * ==================================================
     * RENDERER
     * ==================================================
     */

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0x000000, 0);

    renderer.domElement.className = 'absolute inset-0 h-full w-full';

    container.appendChild(renderer.domElement);

    /**
     * ==================================================
     * TEXTURE CACHE
     * ==================================================
     */

    const textureLoader = new THREE.TextureLoader();

    const textureCache = new Map<string, THREE.Texture>();

    const loadTexture = (path: string) => {
      const cached = textureCache.get(path);

      if (cached) {
        return cached;
      }

      const texture = textureLoader.load(path);

      texture.colorSpace = THREE.SRGBColorSpace;

      textureCache.set(path, texture);

      return texture;
    };

    /**
     * ==================================================
     * CREATE LEAVES
     * ==================================================
     */

    const leaves: LeafObject[] = [];

    for (let index = 0; index < LEAF_COUNT; index++) {
      const texture = loadTexture(randomItem(LEAF_ASSETS));

      const size = randomRange(MIN_LEAF_SIZE, MAX_LEAF_SIZE);

      const geometry = new THREE.PlaneGeometry(size, size);

      const material = new THREE.MeshBasicMaterial({
        map: texture,

        /**
         * 95% opaque.
         */
        opacity: LEAF_OPACITY,

        transparent: true,

        /**
         * Tidak menggunakan depth.
         */
        depthWrite: false,
        depthTest: false,

        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);

      /**
       * Posisi random.
       */

      mesh.position.set(
        randomRange(-window.innerWidth / 2, window.innerWidth / 2),

        randomRange(-window.innerHeight / 2, window.innerHeight / 2),

        0,
      );

      /**
       * Rotasi awal random.
       *
       * Setelah ini tidak berubah
       * secara otomatis.
       */

      mesh.rotation.z = randomRange(0, Math.PI * 2);

      scene.add(mesh);

      leaves.push({
        mesh,

        /**
         * Semua daun awalnya diam.
         */
        velocity: new THREE.Vector2(0, 0),
      });
    }

    /**
     * ==================================================
     * MOUSE
     * ==================================================
     */

    const mouse = new THREE.Vector2(Infinity, Infinity);

    /**
     * Posisi mouse sebelumnya.
     *
     * Kita gunakan untuk mengetahui
     * arah dan kecepatan gerakan cursor.
     */
    const previousMouse = new THREE.Vector2(Infinity, Infinity);

    /**
     * Kecepatan cursor.
     */
    const mouseVelocity = new THREE.Vector2(0, 0);

    /**
     * ==================================================
     * RENDER
     * ==================================================
     */

    const render = () => {
      renderer.render(scene, camera);
    };

    /**
     * ==================================================
     * UPDATE LEAVES
     * ==================================================
     *
     * BAGIAN PENTING:
     *
     * Fungsi ini tidak membuat daun
     * bergerak sendiri.
     *
     * Ia hanya meneruskan velocity
     * yang sebelumnya diberikan oleh
     * cursor.
     */

    const updateLeaves = () => {
      let hasMovement = false;

      for (const leaf of leaves) {
        const { mesh, velocity } = leaf;

        /**
         * Kalau velocity masih ada,
         * daun masih bergerak.
         */

        if (velocity.lengthSq() > 0.00001) {
          hasMovement = true;
        }

        /**
         * Terapkan velocity.
         */

        mesh.position.x += velocity.x;

        mesh.position.y += velocity.y;

        /**
         * Friction.
         *
         * Ini membuat daun perlahan
         * kehilangan momentum.
         */

        velocity.multiplyScalar(FRICTION);

        /**
         * Stop ketika sudah terlalu kecil.
         */

        if (velocity.lengthSq() < 0.00001) {
          velocity.set(0, 0);
        }
      }

      return hasMovement;
    };

    /**
     * ==================================================
     * ANIMATION LOOP
     * ==================================================
     *
     * Ini BUKAN animasi floating.
     *
     * Loop hanya digunakan untuk
     * menyelesaikan momentum daun.
     */

    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const hasMovement = updateLeaves();

      /**
       * Render setiap frame ketika
       * daun sedang bergerak.
       *
       * Saat semua daun diam,
       * renderer tetap ringan karena
       * tidak ada perubahan visual.
       */

      if (hasMovement) {
        render();
      }
    };

    /**
     * Jalankan animation loop.
     */

    animate();

    /**
     * ==================================================
     * POINTER MOVE
     * ==================================================
     */

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();

      /**
       * Convert browser coordinate
       * menjadi Three.js coordinate.
       */

      const mouseX = event.clientX - rect.left - rect.width / 2;

      const mouseY = -(event.clientY - rect.top - rect.height / 2);

      /**
       * Hitung kecepatan cursor.
       */

      if (Number.isFinite(previousMouse.x)) {
        mouseVelocity.set(
          mouseX - previousMouse.x,

          mouseY - previousMouse.y,
        );
      }

      mouse.set(mouseX, mouseY);

      previousMouse.copy(mouse);

      /**
       * ==================================================
       * APPLY FORCE
       * ==================================================
       */

      for (const leaf of leaves) {
        const { mesh, velocity } = leaf;

        const dx = mesh.position.x - mouse.x;

        const dy = mesh.position.y - mouse.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        /**
         * Cursor terlalu jauh.
         *
         * Daun tidak terpengaruh.
         */

        if (distance >= MOUSE_RADIUS || distance === 0) {
          continue;
        }

        /**
         * Influence:
         *
         * 0 = tepi radius
         * 1 = sangat dekat
         */

        const influence = 1 - distance / MOUSE_RADIUS;

        /**
         * Direction dari cursor
         * menuju daun.
         */

        const directionX = dx / distance;

        const directionY = dy / distance;

        /**
         * ------------------------------------------------
         * CURSOR FORCE
         * ------------------------------------------------
         */

        velocity.x += directionX * influence * PUSH_STRENGTH;

        velocity.y += directionY * influence * PUSH_STRENGTH;

        /**
         * ------------------------------------------------
         * CURSOR VELOCITY
         * ------------------------------------------------
         *
         * Kalau cursor sedang bergerak
         * cepat, daun mendapatkan sedikit
         * tambahan momentum.
         */

        velocity.x += mouseVelocity.x * 0.002 * influence;

        velocity.y += mouseVelocity.y * 0.002 * influence;

        /**
         * ------------------------------------------------
         * MAX VELOCITY
         * ------------------------------------------------
         */

        if (velocity.length() > MAX_VELOCITY) {
          velocity.setLength(MAX_VELOCITY);
        }
      }

      /**
       * Kita render langsung agar
       * respons cursor terasa instan.
       */

      render();
    };

    /**
     * ==================================================
     * RESIZE
     * ==================================================
     */

    const handleResize = () => {
      const width = window.innerWidth;

      const height = window.innerHeight;

      camera.left = -width / 2;

      camera.right = width / 2;

      camera.top = height / 2;

      camera.bottom = -height / 2;

      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      render();
    };

    /**
     * ==================================================
     * EVENTS
     * ==================================================
     */

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });

    window.addEventListener('resize', handleResize);

    /**
     * Initial render.
     */

    render();

    /**
     * ==================================================
     * CLEANUP
     * ==================================================
     */

    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener('pointermove', handlePointerMove);

      window.removeEventListener('resize', handleResize);

      for (const leaf of leaves) {
        leaf.mesh.geometry.dispose();

        leaf.mesh.material.dispose();

        scene.remove(leaf.mesh);
      }

      for (const texture of textureCache.values()) {
        texture.dispose();
      }

      textureCache.clear();

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        overflow-hidden
      "
    />
  );
}
