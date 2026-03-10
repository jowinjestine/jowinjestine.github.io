/* ============================================================
   JOWIN JESTINE — PORTFOLIO SCRIPTS
   Canvas animations, GSAP ScrollTrigger, typewriter, counters
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

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
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
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
  const W   = canvas.width;
  const H   = canvas.height;
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
    'clinical systems',
    'analytics platforms',
    'biotech infrastructure',
    'scalable architectures',
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
    document.querySelectorAll('.stat-num').forEach(el => {
      animateCount(el, parseInt(el.dataset.target, 10));
    });
  }
});

/* ============================================================
   HERO ENTRANCE — GSAP timeline
   ============================================================ */
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

heroTl
  .to('.hero-badge',   { opacity: 1, y: 0, duration: 0.55 })
  .to('.hero-name',    { opacity: 1, y: 0, duration: 0.6  }, '-=0.25')
  .to('.hero-role',    { opacity: 1, y: 0, duration: 0.5  }, '-=0.25')
  .to('.hero-desc',    { opacity: 1, y: 0, duration: 0.5  }, '-=0.2' )
  .to('.hero-stats',   { opacity: 1, y: 0, duration: 0.45 }, '-=0.15')
  .to('.hero-actions', { opacity: 1, y: 0, duration: 0.45 }, '-=0.15');

/* ============================================================
   SCROLL-TRIGGERED ANIMATIONS
   ============================================================ */

// Section headers
gsap.utils.toArray('.section-header').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    opacity: 0, y: 32, duration: 0.65, ease: 'power3.out'
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
        { t: 'out', v: '  "location":       "Boston, MA",' },
        { t: 'out', v: '  "specialization": ["Metabolomics Pipelines", "NMR/MS Data Engineering", "HIPAA-Compliant Cloud Systems"],' },
        { t: 'out', v: '  "education":      ["MS Business Analytics — UConn", "BE Computer Engineering — Mumbai"],' },
        { t: 'out', v: '  "open_to":        "Data Engineering · ML Engineering · Big Tech · Hedge Funds",' },
        { t: 'out', v: '  "email":          "jowinjestine@gmail.com"' },
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
        { t: 'out', v: '  "open_to": ["Big Tech","Hedge Fund","Biotech","Quant Research"]' },
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
  let hoveredId = null;
  let selectedId = null;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = 420;
    canvas.style.height = '420px';
  }

  function nodePos(n) {
    const cols  = 6;
    const colW  = W / (cols + 0.5);
    const rowH  = H / 3;
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
      const NW = 130, NH = 44;

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

    requestAnimationFrame(draw);
  }

  function getHitNode(mx, my) {
    return NODES.find(n => {
      const { x, y } = nodePos(n);
      return Math.abs(mx - x) < 68 && Math.abs(my - y) < 26;
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
    const mx = (e.clientX - r.left) * (canvas.width / r.width);
    const my = (e.clientY - r.top)  * (canvas.height / r.height);
    const n  = getHitNode(mx, my);
    hoveredId = n ? n.id : null;
    canvas.style.cursor = n ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', e => {
    const r  = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (canvas.width / r.width);
    const my = (e.clientY - r.top)  * (canvas.height / r.height);
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
    const mx = (t.clientX - r.left) * (canvas.width / r.width);
    const my = (t.clientY - r.top)  * (canvas.height / r.height);
    const n  = getHitNode(mx, my);
    if (n) showPanel(n);
  });

  resize();
  draw();
  window.addEventListener('resize', resize);

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
    const W = canvas.width, H = canvas.height;
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
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const maxR = Math.min(canvas.width, canvas.height) * 0.30;

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
      arch: ['Raw Query', 'Sentence Transformer', 'FAISS Index', 'Ranked Results'],
      bars: [
        { label: 'Retrieval Time Reduction', value: 70, display: '70%' },
        { label: 'Metabolite Coverage', value: 94, display: '100K+ metabolites' },
        { label: 'Cross-Platform Accuracy', value: 94, display: '94%' },
      ],
      stack: ['Python', 'Azure', 'FastAPI', 'FAISS', 'Sentence-Transformers', 'PostgreSQL'],
    },
    'nmr-quality': {
      title: 'NMR Signal Quality Model',
      cat: '🧠 Deep Learning · Signal Processing',
      problem: 'NMR instrument data contains noise artifacts, shimming errors, and baseline distortions that require expert manual review. With 200+ daily acquisitions, analyst bottleneck was causing 48-hour delays in clinical reporting.',
      arch: ['Raw FID Data', 'Feature Extraction', 'Deep Classifier', 'QC Report'],
      bars: [
        { label: 'Accuracy Gain vs Baseline', value: 35, display: '+35%' },
        { label: 'Manual Review Reduction', value: 72, display: '72%' },
        { label: 'Training Observations', value: 87, display: '10K+' },
      ],
      stack: ['Python', 'Deep Learning', 'nmrglue', 'scikit-learn', 'NumPy', 'NMR'],
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
      cat: '🔤 NLP · TensorFlow',
      problem: 'Cigna\'s IT service desk received 500+ daily ServiceNow incidents routed manually to teams. Manual routing accuracy was 30%, causing SLA breaches and 40% of tickets requiring re-assignment, wasting ~$2M/yr in labor.',
      arch: ['Raw Ticket', 'NLP Preprocessing', 'TF Classifier', 'Auto-Route'],
      bars: [
        { label: 'Routing Accuracy', value: 87, display: '87%' },
        { label: 'Mis-route Reduction', value: 85, display: '85%' },
        { label: 'Recall', value: 96, display: '96%' },
      ],
      stack: ['TensorFlow', 'NLP', 'Python', 'ServiceNow API', 'NLTK', 'Keras'],
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
          ${p.arch.map((a,i) => `<div class="modal-arch-node">${a}</div>${i < p.arch.length-1 ? '<span class="modal-arch-arrow">→</span>' : ''}`).join('')}
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
      <div class="modal-section">
        <h4>Tech Stack</h4>
        <div class="tl-tags" style="gap:8px">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
      </div>`;

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
