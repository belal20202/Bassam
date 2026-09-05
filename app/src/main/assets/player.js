/**
 * بسام (Bassam Runner) - Player Controller & Character Renderer
 * Full physics state machine: 3-lane switching, jumping, sliding, tumbling,
 * custom wardrobe rendering with equipped outfits, shield bubbles, and boost effects.
 */

class Player {
  constructor(game) {
    this.game = game;

    // Spatial coordinates (World space)
    this.lane = 0; // -1: Left, 0: Center, 1: Right
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.y = 0; // 0 is ground level, negative is in air
    this.z = 0; // Forward position in world

    // Physics
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    // Stumble / Near-miss state
    this.isStumbling = false;
    this.stumbleTimer = 0;

    // Animation timers
    this.animTime = 0;
    this.rollAngle = 0;

    // Equipped outfit
    this.outfit = CONFIG.CLOTHES[0];
    this.updateEquippedOutfit();
  }

  reset() {
    this.lane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.y = 0;
    this.z = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isStumbling = false;
    this.stumbleTimer = 0;
    this.animTime = 0;
    this.rollAngle = 0;
    this.updateEquippedOutfit();
  }

  // Refresh active costume colors from SaveManager
  updateEquippedOutfit() {
    const equippedId = SaveManager.data?.selectedClothes || "casual";
    const found = CONFIG.CLOTHES.find(c => c.id === equippedId);
    this.outfit = found || CONFIG.CLOTHES[0];
  }

  // Lane switching
  moveLeft() {
    if (this.lane > -1) {
      this.lane--;
      this.targetLaneX = this.lane * CONFIG.LANE_DISTANCE_X;
      AudioManager.playJump();
    }
  }

  moveRight() {
    if (this.lane < 1) {
      this.lane++;
      this.targetLaneX = this.lane * CONFIG.LANE_DISTANCE_X;
      AudioManager.playJump();
    }
  }

