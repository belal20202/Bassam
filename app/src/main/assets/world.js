/**
 * بسام (Bassam Runner) - World & Environment Engine
 * True 3D perspective road projection, Arabic cityscape, palm trees,
 * dynamic day/sunset/night lighting cycles, golden coins, and particle engine.
 */

class WorldManager {
  constructor(game) {
    this.game = game;
    this.coins = [];
    this.powerupItems = [];
    this.particles = [];
    this.sceneryElements = [];
    this.currentEnvIndex = 0;
    this.roadSegments = [];
    this.roadSegmentLength = 60;
    this.totalSegments = 40;

    this.initRoad();
    this.initScenery();
  }

  reset() {
    this.coins = [];
    this.powerupItems = [];
    this.particles = [];
    this.currentEnvIndex = 0;
    this.initScenery();
  }

  // Pre-generate road segment ring
  initRoad() {
    this.roadSegments = [];
    for (let i = 0; i < this.totalSegments; i++) {
      this.roadSegments.push({
        index: i,
        z: i * this.roadSegmentLength
      });
    }
  }

  // Initialize roadside scenery objects (Palm trees, Arabic towers, street lamps)
  initScenery() {
    this.sceneryElements = [];
    for (let i = 0; i < 35; i++) {
      const z = i * 80 + 100;
      // Left side scenery
      this.sceneryElements.push({
        side: -1,
        z,
        x: -210 - Math.random() * 40,
        type: Math.random() > 0.45 ? "building" : "palm"
      });
      // Right side scenery
      this.sceneryElements.push({
        side: 1,
        z,
        x: 210 + Math.random() * 40,
        type: Math.random() > 0.45 ? "building" : "lamp"
      });
    }
  }

  // Spawn lines of floating golden coins
  spawnCoinLine(lane, startZ, count, yOffset = 0) {
    const laneX = lane * CONFIG.LANE_DISTANCE_X;
    for (let i = 0; i < count; i++) {
      this.coins.push({
        lane,
        laneX,
        z: startZ + i * 40,
        y: yOffset - 30, // Float slightly above ground
        rotation: Math.random() * Math.PI * 2,
        collected: false
      });
    }
  }

