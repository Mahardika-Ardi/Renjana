import * as THREE from 'three';

export type LeafState = {
  mesh: THREE.Mesh;

  /**
   * Posisi awal daun.
   *
   * Daun akan kembali ke posisi ini
   * setelah interaksi dengan cursor selesai.
   */
  initialPosition: THREE.Vector2;

  /**
   * Velocity / momentum daun.
   */
  velocity: THREE.Vector2;

  /**
   * Kecepatan rotasi daun.
   */
  rotationVelocity: number;

  /**
   * Waktu terakhir daun berinteraksi
   * dengan cursor.
   *
   * Digunakan untuk menghitung delay
   * sebelum daun mulai kembali.
   */
  lastInteractionTime: number;
};

export type LeafAnimationConfig = {
  /**
   * Friction / damping.
   *
   * Semakin besar nilainya,
   * semakin lama momentum daun bertahan.
   */
  friction: number;

  /**
   * Radius pengaruh cursor.
   */
  mouseRadius: number;

  /**
   * Kekuatan dorongan cursor
   * terhadap daun.
   */
  pushStrength: number;

  /**
   * Velocity maksimum daun.
   */
  maxVelocity: number;

  /**
   * Kekuatan daun kembali
   * ke posisi awal.
   */
  returnStrength: number;

  /**
   * Jarak cursor dari daun.
   *
   * Selama cursor masih berada
   * dalam jarak ini, return force
   * tidak akan aktif.
   */
  returnThreshold: number;

  /**
   * Jarak yang digunakan untuk
   * menghitung seberapa kuat
   * return force.
   */
  returnDistance: number;

  /**
   * Delay sebelum daun mulai
   * kembali ke posisi awal.
   *
   * Dalam milliseconds.
   *
   * 1000 = 1 detik.
   */
  returnDelay: number;
};

export const DEFAULT_LEAF_ANIMATION_CONFIG: LeafAnimationConfig = {
  /**
   * Momentum daun.
   */
  friction: 0.97,

  /**
   * Radius interaksi cursor.
   */
  mouseRadius: 100,

  /**
   * Kekuatan cursor.
   */
  pushStrength: 0.15,

  /**
   * Batas velocity.
   */
  maxVelocity: 4,

  /**
   * Kekuatan return.
   */
  returnStrength: 0.010,

  /**
   * Cursor harus cukup jauh
   * dari daun agar return aktif.
   */
  returnThreshold: 180,

  /**
   * Semakin jauh daun dari
   * posisi awal, semakin kuat
   * return force.
   */
  returnDistance: 100,

  /**
   * Delay sebelum kembali.
   *
   * 1000ms = 1 detik.
   */
  returnDelay: 2000,
};

/**
 * Membuat state awal sebuah daun.
 */
export function createLeafState(mesh: THREE.Mesh): LeafState {
  return {
    mesh,

    /**
     * Simpan posisi awal daun.
     */
    initialPosition: new THREE.Vector2(mesh.position.x, mesh.position.y),

    /**
     * Awalnya tidak bergerak.
     */
    velocity: new THREE.Vector2(0, 0),

    /**
     * Rotasi awal tidak berubah
     * kecuali diberikan dari scene.
     */
    rotationVelocity: 0.001,

    /**
     * Belum pernah terkena cursor.
     */
    lastInteractionTime: 0,
  };
}

/**
 * Memberikan force dari cursor
 * kepada sebuah daun.
 */
export function applyPointerForce(
  leaf: LeafState,
  mouse: THREE.Vector2,
  mouseVelocity: THREE.Vector2,
  config: LeafAnimationConfig,
): boolean {
  const { mesh, velocity } = leaf;

  /**
   * ==========================================
   * DISTANCE DARI CURSOR
   * ==========================================
   */

  const dx = mesh.position.x - mouse.x;

  const dy = mesh.position.y - mouse.y;

  const distanceSquared = dx * dx + dy * dy;

  const radiusSquared = config.mouseRadius * config.mouseRadius;

  /**
   * Cursor berada di luar
   * radius pengaruh.
   */
  if (distanceSquared >= radiusSquared) {
    return false;
  }

  const distance = Math.sqrt(distanceSquared);

  /**
   * Hindari division by zero.
   */
  if (distance === 0) {
    return false;
  }

  /**
   * ==========================================
   * INFLUENCE
   * ==========================================
   *
   * Semakin dekat cursor,
   * semakin kuat dorongannya.
   */

  const influence = 1 - distance / config.mouseRadius;

  /**
   * ==========================================
   * ARAH MENJAUH DARI CURSOR
   * ==========================================
   */

  const directionX = dx / distance;

  const directionY = dy / distance;

  /**
   * ==========================================
   * POINTER FORCE
   * ==========================================
   */

  velocity.x += directionX * influence * config.pushStrength;

  velocity.y += directionY * influence * config.pushStrength;

  /**
   * ==========================================
   * MOUSE MOMENTUM
   * ==========================================
   *
   * Sedikit tambahan velocity
   * mengikuti gerakan cursor.
   */

  velocity.x += mouseVelocity.x * 0.002 * influence;

  velocity.y += mouseVelocity.y * 0.002 * influence;

  /**
   * Batasi velocity maksimum.
   */
  limitVelocity(velocity, config.maxVelocity);

  /**
   * ==========================================
   * RESET RETURN TIMER
   * ==========================================
   *
   * Setiap kali cursor menyentuh
   * daun, timer return di-reset.
   */

  leaf.lastInteractionTime = performance.now();

  return true;
}

