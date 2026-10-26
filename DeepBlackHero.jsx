import React, { useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * SYNAPSE // ALPHA STAR STELLAR MATRIX for React + Tailwind CSS
 * Deep Black (#000000), Alpha Star cursor, 0 - 10 000 stars slider, Swarm & Supernovas
 * ============================================================================
 */
export default function DeepBlackHero() {
  const canvasRef = useRef(null);
  const [starCount, setStarCount] = useState(600);
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    particles: 600,
    coords: 'IDLE // VOID',
    mode: 'swarm'
  });
  const [activeTheme, setActiveTheme] = useState('cyan');
  const [mode, setMode] = useState('swarm');
  const engineRef = useRef(null);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setStarCount(val);
    if (engineRef.current) {
      engineRef.current.setCount(val);
    }
  };

  const handlePresetClick = (val) => {
    setStarCount(val);
    if (engineRef.current) {
      engineRef.current.setCount(val);
      engineRef.current.triggerShockwave(window.innerWidth / 2, window.innerHeight / 2, 220, 3.5);
    }
  };

  const toggleMode = () => {
    const next = mode === 'swarm' ? 'repel' : 'swarm';
    setMode(next);
    if (engineRef.current) {
      engineRef.current.setMode(next);
    }
  };

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

  const triggerSupernova = (e) => {
    if (engineRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      engineRef.current.triggerSupernova(cx, cy);
      engineRef.current.triggerShockwave(cx, cy, 320, 6.0);
    }
  };

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
      engineRef.current.triggerSupernova(window.innerWidth / 2, window.innerHeight / 2);
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
    let stardust = [];
    let supernovas = [];
    let shootingStars = [];
    let shockwaves = [];
    let trailPoints = [];
    let currentMode = 'swarm';
    let starRotation = 0;
    let targetCount = starCount;

    const cursor = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      radius: width < 768 ? 140 : 220,
      forceMultiplier: 1.8
    };

    const themes = {
      cyan: { primary: '#00f0ff', secondary: '#a855f7', tertiary: '#ffffff', trail: '0, 240, 255' },
      violet: { primary: '#c084fc', secondary: '#f43f5e', tertiary: '#ffffff', trail: '192, 132, 252' },
      lunar: { primary: '#ffffff', secondary: '#94a3b8', tertiary: '#38bdf8', trail: '255, 255, 255' },
      matrix: { primary: '#10b981', secondary: '#00f0ff', tertiary: '#ffffff', trail: '16, 185, 129' }
    };

    let currentThemeName = 'cyan';

    function createStar() {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const roll = Math.random();
      const isSparkle = roll > 0.92;
      return {
        x: px,
        y: py,
        originX: px,
        originY: py,
        vx: 0,
        vy: 0,
        floatPhaseX: Math.random() * Math.PI * 2,
        floatPhaseY: Math.random() * Math.PI * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.006 + Math.random() * 0.012,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        floatRadius: 8 + Math.random() * 20,
        friction: 0.91 + Math.random() * 0.04,
        spring: 0.022 + Math.random() * 0.02,
        orbitDistance: 20 + Math.random() * 220,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (0.012 + Math.random() * 0.032) * (Math.random() > 0.5 ? 1 : -1),
        swarmAttraction: 0.025 + Math.random() * 0.035,
        size: isSparkle ? 2.2 + Math.random() * 1.8 : 0.9 + Math.random() * 1.4,
        isSparkle: isSparkle,
        sparkleRotation: Math.random() * Math.PI,
        colorType: Math.random() > 0.82 ? 2 : Math.random() > 0.52 ? 1 : 0
      };
    }

    function syncCount(cnt) {
      targetCount = cnt;
      if (particles.length < targetCount) {
        const diff = targetCount - particles.length;
        for (let i = 0; i < diff; i++) particles.push(createStar());
      } else if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      cursor.radius = width < 768 ? 140 : 220;
    }

    resize();
    syncCount(targetCount);
    window.addEventListener('resize', resize, { passive: true });

    const handleMouseMove = (e) => {
      cursor.targetX = e.clientX;
      cursor.targetY = e.clientY;
      if (Math.random() > 0.35) {
        stardust.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: 0.8 + Math.random() * 1.5,
          age: 0,
          maxAge: 35
        });
        if (stardust.length > 70) stardust.shift();
      }
      trailPoints.push({ x: e.clientX, y: e.clientY, age: 0, maxAge: 25 });
      if (trailPoints.length > 35) trailPoints.shift();
    };

    const handleMouseLeave = () => {
      cursor.targetX = -1000;
      cursor.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const triggerSupernovaInternal = (x, y) => {
      for (let i = 0; i < 35; i++) {
        const angle = (Math.PI * 2 * i) / 35 + (Math.random() - 0.5) * 0.4;
        const speed = 4.0 + Math.random() * 8.5;
        supernovas.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 2.5,
          age: 0,
          maxAge: 45,
          colorType: Math.random() > 0.5 ? 0 : 1
        });
      }
      if (supernovas.length > 120) supernovas.splice(0, 35);
    };

    window.addEventListener('mousedown', (e) => {
      triggerSupernovaInternal(e.clientX, e.clientY);
      shockwaves.push({ x: e.clientX, y: e.clientY, radius: 5, maxRadius: 200, speed: 9, force: 4.5, alpha: 0.95 });
    });

    engineRef.current = {
      setCount: syncCount,
      setMode: (m) => { currentMode = m; },
      triggerSupernova: triggerSupernovaInternal,
      triggerShockwave: (x, y, maxRadius = 220, force = 4.5) => {
        shockwaves.push({ x, y, radius: 5, maxRadius, speed: 9, force, alpha: 0.95 });
      },
      setTheme: (t) => { if (themes[t]) currentThemeName = t; }
    };

    function draw4PointStar(cx, cy, spikes, outerRadius, innerRadius, color, rotation = 0) {
      let rot = (Math.PI / 2) * 3 + rotation;
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

    let animationId;
    let lastTime = performance.now();
    let frameCount = 0;
    let timer = 0;

    function loop(now) {
      const dt = now - lastTime;
      lastTime = now;
      frameCount++;
      timer += dt;
      starRotation += 0.015;

      if (timer >= 500) {
        setTelemetry({
          fps: Math.round((frameCount * 1000) / timer),
          particles: particles.length,
          coords: cursor.x > -500 ? `X:${Math.round(cursor.x)} Y:${Math.round(cursor.y)}` : 'IDLE // VOID',
          mode: currentMode
        });
        frameCount = 0;
        timer = 0;
      }

      if (cursor.targetX !== -1000) {
        cursor.x += (cursor.targetX - cursor.x) * 0.35;
        cursor.y += (cursor.targetY - cursor.y) * 0.35;
      } else {
        cursor.x = -1000;
        cursor.y = -1000;
      }

      // Particles Physics Update
      const mouseActive = cursor.x > -500;
      const count = particles.length;

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.floatPhaseX += p.floatSpeed;
        p.floatPhaseY += p.floatSpeed * 0.8;
        p.twinklePhase += p.twinkleSpeed;
        const ambientTargetX = p.originX + Math.sin(p.floatPhaseX) * p.floatRadius;
        const ambientTargetY = p.originY + Math.cos(p.floatPhaseY) * p.floatRadius;

        if (mouseActive) {
          if (currentMode === 'swarm') {
            p.orbitAngle += p.orbitSpeed;
            const targetX = cursor.x + Math.cos(p.orbitAngle) * p.orbitDistance;
            const targetY = cursor.y + Math.sin(p.orbitAngle) * p.orbitDistance;
            p.vx += (targetX - p.x) * p.swarmAttraction;
            p.vy += (targetY - p.y) * p.swarmAttraction;
          } else {
            const dx = p.x - cursor.x;
            const dy = p.y - cursor.y;
            const dist = Math.hypot(dx, dy);
            if (dist < cursor.radius && dist > 1) {
              const force = Math.pow(1 - dist / cursor.radius, 2) * 5.0;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
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
      }

      // DRAWING
      const palette = themes[currentThemeName];
      const colors = [palette.primary, palette.secondary, palette.tertiary];
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Batched star drawing for high performance (up to 10 000 stars)
      if (count > 1200) {
        for (let c = 0; c < 3; c++) {
          ctx.beginPath();
          ctx.fillStyle = colors[c];
          for (let i = 0; i < count; i++) {
            const p = particles[i];
            if (p.colorType === c && !p.isSparkle) {
              ctx.rect(p.x, p.y, p.size, p.size);
            }
          }
          ctx.fill();
        }
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          if (p.isSparkle) {
            draw4PointStar(p.x, p.y, 4, p.size * 2.2, p.size * 0.6, colors[p.colorType], p.sparkleRotation);
          }
        }
      } else {
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          const color = colors[p.colorType];
          if (p.isSparkle) {
            draw4PointStar(p.x, p.y, 4, p.size * 2.6, p.size * 0.6, color, p.sparkleRotation);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }
        }
      }

      // Draw Alpha Star Cursor
      if (cursor.x > -500) {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = palette.primary;
        draw4PointStar(cursor.x, cursor.y, 4, 18, 4, '#ffffff', starRotation);
        draw4PointStar(cursor.x, cursor.y, 4, 11, 2.5, palette.primary, starRotation + Math.PI / 4);
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

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
              <span className="font-bold tracking-wider text-lg">SYNAPSE<span className="text-cyan-400">.STARS</span></span>
            </div>

            <button
              onClick={toggleMode}
              className={`px-4 py-1.5 rounded-full text-xs font-mono border transition-all ${
                mode === 'swarm'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                  : 'border-purple-400 bg-purple-950/40 text-purple-300'
              }`}
            >
              {mode === 'swarm' ? '✨ РОЙ ЗВЁЗД: АКТИВЕН' : '⚡ ДИСПЕРСИЯ: РАЗЛЁТ'}
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex items-center justify-center py-12 px-4">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
              <span>●</span> ALPHA STAR CURSOR // 0 — 10 000 ЗВЁЗД
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-5 leading-tight">
              СВИТА ЗВЁЗД В СТИЛЕ<br />
              <span className="bg-gradient-to-r from-white via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                ГЛУБОКОГО ЧЕРНОГО
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-white/70 mb-7 leading-relaxed">
              Управляйте Главной звёздочкой (курсором), за которой кружит рой звёзд. Регулируйте плотность вселенной ползунком от 0 до 10 000 звёзд!
            </p>

            {/* Slider Widget */}
            <div className="w-full max-w-lg bg-black/75 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 mb-8 text-left shadow-2xl">
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <span className="text-white/80">✦ КОЛИЧЕСТВО ЗВЁЗД:</span>
                <span className="text-cyan-300 font-bold text-sm bg-black px-3 py-0.5 rounded-full border border-cyan-400/30">
                  {Number(starCount).toLocaleString('ru-RU')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={starCount}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-3"
              />
              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[11px] font-mono">
                <span className="text-white/40">Быстрый выбор:</span>
                <div className="flex gap-1.5">
                  {[100, 600, 2000, 5000, 10000].map((val) => (
                    <button
                      key={val}
                      onClick={() => handlePresetClick(val)}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        starCount === val ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 font-bold' : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {val === 10000 ? '10 000 MAX' : val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={triggerSupernova}
                className="relative group px-8 py-3.5 rounded-full font-semibold text-sm bg-black border border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] transition-all hover:scale-105 active:scale-95"
              >
                <span>Взрыв Суперновы ✦</span>
              </button>

              <button
                onClick={toggleMode}
                className="px-7 py-3.5 rounded-full font-medium text-xs font-mono text-white/80 bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/30 transition-all"
              >
                Сменить режим ({mode === 'swarm' ? '✨ Рой' : '⚡ Разлёт'})
              </button>
            </div>

            {/* Telemetry bar */}
            <div className="px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 flex items-center gap-6 font-mono text-xs text-white/60">
              <span>FPS: <strong className="text-cyan-400">{telemetry.fps}</strong></span>
              <span>ЗВЁЗД: <strong className="text-cyan-300">{Number(telemetry.particles).toLocaleString('ru-RU')}</strong></span>
              <span>РЕЖИМ: <strong className="text-cyan-300">{telemetry.mode === 'swarm' ? '✨ РОЙ' : '⚡ РАЗЛЁТ'}</strong></span>
            </div>

          </div>
        </main>

        {/* 3 Glassmorphism Cards */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-6 text-cyan-400">
                ✦
              </div>
              <h3 className="text-xl font-bold mb-2">Главная Звезда и Рой</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Курсор становится лучистой Альфа-звездой, а до 10 000 звёзд следуют за ней, образуя танцующий гравитационный вихрь.
              </p>
              <div className="pt-4 border-t border-white/10 font-mono text-xs text-white/40 flex justify-between">
                <span>CAPACITY: 10 000</span>
                <span className="text-cyan-400">SWARM DYNAMICS</span>
              </div>
            </div>

            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-purple-400/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center mb-6 text-purple-400">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Суперновы и Палитра</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Клик вызывает взрывную вспышку с искрами, а по небу пролетают метеоры.
              </p>
              <div className="flex gap-2 mb-4">
                {['cyan', 'violet', 'lunar', 'matrix'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border uppercase ${
                      activeTheme === theme ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40' : 'border-white/10 text-white/60'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10 font-mono text-xs text-white/40 flex justify-between">
                <span>METEORS: ACTIVE</span>
                <span className="text-purple-400">4 PALETTES</span>
              </div>
            </div>

            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="p-7 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-white/40 transition-all duration-300 group shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center mb-6 text-white">
                ▣
              </div>
              <h3 className="text-xl font-bold mb-2">Glassmorphism Spotlight</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Многослойный Blur 28px, динамический спотлайт за Главной звездой и кинетический 3D-наклон.
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
            <span>#000000 DEEP BLACK MATRIX // UP TO 10 000 STARS</span>
            <span>MOBILE TOUCH OPTIMIZED</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
