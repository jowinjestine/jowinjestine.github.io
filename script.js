/* ============================================================
   JOWIN JESTINE — PORTFOLIO SCRIPTS
   Canvas animations, GSAP ScrollTrigger, typewriter, counters
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   PRETEXT BRIDGE — fires callback once pretext module is ready
   ============================================================ */
function withPretext(fn) {
  if (window.__pretext) fn(window.__pretext);
  else window.addEventListener('pretextReady', () => fn(window.__pretext), { once: true });
}

/* ============================================================
   HERO CANVAS — NMR Metabolomics Spectral Visualization
   ============================================================ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, t = 0;

  // Real metabolite peaks: { ppm, amp (0-1), width, label, color }
  const PEAKS = [
    { ppm: 8.46, amp: 0.38, width: 0.04, label: 'Formate',    color: '#a855f7' },
    { ppm: 7.83, amp: 0.22, width: 0.05, label: 'Histidine',  color: '#38bdf8' },
    { ppm: 6.89, amp: 0.18, width: 0.06, label: 'Tyrosine',   color: '#a855f7' },
    { ppm: 4.11, amp: 0.52, width: 0.05, label: 'Lactate',    color: '#38bdf8' },
    { ppm: 3.56, amp: 0.31, width: 0.04, label: 'Glycine',    color: '#06b6d4' },
    { ppm: 3.41, amp: 0.88, width: 0.08, label: 'Glucose',    color: '#38bdf8' },
    { ppm: 3.04, amp: 0.65, width: 0.05, label: 'Creatinine', color: '#a855f7' },
    { ppm: 2.67, amp: 0.45, width: 0.07, label: 'Citrate',    color: '#38bdf8' },
    { ppm: 2.43, amp: 0.29, width: 0.06, label: 'Glutamine',  color: '#06b6d4' },
    { ppm: 1.47, amp: 0.72, width: 0.06, label: 'Alanine',    color: '#a855f7' },
    { ppm: 1.33, amp: 0.58, width: 0.05, label: 'Lactate',    color: '#38bdf8' },
    { ppm: 0.91, amp: 0.24, width: 0.05, label: 'Val/Leu',    color: '#06b6d4' },
  ];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Lorentzian peak function
  function lorentzian(x, center, width, amp) {
    return amp / (1 + Math.pow((x - center) / width, 2));
  }

  // Map ppm (9→0) to canvas x
  function ppmToX(ppm) { return W - (ppm / 9) * W; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;

    const BASELINE_Y = H * 0.78;
    const CHART_H    = H * 0.55;

    // Axis line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56,189,248,0.12)';
    ctx.lineWidth   = 1;
    ctx.moveTo(0, BASELINE_Y);
    ctx.lineTo(W, BASELINE_Y);
    ctx.stroke();

    // ppm tick labels
    ctx.font      = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148,163,184,0.35)';
    ctx.textAlign = 'center';
    for (let p = 1; p <= 9; p++) {
      const tx = ppmToX(p);
      ctx.fillText(p + ' ppm', tx, BASELINE_Y + 18);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56,189,248,0.07)';
      ctx.lineWidth = 0.5;
      ctx.moveTo(tx, BASELINE_Y - 4);
      ctx.lineTo(tx, BASELINE_Y + 4);
      ctx.stroke();
    }

    // Noise floor
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56,189,248,0.08)';
    ctx.lineWidth   = 0.8;
    let prevY = BASELINE_Y;
    for (let px = 0; px < W; px += 3) {
      const noise = (Math.sin(px * 0.08 + t * 0.7) + Math.sin(px * 0.23 + t * 1.1)) * 1.8;
      const y = BASELINE_Y - noise;
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Draw each peak as a filled+stroked Lorentzian
    const STEP = 3;
    PEAKS.forEach((pk, idx) => {
      const liveAmp = pk.amp * (1 + 0.03 * Math.sin(t * 2.1 + idx * 0.8));
      const cx  = ppmToX(pk.ppm);

      // Build path
      const pts = [];
      const spreadPx = pk.width * (W / 9) * 14;
      for (let dx = -spreadPx; dx <= spreadPx; dx += STEP) {
        const screenX = cx + dx;
        const ppmX    = 9 - (screenX / W) * 9;
        const y_val   = lorentzian(ppmX, pk.ppm, pk.width, liveAmp);
        pts.push({ x: screenX, y: BASELINE_Y - y_val * CHART_H });
      }

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, BASELINE_Y - liveAmp * CHART_H, 0, BASELINE_Y);
      const hex  = pk.color;
      grad.addColorStop(0, hex + '28');
      grad.addColorStop(1, hex + '00');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, BASELINE_Y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, BASELINE_Y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke line
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = hex + '70';
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      // Peak label (above apex)
      const apexY = BASELINE_Y - liveAmp * CHART_H;
      if (liveAmp > 0.2 && apexY > 40) {
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = hex + '90';
        ctx.textAlign = 'center';
        ctx.fillText('δ' + pk.ppm.toFixed(2), cx, apexY - 8);
        ctx.font      = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = hex + '60';
        ctx.fillText(pk.label, cx, apexY - 18);
      }
    });

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);
})();

/* ============================================================
   ORBIT CANVAS — Animated skill orbit in About section
   ============================================================ */
(function initOrbitCanvas() {
  const canvas = document.getElementById('orbitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W   = 340;
  const H   = 340;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  const cx  = W / 2;
  const cy  = H / 2;

  const orbits = [
    { radius: 68,  speed: 0.5,  offset: 0,    label: 'Python',    color: '#38bdf8' },
    { radius: 68,  speed: 0.5,  offset: 3.14, label: 'SQL',       color: '#06b6d4' },
    { radius: 106, speed: 0.32, offset: 1.0,  label: 'Azure',     color: '#a855f7' },
    { radius: 106, speed: 0.32, offset: 4.14, label: 'Mage AI',   color: '#c084fc' },
    { radius: 142, speed: 0.2,  offset: 0.5,  label: 'NMR',       color: '#38bdf8' },
    { radius: 142, speed: 0.2,  offset: 2.8,  label: 'Docker',    color: '#818cf8' },
    { radius: 142, speed: 0.2,  offset: 5.1,  label: 'XGBoost',   color: '#a855f7' },
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() / 1000;

    // Orbit rings
    [68, 106, 142].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56,189,248,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Orbiting chips
    orbits.forEach(o => {
      const angle = t * o.speed + o.offset;
      const x     = cx + Math.cos(angle) * o.radius;
      const y     = cy + Math.sin(angle) * o.radius;

      // Connector line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = o.color + '22';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 14);
      grd.addColorStop(0, o.color + '55');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = o.color;
      ctx.fill();

      // Label
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = o.color + 'cc';
      ctx.textAlign = 'center';
      ctx.fillText(o.label, x, y - 12);
    });

    // Centre node
    const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    cGrd.addColorStop(0, 'rgba(56,189,248,0.35)');
    cGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = cGrd;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    requestAnimationFrame(draw);
  }

  draw();
})();

/* ============================================================
   NAVBAR — scroll class toggle
   ============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* ============================================================
   TYPEWRITER EFFECT
   ============================================================ */
(function initTypewriter() {
  const el    = document.getElementById('typewriter');
  const words = [
    'data pipelines',
    'fintech systems',
    'scalable architectures',
    'analytics platforms',
    'production-grade APIs',
    'cloud infrastructure',
  ];
  let wi       = 0;
  let ci       = 0;
  let deleting = false;

  function tick() {
    const word = words[wi];
    if (deleting) {
      el.textContent = word.slice(0, --ci);
    } else {
      el.textContent = word.slice(0, ++ci);
    }

    let delay = deleting ? 38 : 72;
    if (!deleting && ci === word.length) { delay = 2200; deleting = true; }
    else if (deleting && ci === 0)       { deleting = false; wi = (wi + 1) % words.length; delay = 450; }

    setTimeout(tick, delay);
  }

  // Kick off after hero reveal (~2.2s)
  setTimeout(tick, 2200);
})();

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function animateCount(el, target) {
  const start = performance.now();
  const dur   = 1600; // ms

  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

ScrollTrigger.create({
  trigger: '.hero-stats',
  start: 'top 80%',
  once: true,
  onEnter: () => {
    window.__heroCounterFired = true;
    document.querySelectorAll('.stat-num').forEach(el => {
      animateCount(el, parseInt(el.dataset.target, 10));
    });
    // Fire redaction wipe after counter finishes (1600ms counter + 300ms buffer)
    setTimeout(() => { if (window.__fireRedaction) window.__fireRedaction(); }, 1900);
  }
});

/* ============================================================
   HERO ENTRANCE — GSAP timeline
   ============================================================ */
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

heroTl
  .to('.hero-name',    { opacity: 1, y: 0, duration: 0.6  })
  .to('.hero-journey', { opacity: 1, y: 0, duration: 0.45 }, '-=0.2')
  .to('.hero-role',    { opacity: 1, y: 0, duration: 0.5  }, '-=0.25')
  .to('.hero-desc',    { opacity: 1, y: 0, duration: 0.5  }, '-=0.2' )
  .to('.hero-stats',   { opacity: 1, y: 0, duration: 0.45 }, '-=0.15')
  .to('.hero-now',     { opacity: 1, y: 0, duration: 0.4  }, '-=0.10')
  .to('.hero-actions', { opacity: 1, y: 0, duration: 0.45 }, '-=0.10');

/* ============================================================
   SCROLL-TRIGGERED ANIMATIONS
   ============================================================ */

// Section headers — tag chip + subtitle fade; h2 is handled by initHeadingReveal (pretext)
gsap.utils.toArray('.section-header').forEach(el => {
  const tag = el.querySelector('.section-tag');
  const sub = el.querySelector('.section-sub');
  if (tag) gsap.from(tag, {
    scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    opacity: 0, y: 16, duration: 0.5, ease: 'power3.out',
  });
  if (sub) gsap.from(sub, {
    scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    opacity: 0, y: 16, duration: 0.5, ease: 'power3.out', delay: 0.25,
  });
});

// About visual
gsap.from('.orbit-wrap', {
  scrollTrigger: { trigger: '.about-grid', start: 'top 72%', once: true },
  opacity: 0, x: -36, duration: 0.75, ease: 'power3.out'
});

// About text paragraphs
gsap.from('.about-body > *', {
  scrollTrigger: { trigger: '.about-grid', start: 'top 72%', once: true },
  opacity: 0, x: 36, duration: 0.65, ease: 'power3.out',
  stagger: 0.1
});

// About pills
gsap.from('.about-pill', {
  scrollTrigger: { trigger: '.about-pills', start: 'top 85%', once: true },
  opacity: 0, x: 24, duration: 0.5, ease: 'power3.out',
  stagger: 0.1
});

// Timeline items — staggered slide-in
document.querySelectorAll('.tl-item').forEach((item, i) => {
  gsap.to(item, {
    scrollTrigger: { trigger: item, start: 'top 84%', once: true },
    opacity: 1, x: 0, duration: 0.58, ease: 'power3.out',
    delay: i * 0.04
  });
});

// Skill cards — staggered pop-up
document.querySelectorAll('.skill-card').forEach((el, i) => {
  gsap.to(el, {
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    opacity: 1, y: 0, duration: 0.5, ease: 'power3.out',
    delay: i * 0.07
  });
});

// Education cards
document.querySelectorAll('.edu-card').forEach((el, i) => {
  gsap.to(el, {
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
    delay: i * 0.12
  });
});

// Publications card reveal
gsap.to('.pub-card', {
  scrollTrigger: { trigger: '.pub-card', start: 'top 85%', once: true },
  opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
});

// Contact cards
gsap.from('.contact-card', {
  scrollTrigger: { trigger: '.contact-cards', start: 'top 80%', once: true },
  opacity: 0, y: 22, duration: 0.5, ease: 'power3.out', stagger: 0.1
});

gsap.from('.contact-wrap > *:not(.contact-cards)', {
  scrollTrigger: { trigger: '.contact-wrap', start: 'top 80%', once: true },
  opacity: 0, y: 24, duration: 0.55, ease: 'power3.out', stagger: 0.1
});

/* ============================================================
   SMOOTH ANCHOR SCROLL — offset for fixed navbar
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH   = navbar.offsetHeight;
    const top    = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   ACTIVE NAV LINK highlight on scroll
   ============================================================ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"], .mobile-link[href^="#"]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          const active = l.getAttribute('href') === `#${id}`;
          l.style.color = active ? 'var(--blue)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  const dot  = document.getElementById('cDot');
  const ring = document.getElementById('cRing');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  (function loop() {
    // Dot snaps immediately
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    // Ring lags behind with lerp
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  })();

  // Expand ring over interactive elements
  const interactiveSelector = 'a, button, .project-card, .tl-card, .skill-card, .contact-card, .edu-card, .pub-card, .filter-tab';
  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
})();

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
(function initProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
})();

/* ============================================================
   3D TILT on project cards
   ============================================================ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r    = card.getBoundingClientRect();
    const x    = e.clientX - r.left;
    const y    = e.clientY - r.top;
    const rotX = ((y - r.height / 2) / (r.height / 2)) * -7;
    const rotY = ((x - r.width  / 2) / (r.width  / 2)) *  7;

    card.style.transition = 'border-color 0.3s, box-shadow 0.3s';
    card.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;

    // Spotlight glow follows mouse
    card.style.setProperty('--mx', `${(x / r.width)  * 100}%`);
    card.style.setProperty('--my', `${(y / r.height) * 100}%`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s';
    card.style.transform  = '';
  });
});

/* ============================================================
   PROJECT FILTER TABS
   ============================================================ */
(function initFilters() {
  const tabs  = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.project-card[data-category]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        gsap.to(card, {
          opacity:  match ? 1    : 0.15,
          scale:    match ? 1    : 0.96,
          duration: 0.3,
          ease:     'power2.out',
        });
      });
    });
  });
})();

