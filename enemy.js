/**
 * بسام (Bassam Runner) - Pursuer Engine (المطارد الكوميدي)
 * Runs behind Bassam, closes the gap on stumbles, recedes on clean running,
 * triggers red alert HUD indicators, and initiates comic capture sequence.
 */

class EnemyPursuer {
  constructor(game) {
    this.game = game;
    this.distanceBehind = CONFIG.PHYSICS.ENEMY_DEFAULT_DISTANCE; // Distance in world Z behind player
    this.lane = 0;
    this.currentLaneX = 0;
    this.animTime = 0;
    this.isAlert = false;
  }

  reset() {
    this.distanceBehind = CONFIG.PHYSICS.ENEMY_DEFAULT_DISTANCE;
    this.lane = 0;
    this.currentLaneX = 0;
    this.animTime = 0;
    this.isAlert = false;
  }

  // Push enemy back when Bassam picks up Boost or runs cleanly
  pushBack(amount = 30) {
    this.distanceBehind = Math.min(130, this.distanceBehind + amount);
    this.isAlert = false;
  }

  // Approach rapidly when Bassam stumbles
  approachOnStumble() {
    this.distanceBehind = Math.max(12, this.distanceBehind - CONFIG.PHYSICS.ENEMY_STUMBLE_APPROACH);
    this.isAlert = true;
  }

  // Per-frame physics & tracking update
  update(dt, player, currentSpeed) {
    this.animTime += dt * (currentSpeed / 90);

    // Enemy matches player's lane with a slight comedic delay
    this.currentLaneX = Utils.lerp(this.currentLaneX, player.currentLaneX, dt * 8);

    // If player is stumbling, maintain aggressive proximity
    if (player.isStumbling) {
      this.distanceBehind = Math.max(12, this.distanceBehind - dt * 25);
      this.isAlert = true;
    } else {
      // Clean running: enemy slowly recedes back to safe distance
      if (this.distanceBehind < CONFIG.PHYSICS.ENEMY_DEFAULT_DISTANCE) {
        this.distanceBehind += CONFIG.PHYSICS.ENEMY_RECEDE_SPEED * dt;
      }
      this.isAlert = this.distanceBehind < 35;
    }

    // Capture condition: if enemy gets too close and player is stumbling or trapped
    if (this.distanceBehind <= CONFIG.PHYSICS.ENEMY_CAUGHT_THRESHOLD) {
      this.game.gameOver("المطارد أمسك بك!");
    }
  }

  // ==========================================
  // PURSUER 3D VECTOR RENDERER
  // Comedic stout inspector / traffic warden with whistle & cap
  // ==========================================

  render(ctx, camera, width, height) {
    const enemyZ = this.game.player.z - this.distanceBehind;
    // Don't draw if behind camera
    if (enemyZ < camera.z) return;

    const p = Utils.project3D(this.currentLaneX, 0, enemyZ, camera, width, height);
    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    const scale = p.scale;
    const x = p.screenX;
    const y = p.screenY;

    // 1. Ground Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * scale, 28 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Character Body & Motion
    const bounce = Math.sin(this.animTime * 14) * 6 * scale;
    const legAngle = Math.sin(this.animTime * 14);
    const armAngle = -legAngle;

    const baseH = 80 * scale;
    ctx.translate(x, y - baseH + bounce);

    // Legs (Navy blue trousers)
    this.drawLeg(ctx, 8 * scale, 44 * scale, legAngle * 0.7, "#1e3a8a", "#0f172a", scale);
    this.drawLeg(ctx, -8 * scale, 44 * scale, -legAngle * 0.7, "#1e3a8a", "#0f172a", scale);

    // Torso / Stout Navy Inspector Uniform
    ctx.fillStyle = "#1e40af";
    ctx.beginPath();
    ctx.roundRect(-16 * scale, 18 * scale, 32 * scale, 30 * scale, 8 * scale);
    ctx.fill();

    // Police / Guard Badge on chest
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(8 * scale, 26 * scale, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Belt & Buckle
    ctx.fillStyle = "#111827";
    ctx.fillRect(-15 * scale, 44 * scale, 30 * scale, 5 * scale);
    ctx.fillStyle = "#eab308";
    ctx.fillRect(-4 * scale, 43 * scale, 8 * scale, 7 * scale);

    // Arms waving with determination / whistle
    this.drawArm(ctx, 16 * scale, 22 * scale, armAngle * 0.8, "#1e40af", scale);
    this.drawArm(ctx, -16 * scale, 22 * scale, -armAngle * 0.8, "#1e40af", scale);

    // Head
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, 4 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Mustache (Comedic big brown mustache)
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.ellipse(0, 9 * scale, 8 * scale, 3.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whistle cord & whistle hanging
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 10 * scale);
    ctx.lineTo(2 * scale, 16 * scale);
    ctx.stroke();

    // Eyes (Determined look)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-5 * scale, 3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(5 * scale, 3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Inspector Cap (Navy with gold band and visor)
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.arc(0, -1 * scale, 15 * scale, Math.PI, Math.PI * 2);
    ctx.fill();

    // Gold cap band
    ctx.fillStyle = "#eab308";
    ctx.fillRect(-15 * scale, -2 * scale, 30 * scale, 3 * scale);

    // Black visor
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-16 * scale, 1 * scale, 32 * scale, 4 * scale);

    ctx.restore();
  }

  drawLeg(ctx, px, py, angle, pantsColor, shoesColor, scale) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-5 * scale, 0, 10 * scale, 24 * scale, 4 * scale);
    ctx.fill();
    ctx.fillStyle = shoesColor;
    ctx.beginPath();
    ctx.roundRect(-5 * scale, 22 * scale, 13 * scale, 8 * scale, 3 * scale);
    ctx.fill();
    ctx.restore();
  }

  drawArm(ctx, px, py, angle, sleeveColor, scale) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = sleeveColor;
    ctx.beginPath();
    ctx.roundRect(-4 * scale, 0, 8 * scale, 22 * scale, 3 * scale);
    ctx.fill();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, 23 * scale, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
