import React, { useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * SYNAPSE // Deep Black Reactive Canvas Component for React + Tailwind CSS
 * Aesthetics: Absolute Deep Black (#000000), Electric Cyan, Neon Violet, Lunar White
 * ============================================================================
 */
export default function DeepBlackHero() {
  const canvasRef = useRef(null);
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    particles: 100,
    coords: 'IDLE // VOID'
  });
  const [activeTheme, setActiveTheme] = useState('cyan');
  const engineRef = useRef(null);

  // Card hover spotlight tracking
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const triggerShockwave = (e) => {
    if (engineRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      engineRef.current.triggerShockwave(cx, cy, 320, 6.0);
    }
  };

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
      engineRef.current.triggerShockwave(window.innerWidth / 2, window.innerHeight / 2, 260, 3.5);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let particles = [];
    let shockwaves = [];
    let trailPoints = [];

    const cursor = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      isMoving: false,
      lastMoveTime: 0,
      radius: width < 768 ? 120 : 175,
      forceMultiplier: 1.8
    };

    const themes = {
      cyan: { primary: '#00f0ff', secondary: '#a855f7', tertiary: '#ffffff', trail: '0, 240, 255' },
      violet: { primary: '#c084fc', secondary: '#f43f5e', tertiary: '#ffffff', trail: '192, 132, 252' },
      lunar: { primary: '#ffffff', secondary: '#94a3b8', tertiary: '#38bdf8', trail: '255, 255, 255' },
      matrix: { primary: '#10b981', secondary: '#00f0ff', tertiary: '#ffffff', trail: '16, 185, 129' }
    };

    let currentThemeName = 'cyan';

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      cursor.radius = width < 768 ? 120 : 175;

      const area = width * height;
      const targetCount = Math.min(130, Math.max(40, Math.floor(area / 12000)));

      if (particles.length === 0) {
        for (let i = 0; i < targetCount; i++) {
          const px = Math.random() * width;
          const py = Math.random() * height;
          const rand = Math.random();
          const type = rand > 0.85 ? 'tertiary' : rand > 0.6 ? 'secondary' : 'primary';

          particles.push({
            x: px,
            y: py,
            originX: px,
            originY: py,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseSpeed: 0.008 + Math.random() * 0.012,
            floatRadius: 8 + Math.random() * 18,
            vx: 0,
            vy: 0,
            friction: 0.91 + Math.random() * 0.03,
            spring: 0.035 + Math.random() * 0.02,
            size: 1.2 + Math.random() * 1.8,
            baseAlpha: 0.45 + Math.random() * 0.45,
            type
          });
        }
      } else {
        particles.forEach((p) => {
          p.originX = Math.min(Math.max(20, p.originX), width - 20);
          p.originY = Math.min(Math.max(20, p.originY), height - 20);
        });
      }
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const handleMouseMove = (e) => {
      cursor.targetX = e.clientX;
      cursor.targetY = e.clientY;
      cursor.isMoving = true;
      cursor.lastMoveTime = performance.now();
      trailPoints.push({ x: e.clientX, y: e.clientY, age: 0, maxAge: 20 });
      if (trailPoints.length > 35) trailPoints.shift();
    };

    const handleMouseLeave = () => {
      cursor.targetX = -1000;
      cursor.targetY = -1000;
      cursor.isMoving = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        cursor.targetX = t.clientX;
        cursor.targetY = t.clientY;
        cursor.isMoving = true;
        cursor.lastMoveTime = performance.now();
        trailPoints.push({ x: t.clientX, y: t.clientY, age: 0, maxAge: 20 });
        if (trailPoints.length > 35) trailPoints.shift();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let animationId;
    let lastTime = performance.now();
    let frameCount = 0;
    let timer = 0;

    engineRef.current = {
      triggerShockwave: (x, y, maxRadius = 180, force = 4.0) => {
        shockwaves.push({ x, y, radius: 5, maxRadius, speed: 8, force, alpha: 0.9 });
      },
      setTheme: (theme) => {
        if (themes[theme]) currentThemeName = theme;
      }
    };

    function loop(now) {
      const dt = now - lastTime;
      lastTime = now;
      frameCount++;
      timer += dt;

      if (timer >= 500) {
        const fps = Math.round((frameCount * 1000) / timer);
        frameCount = 0;
        timer = 0;
        setTelemetry({
          fps,
          particles: particles.length,
          coords: cursor.x > -500 ? `X:${Math.round(cursor.x)} Y:${Math.round(cursor.y)}` : 'IDLE // VOID'
        });
      }

      // Cursor interpolation
      if (cursor.targetX !== -1000) {
        const prevX = cursor.x;
        const prevY = cursor.y;
        cursor.x += (cursor.targetX - cursor.x) * 0.35;
        cursor.y += (cursor.targetY - cursor.y) * 0.35;
        cursor.vx = cursor.x - prevX;
        cursor.vy = cursor.y - prevY;
      } else {
        cursor.x = -1000;
        cursor.y = -1000;
      }

      // Shockwaves update
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += sw.speed;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        const ringThickness = 28;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
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
        if (sw.radius >= sw.maxRadius) shockwaves.splice(s, 1);
      }

      // Particles update
      const mouseActive = cursor.x > -500;
      const curRadSq = cursor.radius * cursor.radius;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.phaseX += p.phaseSpeed;
        p.phaseY += p.phaseSpeed * 0.8;
        const ambientTargetX = p.originX + Math.sin(p.phaseX) * p.floatRadius;
        const ambientTargetY = p.originY + Math.cos(p.phaseY) * p.floatRadius;

        if (mouseActive) {
          const dx = p.x - cursor.x;
          const dy = p.y - cursor.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < curRadSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const normDist = 1 - dist / cursor.radius;
            const force = normDist * normDist * cursor.forceMultiplier * 4.5;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
          }
        }

        // Spring return & damping
        p.vx += (ambientTargetX - p.x) * p.spring;
        p.vy += (ambientTargetY - p.y) * p.spring;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Trail decay
      for (let t = trailPoints.length - 1; t >= 0; t--) {
        const pt = trailPoints[t];
        pt.age++;
        if (pt.age >= pt.maxAge) trailPoints.splice(t, 1);
      }

      // DRAWING
      const palette = themes[currentThemeName];
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Ambient cursor glow
      if (cursor.x > -500) {
        const glowGrad = ctx.createRadialGradient(
          cursor.x, cursor.y, 0,
          cursor.x, cursor.y, cursor.radius * 1.3
        );
        glowGrad.addColorStop(0, `rgba(${palette.trail}, 0.14)`);
        glowGrad.addColorStop(0.5, `rgba(${palette.trail}, 0.03)`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, cursor.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shockwave rings
      for (let i = 0; i < shockwaves.length; i++) {
        const sw = shockwaves[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${palette.trail}, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Connecting lines
      const maxLinkDist = width < 768 ? 95 : 125;
      const maxLinkDistSq = maxLinkDist * maxLinkDist;
      ctx.lineWidth = 0.75;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxLinkDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxLinkDist) * 0.32;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${palette.trail}, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Glowing cursor trail
      if (trailPoints.length > 2) {
        ctx.save();
        for (let i = 1; i < trailPoints.length; i++) {
          const prev = trailPoints[i - 1];
          const curr = trailPoints[i];
          const progress = 1 - curr.age / curr.maxAge;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(${palette.trail}, ${progress * 0.55})`;
          ctx.lineWidth = Math.max(0.5, progress * 4.5);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // Particle dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = palette[p.type] || palette.primary;
        ctx.fill();
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Ambient Vignette & Grid */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.06)_0%,transparent_60%),radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        
        {/* Navigation */}
        <header className="w-full border-b border-white/[0.06] backdrop-blur-md bg-black/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">✦</span>
              </div>
              <span className="font-bold tracking-wider text-lg">SYNAPSE<span className="text-cyan-400">.IO</span></span>
            </div>

            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-mono text-xs text-white/70 uppercase">SYSTEM: ONLINE // 60 FPS</span>
            </div>

            <button onClick={triggerShockwave} className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300 hover:border-cyan-400 transition-all">
              ⚡ ИМПУЛЬС
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
              <span>●</span> REACT + TAILWIND // KINETIC MATRIX
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              КИНЕТИКА В СТИЛЕ<br />
              <span className="bg-gradient-to-r from-white via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                ГЛУБОКОГО ЧЕРНОГО
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-white/70 mb-10 leading-relaxed">
              Полноэкранная симуляция частиц с физикой дисперсии от курсора, реактивным неоновым шлейфом и стеклянным интерфейсом в абсолютном вакууме <span className="text-cyan-300 font-mono">#000000</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <button
                onClick={triggerShockwave}
                className="relative group px-8 py-3.5 rounded-full font-semibold text-sm bg-black border border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] transition-all hover:scale-105 active:scale-95"
              >
                <span>Запустить импульс</span>
              </button>

              <a
                href="#cards"
                className="px-7 py-3.5 rounded-full font-medium text-sm text-white/80 bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/30 transition-all"
              >
                Исследовать карточки
              </a>
            </div>

            {/* Telemetry bar */}
            <div className="px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 flex items-center gap-6 font-mono text-xs text-white/60">
              <span>FPS: <strong className="text-cyan-400">{telemetry.fps}</strong></span>
              <span>NODES: <strong className="text-cyan-300">{telemetry.particles}</strong></span>
              <span>CURSOR: <strong className="text-purple-300">{telemetry.coords}</strong></span>
            </div>

          </div>
        </main>

        {/* 3 Glassmorphism Cards */}
        <section id="cards" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-6 text-cyan-400">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Кинетическая Дисперсия</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Частицы физически выталкиваются курсором по закону обратных квадратов и плавно возвращаются в свои орбиты благодаря пружинной релаксации.
              </p>
              <div className="pt-4 border-t border-white/10 font-mono text-xs text-white/40 flex justify-between">
                <span>REPULSION: 180PX</span>
                <span className="text-cyan-400">DAMPING: 0.92</span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-purple-400/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center mb-6 text-purple-400">
                ✦
              </div>
              <h3 className="text-xl font-bold mb-2">Неоновый Шлейф</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Светящийся радиальный ореол и интерполированная траектория следуют за курсором с плавным затуханием яркости.
              </p>
              <div className="flex gap-2 mb-4">
                {['cyan', 'violet', 'lunar', 'matrix'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border uppercase ${
                      activeTheme === theme
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                        : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10 font-mono text-xs text-white/40 flex justify-between">
                <span>GLOW: 320PX</span>
                <span className="text-purple-400">ADDITIVE BLEND</span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-white/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center mb-6 text-white">
                ▣
              </div>
              <h3 className="text-xl font-bold mb-2">Glassmorphism Spotlight</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Многослойный Blur 28px, динамический спотлайт, следующий за указателем внутри карточки, и кинетический 3D-наклон.
              </p>
              <div className="pt-4 border-t border-white/10 font-mono text-xs text-white/40 flex justify-between">
                <span>BLUR: 28PX</span>
                <span className="text-cyan-400">3D PERSPECTIVE</span>
              </div>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/[0.08] py-8 bg-black/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/40">
            <span>#000000 DEEP BLACK MATRIX // 60 FPS REACTIVE CANVAS</span>
            <span>MOBILE TOUCH OPTIMIZED</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
