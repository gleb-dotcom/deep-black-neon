/**
 * ============================================================================
 * SYNAPSE // UI CONTROLLER & STELLAR MODE MANAGER
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Stellar Engine
  const engine = new ParticleEngine('particle-canvas');

  // 2. Cursor Follower (Desktop only)
  const cursorDot = document.getElementById('cursor-glow-dot');
  const cursorHalo = document.getElementById('cursor-glow-halo');

  let mouseX = -100;
  let mouseY = -100;
  let haloX = -100;
  let haloY = -100;

  if (cursorDot && cursorHalo && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.opacity = '1';
      cursorHalo.style.opacity = '1';
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorHalo.style.opacity = '0';
    });

    // Smooth lerp for halo
    function renderHalo() {
      haloX += (mouseX - haloX) * 0.15;
      haloY += (mouseY - haloY) * 0.15;
      cursorHalo.style.transform = `translate3d(${haloX}px, ${haloY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderHalo);
    }
    requestAnimationFrame(renderHalo);
  }

  // 3. Mode Toggle (Swarm vs Repel)
  const modeToggleBtns = document.querySelectorAll('[data-mode-toggle]');
  const modeDisplay = document.getElementById('telemetry-mode');

  function updateModeUI(mode) {
    modeToggleBtns.forEach((btn) => {
      if (mode === 'swarm') {
        btn.innerHTML = `<span class="text-cyan-400">✨</span> РОЙ ЗВЁЗД: <span class="text-cyan-300 font-bold">АКТИВЕН</span>`;
        btn.classList.add('border-cyan-400', 'bg-cyan-950/40');
      } else {
        btn.innerHTML = `<span class="text-purple-400">⚡</span> ДИСПЕРСИЯ: <span class="text-purple-300 font-bold">РАЗЛЁТ</span>`;
        btn.classList.remove('border-cyan-400', 'bg-cyan-950/40');
      }
    });

    if (modeDisplay) {
      modeDisplay.textContent = mode === 'swarm' ? '✨ РОЙ ЗВЁЗД' : '⚡ ДИСПЕРСИЯ';
      modeDisplay.className = mode === 'swarm' ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold';
    }
  }

  modeToggleBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const newMode = engine.toggleMode();
      updateModeUI(newMode);
    });
  });

  // Keyboard shortcut: Space or 'M' to toggle mode
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' || (e.code === 'Space' && e.target === document.body)) {
      e.preventDefault();
      const newMode = engine.toggleMode();
      updateModeUI(newMode);
    }
  });

  // 4. Glassmorphism Card Spotlight & 3D Tilt
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // 5. Interactive CTA Supernova / Shockwave triggers
  const primaryCta = document.getElementById('primary-cta');
  if (primaryCta) {
    primaryCta.addEventListener('click', (e) => {
      e.preventDefault();
      const rect = primaryCta.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      // Trigger Supernova stellar burst & mega shockwave
      engine.triggerSupernova(clickX, clickY);
      engine.triggerShockwave(clickX, clickY, 340, 6.5);

      primaryCta.style.transform = 'scale(0.95)';
      setTimeout(() => {
        primaryCta.style.transform = '';
      }, 150);
    });
  }

  // Card Action Buttons (Impulse)
  const cardImpulseBtn = document.getElementById('card-impulse-btn');
  if (cardImpulseBtn) {
    cardImpulseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = cardImpulseBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      engine.triggerSupernova(cx, cy);
      engine.triggerShockwave(cx, cy, 280, 5.0);
    });
  }

  // 6. Telemetry Live Updates
  const fpsDisplay = document.getElementById('telemetry-fps');
  const particleCountDisplay = document.getElementById('telemetry-particles');
  const coordDisplay = document.getElementById('telemetry-coords');

  window.addEventListener('canvas-telemetry', (e) => {
    if (fpsDisplay) fpsDisplay.textContent = `${e.detail.fps} FPS`;
    if (particleCountDisplay) particleCountDisplay.textContent = `${e.detail.particleCount} ЗВЁЗД`;
    if (coordDisplay) {
      if (e.detail.cursorX > -500) {
        coordDisplay.textContent = `X:${String(e.detail.cursorX).padStart(4, '0')} Y:${String(e.detail.cursorY).padStart(4, '0')}`;
      } else {
        coordDisplay.textContent = `IDLE // VOID`;
      }
    }
  });

  // 7. Theme Switcher Pills
  const themeBtns = document.querySelectorAll('[data-theme-select]');
  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-select');
      engine.setTheme(theme);

      themeBtns.forEach((b) => b.classList.remove('active-theme', 'border-cyan-400', 'text-white'));
      btn.classList.add('active-theme', 'border-cyan-400', 'text-white');

      if (theme === 'cyan') {
        document.documentElement.style.setProperty('--card-spotlight', 'rgba(0, 240, 255, 0.12)');
        document.documentElement.style.setProperty('--neon-cyan', '#00f0ff');
      } else if (theme === 'violet') {
        document.documentElement.style.setProperty('--card-spotlight', 'rgba(168, 85, 247, 0.15)');
        document.documentElement.style.setProperty('--neon-cyan', '#c084fc');
      } else if (theme === 'lunar') {
        document.documentElement.style.setProperty('--card-spotlight', 'rgba(255, 255, 255, 0.12)');
        document.documentElement.style.setProperty('--neon-cyan', '#ffffff');
      } else if (theme === 'matrix') {
        document.documentElement.style.setProperty('--card-spotlight', 'rgba(16, 185, 129, 0.15)');
        document.documentElement.style.setProperty('--neon-cyan', '#10b981');
      }

      engine.triggerSupernova(window.innerWidth / 2, window.innerHeight / 2);
      engine.triggerShockwave(window.innerWidth / 2, window.innerHeight / 2, 280, 4.0);
    });
  });

  // Initial mode UI
  updateModeUI(engine.mode);
});
