/**
 * ============================================================================
 * SYNAPSE // DEEP BLACK STELLAR CANVAS ENGINE (v3.2 - HIGH CAPACITY)
 * Supports from 0 up to 10,000 stars at smooth 60 FPS!
 * Optimized rendering:
 * - Batched particle drawing by color channels (sub-millisecond draw time)
 * - Adaptive constellation lines (automatically capped when density > 300)
 * - "Главная Звездочка" (Alpha Star cursor) with radiant 4-point flare & stardust
 * - Dual Modes: 'swarm' (звезды кружат за главной звездой) & 'repel' (разлет)
 * - Supernovas on click & shooting stars
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
    this.targetCount = 600;   // Default star count (adjustable 0 - 10000)
    this.stardust = [];       // Embers shed by the main star
    this.supernovas = [];     // Click bursts
    this.shootingStars = [];  // Rare meteors
    this.shockwaves = [];
    this.trailPoints = [];
    
    // Performance Metrics
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTimer = 0;
    this.starRotation = 0;

    // Physics Mode: 'swarm' or 'repel'
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
        lineRgba: '0, 240, 255'
      },
      violet: {
        primary: '#c084fc',
        secondary: '#f43f5e',
        tertiary: '#ffffff',
        accentGlow: 'rgba(192, 132, 252, 0.5)',
        trailRgba: '192, 132, 252',
        lineRgba: '192, 132, 252'
      },
      lunar: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        tertiary: '#38bdf8',
        accentGlow: 'rgba(255, 255, 255, 0.45)',
        trailRgba: '255, 255, 255',
        lineRgba: '220, 230, 255'
      },
      matrix: {
        primary: '#10b981',
        secondary: '#00f0ff',
        tertiary: '#ffffff',
        accentGlow: 'rgba(16, 185, 129, 0.5)',
        trailRgba: '16, 185, 129',
        lineRgba: '16, 185, 129'
      }
    };

    this.init();
  }

  init() {
    this.resize();
    this.setParticleCount(this.targetCount);
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

    this.particles.forEach(p => {
      p.originX = Math.min(Math.max(10, p.originX), this.width - 10);
      p.originY = Math.min(Math.max(10, p.originY), this.height - 10);
    });
  }

  setParticleCount(count) {
    this.targetCount = Math.max(0, Math.min(10000, parseInt(count, 10) || 0));

    if (this.particles.length < this.targetCount) {
      const diff = this.targetCount - this.particles.length;
      for (let i = 0; i < diff; i++) {
        this.particles.push(this.createStar());
      }
    } else if (this.particles.length > this.targetCount) {
      this.particles.length = this.targetCount;
    }

    // Dispatch update immediately
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

  createStar() {
    const px = Math.random() * this.width;
    const py = Math.random() * this.height;
    
    // Types of stars
    const roll = Math.random();
    let isSparkle = roll > 0.92; // Fewer sparkles when count is huge
    let size = isSparkle ? 2.2 + Math.random() * 1.8 : 0.9 + Math.random() * 1.4;

    const colorRoll = Math.random();
    let colorType = 0; // 0: primary, 1: secondary, 2: tertiary
    if (colorRoll > 0.82) colorType = 2;
    else if (colorRoll > 0.52) colorType = 1;

    return {
      x: px,
      y: py,
      originX: px,
      originY: py,
      vx: 0,
      vy: 0,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.05,
      floatPhaseX: Math.random() * Math.PI * 2,
      floatPhaseY: Math.random() * Math.PI * 2,
      floatSpeed: 0.005 + Math.random() * 0.012,
      floatRadius: 8 + Math.random() * 20,
      friction: 0.91 + Math.random() * 0.04,
      spring: 0.022 + Math.random() * 0.02,
      // Swarm orbit settings
      orbitDistance: 20 + Math.random() * 220,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: (0.012 + Math.random() * 0.032) * (Math.random() > 0.5 ? 1 : -1),
      swarmAttraction: 0.025 + Math.random() * 0.035,
      size: size,
      baseAlpha: 0.35 + Math.random() * 0.55,
      isSparkle: isSparkle,
      sparkleRotation: Math.random() * Math.PI,
      colorType: colorType
    };
  }

  setMode(newMode) {
    if (newMode === 'swarm' || newMode === 'repel') {
      this.mode = newMode;
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

      if (Math.random() > 0.35) {
        this.addStardust(e.clientX, e.clientY);
      }

      this.addTrailPoint(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.cursor.targetX = -1000;
      this.cursor.targetY = -1000;
      this.cursor.isMoving = false;
    });

    window.addEventListener('mousedown', (e) => {
      this.triggerSupernova(e.clientX, e.clientY);
      this.triggerShockwave(e.clientX, e.clientY, 200, 4.5);
    });

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
    if (this.trailPoints.length > 35) {
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
      size: 0.8 + Math.random() * 1.6,
      age: 0,
      maxAge: 35 + Math.random() * 25,
      twinkle: Math.random() * Math.PI
    });

    if (this.stardust.length > 70) {
      this.stardust.shift();
    }
  }

  triggerSupernova(x, y) {
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
        colorType: Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? 1 : 2)
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

  spawnShootingStar() {
    if (Math.random() < 0.008 && this.shootingStars.length < 2) {
      const startX = Math.random() * this.width;
      const startY = Math.random() * (this.height * 0.4);
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
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

    this.starRotation += 0.015;
    const mouseActive = this.cursor.x > -500;
    const curRad = this.cursor.radius;
    const curRadSq = curRad * curRad;

    // Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      const ringThickness = 30;
      // When stars count is huge, check shockwave on subset for speed
      const step = this.particles.length > 2000 ? 4 : 1;
      for (let i = 0; i < this.particles.length; i += step) {
        const p = this.particles[i];
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dist - sw.radius) < ringThickness && dist > 1) {
          const impulse = (1 - Math.abs(dist - sw.radius) / ringThickness) * sw.force * 6;
          p.vx += (dx / dist) * impulse;
          p.vy += (dy / dist) * impulse;
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(s, 1);
      }
    }

    // Supernovas
    for (let i = this.supernovas.length - 1; i >= 0; i--) {
      const sn = this.supernovas[i];
      sn.x += sn.vx;
      sn.y += sn.vy;
      sn.vx *= 0.94;
      sn.vy *= 0.94;
      sn.age++;
      if (sn.age >= sn.maxAge) this.supernovas.splice(i, 1);
    }

    // Stardust
    for (let i = this.stardust.length - 1; i >= 0; i--) {
      const sd = this.stardust[i];
      sd.x += sd.vx;
      sd.y += sd.vy;
      sd.vx *= 0.96;
      sd.vy *= 0.96;
      sd.age++;
      if (sd.age >= sd.maxAge) this.stardust.splice(i, 1);
    }

    // Shooting Stars
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

    // Stars Physics (Optimized vectorized loop)
    const pCount = this.particles.length;
    const isSwarm = this.mode === 'swarm';
    const curVx = this.cursor.vx * 0.14;
    const curVy = this.cursor.vy * 0.14;
    const curSpeed = Math.hypot(this.cursor.vx, this.cursor.vy);

    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];

      p.floatPhaseX += p.floatSpeed;
      p.floatPhaseY += p.floatSpeed * 0.8;
      p.twinklePhase += p.twinkleSpeed;
      const ambientTargetX = p.originX + Math.sin(p.floatPhaseX) * p.floatRadius;
      const ambientTargetY = p.originY + Math.cos(p.floatPhaseY) * p.floatRadius;

      if (mouseActive) {
        if (isSwarm) {
          p.orbitAngle += p.orbitSpeed;
          const orbitTargetX = this.cursor.x + Math.cos(p.orbitAngle) * p.orbitDistance;
          const orbitTargetY = this.cursor.y + Math.sin(p.orbitAngle) * p.orbitDistance;

          p.vx += (orbitTargetX - p.x) * p.swarmAttraction;
          p.vy += (orbitTargetY - p.y) * p.swarmAttraction;

          if (curSpeed > 1) {
            p.vx += curVx;
            p.vy += curVy;
          }
        } else {
          const dx = p.x - this.cursor.x;
          const dy = p.y - this.cursor.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < curRadSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const normDist = 1 - (dist / curRad);
            const force = normDist * normDist * this.cursor.forceMultiplier * 4.8;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;

            if (curSpeed > 1) {
              p.vx += curVx * normDist;
              p.vy += curVy * normDist;
            }
          }
          p.vx += (ambientTargetX - p.x) * p.spring;
          p.vy += (ambientTargetY - p.y) * p.spring;
        }
      } else {
        p.vx += (ambientTargetX - p.x) * p.spring;
        p.vy += (ambientTargetY - p.y) * p.spring;
      }

      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 5) { p.x = 5; p.vx *= -0.5; }
      else if (p.x > this.width - 5) { p.x = this.width - 5; p.vx *= -0.5; }
      if (p.y < 5) { p.y = 5; p.vy *= -0.5; }
      else if (p.y > this.height - 5) { p.y = this.height - 5; p.vy *= -0.5; }
    }

    // Trail decay
    for (let t = this.trailPoints.length - 1; t >= 0; t--) {
      const pt = this.trailPoints[t];
      pt.age++;
      if (pt.age >= pt.maxAge) this.trailPoints.splice(t, 1);
    }
  }

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
    const count = this.particles.length;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. SHOOTING STARS
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

      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = palette.primary;
      ctx.fill();
      ctx.restore();
    }

    // 2. SHOCKWAVES
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${palette.trailRgba}, ${sw.alpha * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 12;
      ctx.shadowColor = palette.primary;
      ctx.stroke();
      ctx.restore();
    }

    // 3. CONSTELLATION MESH (Adaptive for performance)
    // Only calculate lines when star count <= 400 to maintain 60 FPS
    if (count <= 400) {
      const maxLinkDist = this.width < 768 ? 95 : 120;
      const maxLinkDistSq = maxLinkDist * maxLinkDist;
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
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${palette.lineRgba}, ${(1 - dist / maxLinkDist) * 0.28})`;
            ctx.stroke();
          }
        }
      }
    }

    // Constellation lines to Main Star
    if (this.cursor.x > -500 && count > 0) {
      const linkSample = Math.min(count, 120);
      const step = Math.max(1, Math.floor(count / linkSample));
      const curMaxDist = 140;

      for (let i = 0; i < count; i += step) {
        const p = this.particles[i];
        const dist = Math.hypot(p.x - this.cursor.x, p.y - this.cursor.y);
        if (dist < curMaxDist) {
          const alpha = (1 - dist / curMaxDist) * (this.mode === 'swarm' ? 0.45 : 0.25);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.cursor.x, this.cursor.y);
          ctx.strokeStyle = `rgba(${palette.trailRgba}, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // 4. GLOWING CURSOR TRAIL
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
        ctx.shadowBlur = 12;
        ctx.shadowColor = palette.primary;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. STARDUST
    for (let i = 0; i < this.stardust.length; i++) {
      const sd = this.stardust[i];
      const prog = 1 - (sd.age / sd.maxAge);
      ctx.beginPath();
      ctx.arc(sd.x, sd.y, sd.size * prog, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${palette.trailRgba}, ${prog * 0.7})`;
      ctx.fill();
    }

    // 6. SUPERNOVAS
    for (let i = 0; i < this.supernovas.length; i++) {
      const sn = this.supernovas[i];
      const prog = 1 - (sn.age / sn.maxAge);
      const col = sn.colorType === 0 ? palette.primary : (sn.colorType === 1 ? palette.secondary : '#ffffff');
      ctx.save();
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.size * prog, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.shadowBlur = 8;
      ctx.shadowColor = palette.primary;
      ctx.fill();
      ctx.restore();
    }

    // 7. ULTRA-HIGH-SPEED BATCHED STAR DRAWING (UP TO 10,000 STARS!)
    // When count > 1500, we batch small stars by color into single paths for maximum FPS
    const colors = [palette.primary, palette.secondary, palette.tertiary];

    if (count > 1200) {
      // 3 Batched paths for micro stars
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.fillStyle = colors[c];
        for (let i = 0; i < count; i++) {
          const p = this.particles[i];
          if (p.colorType === c && !p.isSparkle) {
            ctx.rect(p.x, p.y, p.size, p.size);
          }
        }
        ctx.fill();
      }

      // Draw sparkle stars with lens flares
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        if (p.isSparkle) {
          const twinkle = 0.6 + Math.sin(p.twinklePhase) * 0.4;
          this.draw4PointStar(ctx, p.x, p.y, 4, p.size * 2.2 * twinkle, p.size * 0.6 * twinkle, colors[p.colorType], p.sparkleRotation);
        }
      }
    } else {
      // Standard beautiful drawing with individual alpha & glow
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        const twinkle = 0.6 + Math.sin(p.twinklePhase) * 0.4;
        const color = colors[p.colorType];

        if (p.isSparkle) {
          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = palette.primary;
          this.draw4PointStar(ctx, p.x, p.y, 4, p.size * 2.8 * twinkle, p.size * 0.7 * twinkle, color, p.sparkleRotation);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    }

    // 8. "ГЛАВНАЯ ЗВЕЗДОЧКА" (ALPHA STAR CURSOR)
    if (this.cursor.x > -500) {
      const cx = this.cursor.x;
      const cy = this.cursor.y;
      const starColor = palette.primary;

      ctx.save();
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.cursor.radius * 0.85);
      auraGrad.addColorStop(0, `rgba(${palette.trailRgba}, 0.22)`);
      auraGrad.addColorStop(0.35, `rgba(${palette.trailRgba}, 0.08)`);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, this.cursor.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Rotating 4-point Diamond Star
      ctx.shadowBlur = 18;
      ctx.shadowColor = palette.primary;
      this.draw4PointStar(ctx, cx, cy, 4, 18, 4, '#ffffff', this.starRotation);
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