/* ============================================================
   PROJECT CARDS SCROLL REVEAL
   ============================================================ */
gsap.from('.featured-card', {
  scrollTrigger: { trigger: '.featured-card', start: 'top 82%', once: true },
  opacity: 0, y: 36, duration: 0.75, ease: 'power3.out',
});

gsap.from('.filter-tabs', {
  scrollTrigger: { trigger: '.filter-tabs', start: 'top 88%', once: true },
  opacity: 0, y: 18, duration: 0.45, ease: 'power3.out',
});

document.querySelectorAll('.project-card').forEach((el, i) => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    opacity: 0, y: 30, duration: 0.55, ease: 'power3.out',
    delay: (i % 3) * 0.1,
  });
});

/* ============================================================
   TERMINAL EASTER EGG
   ============================================================ */
(function initTerminal() {
  const overlay  = document.getElementById('terminal-overlay');
  const body     = document.getElementById('termBody');
  const input    = document.getElementById('termInput');
  const closeBtn = document.getElementById('termClose');
  let history    = [];
  let histIdx    = -1;
  let printing   = false;

  const BOOT = [
    { t: 'dim', v: '  ██╗ ██╗' },
    { t: 'dim', v: '     ██╔╝' },
    { t: 'dim', v: '    ██╔╝ ' },
    { t: 'dim', v: '   ██╔╝  ' },
    { t: 'dim', v: '  ██╔╝   Jowin Jestine — Data Engineer III' },
    { t: 'dim', v: '  ╚═╝    Type "help" for available commands.' },
    { t: 'blank', v: '' },
  ];

  const CMDS = {
    help() {
      return [
        { t: 'out', v: 'Available commands:' },
        { t: 'out', v: '  whoami              — profile overview' },
        { t: 'out', v: '  git log --oneline   — recent commit history' },
        { t: 'out', v: '  SELECT * FROM experience;  — work history' },
        { t: 'out', v: '  SELECT * FROM skills ORDER BY proficiency DESC LIMIT 10;' },
        { t: 'out', v: '  docker ps           — running services' },
        { t: 'out', v: '  python -c "import jowin; jowin.describe()"' },
        { t: 'out', v: '  ping olaris.io      — platform health check' },
        { t: 'out', v: '  cat resume.json     — full resume as JSON' },
        { t: 'out', v: '  open resume         — download resume PDF' },
        { t: 'out', v: '  ls ./projects       — all projects' },
        { t: 'out', v: '  nmr --scan          — NMR spectral analysis' },
        { t: 'out', v: '  ps aux              — running processes' },
        { t: 'out', v: '  matrix              — ?' },
        { t: 'out', v: '  fun --facts         — things you didn\'t know about me' },
        { t: 'out', v: '  jowin.vibe()        — current state of mind' },
        { t: 'out', v: '  f1                  — race weekend mode' },
        { t: 'out', v: '  clear               — clear terminal' },
        { t: 'out', v: '  exit                — close terminal' },
        { t: 'blank', v: '' },
      ];
    },
    whoami() {
      return [
        { t: 'out', v: '{' },
        { t: 'out', v: '  "name":           "Jowin Jestine",' },
        { t: 'out', v: '  "title":          "Data Engineer III",' },
        { t: 'out', v: '  "company":        "Olaris, Inc. (Biotech · Clinical Diagnostics)",' },
        { t: 'out', v: '  "origin":         "Mumbai, India 🇮🇳  →  Boston, MA 🇺🇸",' },
        { t: 'out', v: '  "location":       "Boston, MA",' },
        { t: 'out', v: '  "specialization": ["Metabolomics Pipelines", "NMR/MS Data Engineering", "HIPAA-Compliant Cloud Systems"],' },
        { t: 'out', v: '  "education":      ["MS Business Analytics — UConn", "BE Computer Engineering — Mumbai"],' },
        { t: 'out', v: '  "published":      "iScience, Cell Press 2025 (kidney transplant metabolomics)",' },
        { t: 'out', v: '  "interests":      "high-scale data engineering — payments, trading infra, distributed systems",' },
        { t: 'out', v: '  "email":          "jowinjestine@gmail.com",' },
        { t: 'out', v: '  "fun":            "run fun --facts for the real story"' },
        { t: 'out', v: '}' },
        { t: 'blank', v: '' },
      ];
    },
    'git log --oneline'() {
      return [
        { t: 'out', v: 'a3f91c2 feat: migrate 1,200+ clinical records to ADLS Gen2 with RBAC' },
        { t: 'out', v: 'b82e4d1 perf: reduce query latency 75% via indexed views + connection pooling' },
        { t: 'out', v: 'c19f3a8 feat: semantic search across 100K+ metabolites (embedding-based)' },
        { t: 'out', v: 'd540b2e feat: deep learning NMR signal quality classifier — 35% accuracy gain' },
        { t: 'out', v: 'e7a1093 infra: HIPAA-compliant Azure Functions pipeline with audit logging' },
        { t: 'out', v: 'f22d8b4 feat: real-time NMR monitoring + MS Teams alerting (200+ params)' },
        { t: 'out', v: 'g98c5f1 ml: TensorFlow NLP incident router — 30% → 87% accuracy' },
        { t: 'out', v: 'h1b3e92 data: Boehringer Ingelheim data lake migration (13 initiatives)' },
        { t: 'blank', v: '' },
      ];
    },
    'select * from experience;'() {
      return [
        { t: 'out', v: '┌──────────────────────────────┬──────────────────────┬───────────────┬──────────────┐' },
        { t: 'out', v: '│ Company                      │ Role                 │ Period        │ Location     │' },
        { t: 'out', v: '├──────────────────────────────┼──────────────────────┼───────────────┼──────────────┤' },
        { t: 'out', v: '│ Olaris, Inc.                 │ Data Engineer III    │ 2025–Present  │ Boston, MA   │' },
        { t: 'out', v: '│ Olaris, Inc.                 │ Data Engineer I      │ 2023–2024     │ Boston, MA   │' },
        { t: 'out', v: '│ Boehringer Ingelheim         │ Data Engineering Co-op│ 2022–2023    │ Ridgefield   │' },
        { t: 'out', v: '│ University of Connecticut    │ Graduate RA          │ 2022–2023     │ Storrs, CT   │' },
        { t: 'out', v: '│ Cigna                        │ Data Science Intern  │ 2022          │ Bloomfield   │' },
        { t: 'out', v: '└──────────────────────────────┴──────────────────────┴───────────────┴──────────────┘' },
        { t: 'out', v: '5 rows returned.' },
        { t: 'blank', v: '' },
      ];
    },
    'select * from skills order by proficiency desc limit 10;'() {
      return [
        { t: 'out', v: '┌────────────────────────┬─────────────┬──────────────────────────┐' },
        { t: 'out', v: '│ Skill                  │ Proficiency │ Category                 │' },
        { t: 'out', v: '├────────────────────────┼─────────────┼──────────────────────────┤' },
        { t: 'out', v: '│ Python                 │ ★★★★★       │ Programming              │' },
        { t: 'out', v: '│ SQL / PostgreSQL        │ ★★★★★       │ Data Engineering         │' },
        { t: 'out', v: '│ Azure (ADLS, Functions) │ ★★★★☆       │ Cloud                    │' },
        { t: 'out', v: '│ FastAPI                 │ ★★★★☆       │ Programming              │' },
        { t: 'out', v: '│ NMR / Metabolomics     │ ★★★★★       │ Scientific Domain        │' },
        { t: 'out', v: '│ dbt / SQLMesh          │ ★★★★☆       │ Data Engineering         │' },
        { t: 'out', v: '│ Docker / Kubernetes    │ ★★★★☆       │ DevOps                   │' },
        { t: 'out', v: '│ XGBoost / scikit-learn │ ★★★★☆       │ Machine Learning         │' },
        { t: 'out', v: '│ HIPAA / CLIA Compliance│ ★★★★★       │ Regulatory               │' },
        { t: 'out', v: '│ Mage AI / Airflow      │ ★★★☆☆       │ Orchestration            │' },
        { t: 'out', v: '└────────────────────────┴─────────────┴──────────────────────────┘' },
        { t: 'out', v: '10 rows returned.' },
        { t: 'blank', v: '' },
      ];
    },
    'docker ps'() {
      return [
        { t: 'out', v: 'CONTAINER ID   IMAGE                    STATUS          PORTS      NAMES' },
        { t: 'out', v: 'a8f21c3d9e1b   olaris/clinical-api      Up 47 days      :8000      olaris-api' },
        { t: 'out', v: 'b3c10f8a2d4e   olaris/nmr-pipeline      Up 47 days      —          nmr-pipeline' },
        { t: 'out', v: 'c91b4e7f5a2d   olaris/metabolite-search Up 31 days      :8001      metabolite-search' },
        { t: 'out', v: 'd7e2a3b8c1f4   postgres:15-alpine        Up 47 days      :5432      clinical-db' },
        { t: 'blank', v: '' },
      ];
    },
    'python -c "import jowin; jowin.describe()"'() {
      return [
        { t: 'out', v: ">>> import jowin" },
        { t: 'out', v: ">>> jowin.describe()" },
        { t: 'out', v: "<DataEngineer" },
        { t: 'out', v: "  name        = 'Jowin Jestine'" },
        { t: 'out', v: "  speciality  = 'metabolomics & clinical data'" },
        { t: 'out', v: "  certs       = ['HIPAA', 'CLIA', 'Azure']" },
        { t: 'out', v: "  pipelines   = 3   # running in production" },
        { t: 'out', v: "  uptime      = 99.97" },
        { t: 'out', v: "  latency_ms  = 0.31" },
        { t: 'out', v: ">" },
        { t: 'blank', v: '' },
      ];
    },
    'ping olaris.io'() {
      return [
        { t: 'out', v: 'PING olaris.io: 56 data bytes' },
        { t: 'out', v: '64 bytes from olaris.io: CLIA-compliant API ONLINE  icmp_seq=0  latency=0.31ms' },
        { t: 'out', v: '64 bytes from olaris.io: CLIA-compliant API ONLINE  icmp_seq=1  latency=0.28ms' },
        { t: 'out', v: '64 bytes from olaris.io: CLIA-compliant API ONLINE  icmp_seq=2  latency=0.33ms' },
        { t: 'out', v: '64 bytes from olaris.io: CLIA-compliant API ONLINE  icmp_seq=3  latency=0.29ms' },
        { t: 'out', v: '--- olaris.io ping statistics ---' },
        { t: 'out', v: '4 packets transmitted, 4 received, 0% packet loss' },
        { t: 'blank', v: '' },
      ];
    },
    'cat resume.json'() {
      return [
        { t: 'out', v: '{' },
        { t: 'out', v: '  "name": "Jowin Jestine",' },
        { t: 'out', v: '  "current_role": "Data Engineer III @ Olaris, Inc.",' },
        { t: 'out', v: '  "education": [' },
        { t: 'out', v: '    { "degree": "MS Business Analytics", "school": "UConn", "year": 2023 },' },
        { t: 'out', v: '    { "degree": "BE Computer Engineering", "school": "U. Mumbai", "year": 2021 }' },
        { t: 'out', v: '  ],' },
        { t: 'out', v: '  "core_skills": ["Python","SQL","Azure","FastAPI","PostgreSQL","dbt","Docker","NMR"],' },
        { t: 'out', v: '  "highlights": [' },
        { t: 'out', v: '    "HIPAA-compliant clinical data platform — 1,200+ records, <0.5s response",' },
        { t: 'out', v: '    "Semantic metabolite search — 100K+ compounds, 70% faster retrieval",' },
        { t: 'out', v: '    "NMR deep learning QC model — 35% accuracy gain, 72% review reduction",' },
        { t: 'out', v: '    "NLP incident router — 30% → 87% accuracy at Cigna"' },
        { t: 'out', v: '  ],' },
        { t: 'out', v: '  "open_to": ["Fintech", "Big Tech", "Quant Research", "ML Engineering"]' },
        { t: 'out', v: '}' },
        { t: 'blank', v: '' },
      ];
    },
    'ls ./projects'() {
      return [
        { t: 'out', v: 'clinical-data-platform/    — HIPAA Azure platform, 1200+ clinical records' },
        { t: 'out', v: 'ai-metabolite-search/      — Semantic search, 100K+ metabolites, 70% faster' },
        { t: 'out', v: 'nmr-signal-quality/        — Deep learning QC model, 35% accuracy gain' },
        { t: 'out', v: 'live-nmr-monitoring/       — Real-time 200+ param monitoring + alerting' },
        { t: 'out', v: 'it-incident-router/        — NLP TensorFlow, 30%→87% accuracy (Cigna)' },
        { t: 'out', v: 'biotech-data-migration/    — Cloudera lake migration, 13 BI initiatives' },
        { t: 'out', v: 'research-dashboard/        — 400K+ student records, R Shiny + Tableau' },
        { t: 'blank', v: '' },
      ];
    },
    'nmr --scan'() {
      return [
        { t: 'out', v: 'Initializing NMR spectral analysis...' },
        { t: 'out', v: 'Loading metabolite reference library... [████████████] 100%' },
        { t: 'out', v: '' },
        { t: 'out', v: '  Chemical Shift (ppm)' },
        { t: 'out', v: '  9.0    8.0    7.0    6.0    5.0    4.0    3.0    2.0    1.0    0' },
        { t: 'out', v: '  │      │      │      │      │      │      │      │      │      │' },
        { t: 'out', v: '  │      │      │      │      │    ▂▃│     ▄█▅    │  ▃▅▇ │▂▄    │' },
        { t: 'out', v: '  │    ▃▄│      │  ▂   │      │   ▇██│  ▂ ███▇   │ ▂███ │▇█▃   │' },
        { t: 'out', v: '  │   ▅███      │ ▃▄   │      │  █████│ ▇▇████   │ ████ │███▄  │' },
        { t: 'out', v: '  ───────────────────────────────────────────────────────────────' },
        { t: 'out', v: '         Formate  Tyr         Lactate  Glucose Cit  Ala  Val/Leu' },
        { t: 'out', v: '         8.46     6.89        4.11     3.41   2.67 1.47  0.91' },
        { t: 'out', v: '' },
        { t: 'out', v: '  12 peaks detected. Dominant: Glucose (δ3.41), Alanine (δ1.47)' },
        { t: 'out', v: '  Sample classification: URINE · Kidney Transplant Study · HIGH CONFIDENCE' },
        { t: 'blank', v: '' },
      ];
    },
    'ps aux'() {
      return [
        { t: 'out', v: 'USER       PID  %CPU  %MEM  COMMAND' },
        { t: 'out', v: 'jowin     1042   2.1   1.8  python nmr_pipeline.py --watch --output adls' },
        { t: 'out', v: 'jowin     1108   1.4   0.9  uvicorn fastapi_app:app --host 0.0.0.0 --port 8000' },
        { t: 'out', v: 'postgres  1201   0.8   3.2  postgres: clinical_db (1,247,381 rows)' },
        { t: 'out', v: 'jowin     1330   0.3   0.6  dbt run --select clinical_reporting --profiles-dir .' },
        { t: 'out', v: 'jowin     1401   0.2   0.4  python metabolite_search_server.py --port 8001' },
        { t: 'blank', v: '' },
      ];
    },
    'open resume'() {
      setTimeout(() => window.open('Jowin%20Jestine%20-%20Resume.pdf', '_blank'), 600);
      return [
        { t: 'out', v: 'Opening Jowin Jestine - Resume.pdf...' },
        { t: 'dim', v: '✓ Download initiated — check your downloads folder' },
        { t: 'blank', v: '' },
      ];
    },
    'fun --facts'() {
      return [
        { t: 'out', v: 'fun_facts.json → Jowin Jestine' },
        { t: 'blank', v: '' },
        { t: 'out', v: '  [0] Grew up in Mumbai 🇮🇳 pulling PCs apart before writing a single line of code' },
        { t: 'out', v: '  [1] Grade 5 pianist — plays everything from classical to whatever the mood calls for 🎹' },
        { t: 'out', v: '  [2] Has watched every F1 season. WCC standings permanently memorised 🏎️' },
        { t: 'out', v: '  [3] CS2 grinder — rifler main, refuses to eco-drop' },
        { t: 'out', v: '  [4] Built multiple custom PCs from scratch. PCPartPicker is a hobby.' },
        { t: 'out', v: '  [5] Travelled across Northeast, SF, Yosemite, Seattle, Puerto Rico, UK, France, Italy, Dubai' },
        { t: 'out', v: '  [6] Published in Cell Press (iScience) before 30. Biomarker classifier beat serum creatinine.' },
        { t: 'out', v: '  [7] Enjoys high-scale engineering problems — payments, trading infra, distributed systems' },
        { t: 'blank', v: '' },
      ];
    },
    'jowin.vibe()'() {
      return [
        { t: 'out', v: ">>> jowin.vibe()" },
        { t: 'out', v: '{' },
        { t: 'out', v: "  mood:        'shipping things that scale'," },
        { t: 'out', v: "  currently:   'deep in an Azure Functions refactor'," },
        { t: 'out', v: "  music:       'anything — grade 5 pianist so the bar is high'," },
        { t: 'out', v: "  after_work:  'CS2 ranked grind or F1 highlight reel'," },
        { t: 'out', v: "  current_tab: 'PCPartPicker + RL paper + Azure docs (two monitors)'," },
        { t: 'out', v: "  next_drive:  'somewhere with a good road and zero traffic'," },
        { t: 'out', v: "  drawn_to:    'high-scale systems — payments, trading infra, distributed data'" },
        { t: 'out', v: '}' },
        { t: 'blank', v: '' },
      ];
    },
    'f1'() {
      return [
        { t: 'out', v: '$ cat ~/interests/f1.log' },
        { t: 'blank', v: '' },
        { t: 'out', v: 'Formula 1 — season tracker' },
        { t: 'out', v: '  Status:     Race weekend mode 🏎️' },
        { t: 'out', v: '  Stance:     Data tells the story, strategy wins the race' },
        { t: 'out', v: '  Opinion:    DRS is a necessary evil. Tyre deg makes it interesting.' },
        { t: 'out', v: '  Hot take:   The data behind F1 telemetry is genuinely world-class engineering.' },
        { t: 'blank', v: '' },
      ];
    },
    matrix() { return null; }, // handled specially
    clear()   { return 'CLEAR'; },
    exit()    { return 'EXIT'; },
  };

  function openTerminal() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    printLines(BOOT, () => input.focus());
  }

  function closeTerminal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    input.blur();
  }

  function printLines(lines, cb) {
    printing = true;
    let i = 0;
    function next() {
      if (i >= lines.length) { printing = false; if (cb) cb(); return; }
      const l = lines[i++];
      const p = document.createElement('p');
      p.className = 'term-line ' + l.t;
      p.textContent = l.v;
      body.appendChild(p);
      body.scrollTop = body.scrollHeight;
      setTimeout(next, l.t === 'blank' ? 2 : 18);
    }
    next();
  }

  function runMatrix() {
    const mc = document.createElement('canvas');
    mc.style.cssText = 'position:absolute;inset:0;z-index:10;pointer-events:none;';
    overlay.appendChild(mc);
    const mctx = mc.getContext('2d');
    mc.width  = window.innerWidth;
    mc.height = window.innerHeight;
    const cols = Math.floor(mc.width / 14);
    const drops = Array(cols).fill(1);
    const metabolites = ['Glucose','Citrate','Alanine','Lactate','Glycine','Formate','Creatinine','Tyrosine','Glutamine','Valine','Leucine','Isoleucine','Pyruvate','Succinate','Fumarate'];
    let frame = 0;
    const iv = setInterval(() => {
      mctx.fillStyle = 'rgba(2,5,9,0.08)';
      mctx.fillRect(0, 0, mc.width, mc.height);
      mctx.font = '12px "JetBrains Mono", monospace';
      drops.forEach((y, i) => {
        const word = metabolites[Math.floor(Math.random() * metabolites.length)];
        const char = word[Math.floor(Math.random() * word.length)];
        mctx.fillStyle = frame < 60 ? '#22c55e' : '#38bdf8';
        mctx.fillText(char, i * 14, y * 14);
        if (y * 14 > mc.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      frame++;
      if (frame > 180) {
        clearInterval(iv);
        mc.remove();
        printLines([{ t: 'out', v: 'Matrix rain complete. Welcome back.' }, { t: 'blank', v: '' }]);
      }
    }, 33);
  }

  function execCmd(raw) {
    const trimmed = raw.trim();
    const key     = trimmed.toLowerCase();

    // Echo the command
    const p = document.createElement('p');
    p.className = 'term-line cmd';
    p.textContent = 'jowin@portfolio:~$ ' + trimmed;
    body.appendChild(p);

    if (!trimmed) return;
    history.unshift(trimmed);
    histIdx = -1;

    if (key === 'exit')   { setTimeout(closeTerminal, 200); return; }
    if (key === 'clear')  { body.innerHTML = ''; return; }
    if (key === 'matrix') { runMatrix(); return; }

    const fn = CMDS[key] || CMDS[trimmed.toLowerCase()];
    if (fn) {
      printLines(fn());
    } else {
      printLines([
        { t: 'err', v: `command not found: ${trimmed}` },
        { t: 'dim', v: 'Type "help" for available commands.' },
        { t: 'blank', v: '' },
      ]);
    }
  }

  // Key listeners
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !overlay.classList.contains('open') &&
        !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openTerminal();
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeTerminal();
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value;
      input.value = '';
      execCmd(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      else { histIdx = -1; input.value = ''; }
    }
  });

  closeBtn.addEventListener('click', closeTerminal);
  overlay.addEventListener('click', e => { if (e.target === overlay) input.focus(); });
})();