  // Jump action
  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.isSliding = false; // Cancel slide on jump
      this.slideTimer = 0;
      this.vy = -CONFIG.PHYSICS.JUMP_VELOCITY;
      AudioManager.playJump();
      this.game.missions.track("jumps", 1);
    }
  }

  // Slide / Roll action
  slide() {
    if (this.isJumping) {
      // Fast fall when swiping down mid-air
      this.vy = 750;
    } else if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = CONFIG.PHYSICS.SLIDE_DURATION;
      AudioManager.playSlide();
      this.game.missions.track("slides", 1);

      // Spawn slide ground dust
      this.game.world.addExplosion(
        this.currentLaneX,
        this.y - 10,
        this.z - 10,
        "#cbd5e1",
        12
      );
    }
  }

  // Trigger stumble when grazing obstacle or after shield absorption
  stumble() {
    this.isStumbling = true;
    this.stumbleTimer = CONFIG.PHYSICS.STUMBLE_DURATION;
    // Comedic speech bubble
    const comicPhrases = [
      "يا ساتر استر!",
      "على وشك السقوط!",
      "ركّز يا بسام!",
      "أوشك يمسكني!",
      "الحمد لله عدّت!"
    ];
    this.game.ui.showComicBubble(Utils.randChoice(comicPhrases));
  }

  // Main update tick
  update(dt, currentSpeed) {
    this.animTime += dt * (currentSpeed / 100);

    // 1. Smooth Lane transition
    this.currentLaneX = Utils.lerp(this.currentLaneX, this.targetLaneX, dt * 16);

    // 2. Vertical Jump physics
    if (this.isJumping) {
      this.y += this.vy * dt;
      this.vy += CONFIG.PHYSICS.GRAVITY * dt;

      // Land on ground
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // 3. Slide timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      this.rollAngle += dt * 14;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.rollAngle = 0;
      }
    }

    // 4. Stumble timer
    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
      }
    }
  }

  // ==========================================
  // CHARACTER PROCEDURAL 3D VECTOR RENDERER
  // ==========================================

  render(ctx, camera, width, height) {
    const p = Utils.project3D(this.currentLaneX, this.y, this.z, camera, width, height);
    if (!p.visible || p.scale <= 0) return;

    ctx.save();
    const scale = p.scale;
    const x = p.screenX;
    const y = p.screenY;

    // 1. Soft Shadow on ground
    const shadowScale = Utils.clamp(1 - Math.abs(this.y) / 200, 0.3, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * scale, 24 * scale * shadowScale, 8 * scale * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Active Boost or Aura FX
    if (this.game.powerups.isBoostActive()) {
      this.drawBoostAura(ctx, x, y, scale);
    }

    // 3. Render Bassam Character with dynamic outfit colors
    ctx.save();
    if (this.isSliding) {
      this.drawSlidingBassam(ctx, x, y, scale);
    } else {
      this.drawRunningBassam(ctx, x, y, scale);
    }
    ctx.restore();

    // 4. Shield Sphere Forcefield
    if (this.game.powerups.isShieldActive()) {
      this.drawShieldSphere(ctx, x, y, scale);
    }

    ctx.restore();
  }

  // Running Bassam with energetic natural leg & arm swing
  drawRunningBassam(ctx, x, y, scale) {
    const colors = this.outfit.colors;
    const bounce = Math.sin(this.animTime * 12) * 5 * scale;
    const legAngle = Math.sin(this.animTime * 12);
    const armAngle = -legAngle;

    const baseH = 75 * scale;
    const charY = y - baseH + bounce;

    // Stumble comedic wobble
    if (this.isStumbling) {
      ctx.translate(x + Math.sin(this.animTime * 30) * 6 * scale, charY);
      ctx.rotate(Math.sin(this.animTime * 25) * 0.15);
    } else {
      ctx.translate(x, charY);
    }

    // A. Back Leg
    this.drawLeg(ctx, 6 * scale, 40 * scale, legAngle * 0.6, colors.pants, colors.shoes, scale);

    // B. Torso / Shirt
    ctx.fillStyle = colors.shirt;
    ctx.beginPath();
    ctx.roundRect(-12 * scale, 18 * scale, 24 * scale, 26 * scale, 6 * scale);
    ctx.fill();

    // Belt
    ctx.fillStyle = "#374151";
    ctx.fillRect(-11 * scale, 40 * scale, 22 * scale, 4 * scale);

    // C. Back Arm
    this.drawArm(ctx, 12 * scale, 22 * scale, armAngle * 0.7, colors.shirt, scale);

    // D. Front Leg
    this.drawLeg(ctx, -6 * scale, 40 * scale, -legAngle * 0.6, colors.pants, colors.shoes, scale);

    // E. Head & Facial Features
    // Neck
    ctx.fillStyle = "#fcd34d"; // Arabic warm skin tone
    ctx.fillRect(-4 * scale, 12 * scale, 8 * scale, 8 * scale);

    // Head
    ctx.beginPath();
    ctx.arc(0, 4 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Hair (Trendy Arabian pompadour / fade haircut)
    ctx.fillStyle = colors.hair || "#18181b";
    ctx.beginPath();
    ctx.arc(0, 1 * scale, 13.5 * scale, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Cap / Shemagh if outfit has one
    if (colors.cap) {
      ctx.fillStyle = colors.cap;
      ctx.beginPath();
      ctx.arc(0, 0, 14 * scale, Math.PI, Math.PI * 2);
      ctx.fill();
      // Cap visor
      ctx.fillRect(-14 * scale, 0, 28 * scale, 4 * scale);
    }

    // Cheerful Expression / Eyes (facing forward/running)
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(-4 * scale, 4 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(4 * scale, 4 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Confident energetic smile
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.arc(0, 6 * scale, 4 * scale, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // F. Front Arm
    this.drawArm(ctx, -12 * scale, 22 * scale, -armAngle * 0.7, colors.shirt, scale);
  }

  // Sliding / Rolling Bassam
  drawSlidingBassam(ctx, x, y, scale) {
    const colors = this.outfit.colors;
    ctx.translate(x, y - 22 * scale);
    ctx.rotate(this.rollAngle);

    // Body in rolled compact tuck
    ctx.fillStyle = colors.shirt;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Legs tucked
    ctx.fillStyle = colors.pants;
    ctx.beginPath();
    ctx.arc(10 * scale, 6 * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(-8 * scale, -4 * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Cap / Hair
    ctx.fillStyle = colors.cap || colors.hair;
    ctx.beginPath();
    ctx.arc(-8 * scale, -7 * scale, 10.5 * scale, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  drawLeg(ctx, px, py, angle, pantsColor, shoesColor, scale) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Pants / Thigh
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-4 * scale, 0, 8 * scale, 24 * scale, 4 * scale);
    ctx.fill();

    // Running Shoe
    ctx.fillStyle = shoesColor;
    ctx.beginPath();
    ctx.roundRect(-4 * scale, 22 * scale, 12 * scale, 8 * scale, 3 * scale);
    ctx.fill();

    ctx.restore();
  }

  drawArm(ctx, px, py, angle, sleeveColor, scale) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    ctx.fillStyle = sleeveColor;
    ctx.beginPath();
    ctx.roundRect(-3 * scale, 0, 6 * scale, 20 * scale, 3 * scale);
    ctx.fill();

    // Hand
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, 21 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw shimmering blue protective Shield sphere
  drawShieldSphere(ctx, x, y, scale) {
    const r = 44 * scale;
    const pulse = Math.sin(this.animTime * 10) * 3 * scale;

    const grad = ctx.createRadialGradient(x, y - 35 * scale, (r - 10) + pulse, x, y - 35 * scale, r + pulse);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.15)");
    grad.addColorStop(0.8, "rgba(56, 189, 248, 0.5)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0.9)");

    ctx.fillStyle = grad;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3 * scale;

    ctx.beginPath();
    ctx.arc(x, y - 35 * scale, r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Draw explosive fiery particles & speed aura during Rocket Boost
  drawBoostAura(ctx, x, y, scale) {
    const flameCount = 5;
    for (let i = 0; i < flameCount; i++) {
      const offsetX = Utils.randFloat(-16, 16) * scale;
      const offsetY = Utils.randFloat(0, 40) * scale;
      const flameR = Utils.randFloat(10, 24) * scale;

      const grad = ctx.createRadialGradient(x + offsetX, y - offsetY, 2, x + offsetX, y - offsetY, flameR);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#facc15");
      grad.addColorStop(0.8, "#ef4444");
      grad.addColorStop(1, "rgba(239, 68, 68, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + offsetX, y - offsetY, flameR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