/**
 * Memberikan force untuk mengembalikan
 * daun ke posisi awal.
 */
export function applyReturnForce(
  leaf: LeafState,
  mouse: THREE.Vector2,
  config: LeafAnimationConfig,
): void {
  const { mesh, initialPosition, velocity } = leaf;

  /**
   * ==========================================
   * DELAY
   * ==========================================
   *
   * Jangan langsung pulang setelah
   * cursor berhenti menyentuh daun.
   */

  const now = performance.now();

  const elapsed = now - leaf.lastInteractionTime;

  /**
   * Kalau belum melewati delay,
   * jangan memberikan return force.
   */
  if (elapsed < config.returnDelay) {
    return;
  }

  /**
   * ==========================================
   * DISTANCE DARI INITIAL POSITION
   * ==========================================
   */

  const dx = initialPosition.x - mesh.position.x;

  const dy = initialPosition.y - mesh.position.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  /**
   * Sudah sangat dekat dengan
   * posisi awal.
   */
  if (distance < 0.5) {
    /**
     * Snap sedikit agar tidak terjadi
     * floating point movement kecil.
     */
    mesh.position.x = initialPosition.x;

    mesh.position.y = initialPosition.y;

    return;
  }

  /**
   * ==========================================
   * DISTANCE DARI CURSOR
   * ==========================================
   */

  const mouseDx = mesh.position.x - mouse.x;

  const mouseDy = mesh.position.y - mouse.y;

  const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

  /**
   * ==========================================
   * CURSOR MASIH DEKAT
   * ==========================================
   *
   * Kalau cursor masih berada
   * dekat dengan daun, jangan
   * paksa daun pulang.
   */

  if (mouseDistance < config.returnThreshold) {
    return;
  }

  /**
   * ==========================================
   * NORMALIZE RETURN DIRECTION
   * ==========================================
   */

  const directionX = dx / distance;

  const directionY = dy / distance;

  /**
   * ==========================================
   * DISTANCE INFLUENCE
   * ==========================================
   *
   * Semakin jauh dari posisi awal,
   * semakin kuat force.
   */

  const distanceInfluence = Math.min(distance / config.returnDistance, 3);

  /**
   * ==========================================
   * RETURN FORCE
   * ==========================================
   */

  const force = config.returnStrength * distanceInfluence;

  velocity.x += directionX * force;

  velocity.y += directionY * force;

  /**
   * Batasi velocity.
   */
  limitVelocity(velocity, config.maxVelocity);
}

/**
 * Update posisi satu daun.
 */
export function updateLeaf(leaf: LeafState, friction: number): boolean {
  const { mesh, velocity } = leaf;

  /**
   * Kalau velocity sudah sangat kecil,
   * anggap daun berhenti.
   */
  if (velocity.lengthSq() < 0.00001) {
    velocity.set(0, 0);

    return false;
  }

  /**
   * ==========================================
   * POSITION
   * ==========================================
   */

  mesh.position.x += velocity.x;

  mesh.position.y += velocity.y;

  /**
   * ==========================================
   * FRICTION
   * ==========================================
   */

  velocity.multiplyScalar(friction);

  /**
   * Bersihkan velocity yang
   * terlalu kecil.
   */
  if (velocity.lengthSq() < 0.00001) {
    velocity.set(0, 0);
  }

  /**
   * ==========================================
   * ROTATION
   * ==========================================
   */

  if (leaf.rotationVelocity !== 0) {
    mesh.rotation.z += leaf.rotationVelocity;
  }

  return true;
}

/**
 * Update seluruh daun.
 */
export function updateLeaves(
  leaves: LeafState[],
  mouse: THREE.Vector2,
  friction: number,
  config: LeafAnimationConfig,
): boolean {
  let hasMovement = false;

  /**
   * ==========================================
   * UPDATE SETIAP DAUN
   * ==========================================
   */

  for (const leaf of leaves) {
    /**
     * Berikan return force.
     *
     * Fungsi ini sendiri akan memeriksa:
     *
     * 1. Apakah delay sudah selesai?
     * 2. Apakah cursor masih dekat?
     * 3. Apakah daun sudah kembali?
     */
    applyReturnForce(leaf, mouse, config);

    /**
     * Update posisi dan velocity.
     */
    const isMoving = updateLeaf(leaf, friction);

    /**
     * Minimal satu daun masih bergerak.
     */
    if (isMoving) {
      hasMovement = true;
    }
  }

  return hasMovement;
}

/**
 * Membatasi velocity maksimum.
 */
function limitVelocity(velocity: THREE.Vector2, maxVelocity: number): void {
  const length = velocity.length();

  /**
   * Kalau velocity melewati batas,
   * turunkan ke maxVelocity.
   */
  if (length > maxVelocity) {
    velocity.setLength(maxVelocity);
  }
}