/* ============================================================
   ARCHITECTURE CANVAS
   ============================================================ */
(function initArchCanvas() {
  const canvas = document.getElementById('archCanvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const panel  = document.getElementById('archPanel');
  const panelBody = document.getElementById('archPanelBody');
  const closePanel = document.getElementById('archPanelClose');

  // Real Olaris HIPAA order-intake workflow (from Journal Club)
  const NODES = [
    { id: 'lifepoint', label: '🏥 Lifepoint', sub: 'Lab Partner', col: 0, row: 0,
      info: { title: 'Lifepoint Health (Lab Partner)', why: 'Lifepoint Health is a clinical reference lab that sends patient requisition orders to Olaris. Integration uses HTTPS with OAuth 2.0 client credentials, managed through Azure APIM for secure authentication and rate limiting.', code: 'POST /api/v1/requisitions\nAuthorization: Bearer {oauth2_token}\nContent-Type: application/json', metric: 'HIPAA-compliant data exchange with external partner' }},
    { id: 'apim', label: '🔐 Azure APIM', sub: 'API Gateway', col: 1, row: 0,
      info: { title: 'Azure API Management', why: 'APIM acts as the secure entry point for all external lab partner calls. Enforces OAuth 2.0, rate limiting, and IP whitelisting. Provides OpenAPI spec, request validation, and HIPAA-compliant audit logging of all inbound and outbound traffic.', code: '<inbound>\n  <validate-jwt header-name="Authorization"\n    require-expiration-time="true"/>\n  <rate-limit calls="100"\n    renewal-period="60"/>\n</inbound>', metric: 'Zero unauthorized requests since deployment' }},
    { id: 'func', label: '⚡ Azure Functions', sub: 'Serverless Hub', col: 2, row: 0,
      info: { title: 'Azure Functions (Serverless Orchestrator)', why: 'HTTP-triggered Azure Function is the central orchestration hub. It validates incoming requisitions, routes to the right services, writes to Postgres and Blob Storage, and triggers Power Automate for approvals. Scales to zero — no idle cost, ~$15K/yr saved vs dedicated VMs.', code: '@app.route(route="requisition")\ndef process_req(req: func.HttpRequest):\n    data = validate_payload(req.get_json())\n    db.insert(data)\n    blob.upload(data["raw"])\n    automate.trigger(data)', metric: '<0.5s end-to-end processing time' }},
    { id: 'keyvault', label: '🔑 Key Vault', sub: 'Secrets & Keys', col: 2, row: 1,
      info: { title: 'Azure Key Vault', why: 'All secrets — DB credentials, API keys, encryption keys — are managed in Key Vault. Azure Functions use Managed Identity so there are zero hard-coded credentials in code or config. Secrets are rotated automatically. Required for HIPAA key management compliance.', code: 'from azure.keyvault.secrets import SecretClient\nfrom azure.identity import ManagedIdentityCredential\n\ncred = ManagedIdentityCredential()\nclient = SecretClient(vault_url, cred)\ndb_pass = client.get_secret("pg-password")', metric: 'Zero hard-coded secrets in entire codebase' }},
    { id: 'postgres', label: '🐘 PostgreSQL', sub: 'HIPAA Database', col: 3, row: 0,
      info: { title: 'PostgreSQL (HIPAA-Compliant)', why: 'Central clinical database with row-level security, RBAC, geo-fencing, and pgAudit for full audit logging. Field-level encryption for PHI. asyncpg for async queries. Hosted on Azure Database for PostgreSQL Flexible Server with Customer-Managed Key encryption.', code: 'CREATE POLICY patient_isolation\n  ON requisitions\n  USING (org_id = current_setting(\n    \'app.current_org\')::uuid);\n-- pgAudit logs all DDL + DML', metric: '1,200+ clinical records · <0.5s p99 query' }},
    { id: 'blob', label: '📦 Blob Storage', sub: 'HIPAA Files', col: 3, row: 1,
      info: { title: 'Azure Blob Storage (HIPAA)', why: 'Raw instrument files (NMR .fid, LC-MS .wiff) and generated clinical reports are stored with immutable storage policies. Encryption at rest with Customer-Managed Keys (CMK). Geo-redundant replication for HIPAA Business Associate Agreement compliance.', code: 'client.upload_blob(\n  data=raw_file,\n  overwrite=False,\n  metadata={\n    "patient_id": pid,\n    "study_id": sid,\n    "instrument": "nmr"\n  })', metric: 'Immutable · CMK encrypted · 99.999% durability' }},
    { id: 'reqapp', label: '📋 Patient Req App', sub: 'Order Intake', col: 4, row: 0,
      info: { title: 'Patient Requisition App', why: 'Internal web application used by Olaris clinical staff to manage incoming patient orders from lab partners. Displays requisition status, enables manual approvals, and surfaces audit history. Backed by the FastAPI service with real-time polling.', code: '// Real-time requisition status\nconst { data } = useSWR(\n  `/api/requisitions/${id}`,\n  fetcher,\n  { refreshInterval: 5000 }\n);', metric: 'Used daily by Olaris clinical operations team' }},
    { id: 'automate', label: '🔄 Power Automate', sub: 'Approvals & Notify', col: 5, row: 0,
      info: { title: 'Power Automate (Approval Workflow)', why: 'Orchestrates the clinical approval loop: when a requisition arrives, it triggers an email-based approval to the Olaris medical director, sends status notifications back to lab partners via APIM callback, and logs all outcomes. No-code flow keeps clinical staff in control of approval logic.', code: '// HTTP action payload to Power Automate\n{\n  "requisition_id": "REQ-2024-0891",\n  "approval_needed": true,\n  "callback_url":\n    "https://apim.azure.../callback"\n}', metric: 'Automated approvals · partner notifications via APIM' }},
  ];

  const EDGES = [
    ['lifepoint', 'apim'],
    ['apim', 'func'],
    ['func', 'keyvault'],
    ['func', 'postgres'],
    ['func', 'blob'],
    ['func', 'reqapp'],
    ['reqapp', 'automate'],
  ];

  let W, H;
  const particles = [];
  // Per-node NH overrides — populated by pretext once module is ready
  const nodeSizes = {};
  let hoveredId = null;
  let selectedId = null;
  // Tooltip text cache: nodeId -> string[]
  const tooltipCache = {};

  function getTooltipLines(n) {
    if (tooltipCache[n.id]) return tooltipCache[n.id];
    const shortDesc = n.info.why.split('. ')[0] + '.';
    tooltipCache[n.id] = [shortDesc]; // fallback: single unwrapped line
    if (window.__pretext) {
      try {
        const { prepare, layoutWithLines } = window.__pretext;
        const prep = prepare(shortDesc, '10px "Inter", sans-serif');
        const { lines } = layoutWithLines(prep, 176, 15);
        if (lines && lines.length) tooltipCache[n.id] = lines.map(l => l.text);
      } catch (_) {}
    }
    return tooltipCache[n.id];
  }

  function resize() {
    const dpr      = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth <= 640;
    W = canvas.offsetWidth;
    H = isMobile ? 520 : 420;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const MOBILE_LAYOUT = {
    lifepoint: { mc: 0, mr: 0 },
    apim:      { mc: 1, mr: 0 },
    func:      { mc: 0, mr: 1 },
    keyvault:  { mc: 1, mr: 1 },
    postgres:  { mc: 0, mr: 2 },
    blob:      { mc: 1, mr: 2 },
    reqapp:    { mc: 0, mr: 3 },
    automate:  { mc: 1, mr: 3 },
  };

  function nodePos(n) {
    if (window.innerWidth <= 640) {
      const m    = MOBILE_LAYOUT[n.id] || { mc: 0, mr: 0 };
      const colW = W / 2.4;
      const rowH = H / 4.8;
      return {
        x: colW * (m.mc + 0.7),
        y: H * 0.08 + m.mr * rowH,
      };
    }
    const cols = 6;
    const colW = W / (cols + 0.5);
    const rowH = H / 3;
    return {
      x: colW * (n.col + 0.75),
      y: H * 0.28 + n.row * rowH,
    };
  }

  function spawnParticle(fromId, toId) {
    const a = NODES.find(n => n.id === fromId);
    const b = NODES.find(n => n.id === toId);
    if (!a || !b) return;
    const pa = nodePos(a), pb = nodePos(b);
    particles.push({ x: pa.x, y: pa.y, tx: pb.x, ty: pb.y, t: 0, color: '#38bdf8' });
  }

  // Spawn particles periodically
  let edgeIdx = 0;
  setInterval(() => {
    if (!document.getElementById('architecture')) return;
    const e = EDGES[edgeIdx % EDGES.length];
    spawnParticle(e[0], e[1]);
    edgeIdx++;
  }, 400);

  function drawRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw edges
    EDGES.forEach(([aid, bid]) => {
      const a  = NODES.find(n => n.id === aid);
      const b  = NODES.find(n => n.id === bid);
      const pa = nodePos(a), pb = nodePos(b);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56,189,248,0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += 0.02;
      p.x = p.x + (p.tx - p.x) * 0.02;
      p.y = p.y + (p.ty - p.y) * 0.02;
      if (p.t > 1.2) { particles.splice(i, 1); continue; }
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
      grd.addColorStop(0, '#38bdf8cc');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Draw nodes
    NODES.forEach(n => {
      const { x, y } = nodePos(n);
      const isHovered  = hoveredId === n.id;
      const isSelected = selectedId === n.id;
      const isMob = window.innerWidth <= 640;
      const NW = isMob ? 105 : 130;
      const NH = isMob ? 38 : (nodeSizes[n.id] ?? 44);

      // Glow
      if (isHovered || isSelected) {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 70);
        grd.addColorStop(0, 'rgba(56,189,248,0.12)');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, 70, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Box
      drawRoundRect(x - NW/2, y - NH/2, NW, NH, 8);
      ctx.fillStyle = isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = isHovered || isSelected ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.stroke();

      // Label
      ctx.font = `500 11px "Inter", sans-serif`;
      ctx.fillStyle = isHovered || isSelected ? '#f1f5f9' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, x, y - 3);

      // Sub-label
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected ? '#38bdf8' : '#64748b';
      ctx.fillText(n.sub, x, y + 11);
    });

    // Canvas glassmorphism tooltip on hover (powered by pretext layoutWithLines)
    if (hoveredId && !selectedId) {
      const n = NODES.find(x => x.id === hoveredId);
      if (n) {
        const { x, y } = nodePos(n);
        const TW = 202, PAD = 12;
        const wrappedLines = getTooltipLines(n);
        const TH = PAD + 16 + wrappedLines.length * 15 + PAD;
        let tx = x + 74, ty = y - TH / 2;
        if (tx + TW > W - 4) tx = x - TW - 74;
        if (ty < 4) ty = 4;
        if (ty + TH > H - 4) ty = H - TH - 4;

        // Glass box
        ctx.save();
        drawRoundRect(tx, ty, TW, TH, 10);
        ctx.fillStyle = 'rgba(5,10,28,0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,0.38)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Cyan top accent bar
        ctx.beginPath();
        ctx.moveTo(tx + 10, ty + 1.5);
        ctx.lineTo(tx + TW - 10, ty + 1.5);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Title line
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const titleShort = n.info.title.replace(/\s*\([^)]*\)$/, '');
        ctx.fillText(titleShort, tx + PAD, ty + PAD);

        // Body: pretext-wrapped description lines
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        wrappedLines.forEach((line, i) => {
          ctx.fillText(line, tx + PAD, ty + PAD + 17 + i * 15);
        });
        ctx.textBaseline = 'alphabetic';
      }
    }

    requestAnimationFrame(draw);
  }

  function getHitNode(mx, my) {
    const isMob = window.innerWidth <= 640;
    const hw = isMob ? 54 : 68, hh = isMob ? 21 : 26;
    return NODES.find(n => {
      const { x, y } = nodePos(n);
      return Math.abs(mx - x) < hw && Math.abs(my - y) < hh;
    });
  }

  function showPanel(n) {
    selectedId = n.id;
    const d = n.info;
    panelBody.innerHTML = `
      <h4>${d.title}</h4>
      <p class="arch-why">${d.why}</p>
      <pre class="arch-code">${d.code}</pre>
      <div class="arch-metric">⚡ ${d.metric}</div>`;
    panel.classList.add('open');
  }

  canvas.addEventListener('mousemove', e => {
    const r  = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const n  = getHitNode(mx, my);
    hoveredId = n ? n.id : null;
    canvas.style.cursor = n ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', e => {
    const r  = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const n  = getHitNode(mx, my);
    if (n) showPanel(n);
  });

  closePanel.addEventListener('click', () => {
    panel.classList.remove('open');
    selectedId = null;
  });

  // Touch support
  canvas.addEventListener('touchend', e => {
    const r  = canvas.getBoundingClientRect();
    const t  = e.changedTouches[0];
    const mx = t.clientX - r.left;
    const my = t.clientY - r.top;
    const n  = getHitNode(mx, my);
    if (n) showPanel(n);
  });

  resize();
  draw();
  window.addEventListener('resize', resize);

  // Measure node sub-labels with pretext — expands NH if label wraps
  withPretext(({ prepare, layout }) => {
    NODES.forEach(n => {
      const innerW = 130 - 18; // NW - horizontal padding
      const { lineCount } = layout(prepare(n.sub, '9px "JetBrains Mono", monospace'), innerW, 12);
      nodeSizes[n.id] = lineCount > 1 ? 58 : 44;
    });
  });

  // Scroll reveal
  gsap.from('.arch-wrap', {
    scrollTrigger: { trigger: '.arch-wrap', start: 'top 82%', once: true },
    opacity: 0, y: 32, duration: 0.75, ease: 'power3.out',
  });
})();

/* ============================================================
   SKILLS RADAR CHART
   ============================================================ */
(function initSkillsRadar() {
  const canvas  = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const dpr     = window.devicePixelRatio || 1;
  const LOGICAL = 500;
  canvas.width  = LOGICAL * dpr;
  canvas.height = LOGICAL * dpr;
  canvas.style.width  = LOGICAL + 'px';
  canvas.style.height = LOGICAL + 'px';
  ctx.scale(dpr, dpr);
  const legend  = document.getElementById('radarLegend');
  const tooltip = document.getElementById('radarTooltip');

  const AXES = [
    { label: 'Data Engineering', score: 9.2, color: '#38bdf8',
      skills: ['PostgreSQL', 'SQLMesh', 'Mage AI', 'Azure Functions', 'ADLS Gen2', 'Docker'] },
    { label: 'Machine Learning', score: 8.0, color: '#a855f7',
      skills: ['XGBoost', 'Deep Learning', 'NLP', 'Semantic Search', 'FAISS', 'TensorFlow'] },
    { label: 'Cloud & Azure', score: 8.5, color: '#06b6d4',
      skills: ['Azure APIM', 'Key Vault', 'Blob Storage', 'ADLS Gen2', 'Managed Identity', 'Cloudera'] },
    { label: 'Scientific Domain', score: 9.5, color: '#f59e0b',
      skills: ['NMR Metabolomics', 'Mass Spectrometry', 'CLIA Compliance', 'HIPAA', 'GxP Automation'] },
    { label: 'Programming', score: 9.0, color: '#22c55e',
      skills: ['Python', 'SQL', 'R', 'FastAPI', 'PyTorch', 'scikit-learn', 'Pandas'] },
    { label: 'Analytics & Viz', score: 7.5, color: '#f472b6',
      skills: ['Tableau', 'R Shiny', 'Power BI', 'Apache Superset', 'Plotly'] },
  ];

  const N = AXES.length;
  const MAX_SCORE = 10;
  let animProg  = 0;
  let started   = false;
  let hoveredAxis = null;

  // Build legend items
  if (legend) {
    AXES.forEach((ax) => {
      const item = document.createElement('div');
      item.className = 'radar-legend-item';
      item.innerHTML = `<span class="radar-legend-dot" style="background:${ax.color}"></span>${ax.label} <span style="color:${ax.color};margin-left:4px;font-size:11px">${ax.score}/10</span>`;
      legend.appendChild(item);
    });
  }

  function getAngle(i) {
    return (Math.PI * 2 * i / N) - Math.PI / 2; // top-start
  }

  function draw() {
    const W = LOGICAL, H = LOGICAL;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.30;
    const prog = Math.min(animProg, 1);

    ctx.clearRect(0, 0, W, H);

    // Grid rings (5 concentric polygons)
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(r => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const ang = getAngle(i);
        const x = cx + Math.cos(ang) * maxR * r;
        const y = cy + Math.sin(ang) * maxR * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = r === 1.0 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = r === 1.0 ? 1 : 0.5;
      ctx.stroke();

      // Score label at rightmost point of each ring
      if (r < 1.0) {
        const lx = cx + Math.cos(getAngle(0)) * maxR * r + 6;
        const ly = cy + Math.sin(getAngle(0)) * maxR * r;
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((r * 10).toFixed(0), lx, ly);
      }
    });

    // Axis spokes
    AXES.forEach((ax, i) => {
      const ang = getAngle(i);
      const isHov = hoveredAxis === i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * maxR, cy + Math.sin(ang) * maxR);
      ctx.strokeStyle = isHov ? ax.color + 'bb' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = isHov ? 1.5 : 0.5;
      ctx.stroke();
    });

    // Filled data polygon
    ctx.beginPath();
    AXES.forEach((ax, i) => {
      const ang = getAngle(i);
      const r   = (ax.score / MAX_SCORE) * maxR * prog;
      const x   = cx + Math.cos(ang) * r;
      const y   = cy + Math.sin(ang) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grd.addColorStop(0, 'rgba(56,189,248,0.35)');
    grd.addColorStop(1, 'rgba(168,85,247,0.12)');
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Dots + axis labels
    AXES.forEach((ax, i) => {
      const ang  = getAngle(i);
      const r    = (ax.score / MAX_SCORE) * maxR * prog;
      const dotX = cx + Math.cos(ang) * r;
      const dotY = cy + Math.sin(ang) * r;
      const isHov = hoveredAxis === i;

      // Dot
      ctx.beginPath();
      ctx.arc(dotX, dotY, isHov ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ax.color;
      ctx.shadowBlur   = isHov ? 14 : 0;
      ctx.shadowColor  = ax.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      const labelR   = maxR + 22;
      const lx       = cx + Math.cos(ang) * labelR;
      const ly       = cy + Math.sin(ang) * labelR;
      const cosA     = Math.cos(ang);
      const sinA     = Math.sin(ang);

      ctx.font         = isHov ? '600 12px "Inter", sans-serif' : '400 11px "Inter", sans-serif';
      ctx.fillStyle    = isHov ? ax.color : '#94a3b8';
      ctx.textAlign    = cosA > 0.1 ? 'left' : cosA < -0.1 ? 'right' : 'center';
      ctx.textBaseline = sinA > 0.1 ? 'top'  : sinA < -0.1 ? 'bottom' : 'middle';
      ctx.fillText(ax.label, lx, ly);

      // Score tag when hovered
      if (isHov && prog > 0.4) {
        const sx = cx + Math.cos(ang) * (r + 18);
        const sy = cy + Math.sin(ang) * (r + 18);
        ctx.font         = '700 12px "JetBrains Mono", monospace';
        ctx.fillStyle    = ax.color;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${ax.score}`, sx, sy);
      }
    });

    requestAnimationFrame(draw);
  }

  // Smooth animation on scroll trigger
  function animateFill() {
    if (animProg >= 1) return;
    animProg = Math.min(animProg + 0.022, 1);
    requestAnimationFrame(animateFill);
  }

  // Hover hit-test on axis labels
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const cx   = LOGICAL / 2, cy = LOGICAL / 2;
    const maxR = LOGICAL * 0.30;

    hoveredAxis = null;
    AXES.forEach((ax, i) => {
      const ang = getAngle(i);
      const lx  = cx + Math.cos(ang) * (maxR + 22);
      const ly  = cy + Math.sin(ang) * (maxR + 22);
      if (Math.abs(mx - lx) < 70 && Math.abs(my - ly) < 22) {
        hoveredAxis = i;
        if (tooltip) {
          tooltip.innerHTML = `<strong style="color:${ax.color}">${ax.label} — ${ax.score}/10</strong>${ax.skills.map(s => `<span>${s}</span>`).join('')}`;
          tooltip.style.left = `${e.clientX + 14}px`;
          tooltip.style.top  = `${e.clientY - 10}px`;
          tooltip.classList.add('visible');
        }
      }
    });
    if (hoveredAxis === null && tooltip) tooltip.classList.remove('visible');
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredAxis = null;
    if (tooltip) tooltip.classList.remove('visible');
  });

  // ScrollTrigger fires animation
  gsap.to({}, {
    scrollTrigger: {
      trigger: '#skills-radar',
      start: 'top 78%',
      once: true,
      onEnter: () => { if (!started) { started = true; animateFill(); } },
    },
  });

  draw();
})();

/* ============================================================
   PROJECT CASE STUDY MODALS
   ============================================================ */
(function initModals() {
  const overlay   = document.getElementById('modal-overlay');
  const card      = document.getElementById('modalCard');
  const closeBtn  = document.getElementById('modalClose');

  const PROJECTS = {
    'metabolite-search': {
      title: 'AI Metabolite Search Engine',
      cat: '🤖 Machine Learning · Semantic Search',
      problem: 'The existing metabolite lookup was keyword-based, requiring exact name matches. Analysts spent 20+ minutes per session navigating 100K+ compounds across two diagnostic platforms (NMR and LC-MS), with no cross-platform search.',
      arch: ['Raw Query', 'Sentence Transformer\n(all-MiniLM-L6-v2)', 'FAISS Index\n(100K vectors)', 'MMR Re-ranking', 'Top-K Results'],
      bars: [
        { label: 'Retrieval Time Reduction', value: 70, display: '70%' },
        { label: 'Metabolite Coverage', value: 94, display: '100K+ compounds' },
        { label: 'Cross-Platform Accuracy', value: 94, display: '94%' },
      ],
      stack: ['Python', 'Azure', 'FastAPI', 'FAISS', 'Sentence-Transformers', 'PostgreSQL'],
      decisions: [
        { title: 'FAISS over Pinecone', body: 'HIPAA compliance required all data to stay within our Azure tenant. Pinecone would have sent embeddings to a third-party cloud — not viable. FAISS runs fully on-premise, indexes 100K vectors in under 2 seconds, and costs $0.' },
        { title: 'Sentence Transformers over OpenAI embeddings', body: 'OpenAI API calls would leak compound identifiers and query patterns outside our security perimeter. all-MiniLM-L6-v2 runs locally, inference time under 10ms per query, and performed near-equivalently on our domain after fine-tuning on biomedical text.' },
        { title: 'MMR re-ranking over pure cosine similarity', body: 'Cosine similarity alone returned redundant results — querying "creatinine" surfaced 8 creatinine variants before any chemically distinct alternatives. Maximal Marginal Relevance re-ranking balances relevance vs. diversity, giving analysts actionable cross-platform results on the first page.' },
      ],
      schema: `-- Metabolite index (sanitized)
CREATE TABLE metabolites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  formula     TEXT,
  hmdb_id     VARCHAR(12),        -- HMDB0000001 format
  platform    TEXT CHECK (platform IN ('NMR','LC-MS','BOTH')),
  embedding   VECTOR(384),        -- FAISS-synced via pgvector
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- HIPAA-required query audit log
CREATE TABLE search_log (
  id           UUID PRIMARY KEY,
  query_hash   TEXT NOT NULL,     -- SHA-256, never raw text
  result_count INT,
  latency_ms   INT,
  user_role    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);`,
      lesson: 'Never trust keyword search for scientific data. Synonyms, abbreviations, and structural aliases mean the same compound has 15+ valid names. Semantic search cut "no results" queries from 34% to under 3% — without any new data, just better retrieval.',
    },
    'nmr-quality': {
      title: 'NMR Signal Quality Classifier',
      cat: '🧠 Deep Learning · Signal Processing',
      problem: 'NMR instrument data contains noise artifacts, shimming errors, and baseline distortions requiring expert manual review. With 200+ daily acquisitions, analyst bottleneck was causing 48-hour delays in clinical reporting.',
      arch: ['Raw FID (.fid)', 'nmrglue: FFT +\nPhase Correction', 'Baseline Correction\n+ Windowing', '1D CNN\nClassifier', 'QC Pass/Fail\n+ Confidence'],
      bars: [
        { label: 'Accuracy Gain vs Baseline', value: 35, display: '+35%' },
        { label: 'Manual Review Reduction', value: 72, display: '72%' },
        { label: 'Training Observations', value: 87, display: '10K+ spectra' },
      ],
      stack: ['Python', 'nmrglue', 'scikit-learn', 'NumPy', 'PyTorch', 'PostgreSQL'],
      decisions: [
        { title: '1D CNN over Random Forest', body: 'NMR spectra are sequential signals — a shimming artifact at 4.7 ppm correlates with neighbouring peaks. Random Forest treated each frequency bin as independent, missing this locality entirely. A 1D CNN with kernel size 7 captured local correlations and added 23% accuracy over the RF baseline.' },
        { title: 'Confidence threshold at 0.82, not 0.5', body: 'In clinical diagnostics, a false-negative (bad spectrum labeled as good) is catastrophic. We calibrated the threshold to 0.82 to push uncertain samples to manual review rather than auto-approve. This held the false-negative rate below 0.4% across the full test set.' },
        { title: 'Synthetic augmentation for class imbalance', body: 'Failing spectra represent only ~8% of acquisitions. Rather than over-sample real failures (risking data leakage), we generated synthetic noise artifacts using domain knowledge of shimming error patterns. This produced a balanced training set without contaminating validation data.' },
      ],
      schema: `-- NMR acquisition tracking (sanitized)
CREATE TABLE nmr_acquisitions (
  id              UUID PRIMARY KEY,
  sample_id       UUID NOT NULL,
  instrument_id   INT  NOT NULL,
  fid_path        TEXT,           -- Azure Blob Storage URI
  qc_status       TEXT CHECK (qc_status IN ('PASS','FAIL','REVIEW')),
  qc_confidence   NUMERIC(4,3),   -- 0.000 – 1.000
  review_required BOOLEAN DEFAULT FALSE,
  acquired_at     TIMESTAMPTZ,
  processed_at    TIMESTAMPTZ
);

CREATE TABLE qc_predictions (
  id              UUID PRIMARY KEY,
  acquisition_id  UUID REFERENCES nmr_acquisitions(id),
  model_version   TEXT NOT NULL,  -- e.g. 'v2.3.1'
  prediction      TEXT NOT NULL,
  confidence      NUMERIC(4,3),
  processing_ms   INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);`,
      lesson: 'Threshold calibration matters more than model architecture. A model with 88% accuracy but poorly calibrated confidence is dangerous in clinical settings. We spent 30% of the project on calibration and failure-mode analysis — not on the model itself. The right answer was often "route to human", not "guess".',
    },
    'nmr-monitoring': {
      title: 'Live NMR Monitoring System',
      cat: '⚙️ Data Engineering · Real-time Systems',
      problem: 'NMR instrument QC parameters (temperature, shimming, B0 field) drifted silently during overnight runs, resulting in unusable data that was only discovered after 8-12 hour batches completed — wasting expensive instrument time.',
      arch: ['NMR Instrument', 'FastAPI Listener', 'PostgreSQL', 'MS Teams Alert'],
      bars: [
        { label: 'Parameters Monitored', value: 80, display: '200+' },
        { label: 'Alert Response Time', value: 90, display: '<200ms' },
        { label: 'Instrument Uptime', value: 99, display: '99.9%' },
      ],
      stack: ['FastAPI', 'Mage AI', 'PostgreSQL', 'Docker', 'MS Teams API', 'Python'],
    },
    'it-routing': {
      title: 'IT Incident Routing Neural Net',
      cat: '🔤 NLP · Production ML · Scale',
      problem: 'Cigna\'s IT service desk received 500+ daily ServiceNow incidents routed manually to teams. Manual routing accuracy was 30%, causing SLA breaches and 40% of tickets requiring re-assignment — ~$2M/yr in wasted labor.',
      arch: ['ServiceNow Ticket', 'NLP Preprocessing\n+ Tokenization', 'BERT Fine-tuned\nClassifier', 'Confidence\nFilter', 'Auto-Route\nor Escalate'],
      bars: [
        { label: 'Routing Accuracy', value: 87, display: '87%' },
        { label: 'Mis-route Reduction', value: 85, display: '85%' },
        { label: 'Recall', value: 96, display: '96%' },
      ],
      stack: ['TensorFlow', 'Python', 'ServiceNow API', 'NLTK', 'Keras', 'SQL Server'],
      decisions: [
        { title: 'Fine-tuned BERT over vanilla LSTM', body: 'IT incident descriptions contain highly domain-specific jargon ("P2 SAML federation issue on Citrix Gateway"). A vanilla LSTM had no pre-trained context for these terms. Fine-tuning BERT on 6 months of historical tickets gave the model domain vocabulary from day 1 — a 19% accuracy gain over LSTM.' },
        { title: 'Confidence filter before auto-routing', body: 'Auto-routing a high-confidence wrong ticket is worse than no routing at all. We added a confidence threshold (>0.78) — tickets below that go to a triage queue for human review. This maintained 87% accuracy at high confidence while keeping false-route rate under 2%.' },
        { title: 'Active learning re-training loop', body: 'Each human correction on a mis-routed ticket was fed back into a weekly re-training pipeline. After 90 days, accuracy improved from 81% to 87% without any additional manual labeling effort. The system learned from its own mistakes at zero marginal cost.' },
      ],
      schema: `-- Incident routing (sanitized, adapted from ServiceNow)
CREATE TABLE incidents (
  id            BIGINT PRIMARY KEY,
  short_desc    TEXT NOT NULL,    -- raw ticket text
  description   TEXT,
  priority      TINYINT,         -- 1 Critical → 4 Low
  actual_team   VARCHAR(64),     -- ground truth post-resolution
  created_at    DATETIME
);

CREATE TABLE routing_predictions (
  incident_id   BIGINT REFERENCES incidents(id),
  model_version VARCHAR(20),
  predicted_team VARCHAR(64),
  confidence    DECIMAL(5,4),
  was_correct   BIT,             -- set after ticket resolution
  routed_at     DATETIME DEFAULT GETDATE()
);`,
      lesson: 'The biggest accuracy gains came from data quality, not model complexity. Normalizing team names (17 inconsistent spellings of "Infrastructure Network") and cleaning 3 years of mislabeled historical data improved training accuracy by 12% before any model changes. Garbage in, garbage out — still holds at scale.',
    },
    'data-migration': {
      title: 'Biotech Research Data Migration',
      cat: '☁️ Data Engineering · Cloud Migration',
      problem: 'Boehringer Ingelheim\'s 13 research initiatives stored data in 100+ disconnected Excel/PowerPoint files with no schema governance. Cross-initiative analysis was impossible and onboarding new scientists took 3+ weeks.',
      arch: ['Excel / PPT Files', 'Python ETL', 'YAML Schema', 'Cloudera Lake'],
      bars: [
        { label: 'Data Loss', value: 0, display: '0 records' },
        { label: 'Onboarding Speed Gain', value: 30, display: '+30%' },
        { label: 'Initiatives Migrated', value: 100, display: '13 / 13' },
      ],
      stack: ['Python', 'Cloudera', 'SQL', 'YAML', 'Pandas', 'Apache Hive'],
    },
    'research-dashboard': {
      title: 'Institutional Research Dashboard',
      cat: '📊 Analytics · Data Visualization',
      problem: 'UConn\'s IR office relied on static SAS reports updated monthly, making real-time enrollment tracking and academic decision-making impossible during critical registration periods.',
      arch: ['SAS Source', 'Data Model', 'R Shiny / Tableau', 'Live Dashboard'],
      bars: [
        { label: 'Records Processed', value: 80, display: '400K+' },
        { label: 'Reporting Frequency', value: 100, display: 'Real-time' },
        { label: 'Stakeholder Adoption', value: 90, display: '90%+' },
      ],
      stack: ['R Shiny', 'Tableau', 'SQL', 'SAS', 'R', 'PostgreSQL'],
    },
  };

  function openModal(id) {
    const p = PROJECTS[id];
    if (!p) return;

    const decisionsHtml = p.decisions ? `
      <div class="modal-section">
        <h4>Design Decisions</h4>
        <div class="modal-decisions">
          ${p.decisions.map(d => `
            <div class="modal-decision">
              <div class="modal-decision-title">${d.title}</div>
              <div class="modal-decision-body">${d.body}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    const schemaHtml = p.schema ? `
      <div class="modal-section">
        <h4>Data Model <span class="modal-schema-badge">sanitized</span></h4>
        <pre class="modal-schema"><code>${p.schema}</code></pre>
      </div>` : '';

    const lessonHtml = p.lesson ? `
      <div class="modal-section modal-lesson">
        <h4>Key Engineering Insight</h4>
        <p>${p.lesson}</p>
      </div>` : '';

    card.innerHTML = `
      <span class="modal-cat">${p.cat}</span>
      <h2 class="modal-title">${p.title}</h2>
      <div class="modal-section">
        <h4>Problem</h4>
        <p>${p.problem}</p>
      </div>
      <div class="modal-section">
        <h4>Architecture</h4>
        <div class="modal-arch">
          ${p.arch.map((a,i) => `<div class="modal-arch-node">${a.replace(/\n/g,'<br><small>')}</div>${i < p.arch.length-1 ? '<span class="modal-arch-arrow">→</span>' : ''}`).join('')}
        </div>
      </div>
      <div class="modal-section">
        <h4>Results</h4>
        <div class="modal-bars">
          ${p.bars.map(b => `
            <div class="modal-bar-row">
              <div class="modal-bar-label">${b.label} <span>${b.display}</span></div>
              <div class="modal-bar-track"><div class="modal-bar-fill" data-val="${b.value}"></div></div>
            </div>`).join('')}
        </div>
      </div>
      ${decisionsHtml}
      ${schemaHtml}
      <div class="modal-section">
        <h4>Tech Stack</h4>
        <div class="tl-tags" style="gap:8px">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
      </div>
      ${lessonHtml}`;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    // Animate bars after transition
    setTimeout(() => {
      card.querySelectorAll('.modal-bar-fill').forEach(el => {
        el.style.width = el.dataset.val + '%';
      });
    }, 420);
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.case-study-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(btn.dataset.modal);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });
})();

/* ============================================================
   PROJECT CARD THUMBNAIL CANVASES
   6 unique abstract visualizations — DPR-aware, looping animations
   ============================================================ */
(function initCardThumbs() {
  const dpr = window.devicePixelRatio || 1;

  document.querySelectorAll('.card-thumb').forEach(canvas => {
    const type = canvas.dataset.thumb;
    const logW = canvas.parentElement.offsetWidth + 48;
    const logH = 130;
    canvas.width  = logW * dpr;
    canvas.height = logH * dpr;
    canvas.style.width  = logW + 'px';
    canvas.style.height = logH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = logW, H = logH;

    const CYAN   = '#38bdf8';
    const PURPLE = '#a855f7';
    const TEAL   = '#06b6d4';
    const BG     = '#060b16';

    if (type === 'embedding') {
      // Dot-cloud / embedding space — dots slowly drift & cluster
      const N = 70;
      const clusters = [
        { x: W * 0.22, y: H * 0.50 },
        { x: W * 0.54, y: H * 0.35 },
        { x: W * 0.80, y: H * 0.62 },
      ];
      const dots = Array.from({ length: N }, (_, i) => {
        const c = clusters[i % clusters.length];
        return {
          x: c.x + (Math.random() - 0.5) * 60,
          y: c.y + (Math.random() - 0.5) * 46,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1.8 + Math.random() * 1.8,
          color: Math.random() > 0.5 ? CYAN : PURPLE,
          phase: Math.random() * Math.PI * 2,
        };
      });
      let t = 0;
      (function loop() {
        t += 0.008;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        clusters.forEach((c, i) => {
          const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 46);
          grad.addColorStop(0, (i === 0 ? CYAN : PURPLE) + '16'); grad.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(c.x, c.y, 46, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        });
        dots.forEach(d => {
          d.x += d.vx + Math.sin(t + d.phase) * 0.10;
          d.y += d.vy + Math.cos(t + d.phase) * 0.08;
          if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
          if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = d.color + 'cc'; ctx.fill();
        });
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('EMBEDDING SPACE', 10, 8);
        requestAnimationFrame(loop);
      })();

    } else if (type === 'spectrum') {
      // Mini NMR spectrum waveform
      const PEAKS_S = [
        { ppm: 7.4, amp: 0.52, w: 0.12, color: PURPLE },
        { ppm: 5.1, amp: 0.32, w: 0.15, color: CYAN },
        { ppm: 3.7, amp: 0.78, w: 0.10, color: CYAN },
        { ppm: 2.9, amp: 0.58, w: 0.08, color: PURPLE },
        { ppm: 1.9, amp: 0.44, w: 0.12, color: TEAL },
        { ppm: 1.2, amp: 0.68, w: 0.09, color: CYAN },
      ];
      function lorentz(x, c, w, a) { return a / (1 + Math.pow((x - c) / w, 2)); }
      function ppmX(p) { return W - (p / 9) * W; }
      let ts = 0;
      (function loop() {
        ts += 0.010;
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        const BY = H * 0.74, CH = H * 0.58;
        ctx.beginPath(); ctx.strokeStyle = CYAN + '15'; ctx.lineWidth = 0.7;
        ctx.moveTo(0, BY); ctx.lineTo(W, BY); ctx.stroke();
        ctx.beginPath(); ctx.strokeStyle = CYAN + '12'; ctx.lineWidth = 0.6;
        for (let x = 0; x < W; x += 2) {
          const n = (Math.sin(x * 0.1 + ts) + Math.sin(x * 0.3 + ts * 1.3)) * 1.4;
          x === 0 ? ctx.moveTo(x, BY - n) : ctx.lineTo(x, BY - n);
        }
        ctx.stroke();
        PEAKS_S.forEach((pk, idx) => {
          const la = pk.amp * (1 + 0.04 * Math.sin(ts * 2 + idx));
          const cxp = ppmX(pk.ppm);
          const pts = [];
          const sp = pk.w * (W / 9) * 14;
          for (let dx = -sp; dx <= sp; dx += 2) {
            const sx = cxp + dx, pv = 9 - (sx / W) * 9;
            pts.push({ x: sx, y: BY - lorentz(pv, pk.ppm, pk.w, la) * CH });
          }
          const grad = ctx.createLinearGradient(0, BY - la * CH, 0, BY);
          grad.addColorStop(0, pk.color + '28'); grad.addColorStop(1, pk.color + '00');
          ctx.beginPath(); ctx.moveTo(pts[0].x, BY);
          pts.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.lineTo(pts[pts.length-1].x, BY); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
          ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.strokeStyle = pk.color + '75'; ctx.lineWidth = 1; ctx.stroke();
        });
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('NMR SIGNAL', 10, 8);
        requestAnimationFrame(loop);
      })();

    } else if (type === 'realtime') {
      // Scrolling real-time multi-channel chart
      const CHANNELS = [
        { color: CYAN,   label: 'Acquisition', phase: 0 },
        { color: PURPLE, label: 'QC Score',    phase: 1.5 },
        { color: TEAL,   label: 'Lock Signal', phase: 3.0 },
      ];
      const history = CHANNELS.map(() => []);
      const MAX_PTS = 80;
      let tr = 0, blinkPhase = 0;
      (function loop() {
        tr += 0.04; blinkPhase += 0.06;
        CHANNELS.forEach((ch, i) => {
          const v = 0.3 + 0.25 * Math.sin(tr + ch.phase) + 0.06 * Math.sin(tr * 3.1 + i);
          history[i].push(v);
          if (history[i].length > MAX_PTS) history[i].shift();
        });
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        const PAD = 14, cW = W - PAD * 2, cH = (H - 26) / CHANNELS.length;
        CHANNELS.forEach((ch, i) => {
          const yBase = 13 + i * cH + cH * 0.5;
          const pts = history[i];
          if (pts.length < 2) return;
          ctx.beginPath();
          pts.forEach((v, j) => {
            const x = PAD + (j / (MAX_PTS - 1)) * cW, y = yBase - (v - 0.5) * cH * 0.78;
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.strokeStyle = ch.color + 'aa'; ctx.lineWidth = 1.1; ctx.stroke();
          const grad = ctx.createLinearGradient(0, yBase - cH * 0.4, 0, yBase + cH * 0.4);
          grad.addColorStop(0, ch.color + '20'); grad.addColorStop(1, ch.color + '00');
          ctx.lineTo(PAD + cW, yBase); ctx.lineTo(PAD, yBase); ctx.closePath();
          ctx.fillStyle = grad; ctx.fill();
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = ch.color + '70'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(ch.label, PAD, 13 + i * cH + 5);
        });
        if (Math.sin(blinkPhase) > 0) {
          ctx.beginPath(); ctx.arc(W - 22, 10, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e'; ctx.fill();
        }
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = '#22c55e70'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('LIVE', W - 8, 6);
        requestAnimationFrame(loop);
      })();

    } else if (type === 'neural') {
      // Layered neural network diagram with animated pulses
      const LAYERS = [4, 5, 3, 1];
      const COLORS = [CYAN, TEAL, PURPLE, PURPLE];
      const layerX = LAYERS.map((_, i) => W * (0.10 + i * 0.26));
      function nodeY(layer, node) {
        const n = LAYERS[layer], spacing = Math.min(H / (n + 1), 26);
        return H / 2 + (node - (n - 1) / 2) * spacing;
      }
      const pulses = [];
      setInterval(() => {
        const fromL = Math.floor(Math.random() * (LAYERS.length - 1));
        const fromN = Math.floor(Math.random() * LAYERS[fromL]);
        const toN   = Math.floor(Math.random() * LAYERS[fromL + 1]);
        pulses.push({ l: fromL, fn: fromN, tn: toN, t: 0 });
        if (pulses.length > 14) pulses.shift();
      }, 260);
      (function loop() {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        for (let l = 0; l < LAYERS.length - 1; l++) {
          for (let a = 0; a < LAYERS[l]; a++) {
            for (let b = 0; b < LAYERS[l + 1]; b++) {
              ctx.beginPath();
              ctx.moveTo(layerX[l], nodeY(l, a)); ctx.lineTo(layerX[l + 1], nodeY(l + 1, b));
              ctx.strokeStyle = 'rgba(56,189,248,0.06)'; ctx.lineWidth = 0.6; ctx.stroke();
            }
          }
        }
        pulses.forEach(p => {
          p.t = Math.min(p.t + 0.032, 1);
          const sx = layerX[p.l], sy = nodeY(p.l, p.fn);
          const ex = layerX[p.l + 1], ey = nodeY(p.l + 1, p.tn);
          const px = sx + (ex - sx) * p.t, py = sy + (ey - sy) * p.t;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 5);
          grad.addColorStop(0, CYAN + 'cc'); grad.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        });
        LAYERS.forEach((n, l) => {
          for (let i = 0; i < n; i++) {
            const x = layerX[l], y = nodeY(l, i);
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = COLORS[l] + '2a'; ctx.fill();
            ctx.strokeStyle = COLORS[l] + '99'; ctx.lineWidth = 1; ctx.stroke();
          }
        });
        const labels = ['Input', 'Hidden', 'Hidden', 'Out'];
        ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
        LAYERS.forEach((_, l) => {
          ctx.fillStyle = COLORS[l] + '50'; ctx.fillText(labels[l], layerX[l], H - 5);
        });
        ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('NEURAL NETWORK', 10, 8);
        requestAnimationFrame(loop);
      })();

    } else if (type === 'pipeline') {
      // ETL pipeline: sources → transform → targets with animated particles
      const SOURCES = [{ label: 'Excel', y: H*0.25 }, { label: 'PPT', y: H*0.5 }, { label: 'Docs', y: H*0.75 }];
      const TARGETS = [{ label: 'HDFS', y: H*0.35 }, { label: 'Hive', y: H*0.65 }];
      const TX = W * 0.5, TY = H * 0.5;
      const particles2 = [];
      setInterval(() => {
        const s = SOURCES[Math.floor(Math.random() * SOURCES.length)];
        particles2.push({ sx: W*0.13, sy: s.y, ex: TX - 30, ey: TY, t: 0, col: CYAN });
        const tg = TARGETS[Math.floor(Math.random() * TARGETS.length)];
        particles2.push({ sx: TX + 30, sy: TY, ex: W*0.87, ey: tg.y, t: 0, col: PURPLE });
        if (particles2.length > 22) particles2.splice(0, 2);
      }, 340);
      function drawBox(ctx, x, y, w, h, color, label) {
        const rx = x - w/2, ry = y - h/2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, w, h, 4); else ctx.rect(rx, ry, w, h);
        ctx.fillStyle = color + '1a'; ctx.fill();
        ctx.strokeStyle = color + '60'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = color + 'bb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
      (function loop() {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        SOURCES.forEach(s => {
          ctx.beginPath(); ctx.moveTo(W*0.13, s.y); ctx.lineTo(TX - 30, TY);
          ctx.strokeStyle = CYAN + '1a'; ctx.lineWidth = 0.7; ctx.stroke();
        });
        TARGETS.forEach(tg => {
          ctx.beginPath(); ctx.moveTo(TX + 30, TY); ctx.lineTo(W*0.87, tg.y);
          ctx.strokeStyle = PURPLE + '1a'; ctx.lineWidth = 0.7; ctx.stroke();
        });
        particles2.forEach(p => {
          p.t = Math.min(p.t + 0.026, 1);
          ctx.beginPath(); ctx.arc(p.sx + (p.ex-p.sx)*p.t, p.sy + (p.ey-p.sy)*p.t, 2.2, 0, Math.PI*2);
          ctx.fillStyle = p.col + 'cc'; ctx.fill();
        });
        SOURCES.forEach(s => drawBox(ctx, W*0.13, s.y, 42, 19, CYAN, s.label));
        drawBox(ctx, TX, TY, 58, 32, TEAL, 'Transform');
        TARGETS.forEach(tg => drawBox(ctx, W*0.87, tg.y, 42, 19, PURPLE, tg.label));
        ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('ETL PIPELINE', 10, 8);
        requestAnimationFrame(loop);
      })();

    } else if (type === 'barchart') {
      // Animated bar chart — 6 bars with gentle breathing
      const BARS = [
        { label: 'A', target: 0.72, color: CYAN   },
        { label: 'B', target: 0.55, color: PURPLE },
        { label: 'C', target: 0.88, color: TEAL   },
        { label: 'D', target: 0.63, color: CYAN   },
        { label: 'E', target: 0.80, color: PURPLE },
        { label: 'F', target: 0.48, color: TEAL   },
      ];
      let tb = 0;
      (function loop() {
        tb += 0.012;
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        const PL=14, PR=14, PT=20, PB=22;
        const cW = W-PL-PR, cH = H-PT-PB;
        const barW = cW / (BARS.length * 1.6), gap = cW / BARS.length;
        [0.25, 0.5, 0.75, 1.0].forEach(r => {
          const y = PT + cH * (1 - r);
          ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + cW, y);
          ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke();
        });
        BARS.forEach((b, i) => {
          const liveH = b.target * (1 + 0.03 * Math.sin(tb * 1.8 + i * 0.9));
          const barH  = cH * Math.min(liveH, 1);
          const x = PL + gap * i + gap / 2 - barW / 2, y = PT + cH - barH;
          const grad = ctx.createLinearGradient(0, y, 0, y + barH);
          grad.addColorStop(0, b.color + 'cc'); grad.addColorStop(1, b.color + '33');
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [3,3,0,0]); else ctx.rect(x, y, barW, barH);
          ctx.fillStyle = grad; ctx.fill();
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = b.color + '88'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(b.label, x + barW / 2, PT + cH + 4);
        });
        ctx.fillStyle = 'rgba(56,189,248,0.30)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText('DASHBOARD METRICS', 10, 8);
        requestAnimationFrame(loop);
      })();
    }
  });
})();

/* ============================================================
   FEATURE 1: WORD-BY-WORD HEADING REVEAL (powered by pretext)
   Measurement deferred into onEnter so offsetWidth is valid.
   pretext maps each word to its line — L→R stagger per line
   with a gap between lines. Zero DOM reflows at init time.
   ============================================================ */
(function initHeadingReveal() {
  withPretext(({ prepareWithSegments, layoutWithLines }) => {
    document.querySelectorAll('.section-header h2').forEach(el => {
      // Pre-extract text now (no layout needed for textContent)
      const clone = el.cloneNode(true);
      clone.querySelectorAll('br').forEach(br => br.replaceWith(' '));
      const rawText = clone.textContent.trim().replace(/\s+/g, ' ');
      const words = rawText.split(' ').filter(Boolean);
      if (words.length === 0) return;

      // Hide heading until scroll entry (replaces old section-header block fade)
      gsap.set(el, { opacity: 0 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 87%',
        once: true,
        onEnter() {
          // Layout is now valid — el is in/near viewport
          const cs        = getComputedStyle(el);
          const font      = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const lineHeight = parseFloat(cs.lineHeight);
          const maxWidth  = el.offsetWidth;

          const WORD_DT = 0.072, LINE_GAP = 0.20;
          let wordDelays = words.map((_, i) => i * WORD_DT); // safe default

          if (maxWidth > 0) {
            try {
              const prepared = prepareWithSegments(rawText, font);
              const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
              wordDelays = [];
              let delay = 0, cursor = 0;
              lines.forEach((line, li) => {
                if (li > 0) delay += LINE_GAP;
                const n = line.text.trim().split(/\s+/).filter(Boolean).length;
                for (let w = 0; w < n; w++) {
                  wordDelays[cursor++] = delay;
                  delay += WORD_DT;
                }
              });
              // Fallback for any overflow words
              for (let i = cursor; i < words.length; i++) {
                wordDelays[i] = delay; delay += WORD_DT;
              }
            } catch (_) { /* keep sequential default */ }
          }

          // Swap h2 text for per-word spans, then animate
          el.innerHTML = words.map(w => `<span class="reveal-word">${w}</span>`).join(' ');
          const spans  = Array.from(el.querySelectorAll('.reveal-word'));
          gsap.set(el,    { opacity: 1 });
          gsap.set(spans, { opacity: 0, y: 22 });
          spans.forEach((span, i) => {
            gsap.to(span, {
              opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
              delay: wordDelays[i] ?? i * WORD_DT,
            });
          });
        },
      });
    });
  });
})();

/* ============================================================
   FEATURE 2: STREAMING ABSTRACT REVEAL (powered by pretext)
   layoutWithLines gives exact per-line text + width. Characters
   stream in line by line; each finished line gets a cyan
   underline sweep — like an AI reading the text live.
   ============================================================ */
(function initAbstractStream() {
  const el = document.querySelector('.pub-abstract');
  if (!el) return;
  const rawText = el.textContent.trim();

  // Wrap ScrollTrigger creation inside withPretext so both are guaranteed ready
  withPretext(({ prepareWithSegments, layoutWithLines }) => {
    gsap.set(el, { opacity: 0 });

    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter() {
        // Measurement here: element is in/near viewport so offsetWidth is valid
        const cs       = getComputedStyle(el);
        const font     = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const lh       = parseFloat(cs.lineHeight);
        const maxWidth = el.offsetWidth;
        if (!maxWidth) { gsap.set(el, { opacity: 1 }); return; }

        // layoutWithLines returns exact per-line { text, width } — no DOM reflow
        const prepared = prepareWithSegments(rawText, font);
        const { lines } = layoutWithLines(prepared, maxWidth, lh);
        if (!lines || !lines.length) { gsap.set(el, { opacity: 1 }); return; }

        // Build DOM: one <span class="stream-line"> per line
        gsap.set(el, { opacity: 1 });
        el.innerHTML = '';
        const lineEls = lines.map(() => {
          const span = document.createElement('span');
          span.className = 'stream-line';
          el.appendChild(span);
          return span;
        });

        // Stream line by line, character by character
        let lineIdx = 0;
        let charIdx = 0;
        function tick() {
          if (lineIdx >= lines.length) return;
          const line = lines[lineIdx];
          charIdx = Math.min(charIdx + 4, line.text.length);
          if (charIdx >= line.text.length) {
            // Line complete — finalise text and sweep cyan underline
            lineEls[lineIdx].textContent = line.text;
            const sweep = document.createElement('span');
            sweep.className = 'stream-sweep';
            sweep.style.width = Math.ceil(line.width) + 'px';
            lineEls[lineIdx].appendChild(sweep);
            requestAnimationFrame(() => sweep.classList.add('stream-sweep-go'));
            lineIdx++;
            charIdx = 0;
          } else {
            lineEls[lineIdx].textContent = line.text.slice(0, charIdx) + '█';
          }
          setTimeout(tick, 22);
        }
        tick();
      },
    });
  });
})();

/* ============================================================
   FEATURE 3: SCAN-LINE BULLET REVEAL (powered by pretext)
   walkLineRanges measures exact line count of each experience
   bullet so the cyan scan bar timing is pixel-perfect.
   ============================================================ */
(function initBulletScanLine() {
  withPretext(({ prepare, walkLineRanges }) => {
    document.querySelectorAll('.tl-card').forEach(card => {
      const bulletList = card.querySelector('.tl-bullets');
      if (!bulletList) return;
      const bullets = Array.from(bulletList.querySelectorAll('li'));
      if (!bullets.length) return;

      bullets.forEach(li => li.classList.add('scan-dim'));

      const scanBar = document.createElement('div');
      scanBar.className = 'scan-bar';
      bulletList.style.position = 'relative';
      bulletList.appendChild(scanBar);

      ScrollTrigger.create({
        trigger: card, start: 'top 80%', once: true,
        onEnter() {
          const cs      = getComputedStyle(bullets[0]);
          const font    = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const maxW    = bulletList.offsetWidth - 28;
          const lineH   = parseFloat(cs.lineHeight) || 22;

          // walkLineRanges counts exact wrapped lines per bullet
          let cumY = 0;
          const meta = bullets.map(li => {
            let lineCount = 0;
            try {
              const prep = prepare(li.textContent.trim(), font);
              walkLineRanges(prep, maxW, () => { lineCount++; });
            } catch (_) {}
            lineCount = Math.max(lineCount, 1);
            const h = lineCount * lineH + 12;
            const midY = cumY + h / 2;
            cumY += h;
            return { li, midY };
          });

          const totalH = bulletList.offsetHeight || cumY;

          const tl = gsap.timeline();
          tl.fromTo(scanBar,
            { top: -2, opacity: 1 },
            {
              top: totalH + 2, duration: 1.4, ease: 'linear',
              onUpdate() {
                const barY = gsap.getProperty(scanBar, 'top');
                meta.forEach(m => {
                  if (+barY >= m.midY && !m.li.classList.contains('scan-lit')) {
                    m.li.classList.remove('scan-dim');
                    m.li.classList.add('scan-lit');
                  }
                });
              },
            },
          );
          tl.to(scanBar, { opacity: 0, duration: 0.25 });
        },
      });
    });
  });
})();

/* ============================================================
   FEATURE 4: REDACTION BAR HERO STAT REVEAL (powered by pretext)
   layoutWithLines .width gives exact pixel width of each stat
   label — redaction bars are sized precisely, then wipe away.
   ============================================================ */
(function initRedactionReveal() {
  withPretext(({ prepare, layoutWithLines }) => {
    const bars = [];

    document.querySelectorAll('.stat-label').forEach((label) => {
      const cs   = getComputedStyle(label);
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const lh   = parseFloat(cs.lineHeight) || 18;
      const text = label.textContent;

      let barW = label.offsetWidth || 90;
      try {
        const prep       = prepare(text, font);
        const { lines }  = layoutWithLines(prep, Infinity, lh);
        if (lines && lines[0]) barW = lines[0].width + 8;
      } catch (_) {}

      label.style.position = 'relative';
      const bar = document.createElement('span');
      bar.className = 'redact-bar';
      bar.style.width = barW + 'px';
      label.appendChild(bar);
      bars.push(bar);
    });

    // Called by the counter ScrollTrigger after the count animation finishes
    window.__fireRedaction = function () {
      bars.forEach((bar, i) => {
        gsap.to(bar, {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: 0.55,
          ease: 'power2.inOut',
          delay: i * 0.45,            // stagger relative to wipe start, not page load
          onComplete() { bar.style.display = 'none'; },
        });
      });
    };

    // Edge case: if the counter ScrollTrigger already fired before pretext loaded
    if (window.__heroCounterFired) {
      setTimeout(window.__fireRedaction, 1900);
    }
  });
})();

/* ============================================================
   PHILOSOPHY SECTION — scroll animation
   ============================================================ */
gsap.from('.phil-card', {
  scrollTrigger: { trigger: '.philosophy-grid', start: 'top 80%', once: true },
  opacity: 0, y: 30, duration: 0.55, stagger: 0.1, ease: 'power2.out',
});


/* ============================================================
   EXPLORING SECTION — scroll animation
   ============================================================ */
gsap.from('.explore-card', {
  scrollTrigger: { trigger: '.exploring-grid', start: 'top 80%', once: true },
  opacity: 0, y: 30, duration: 0.5, stagger: 0.1, ease: 'power2.out',
});

/* ============================================================
   AUC ANIMATED BAR CHART
   ============================================================ */
(function initAUCChart() {
  const canvas = document.getElementById('aucChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const bars = [
    { label: 'myOLARIS-KTdx\n(This Study)',  auc: 0.878, color: '#38bdf8', glow: true },
    { label: 'Serum Creatinine\n(Gold Standard)', auc: 0.65,  color: '#475569', glow: false },
  ];

  let animProgress = 0;
  let animating = false;

  function resize() {
    const W = canvas.parentElement.offsetWidth;
    canvas.width  = W * dpr;
    canvas.height = 90 * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = '90px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(progress) {
    const W = canvas.offsetWidth;
    const H = 90;
    ctx.clearRect(0, 0, W, H);

    const barH    = 26;
    const barGap  = 16;
    const labelW  = 170;
    const maxBarW = W - labelW - 80;
    const startY  = 8;

    bars.forEach((b, i) => {
      const y       = startY + i * (barH + barGap);
      const fullW   = b.auc * maxBarW;
      const animW   = fullW * progress;
      const x       = labelW;

      // Label
      ctx.font = `500 11px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const lines = b.label.split('\n');
      ctx.fillText(lines[0], labelW - 10, y + barH / 2 - 6);
      ctx.font = `400 10px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(lines[1] || '', labelW - 10, y + barH / 2 + 7);

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(x, y, maxBarW, barH, 4);
      ctx.fill();

      // Bar
      if (animW > 0) {
        if (b.glow) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
        }
        const grad = ctx.createLinearGradient(x, 0, x + animW, 0);
        if (b.glow) {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(1, '#a855f7');
        } else {
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#475569');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, animW, barH, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // AUC value
      ctx.font = `700 13px "JetBrains Mono", monospace`;
      ctx.fillStyle = b.glow ? '#38bdf8' : '#64748b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.auc.toFixed(3), x + animW + 8, y + barH / 2);
    });

    // Dotted line at AUC 0.65 (baseline)
    const baselineX = labelW + 0.65 * maxBarW;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(100,116,139,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(baselineX, 0);
    ctx.lineTo(baselineX, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function animate() {
    if (!animating) return;
    animProgress = Math.min(animProgress + 0.025, 1);
    draw(animProgress);
    if (animProgress < 1) requestAnimationFrame(animate);
    else animating = false;
  }

  resize();
  draw(0);
  window.addEventListener('resize', () => { resize(); draw(animProgress); });

  ScrollTrigger.create({
    trigger: canvas,
    start: 'top 85%',
    once: true,
    onEnter() { animating = true; requestAnimationFrame(animate); },
  });
})();


/* ============================================================
   CAREER IMPACT TIMELINE CHART
   ============================================================ */
(function initImpactChart() {
  const canvas = document.getElementById('impactCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const MILESTONES = [
    { year: '2021', label: 'UConn\nAnalyst',   records: 400,   color: '#64748b', note: '400K records\nR Shiny + Tableau' },
    { year: '2022', label: 'Cigna\nConsultant', records: 1200,  color: '#94a3b8', note: '87% NLP accuracy\n30%→87% routing' },
    { year: '2023', label: 'Boehringer\nIngelheim', records: 5000, color: '#38bdf8', note: '100+ Excel artifacts\n13 initiatives' },
    { year: '2024', label: 'Olaris\nEngineer I', records: 18000, color: '#22d3ee', note: '10K NMR observations\n200+ params live' },
    { year: '2025', label: 'Olaris\nEngineer III + Cell Press', records: 120000, color: '#a855f7', note: '1.2M clinical records\niScience published' },
  ];

  let animProgress = 0;
  let animating = false;

  function resize() {
    const W = canvas.parentElement.offsetWidth;
    canvas.width  = W * dpr;
    canvas.height = 220 * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = '220px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(progress) {
    const W = canvas.offsetWidth;
    const H = 220;
    ctx.clearRect(0, 0, W, H);

    const PAD_L  = 24;
    const PAD_R  = 24;
    const PAD_T  = 16;
    const PAD_B  = 56;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const maxVal = Math.max(...MILESTONES.map(m => m.records));
    const n = MILESTONES.length;
    const xStep = chartW / (n - 1);

    // Grid lines
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const y = PAD_T + chartH * (1 - frac);
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(W - PAD_R, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Area fill
    const points = MILESTONES.map((m, i) => ({
      x: PAD_L + i * xStep,
      y: PAD_T + chartH * (1 - (m.records / maxVal) * progress),
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, H - PAD_B);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[n-1].x, H - PAD_B);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, PAD_T, 0, H - PAD_B);
    areaGrad.addColorStop(0, 'rgba(56,189,248,0.15)');
    areaGrad.addColorStop(1, 'rgba(56,189,248,0.01)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    const lineGrad = ctx.createLinearGradient(PAD_L, 0, W - PAD_R, 0);
    lineGrad.addColorStop(0, '#64748b');
    lineGrad.addColorStop(0.6, '#38bdf8');
    lineGrad.addColorStop(1, '#a855f7');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Points + labels
    MILESTONES.forEach((m, i) => {
      if (i / (n - 1) > progress + 0.01) return;
      const p = points[i];

      // Glow dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Year + label below
      const labelLines = m.label.split('\n');
      ctx.font = `700 11px "Inter", sans-serif`;
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(m.year, p.x, H - PAD_B + 10);
      ctx.font = `400 9px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#64748b';
      labelLines.forEach((line, li) => ctx.fillText(line, p.x, H - PAD_B + 22 + li * 11));
    });
  }

  resize();
  draw(0);
  window.addEventListener('resize', () => { resize(); draw(animProgress); });

  ScrollTrigger.create({
    trigger: '#impact',
    start: 'top 78%',
    once: true,
    onEnter() {
      animating = true;
      gsap.to({ v: 0 }, {
        v: 1, duration: 1.8, ease: 'power2.out',
        onUpdate() { animProgress = this.targets()[0].v; draw(animProgress); },
      });
    },
  });
})();

/* ============================================================
   MOUSE-FOLLOWING AMBIENT GLOW
   ============================================================ */
(function initMouseGlow() {
  const glow = document.getElementById('mouseGlow');
  if (!glow) return;
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();
})();

