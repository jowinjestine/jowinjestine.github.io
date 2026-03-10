/* ============================================================
   JOWIN JESTINE — PORTFOLIO SCRIPTS
   Canvas animations, GSAP ScrollTrigger, typewriter, counters
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   HERO CANVAS — Network / data-graph particle field
   ============================================================ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  const ctx    = canvas.getContext('2d');
  const NODES  = 90;
  const RANGE  = 130;
  let nodes    = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < NODES; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r:  Math.random() * 1.8 + 0.8,
        hue: Math.random() > 0.6 ? 280 : 200, // purple or cyan
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < RANGE) {
          const a = (1 - dist / RANGE) * 0.3;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(56,189,248,${a})`;
          ctx.lineWidth   = 0.6;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach(n => {
      // Glow halo
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
      grd.addColorStop(0, `hsla(${n.hue},90%,72%,0.5)`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${n.hue},90%,80%,0.9)`;
      ctx.fill();

      // Move
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  resize();
  createNodes();
  draw();

  window.addEventListener('resize', () => { resize(); createNodes(); });
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
  const interactiveSelector = 'a, button, .project-card, .tl-card, .skill-card, .contact-card, .edu-card, .filter-tab';
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