  // Spawn parabolic arc of coins over high barriers
  spawnCoinArc(lane, startZ, endZ, peakY = -60) {
    const laneX = lane * CONFIG.LANE_DISTANCE_X;
    const count = 5;
    const stepZ = (endZ - startZ) / (count - 1);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      // Parabolic curve: 4 * t * (1 - t) peaks at 1.0 when t = 0.5
      const curveY = 4 * t * (1 - t) * peakY;
      this.coins.push({
        lane,
        laneX,
        z: startZ + i * stepZ,
        y: curveY - 20,
        rotation: i * 0.4,
        collected: false
      });
    }
  }

  // Spawn collectible powerup in world
  spawnPowerupItem(type, lane, z) {
    const laneX = lane * CONFIG.LANE_DISTANCE_X;
    this.powerupItems.push({
      type,
      lane,
      laneX,
      z,
      y: -35,
      bobTimer: 0,
      collected: false
    });
  }

  // Add burst of glowing particles (coins, impacts, shields)
  addExplosion(x, y, z, color, count = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        z,
        vx: Utils.randFloat(-140, 140),
        vy: Utils.randFloat(-220, 50),
        vz: Utils.randFloat(-80, 80),
        life: 0.7,
        maxLife: 0.7,
        color,
        size: Utils.randFloat(3, 7)
      });
    }
  }

  // Per-frame physics and animation update
  update(dt, playerZ) {
    // 1. Identify current active environment
    const dist = this.game.distance;
    let envIdx = 0;
    for (let i = 0; i < CONFIG.ENVIRONMENTS.length; i++) {
      if (dist >= CONFIG.ENVIRONMENTS[i].minDist) {
        envIdx = i;
      }
    }
    this.currentEnvIndex = envIdx;

    // 2. Rotate and clean up coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.rotation += dt * 5;

      // Player pickup collision check
      if (!c.collected && Math.abs(c.laneX - this.game.player.currentLaneX) < 45 && Math.abs(c.z - playerZ) < 32) {
        // Vertical reach check
        if (Math.abs(c.y - this.game.player.y) < 55) {
          c.collected = true;
          this.collectCoin(c);
        }
      }

      // Despawn behind player
      if (c.z < playerZ - 40 || c.collected) {
        this.coins.splice(i, 1);
      }
    }

    // 3. Update collectible powerups
    for (let i = this.powerupItems.length - 1; i >= 0; i--) {
      const p = this.powerupItems[i];
      p.bobTimer += dt * 4;

      if (!p.collected && Math.abs(p.laneX - this.game.player.currentLaneX) < 50 && Math.abs(p.z - playerZ) < 35) {
        p.collected = true;
        this.game.powerups.activate(p.type);
        this.addExplosion(p.laneX, p.y, p.z, "#f59e0b", 25);
      }

      if (p.z < playerZ - 40 || p.collected) {
        this.powerupItems.splice(i, 1);
      }
    }

    // 4. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z += pt.vz * dt;
      pt.vy += 450 * dt; // Gravity
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Recycle roadside scenery elements smoothly
    for (const sc of this.sceneryElements) {
      if (sc.z < playerZ - 80) {
        sc.z += 35 * 80;
        // Occasionally re-randomize type
        if (Math.random() > 0.6) {
          sc.type = Math.random() > 0.4 ? "building" : "palm";
        }
      }
    }
  }

  // Handle coin pickup mechanics
  collectCoin(coin) {
    let value = 1;
    if (this.game.powerups.isMultiplierActive()) {
      value *= 2;
    }
    this.game.coinsRun += value;
    this.game.score += value * 10 * this.game.multiplier;
    this.game.missions.track("coins", value);
    AudioManager.playCoin();

    // Spawn pickup sparkle particles
    this.addExplosion(coin.laneX, coin.y, coin.z, "#ffd600", 8);
  }

  // ==========================================
  // MASTER 3D RENDERING PIPELINE
  // ==========================================

  render(ctx, camera, width, height) {
    const env = CONFIG.ENVIRONMENTS[this.currentEnvIndex];

    // 1. Draw dynamic sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    skyGrad.addColorStop(0, env.skyGradient[0]);
    skyGrad.addColorStop(1, env.skyGradient[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Distant Arab skyline / Desert mountains backdrop
    this.renderDistantSkyline(ctx, env, width, height);

    // 3. Ground / Desert floor
    ctx.fillStyle = env.sidewalkColor;
    ctx.fillRect(0, height * 0.38, width, height * 0.62);

    // 4. 3D Projected Road Surface (Trapezoid converging to horizon)
    this.renderRoad(ctx, camera, env, width, height);

    // 5. Roadside scenery (Buildings & Palm trees sorted by depth)
    this.renderScenery(ctx, camera, env, width, height);

    // 6. Floating Golden Coins
    this.renderCoins(ctx, camera, width, height);

    // 7. Collectible Powerup Items
    this.renderPowerups(ctx, camera, width, height);

    // 8. 3D Particles
    this.renderParticles(ctx, camera, width, height);
  }

  // Distant iconic Arabic cityscape silhouettes (Riyadh/Cairo/Baghdad inspired)
  renderDistantSkyline(ctx, env, width, height) {
    const horizonY = height * 0.38;
    ctx.save();

    // Sun or Moon
    if (env.timeOfDay === "day") {
      ctx.fillStyle = "rgba(255, 235, 59, 0.85)";
      ctx.beginPath();
      ctx.arc(width * 0.75, horizonY - 60, 24, 0, Math.PI * 2);
      ctx.fill();
    } else if (env.timeOfDay === "sunset") {
      ctx.fillStyle = "rgba(255, 112, 67, 0.9)";
      ctx.beginPath();
      ctx.arc(width * 0.7, horizonY - 30, 28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crescent Moon in night
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(width * 0.8, horizonY - 70, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = env.skyGradient[0];
      ctx.beginPath();
      ctx.arc(width * 0.8 - 6, horizonY - 74, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant building silhouettes
    ctx.fillStyle = env.timeOfDay === "night" ? "rgba(15, 23, 42, 0.85)" : "rgba(100, 116, 139, 0.4)";
    const bldCount = 14;
    const bldWidth = width / bldCount;
    for (let i = 0; i < bldCount; i++) {
      const h = 40 + Math.sin(i * 1.8) * 35 + ((i % 3) * 20);
      ctx.fillRect(i * bldWidth, horizonY - h, bldWidth + 2, h);

      // Skyscraper spires
      if (i % 4 === 0) {
        ctx.beginPath();
        ctx.moveTo(i * bldWidth + bldWidth * 0.5, horizonY - h - 25);
        ctx.lineTo(i * bldWidth, horizonY - h);
        ctx.lineTo(i * bldWidth + bldWidth, horizonY - h);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Project 3-lane road with perspective lane dashed markings
  renderRoad(ctx, camera, env, width, height) {
    const horizonY = height * 0.38;
    const centerX = width * 0.5;
    const nearZ = 10;
    const farZ = 1200;

    const roadWidthNear = 320;
    const roadWidthFar = 28;

    // Road Asphalt polygon
    ctx.fillStyle = env.roadColor;
    ctx.beginPath();
    ctx.moveTo(centerX - roadWidthNear, height);
    ctx.lineTo(centerX - roadWidthFar, horizonY);
    ctx.lineTo(centerX + roadWidthFar, horizonY);
    ctx.lineTo(centerX + roadWidthNear, height);
    ctx.closePath();
    ctx.fill();

    // Road Curbs (Red-White or Yellow-Black painted edges)
    ctx.lineWidth = 6;
    ctx.strokeStyle = env.curbColor;
    ctx.beginPath();
    ctx.moveTo(centerX - roadWidthNear, height);
    ctx.lineTo(centerX - roadWidthFar, horizonY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + roadWidthNear, height);
    ctx.lineTo(centerX + roadWidthFar, horizonY);
    ctx.stroke();

    // Dashed white lane dividers (Separating into 3 lanes: -1, 0, 1)
    const laneDivOffset = roadWidthNear * 0.333;
    const laneDivFarOffset = roadWidthFar * 0.333;

    // Animated dashed lines moving towards player
    const offsetZ = camera.z % 80;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = -offsetZ * 0.8;

    // Left divider
    ctx.beginPath();
    ctx.moveTo(centerX - laneDivOffset, height);
    ctx.lineTo(centerX - laneDivFarOffset, horizonY);
    ctx.stroke();

    // Right divider
    ctx.beginPath();
    ctx.moveTo(centerX + laneDivOffset, height);
    ctx.lineTo(centerX + laneDivFarOffset, horizonY);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash
  }

  // Draw roadside Palm Trees and Arabic architecture
  renderScenery(ctx, camera, env, width, height) {
    // Sort far to near
    const visibleScenery = this.sceneryElements.filter(s => s.z > camera.z + 10 && s.z < camera.z + 1100);
    visibleScenery.sort((a, b) => b.z - a.z);

    for (const sc of visibleScenery) {
      const p = Utils.project3D(sc.x, 0, sc.z, camera, width, height);
      if (!p.visible) continue;

      ctx.save();
      if (sc.type === "palm") {
        this.drawPalmTree(ctx, p.screenX, p.screenY, p.scale);
      } else if (sc.type === "building") {
        this.drawArabicBuilding(ctx, p.screenX, p.screenY, p.scale, env);
      } else {
        this.drawStreetLamp(ctx, p.screenX, p.screenY, p.scale, env);
      }
      ctx.restore();
    }
  }

  // Procedural Arab Palm Tree
  drawPalmTree(ctx, x, y, scale) {
    const trunkH = 90 * scale;
    const trunkW = 10 * scale;

    // Curved Trunk
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.moveTo(x - trunkW * 0.5, y);
    ctx.quadraticCurveTo(x + 10 * scale, y - trunkH * 0.5, x - trunkW * 0.3, y - trunkH);
    ctx.lineTo(x + trunkW * 0.3, y - trunkH);
    ctx.quadraticCurveTo(x + 14 * scale, y - trunkH * 0.5, x + trunkW * 0.5, y);
    ctx.fill();

    // Lush Palm fronds / leaves
    ctx.fillStyle = "#15803d";
    const frondCount = 6;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const lx = Math.cos(angle) * 35 * scale;
      const ly = Math.sin(angle) * 16 * scale;

      ctx.beginPath();
      ctx.moveTo(x, y - trunkH);
      ctx.quadraticCurveTo(x + lx, y - trunkH - 12 * scale, x + lx * 1.3, y - trunkH + ly);
      ctx.quadraticCurveTo(x + lx * 0.6, y - trunkH + ly * 0.5, x, y - trunkH);
      ctx.fill();
    }
  }

  // Modern / Traditional Arabic Building with lit windows
  drawArabicBuilding(ctx, x, y, scale, env) {
    const w = 70 * scale;
    const h = 140 * scale;

    // Building Wall
    ctx.fillStyle = env.timeOfDay === "night" ? "#1e293b" : "#e2e8f0";
    ctx.fillRect(x - w * 0.5, y - h, w, h);

    // Arabic Arch Rooftop
    ctx.fillStyle = env.timeOfDay === "night" ? "#0f172a" : "#cbd5e1";
    ctx.beginPath();
    ctx.arc(x, y - h, w * 0.35, Math.PI, 0);
    ctx.fill();

    // Windows with warm lights
    ctx.fillStyle = env.timeOfDay === "night" ? "#fef08a" : "#38bdf8";
    const rows = 4;
    const cols = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x - w * 0.35 + c * (w * 0.45);
        const wy = y - h + 20 * scale + r * (24 * scale);
        ctx.fillRect(wx, wy, 10 * scale, 14 * scale);
      }
    }
  }

  // Street Lamp with glowing cone at night
  drawStreetLamp(ctx, x, y, scale, env) {
    const h = 80 * scale;
    ctx.fillStyle = "#334155";
    ctx.fillRect(x - 2 * scale, y - h, 4 * scale, h);

    // Lamp head
    ctx.fillRect(x - 10 * scale, y - h, 14 * scale, 4 * scale);

    // Glowing warm bulb
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(x - 8 * scale, y - h + 3 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw 3D rotating golden coins
  renderCoins(ctx, camera, width, height) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const p = Utils.project3D(coin.laneX, coin.y, coin.z, camera, width, height);
      if (!p.visible) continue;

      const r = 16 * p.scale;
      const cosRot = Math.cos(coin.rotation);
      const coinWidth = Math.max(3, Math.abs(cosRot) * r);

      ctx.save();
      // Outer Golden Rim
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.ellipse(p.screenX, p.screenY, coinWidth, r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Coin Face
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.ellipse(p.screenX, p.screenY, coinWidth * 0.75, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arabic 1 symbol engraved inside coin (١)
      if (Math.abs(cosRot) > 0.4) {
        ctx.fillStyle = "#b45309";
        ctx.font = `bold ${Math.max(6, Math.floor(10 * p.scale))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("١", p.screenX, p.screenY);
      }

      ctx.restore();
    }
  }

  // Draw floating collectible powerup capsules
  renderPowerups(ctx, camera, width, height) {
    for (const pu of this.powerupItems) {
      if (pu.collected) continue;
      const floatY = pu.y + Math.sin(pu.bobTimer) * 8;
      const p = Utils.project3D(pu.laneX, floatY, pu.z, camera, width, height);
      if (!p.visible) continue;

      const r = 24 * p.scale;

      ctx.save();
      // Glowing outer orb
      const grad = ctx.createRadialGradient(p.screenX, p.screenY, r * 0.2, p.screenX, p.screenY, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#f59e0b");
      grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);
      ctx.fill();

      // Icon display
      const icon = CONFIG.POWERUPS[pu.type]?.icon || "⚡";
      ctx.font = `${Math.max(12, Math.floor(22 * p.scale))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, p.screenX, p.screenY);
      ctx.restore();
    }
  }

  // Draw 3D explosion & trail particles
  renderParticles(ctx, camera, width, height) {
    for (const pt of this.particles) {
      const p = Utils.project3D(pt.x, pt.y, pt.z, camera, width, height);
      if (!p.visible) continue;

      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = Utils.hexToRgba(pt.color, alpha);
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, pt.size * p.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
