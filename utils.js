/**
 * بسام (Bassam Runner) - Utilities & Math Helpers
 * Vector projection, pseudo-3D math, collisions, particles, formatting.
 */

const Utils = {
  // Linear interpolation
  lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  },

  // Clamp number within bounds
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // Random float in range [min, max)
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Random integer in range [min, max]
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Pick random element from array
  randChoice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // Format Arabic numbers with commas
  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return Math.floor(num).toLocaleString('ar-EG');
  },

  // Format distance
  formatDistance(meters) {
    return `${Math.floor(meters).toLocaleString('ar-EG')} م`;
  },

  // 3D Perspective Projection helper
  // Takes world coordinates (x, y, z) where z is distance forward from camera,
  // and projects to screen 2D coordinates (screenX, screenY, scale).
  project3D(x, y, z, camera, canvasWidth, canvasHeight) {
    const relZ = z - camera.z;
    if (relZ <= 0.1) {
      return { screenX: 0, screenY: 0, scale: 0, visible: false };
    }

    const fov = 320; // Field of view depth factor
    const scale = fov / relZ;

    const relX = x - camera.x;
    const relY = y - camera.y;

    const horizonY = canvasHeight * 0.38; // 38% from top
    const centerX = canvasWidth * 0.5;

    const screenX = centerX + relX * scale;
    const screenY = horizonY + relY * scale;

    return {
      screenX,
      screenY,
      scale,
      depth: relZ,
      visible: screenX > -200 && screenX < canvasWidth + 200 && screenY > -100 && screenY < canvasHeight + 200
    };
  },

  // Fast 2D bounding box collision detection
  aabb(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  },

  // Check 3D lane collision
  checkRunnerCollision(player, obstacle) {
    // 1. Check Lane
    const laneDist = Math.abs(player.currentLaneX - obstacle.laneX);
    if (laneDist > 45) return false;

    // 2. Check Z depth proximity
    const zDist = Math.abs(player.z - obstacle.z);
    if (zDist > (obstacle.depth || 30)) return false;

    // 3. Check Vertical state (Jump / Slide)
    if (obstacle.type === "low_barrier" || obstacle.type === "barrier_jump") {
      // Must jump over: if player height > barrier height, safe
      if (player.y < -45) return false; // In air!
      return true;
    }

    if (obstacle.type === "high_banner" || obstacle.type === "overhead_sign") {
      // Must slide under: if player is sliding, safe
      if (player.isSliding) return false;
      return true;
    }

    if (obstacle.type === "hole" || obstacle.type === "roadwork_pit") {
      // Must jump over
      if (player.y < -40) return false;
      return true;
    }

    // Solid vehicles & barricades block unless player jumps completely over
    if (player.y < -90) return false; // Jumped high over vehicle
    return true;
  },

  // Color hex to rgba helper
  hexToRgba(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
};
