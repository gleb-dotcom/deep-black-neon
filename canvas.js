/**
 * ============================================================================
 * DEEP BLACK INTERACTIVE PARTICLE CANVAS ENGINE
 * High-performance 60FPS physics: dispersion, spring-return, neon links,
 * glowing cursor trail, shockwaves, and full touch responsiveness.
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
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.particles = [];
    this.shockwaves = [];
    this.trailPoints = [];
    
    // Performance Metrics
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTimer = 0;

    // Interaction State
    this.cursor = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      prevX: -1000,
      prevY: -1000,
      isMoving: false,
      lastMoveTime: 0,
      radius: 170, // Repulsion radius
      forceMultiplier: 1.8,
      isDown: false
    };

    // Color Palettes
    this.currentTheme = 'cyan';
    this.themes = {
      cyan: {
        primary: '#00f0ff',
        secondary: '#a855f7',
        tertiary: '#ffffff',
        accentGlow: 'rgba(0, 240, 255, 0.4)',
        trailRgba: '0, 240, 255',
        lineRgba: '0, 240, 255'
      },
      violet: {
        primary: '#c084fc',
        secondary: '#f43f5e',
        tertiary: '#ffffff',
        accentGlow: 'rgba(192, 132, 252, 0.4)',
        trailRgba: '192, 132, 252',
        lineRgba: '192, 132, 252'
      },
      lunar: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        tertiary: '#38bdf8',
        accentGlow: 'rgba(255, 255, 255, 0.35)',
        trailRgba: '255, 255, 255',
        lineRgba: '220, 230, 255'
      },
      matrix: {
        primary: '#10b981',
        secondary: '#00f0ff',
        tertiary: '#ffffff',
        accentGlow: 'rgba(16, 185, 129, 0.4)',
        trailRgba: '16, 185, 129',
        lineRgba: '16, 185, 129'
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

    // Responsive interaction radius
    if (this.width < 768) {
      this.cursor.radius = 120;
    } else {
      this.cursor.radius = 175;
    }

    // Re-adjust particle population if needed
    if (this.particles.length === 0) {
      this.initParticles();
    } else {
      // Re-anchor existing particles proportionally to new bounds
      this.rebalanceParticles();
    }
  }

  initParticles() {
    this.particles = [];
    // Dynamic density: ~100 on desktop 1080p, ~45 on mobile
    const area = this.width * this.height;
    const targetCount = Math.min(130, Math.max(40, Math.floor(area / 12000)));

    for (let i = 0; i < targetCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(x, y) {
    const px = x !== undefined ? x : Math.random() * this.width;
    const py = y !== undefined ? y : Math.random() * this.height;
    
    // Color assignment
    const rand = Math.random();
    let type = 'primary';
    if (rand > 0.85) type = 'tertiary';
    else if (rand > 0.6) type = 'secondary';

    return {
      // Current position
      x: px,
      y: py,
      // Target / Home anchor
      originX: px,
      originY: py,
      // Ambient floating phase
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseSpeed: 0.008 + Math.random() * 0.012,
      floatRadius: 8 + Math.random() * 18,
      // Velocities
      vx: 0,
      vy: 0,
      // Mass & physics coefficients
      friction: 0.91 + Math.random() * 0.03, // 0.91 - 0.94
      spring: 0.035 + Math.random() * 0.02,   // Returning spring elasticity
      size: 1.2 + Math.random() * 1.8,       // 1.2px - 3.0px
      baseAlpha: 0.45 + Math.random() * 0.45,
      type: type,
      glowRadius: 6 + Math.random() * 10
    };
  }

  rebalanceParticles() {
    this.particles.forEach(p => {
      p.originX = Math.min(Math.max(20, p.originX), this.width - 20);
      p.originY = Math.min(Math.max(20, p.originY), this.height - 20);
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Desktop Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.cursor.targetX = e.clientX;
      this.cursor.targetY = e.clientY;
      this.cursor.isMoving = true;
      this.cursor.lastMoveTime = performance.now();

      // Record trail
      this.addTrailPoint(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.cursor.targetX = -1000;
      this.cursor.targetY = -1000;
      this.cursor.isMoving = false;
    });

    window.addEventListener('mousedown', (e) => {
      this.cursor.isDown = true;
      // Trigger a subtle shockwave pulse on click
      this.triggerShockwave(e.clientX, e.clientY, 140, 2.5);
    });

    window.addEventListener('mouseup', () => {
      this.cursor.isDown = false;
    });

    // Touch Support for mobile screens
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.cursor.targetX = touch.clientX;
        this.cursor.targetY = touch.clientY;
        this.cursor.x = touch.clientX;
        this.cursor.y = touch.clientY;
        this.cursor.isMoving = true;
        this.cursor.lastMoveTime = performance.now();
        this.addTrailPoint(touch.clientX, touch.clientY);
        this.triggerShockwave(touch.clientX, touch.clientY, 100, 1.8);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.cursor.targetX = touch.clientX;
        this.cursor.targetY = touch.clientY;
        this.cursor.isMoving = true;
        this.cursor.lastMoveTime = performance.now();
        this.addTrailPoint(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.cursor.targetX = -1000;
      this.cursor.targetY = -1000;
      this.cursor.isMoving = false;
    });
  }

  addTrailPoint(x, y) {
    this.trailPoints.push({
      x,
      y,
      age: 0,
      maxAge: 20, // Frames of life
      size: 4
    });

    // Keep trail buffer compact
    if (this.trailPoints.length > 35) {
      this.trailPoints.shift();
    }
  }

  triggerShockwave(x, y, maxRadius = 180, force = 4.0) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: maxRadius,
      speed: 8,
      force: force,
      alpha: 0.9
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
    
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  updatePhysics(now) {
    // Smooth cursor interpolation (lerp)
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

    // Cursor movement timeout
    if (now - this.cursor.lastMoveTime > 180) {
      this.cursor.isMoving = false;
    }

    const mouseActive = this.cursor.x > -500;
    const curRad = this.cursor.radius;
    const curRadSq = curRad * curRad;

    // Update Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      // Disperse particles along shockwave ring
      const ringThickness = 28;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dist - sw.radius) < ringThickness && dist > 1) {
          const impulse = (1 - Math.abs(dist - sw.radius) / ringThickness) * sw.force * 5;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * impulse;
          p.vy += Math.sin(angle) * impulse;
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(s, 1);
      }
    }

    // Update Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Ambient natural orbit (sinusoidal drifting anchor)
      p.phaseX += p.phaseSpeed;
      p.phaseY += p.phaseSpeed * 0.8;
      const ambientTargetX = p.originX + Math.sin(p.phaseX) * p.floatRadius;
      const ambientTargetY = p.originY + Math.cos(p.phaseY) * p.floatRadius;

      // 1. MOUSE REPULSION PHYSICS
      if (mouseActive) {
        const dx = p.x - this.cursor.x;
        const dy = p.y - this.cursor.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < curRadSq && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          // Distance falloff (smooth cubic curve)
          const normDist = 1 - (dist / curRad);
          const force = normDist * normDist * this.cursor.forceMultiplier * 4.5;
          const angle = Math.atan2(dy, dx);

          // Radial repulsion
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;

          // Add dynamic momentum from mouse velocity
          const mouseSpeed = Math.hypot(this.cursor.vx, this.cursor.vy);
          if (mouseSpeed > 1) {
            const transfer = Math.min(mouseSpeed * 0.15, 3.5);
            p.vx += this.cursor.vx * 0.12 * normDist;
            p.vy += this.cursor.vy * 0.12 * normDist;
          }
        }
      }

      // 2. SPRING-BACK RESTORING FORCE
      // Pulls particle smoothly back to ambient anchor
      const springDx = ambientTargetX - p.x;
      const springDy = ambientTargetY - p.y;
      p.vx += springDx * p.spring;
      p.vy += springDy * p.spring;

      // 3. FRICTION / DAMPING
      p.vx *= p.friction;
      p.vy *= p.friction;

      // 4. INTEGRATE POSITION
      p.x += p.vx;
      p.y += p.vy;

      // Soft boundary bounce to keep particles in view
      const pad = 10;
      if (p.x < pad) { p.x = pad; p.vx *= -0.5; }
      else if (p.x > this.width - pad) { p.x = this.width - pad; p.vx *= -0.5; }
      if (p.y < pad) { p.y = pad; p.vy *= -0.5; }
      else if (p.y > this.height - pad) { p.y = this.height - pad; p.vy *= -0.5; }
    }

    // Update Cursor Trail points
    for (let t = this.trailPoints.length - 1; t >= 0; t--) {
      const pt = this.trailPoints[t];
      pt.age++;
      if (pt.age >= pt.maxAge) {
        this.trailPoints.splice(t, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const palette = this.themes[this.currentTheme];

    // Clear with deep black (#000000)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. DRAW CURSOR GLOW / AMBIENT LUMINESCENCE UNDER MOUSE
    if (this.cursor.x > -500) {
      const glowGrad = ctx.createRadialGradient(
        this.cursor.x, this.cursor.y, 0,
        this.cursor.x, this.cursor.y, this.cursor.radius * 1.3
      );
      glowGrad.addColorStop(0, `rgba(${palette.trailRgba}, 0.14)`);
      glowGrad.addColorStop(0.45, `rgba(${palette.trailRgba}, 0.04)`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.cursor.x, this.cursor.y, this.cursor.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. DRAW SHOCKWAVES
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${palette.trailRgba}, ${sw.alpha * 0.7})`;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 12;
      ctx.shadowColor = palette.primary;
      ctx.stroke();
      ctx.restore();
    }

    // 3. DRAW CONNECTING NEON LINES (CONSTELLATION MESH)
    const maxLinkDist = this.width < 768 ? 95 : 125;
    const maxLinkDistSq = maxLinkDist * maxLinkDist;
    const particleCount = this.particles.length;

    ctx.lineWidth = 0.75;
    for (let i = 0; i < particleCount; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < particleCount; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxLinkDistSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / maxLinkDist) * 0.32;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${palette.lineRgba}, ${alpha})`;
          ctx.stroke();
        }
      }

      // Interactive link to cursor if nearby
      if (this.cursor.x > -500) {
        const cdx = p1.x - this.cursor.x;
        const cdy = p1.y - this.cursor.y;
        const cDistSq = cdx * cdx + cdy * cdy;
        if (cDistSq < maxLinkDistSq * 0.8) {
          const cDist = Math.sqrt(cDistSq);
          const cAlpha = (1 - cDist / (maxLinkDist * 0.89)) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(this.cursor.x, this.cursor.y);
          ctx.strokeStyle = `rgba(${palette.trailRgba}, ${cAlpha})`;
          ctx.stroke();
        }
      }
    }

    // 4. DRAW GLOWING CURSOR TRAIL (SOFT LUMINESCENT TAIL)
    if (this.trailPoints.length > 2) {
      ctx.save();
      for (let i = 1; i < this.trailPoints.length; i++) {
        const prev = this.trailPoints[i - 1];
        const curr = this.trailPoints[i];
        const progress = 1 - (curr.age / curr.maxAge); // 1.0 -> 0.0
        
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `rgba(${palette.trailRgba}, ${progress * 0.55})`;
        ctx.lineWidth = Math.max(0.5, progress * 4.5);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = palette.primary;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. DRAW PARTICLES
    for (let i = 0; i < particleCount; i++) {
      const p = this.particles[i];
      const color = this.getThemeColor(p.type, p.baseAlpha);

      // Subtle glow for larger particles
      if (p.size > 2.0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.trailRgba}, 0.15)`;
        ctx.fill();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  animate() {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Track FPS
    this.frameCount++;
    this.fpsUpdateTimer += dt;
    if (this.fpsUpdateTimer >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
      // Dispatch telemetry event for UI
      window.dispatchEvent(new CustomEvent('canvas-telemetry', {
        detail: {
          fps: this.fps,
          particleCount: this.particles.length,
          cursorX: Math.round(this.cursor.x),
          cursorY: Math.round(this.cursor.y)
        }
      }));
    }

    this.updatePhysics(now);
    this.draw();

    requestAnimationFrame(() => this.animate());
  }
}

// Export for module or global use
window.ParticleEngine = ParticleEngine;
