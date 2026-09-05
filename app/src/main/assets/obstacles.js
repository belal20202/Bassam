/**
 * بسام (Bassam Runner) - Obstacle Management Engine
 * Generates fair, dynamic, and authentic obstacles with high performance.
 */

class ObstacleManager {
  constructor(world) {
    this.world = world;
    this.obstacles = [];
    this.obstaclePool = [];
    this.lastSpawnZ = 300;
    this.minSpawnDistance = 220; // Safe distance between obstacle rows
  }

  reset() {
    this.obstacles = [];
    this.lastSpawnZ = 300;
  }

  // Update & remove passed obstacles
  update(playerZ, dt) {
    // Remove obstacles that player passed safely
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      // If obstacle is a moving vehicle, move it slightly forward or backward
      if (obs.speed) {
        obs.z += obs.speed * dt;
      }

      if (obs.z < playerZ - 60) {
        this.obstacles.splice(i, 1);
        this.obstaclePool.push(obs);
      }
    }

    // Spawn new obstacles ahead of player
    const spawnHorizon = playerZ + 1600;
    while (this.lastSpawnZ < spawnHorizon) {
      this.spawnPattern(this.lastSpawnZ);
      // Spawn gap narrows slightly as distance increases to raise challenge fairly
      const speedFactor = Utils.clamp((playerZ / 3000), 0, 0.4);
      const gap = this.minSpawnDistance * (1.25 - speedFactor);
      this.lastSpawnZ += gap + Utils.randFloat(30, 90);
    }
  }

  // Spawn guaranteed-fair patterns with at least one viable exit path
  spawnPattern(spawnZ) {
    const patternType = Utils.randChoice([
      "single_barrier",
      "bus_and_taxi",
      "jump_barricade",
      "slide_banner",
      "truck_and_cones",
      "double_vehicle_gap",
      "roadwork_hole"
    ]);

    const lanes = [-1, 0, 1]; // Left, Center, Right

    switch (patternType) {
      case "jump_barricade": {
        // Red-and-white barrier in 1 or 2 lanes, with coins floating in arc above
        const occupiedLane = Utils.randChoice(lanes);
        this.addObstacle("barrier_jump", occupiedLane, spawnZ, { width: 60, height: 40 });
        // Place arc of coins over it to guide player to jump
        this.world.spawnCoinArc(occupiedLane, spawnZ - 40, spawnZ + 60, -65);
        break;
      }

      case "slide_banner": {
        // Overhead street sign or gate spanning all or two lanes that player must slide under
        const occupiedLane = Utils.randChoice(lanes);
        this.addObstacle("overhead_sign", occupiedLane, spawnZ, { width: 75, height: 70 });
        // Coins on ground under banner
        this.world.spawnCoinLine(occupiedLane, spawnZ - 20, 3, 0);
        break;
      }

      case "bus_and_taxi": {
        // Leave at least 1 open lane
        const openLane = Utils.randChoice(lanes);
        const blockedLanes = lanes.filter(l => l !== openLane);
        
        this.addObstacle("red_bus", blockedLanes[0], spawnZ, { width: 70, height: 80, depth: 80 });
        if (Math.random() < 0.6) {
          this.addObstacle("taxi", blockedLanes[1], spawnZ + 30, { width: 60, height: 50, depth: 60 });
        }
        // Place coins in open safe lane to reward good lane switching
        this.world.spawnCoinLine(openLane, spawnZ, 5, 0);
        break;
      }

      case "truck_and_cones": {
        const lane1 = Utils.randChoice(lanes);
        this.addObstacle("white_pickup", lane1, spawnZ, { width: 65, height: 55, depth: 65 });
        const remaining = lanes.filter(l => l !== lane1);
        const coneLane = Utils.randChoice(remaining);
        this.addObstacle("low_barrier", coneLane, spawnZ + 20, { width: 50, height: 35 });
        break;
      }

      case "double_vehicle_gap": {
        // Two vehicles in Left and Right, Center is open
        this.addObstacle("taxi", -1, spawnZ, { width: 60, height: 50, depth: 60 });
        this.addObstacle("white_pickup", 1, spawnZ, { width: 65, height: 55, depth: 65 });
        this.world.spawnCoinLine(0, spawnZ - 10, 4, 0);
        break;
      }

      case "roadwork_hole": {
        const lane = Utils.randChoice(lanes);
        this.addObstacle("roadwork_pit", lane, spawnZ, { width: 65, height: 10, depth: 50 });
        this.world.spawnCoinArc(lane, spawnZ - 30, spawnZ + 50, -55);
        break;
      }

      default: {
        // Single barrier
        const lane = Utils.randChoice(lanes);
        this.addObstacle("barrier_jump", lane, spawnZ, { width: 60, height: 40 });
        break;
      }
    }

    // Occasional power-up spawn in a safe spot
    if (Math.random() < 0.22) {
      const openLane = Utils.randChoice(lanes);
      const puType = Utils.randChoice(["shield", "magnet", "slowmo", "multiplier", "boost"]);
      this.world.spawnPowerupItem(puType, openLane, spawnZ + 90);
    }
  }

  addObstacle(type, lane, z, dims) {
    const laneX = lane * CONFIG.LANE_DISTANCE_X;
    const obs = {
      type,
      lane,
      laneX,
      z,
      width: dims.width || 60,
      height: dims.height || 50,
      depth: dims.depth || 30,
      speed: 0
    };
    this.obstacles.push(obs);
  }

  // Draw 3D projected obstacle on canvas
  render(ctx, camera, width, height) {
    // Sort from back to front
    this.obstacles.sort((a, b) => b.z - a.z);

    for (const obs of this.obstacles) {
      if (obs.z < camera.z - 20) continue;

      const p = Utils.project3D(obs.laneX, 0, obs.z, camera, width, height);
      if (!p.visible || p.scale <= 0) continue;

      const w = obs.width * p.scale;
      const h = obs.height * p.scale;
      const x = p.screenX - w * 0.5;
      const y = p.screenY - h;

      ctx.save();

      switch (obs.type) {
        case "barrier_jump":
        case "low_barrier":
          this.drawWoodenBarricade(ctx, x, y, w, h, p.scale);
          break;

        case "overhead_sign":
        case "high_banner":
          this.drawOverheadBanner(ctx, x, y, w, h, p.scale);
          break;

        case "taxi":
          this.drawTaxiCar(ctx, x, y, w, h, p.scale);
          break;

        case "red_bus":
          this.drawRedBus(ctx, x, y, w, h, p.scale);
          break;

        case "white_pickup":
          this.drawWhitePickup(ctx, x, y, w, h, p.scale);
          break;

        case "roadwork_pit":
          this.drawRoadworkHole(ctx, x, y, w, h, p.scale);
          break;

        default:
          this.drawWoodenBarricade(ctx, x, y, w, h, p.scale);
          break;
      }

      ctx.restore();
    }
  }

  // 1. Red & White Striped Wooden Barrier (Jump)
  drawWoodenBarricade(ctx, x, y, w, h, scale) {
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h + 2 * scale, w * 0.55, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden legs
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(x + 4 * scale, y + 10 * scale, 6 * scale, h - 10 * scale);
    ctx.fillRect(x + w - 10 * scale, y + 10 * scale, 6 * scale, h - 10 * scale);

    // Cross beam
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y + 8 * scale, w, 16 * scale);

    // Red warning stripes
    ctx.fillStyle = "#dc2626";
    for (let i = 0; i < w; i += 20 * scale) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + 8 * scale);
      ctx.lineTo(x + i + 10 * scale, y + 8 * scale);
      ctx.lineTo(x + i + 4 * scale, y + 24 * scale);
      ctx.lineTo(x + i - 6 * scale, y + 24 * scale);
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = "#4e342e";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y + 8 * scale, w, 16 * scale);
  }

  // 2. High Highway Banner / Overhead Street Arch (Slide under)
  drawOverheadBanner(ctx, x, y, w, h, scale) {
    // Steel pillars on sides
    ctx.fillStyle = "#475569";
    ctx.fillRect(x - 8 * scale, y - 20 * scale, 6 * scale, h + 20 * scale);
    ctx.fillRect(x + w + 2 * scale, y - 20 * scale, 6 * scale, h + 20 * scale);

    // Top Sign Board (Player slides safely underneath)
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(x - 12 * scale, y - 25 * scale, w + 24 * scale, 32 * scale);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x - 12 * scale, y - 25 * scale, w + 24 * scale, 32 * scale);

    // Arabic Signboard Text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(9, Math.floor(11 * scale))}px 'Cairo', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("⬇️ انزلق يا بسام ⬇️", x + w * 0.5, y - 6 * scale);

    // Yellow hazard warning bottom bar
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x - 12 * scale, y + 3 * scale, w + 24 * scale, 4 * scale);
  }

  // 3. Yellow City Taxi
  drawTaxiCar(ctx, x, y, w, h, scale) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h + 2 * scale, w * 0.6, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Car Body (Yellow)
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.roundRect(x, y + 16 * scale, w, h - 16 * scale, 8 * scale);
    ctx.fill();

    // Cabin Roof & Rear Window
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.roundRect(x + 6 * scale, y, w - 12 * scale, 24 * scale, 6 * scale);
    ctx.fill();

    // Rear Windshield Glass
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.roundRect(x + 9 * scale, y + 3 * scale, w - 18 * scale, 14 * scale, 4 * scale);
    ctx.fill();

    // Taxi Checker Stripe
    ctx.fillStyle = "#1e293b";
    for (let i = 0; i < w; i += 12 * scale) {
      ctx.fillRect(x + i, y + 26 * scale, 6 * scale, 6 * scale);
    }

    // Taillights (Red Glowing)
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 6 * scale;
    ctx.fillRect(x + 4 * scale, y + 36 * scale, 12 * scale, 8 * scale);
    ctx.fillRect(x + w - 16 * scale, y + 36 * scale, 12 * scale, 8 * scale);
    ctx.shadowBlur = 0;

    // License Plate
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w * 0.5 - 12 * scale, y + 38 * scale, 24 * scale, 8 * scale);
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("بسام 26", x + w * 0.5, y + 44 * scale);

    // Taxi sign on top
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w * 0.5 - 10 * scale, y - 6 * scale, 20 * scale, 7 * scale);
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${Math.max(5, Math.floor(6 * scale))}px sans-serif`;
    ctx.fillText("TAXI", x + w * 0.5, y - 1 * scale);
  }

  // 4. Red City Bus
  drawRedBus(ctx, x, y, w, h, scale) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h + 3 * scale, w * 0.65, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Bus Body
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8 * scale);
    ctx.fill();

    // White Roof stripe
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, w, 10 * scale);

    // Large Rear Window
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(x + 8 * scale, y + 14 * scale, w - 16 * scale, 28 * scale, 4 * scale);
    ctx.fill();

    // Glowing Bus Taillights
    ctx.fillStyle = "#f87171";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 8 * scale;
    ctx.fillRect(x + 6 * scale, y + h - 18 * scale, 12 * scale, 12 * scale);
    ctx.fillRect(x + w - 18 * scale, y + h - 18 * scale, 12 * scale, 12 * scale);
    ctx.shadowBlur = 0;

    // Bus Route Display
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(x + w * 0.5 - 20 * scale, y + 4 * scale, 40 * scale, 8 * scale);
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px 'Cairo'`;
    ctx.textAlign = "center";
    ctx.fillText("خط 10 - وسط المدينة", x + w * 0.5, y + 10 * scale);
  }

  // 5. White Pickup Truck (وانيت)
  drawWhitePickup(ctx, x, y, w, h, scale) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h + 2 * scale, w * 0.6, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Truck bed & body
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(x, y + 12 * scale, w, h - 12 * scale, 6 * scale);
    ctx.fill();

    // Cargo in bed (wooden crates)
    ctx.fillStyle = "#b45309";
    ctx.fillRect(x + 8 * scale, y + 16 * scale, w - 16 * scale, 14 * scale);
    ctx.strokeStyle = "#78350f";
    ctx.strokeRect(x + 8 * scale, y + 16 * scale, w - 16 * scale, 14 * scale);

    // Cabin
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(x + 6 * scale, y, w - 12 * scale, 18 * scale, 4 * scale);
    ctx.fill();

    // Rear window
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x + 10 * scale, y + 4 * scale, w - 20 * scale, 10 * scale);

    // Taillights
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x + 4 * scale, y + h - 12 * scale, 10 * scale, 8 * scale);
    ctx.fillRect(x + w - 14 * scale, y + h - 12 * scale, 10 * scale, 8 * scale);
  }

  // 6. Roadwork Pit / Hole (Jump over)
  drawRoadworkHole(ctx, x, y, w, h, scale) {
    // Dark deep asphalt pit
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.55, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orange caution cones around pit
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(x - 4 * scale, y + 8 * scale);
    ctx.lineTo(x + 4 * scale, y - 10 * scale);
    ctx.lineTo(x + 12 * scale, y + 8 * scale);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + w - 12 * scale, y + 8 * scale);
    ctx.lineTo(x + w - 4 * scale, y - 10 * scale);
    ctx.lineTo(x + w + 4 * scale, y + 8 * scale);
    ctx.fill();
  }
}
