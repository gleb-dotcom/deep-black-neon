/**
 * ============================================================================
 * SYNAPSE // DEEP BLACK STELLAR CANVAS ENGINE (v3.0)
 * 60FPS Reactive Cosmic Simulation:
 * - "Главная Звездочка" (Alpha Star cursor) with radiant 4-point lens flare & stardust emission
 * - Dual Modes:
 *     1) "SWARM" (Гравитационный рой / Свита звёзд) — звезды кружат и следуют за главной звездой
 *     2) "REPEL" (Кинетическая дисперсия) — звезды взрывоподобно разлетаются от курсора
 * - 300+ Twinkling Stars (Micro, Bright, 4-Point Sparkles, Stardust Embers, Shooting Stars)
 * - Supernova click bursts & glowing constellation links
 * ============================================================================
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas #${canvasId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Engine State
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Star & Particle collections
    this.particles = [];
    this.stardust = [];       // Tiny sparkling embers shed by the main star
    this.supernovas = [];     // Click bursts
    this.shootingStars = [];  // Rare fast meteor streaks
    this.shockwaves = [];
    this.trailPoints = [];
    
    // Performance Metrics
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTimer = 0;
    this.starRotation = 0;    // Main star continuous slow rotation

    // Physics Mode: 'swarm' (звезды следуют) or 'repel' (звезды разлетаются)
    this.mode = 'swarm';

    // Interaction State
    this.cursor = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      isMoving: false,
      lastMoveTime: 0,
      radius: 200,
      forceMultiplier: 1.8
    };

    // Color Palettes
    this.currentTheme = 'cyan';
    this.themes = {
      cyan: {
        primary: '#00f0ff',
        secondary: '#a855f7',
        tertiary: '#ffffff',
        accentGlow: 'rgba(0, 240, 255, 0.5)',
        trailRgba: '0, 240, 255',
        lineRgba: '0, 240, 255',
        starCore: '#ffffff'
      },
      violet: {
        primary: '#c084fc',
        secondary: '#f43f5e',
        tertiary: '#ffffff',
        accentGlow: 'rgba(192, 132, 252, 0.5)',
        trailRgba: '192, 132, 252',
        lineRgba: '192, 132, 252',
        starCore: '#ffffff'
      },
      lunar: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        tertiary: '#38bdf8',
        accentGlow: 'rgba(255, 255, 255, 0.45)',
        trailRgba: '255, 255, 255',
        lineRgba: '220, 230, 255',
        starCore: '#ffffff'
      },
      matrix: {
        primary: '#10b981',
        secondary: '#00f0ff',
        tertiary: '#ffffff',
        accentGlow: 'rgba(16, 185, 129, 0.5)',
        trailRgba: '16, 185, 129',
        lineRgba: '16, 185, 129',
        starCore: '#ffffff'
      }
    };

    this.init();
  }

  init() {
    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    this.cursor.radius = this.width < 768 ? 140 : 220;

    if (this.particles.length === 0) {
      this.initParticles();
    } else {
      this.particles.forEach(p => {
        p.originX = Math.min(Math.max(20, p.originX), this.width - 20);
        p.originY = Math.min(Math.max(20, p.originY), this.height - 20);
      });
    }
  }

  initParticles() {
    this.particles = [];
    // Enhanced star population: ~280-350 on desktop, ~140 on mobile
    const area = this.width * this.height;
    const targetCount = Math.min(340, Math.max(120, Math.floor(area / 4800)));

    for (let i = 0; i < targetCount; i++) {
      this.particles.push(this.createStar());
    }
  }

  createStar(x, y) {
    const px = x !== undefined ? x : Math.random() * this.width;
    const py = y !== undefined ? y : Math.random() * this.height;
    
    // Type of star:
    // 15% 4-pointed shimmering stars
    // 35% medium neon stars
    // 50% tiny micro twinkling background stars
    const roll = Math.random();
    let starType = 'micro';
    let size = 1.0 + Math.random() * 1.2;
    let isSparkle = false;

    if (roll > 0.82) {
      starType = 'sparkle';
      size = 2.4 + Math.random() * 2.2;
      isSparkle = true;
    } else if (roll > 0.48) {
      starType = 'bright';
      size = 1.8 + Math.random() * 1.5;
    }

    const colorRoll = Math.random();
    let colorType = 'primary';
    if (colorRoll > 0.85) colorType = 'tertiary';
    else if (colorRoll > 0.55) colorType = 'secondary';

    return {
      x: px,
      y: py,
      originX: px,
      originY: py,
      vx: 0,
      vy: 0,
      // Ambient floating & twinkle phase
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
      floatPhaseX: Math.random() * Math.PI * 2,
      floatPhaseY: Math.random() * Math.PI * 2,
      floatSpeed: 0.005 + Math.random() * 0.012,
      floatRadius: 10 + Math.random() * 25,
      // Physics coefficients
      friction: 0.92 + Math.random() * 0.03, // 0.92 - 0.95
      spring: 0.025 + Math.random() * 0.02,
      // Swarm orbit settings
      orbitDistance: 25 + Math.random() * 190,  // preferred orbit radius around main star
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: (0.015 + Math.random() * 0.035) * (Math.random() > 0.5 ? 1 : -1),
      swarmAttraction: 0.03 + Math.random() * 0.04,
      // Star visual attributes
      size: size,
      baseAlpha: 0.4 + Math.random() * 0.5,
      isSparkle: isSparkle,
      sparkleRotation: Math.random() * Math.PI,
      starType: starType,
      colorType: colorType
    };
  }

  setMode(newMode) {
    if (newMode === 'swarm' || newMode === 'repel') {
      this.mode = newMode;
      // Trigger a shockwave when switching modes
      if (this.cursor.x > -500) {
        this.triggerShockwave(this.cursor.x, this.cursor.y, 250, 4.0);
      } else {
        this.triggerShockwave(this.width / 2, this.height / 2, 280, 4.0);
      }
    }
  }

  toggleMode() {
    this.setMode(this.mode === 'swarm' ? 'repel' : 'swarm');
    return this.mode;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.cursor.targetX = e.clientX;
      this.cursor.targetY = e.clientY;
      this.cursor.isMoving = true;
      this.cursor.lastMoveTime = performance.now();

      // Emit stardust particles behind the main star
      if (Math.random() > 0.3) {
        this.addStardust(e.clientX, e.clientY);
      }

      this.addTrailPoint(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.cursor.targetX = -1000;
      this.cursor.targetY = -1000;
      this.cursor.isMoving = false;
    });

    // Click triggers Supernova explosion + shockwave
    window.addEventListener('mousedown', (e) => {
      this.triggerSupernova(e.clientX, e.clientY);
      this.triggerShockwave(e.clientX, e.clientY, 200, 4.5);
    });

    // Touch events
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        this.cursor.targetX = t.clientX;
        this.cursor.targetY = t.clientY;
        this.cursor.x = t.clientX;
        this.cursor.y = t.clientY;
        this.cursor.isMoving = true;
        this.cursor.lastMoveTime = performance.now();
        this.triggerSupernova(t.clientX, t.clientY);
        this.triggerShockwave(t.clientX, t.clientY, 160, 3.5);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        this.cursor.targetX = t.clientX;
        this.cursor.targetY = t.clientY;
        this.cursor.isMoving = true;
        this.cursor.lastMoveTime = performance.now();
        if (Math.random() > 0.4) {
          this.addStardust(t.clientX, t.clientY);
        }
        this.addTrailPoint(t.clientX, t.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.cursor.targetX = -1000;
      this.cursor.targetY = -1000;
      this.cursor.isMoving = false;
    });
  }

  addTrailPoint(x, y) {
    this.trailPoints.push({ x, y, age: 0, maxAge: 25 });
    if (this.trailPoints.length > 40) {
      this.trailPoints.shift();
    }
  }

  addStardust(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2.5;
    this.stardust.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.8 + Math.random() * 1.8,
      age: 0,
      maxAge: 35 + Math.random() * 25,
      twinkle: Math.random() * Math.PI
    });

    if (this.stardust.length > 80) {
      this.stardust.shift();
    }
  }

  triggerSupernova(x, y) {
    // Burst of 35 glittering stellar sparks
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 4.0 + Math.random() * 8.5;
      this.supernovas.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.8,
        age: 0,
        maxAge: 45 + Math.random() * 30,
        color: Math.random() > 0.5 ? 'primary' : (Math.random() > 0.5 ? 'secondary' : 'tertiary')
      });
    }

    if (this.supernovas.length > 120) {
      this.supernovas.splice(0, 35);
    }
  }

  triggerShockwave(x, y, maxRadius = 220, force = 4.5) {
    this.shockwaves.push({
      x, y, radius: 5, maxRadius, speed: 9, force, alpha: 0.95
    });
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
    }
  }

  getThemeColor(type, alpha = 1) {
    const palette = this.themes[this.currentTheme];
    const hex = palette[type] || palette.primary;
    if (alpha === 1) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  spawnShootingStar() {
    if (Math.random() < 0.008 && this.shootingStars.length < 2) {
      const startX = Math.random() * this.width;
      const startY = Math.random() * (this.height * 0.4);
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3; // 45 degrees
      const speed = 14 + Math.random() * 8;
      this.shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 80 + Math.random() * 70,
        age: 0,
        maxAge: 30 + Math.random() * 20
      });
    }
  }

  updatePhysics(now) {
    // 1. Smooth cursor interpolation (lerp)
    if (this.cursor.targetX !== -1000) {
      const prevX = this.cursor.x;
      const prevY = this.cursor.y;
      this.cursor.x += (this.cursor.targetX - this.cursor.x) * 0.35;
      this.cursor.y += (this.cursor.targetY - this.cursor.y) * 0.35;
      this.cursor.vx = this.cursor.x - prevX;
      this.cursor.vy = this.cursor.y - prevY;
    } else {
      this.cursor.x = -1000;
      this.cursor.y = -1000;
      this.cursor.vx = 0;
      this.cursor.vy = 0;
    }

    if (now - this.cursor.lastMoveTime > 180) {
      this.cursor.isMoving = false;
    }

    this.starRotation += 0.015;
    const mouseActive = this.cursor.x > -500;
    const curRad = this.cursor.radius;
    const curRadSq = curRad * curRad;

    // 2. Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      const ringThickness = 30;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dist - sw.radius) < ringThickness && dist > 1) {
          const impulse = (1 - Math.abs(dist - sw.radius) / ringThickness) * sw.force * 6;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * impulse;
          p.vy += Math.sin(angle) * impulse;
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(s, 1);
      }
    }

    // 3. Supernovas (Click bursts)
    for (let i = this.supernovas.length - 1; i >= 0; i--) {
      const sn = this.supernovas[i];
      sn.x += sn.vx;
      sn.y += sn.vy;
      sn.vx *= 0.94;
      sn.vy *= 0.94;
      sn.age++;
      if (sn.age >= sn.maxAge) {
        this.supernovas.splice(i, 1);
      }
    }

    // 4. Stardust Embers
    for (let i = this.stardust.length - 1; i >= 0; i--) {
      const sd = this.stardust[i];
      sd.x += sd.vx;
      sd.y += sd.vy;
      sd.vx *= 0.96;
      sd.vy *= 0.96;
      sd.age++;
      if (sd.age >= sd.maxAge) {
        this.stardust.splice(i, 1);
      }
    }

    // 5. Shooting Stars
    this.spawnShootingStar();
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const m = this.shootingStars[i];
      m.x += m.vx;
      m.y += m.vy;
      m.age++;
      if (m.age >= m.maxAge || m.x > this.width + 100 || m.y > this.height + 100) {
        this.shootingStars.splice(i, 1);
      }
    }

    // 6. Stars Physics Update (Dual Mode: SWARM vs REPEL)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Ambient natural orbit
      p.floatPhaseX += p.floatSpeed;
      p.floatPhaseY += p.floatSpeed * 0.8;
      p.twinklePhase += p.twinkleSpeed;
      const ambientTargetX = p.originX + Math.sin(p.floatPhaseX) * p.floatRadius;
      const ambientTargetY = p.originY + Math.cos(p.floatPhaseY) * p.floatRadius;

      if (mouseActive) {
        const dx = p.x - this.cursor.x;
        const dy = p.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (this.mode === 'swarm') {
          // ================================================================
          // MODE 1: SWARM (СВИТА ЗВЕЗД ЛЕТИТ ЗА ГЛАВНОЙ ЗВЕЗДОЙ)
          // ================================================================
          p.orbitAngle += p.orbitSpeed;
          // Target orbit position around the main star
          const orbitTargetX = this.cursor.x + Math.cos(p.orbitAngle) * p.orbitDistance;
          const orbitTargetY = this.cursor.y + Math.sin(p.orbitAngle) * p.orbitDistance;

          // Pull towards orbit target around main star
          const pullX = orbitTargetX - p.x;
          const pullY = orbitTargetY - p.y;
          p.vx += pullX * p.swarmAttraction;
          p.vy += pullY * p.swarmAttraction;

          // Swirl momentum when main star is moving fast
          const curSpeed = Math.hypot(this.cursor.vx, this.cursor.vy);
          if (curSpeed > 1) {
            p.vx += this.cursor.vx * 0.14;
            p.vy += this.cursor.vy * 0.14;
          }
        } else {
          // ================================================================
          // MODE 2: REPEL (КИНЕТИЧЕСКАЯ ДИСПЕРСИЯ / ВЫТАЛКИВАНИЕ)
          // ================================================================
          if (distSq < curRadSq && distSq > 0.01) {
            const normDist = 1 - (dist / curRad);
            const force = normDist * normDist * this.cursor.forceMultiplier * 4.8;
            const angle = Math.atan2(dy, dx);

            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;

            const curSpeed = Math.hypot(this.cursor.vx, this.cursor.vy);
            if (curSpeed > 1) {
              p.vx += this.cursor.vx * 0.14 * normDist;
              p.vy += this.cursor.vy * 0.14 * normDist;
            }
          }

          // Spring return to original position
          p.vx += (ambientTargetX - p.x) * p.spring;
          p.vy += (ambientTargetY - p.y) * p.spring;
        }
      } else {
        // No cursor: smooth spring return to home constellation
        p.vx += (ambientTargetX - p.x) * p.spring;
        p.vy += (ambientTargetY - p.y) * p.spring;
      }

      // Damping
      p.vx *= p.friction;
      p.vy *= p.friction;

      // Integrate
      p.x += p.vx;
      p.y += p.vy;

      // Soft edge bounce
      const pad = 10;
      if (p.x < pad) { p.x = pad; p.vx *= -0.5; }
      else if (p.x > this.width - pad) { p.x = this.width - pad; p.vx *= -0.5; }
      if (p.y < pad) { p.y = pad; p.vy *= -0.5; }
      else if (p.y > this.height - pad) { p.y = this.height - pad; p.vy *= -0.5; }
    }

    // 7. Cursor Trail decay
    for (let t = this.trailPoints.length - 1; t >= 0; t--) {
      const pt = this.trailPoints[t];
      pt.age++;
      if (pt.age >= pt.maxAge) {
        this.trailPoints.splice(t, 1);
      }
    }
  }

  // Draw 4-point radiant star with diffraction spikes
  draw4PointStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color, rotation = 0) {
    let rot = Math.PI / 2 * 3 + rotation;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    const palette = this.themes[this.currentTheme];

    // Clear deep black (#000000)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. DRAW SHOOTING STARS
    for (let i = 0; i < this.shootingStars.length; i++) {
      const m = this.shootingStars[i];
      const prog = 1 - m.age / m.maxAge;
      const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
      const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.7, `rgba(${palette.trailRgba}, ${prog * 0.4})`);
      grad.addColorStop(1, '#ffffff');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Bright head
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = palette.primary;
      ctx.fill();
      ctx.restore();
    }

    // 2. DRAW SHOCKWAVES
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${palette.trailRgba}, ${sw.alpha * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 15;
      ctx.shadowColor = palette.primary;
      ctx.stroke();
      ctx.restore();
    }

    // 3. DRAW CONNECTING CONSTELLATION MESH
    const maxLinkDist = this.width < 768 ? 95 : 120;
    const maxLinkDistSq = maxLinkDist * maxLinkDist;
    const count = this.particles.length;

    ctx.lineWidth = 0.7;
    for (let i = 0; i < count; i += 2) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < count; j += 2) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxLinkDistSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / maxLinkDist) * 0.28;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${palette.lineRgba}, ${alpha})`;
          ctx.stroke();
        }
      }

      // Constellation link to main star if nearby
      if (this.cursor.x > -500) {
        const cdx = p1.x - this.cursor.x;
        const cdy = p1.y - this.cursor.y;
        const cDistSq = cdx * cdx + cdy * cdy;
        if (cDistSq < maxLinkDistSq * 1.2) {
          const cDist = Math.sqrt(cDistSq);
          const cAlpha = (1 - cDist / (maxLinkDist * 1.2)) * (this.mode === 'swarm' ? 0.45 : 0.25);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(this.cursor.x, this.cursor.y);
          ctx.strokeStyle = `rgba(${palette.trailRgba}, ${cAlpha})`;
          ctx.stroke();
        }
      }
    }

    // 4. DRAW GLOWING CURSOR TRAIL (TAIL OF THE MAIN STAR)
    if (this.trailPoints.length > 2) {
      ctx.save();
      for (let i = 1; i < this.trailPoints.length; i++) {
        const prev = this.trailPoints[i - 1];
        const curr = this.trailPoints[i];
        const progress = 1 - (curr.age / curr.maxAge);
        
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `rgba(${palette.trailRgba}, ${progress * 0.6})`;
        ctx.lineWidth = Math.max(0.6, progress * 4.8);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = palette.primary;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. DRAW STARDUST EMBERS
    for (let i = 0; i < this.stardust.length; i++) {
      const sd = this.stardust[i];
      const prog = 1 - (sd.age / sd.maxAge);
      const twinkle = 0.5 + Math.sin(sd.twinkle + sd.age * 0.2) * 0.5;
      ctx.beginPath();
      ctx.arc(sd.x, sd.y, sd.size * prog, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${palette.trailRgba}, ${prog * twinkle * 0.8})`;
      ctx.fill();
    }

    // 6. DRAW SUPERNOVA SPARKS
    for (let i = 0; i < this.supernovas.length; i++) {
      const sn = this.supernovas[i];
      const prog = 1 - (sn.age / sn.maxAge);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.size * prog, 0, Math.PI * 2);
      ctx.fillStyle = this.getThemeColor(sn.color, prog);
      ctx.shadowBlur = 10;
      ctx.shadowColor = palette.primary;
      ctx.fill();
      ctx.restore();
    }

    // 7. DRAW STARS (POINTS & 4-POINT SPARKLES)
    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const twinkle = 0.6 + Math.sin(p.twinklePhase) * 0.4;
      const alpha = p.baseAlpha * twinkle;
      const color = this.getThemeColor(p.colorType, alpha);

      if (p.isSparkle) {
        // Draw radiant 4-point star
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = palette.primary;
        this.draw4PointStar(
          ctx,
          p.x,
          p.y,
          4,
          p.size * 2.8 * twinkle,
          p.size * 0.7 * twinkle,
          color,
          p.sparkleRotation
        );
        ctx.restore();
      } else {
        // Standard star dot with soft corona
        if (p.size > 2.0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${palette.trailRgba}, ${alpha * 0.2})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // 8. DRAW "ГЛАВНАЯ ЗВЕЗДОЧКА" (ALPHA STAR CURSOR)
    if (this.cursor.x > -500) {
      const cx = this.cursor.x;
      const cy = this.cursor.y;
      const starColor = palette.primary;

      ctx.save();
      // Outer radiant aura
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.cursor.radius * 0.85);
      auraGrad.addColorStop(0, `rgba(${palette.trailRgba}, 0.22)`);
      auraGrad.addColorStop(0.35, `rgba(${palette.trailRgba}, 0.08)`);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, this.cursor.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Rotating 4-point Diamond Star (Diffraction spikes)
      ctx.shadowBlur = 18;
      ctx.shadowColor = palette.primary;

      // Primary star flare
      this.draw4PointStar(ctx, cx, cy, 4, 18, 4, '#ffffff', this.starRotation);
      // Secondary diagonal flare
      this.draw4PointStar(ctx, cx, cy, 4, 11, 2.5, starColor, this.starRotation + Math.PI / 4);

      // Bright inner core
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }

  animate() {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameCount++;
    this.fpsUpdateTimer += dt;
    if (this.fpsUpdateTimer >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;

      window.dispatchEvent(new CustomEvent('canvas-telemetry', {
        detail: {
          fps: this.fps,
          particleCount: this.particles.length,
          cursorX: Math.round(this.cursor.x),
          cursorY: Math.round(this.cursor.y),
          mode: this.mode
        }
      }));
    }

    this.updatePhysics(now);
    this.draw();

    requestAnimationFrame(() => this.animate());
  }
}

// Global export
window.ParticleEngine = ParticleEngine;
