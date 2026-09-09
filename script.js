/* ═══════════════════════════════════════════════════════════════════════
   Four behaviours: draw and explain the spectrum, jump to a case study
   from the failure list, start figure animations when they come into view,
   and fill in repo commit counts. Everything else here is HTML and CSS.
   ═══════════════════════════════════════════════════════════════════════ */

(function spectrum() {
  const canvas = document.getElementById('spectrum');
  const readout = document.getElementById('readout');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  /* Real proton shifts from a urine spectrum. The gap either side of
     4.7 ppm is where the water resonance is suppressed, which is why a
     urine spectrum has a hole in the middle rather than its tallest peak. */
  const PEAKS = [
    { ppm: 8.46, h: 0.42, w: 0.010, label: 'Formate',
      note: 'A one-carbon metabolite, and the sharp singlet at the high-shift end of the spectrum.' },
    { ppm: 7.83, h: 0.30, w: 0.012, label: 'Histidine',
      note: 'An essential amino acid. Its aromatic protons sit in the crowded region between seven and eight.' },
    { ppm: 7.64, h: 0.38, w: 0.013, label: 'Hippurate',
      note: 'A co-metabolite of gut microbes and diet, and one of the most abundant signals in urine.' },
    { ppm: 7.55, h: 0.24, w: 0.011 },
    { ppm: 4.06, h: 0.34, w: 0.012 },
    { ppm: 3.57, h: 0.46, w: 0.011, label: 'Glycine',
      note: 'The simplest amino acid, and a single strong resonance.' },
    { ppm: 3.04, h: 0.78, w: 0.010, label: 'Creatinine',
      note: 'A muscle breakdown product, and the routine clinical reference for kidney function. It is the comparator in the published work further down this page.' },
    { ppm: 2.67, h: 0.62, w: 0.012, label: 'Citrate',
      note: 'An intermediate of the citric acid cycle. The coupled pair sits either side of 2.6.' },
    { ppm: 2.55, h: 0.54, w: 0.012 },
    { ppm: 2.45, h: 0.36, w: 0.013, label: 'Glutamine',
      note: 'An amino acid whose multiplets overlap several neighbours, which is what makes this stretch hard to resolve.' },
    { ppm: 1.92, h: 0.44, w: 0.011, label: 'Acetate',
      note: 'A short-chain fatty acid, largely microbial in origin.' },
    { ppm: 1.48, h: 0.58, w: 0.010, label: 'Alanine',
      note: 'An amino acid, and a clean doublet.' },
    { ppm: 1.33, h: 1.00, w: 0.010, label: 'Lactate',
      note: 'Usually the tallest peak in this half of the spectrum, and a doublet.' },
    { ppm: 0.95, h: 0.50, w: 0.014, label: 'Valine, leucine',
      note: 'Branched-chain amino acids at the low-shift end, where the aliphatic signals sit.' },
  ];
  const NAMED = PEAKS.filter(p => p.label);

  const PPM_HI = 9.2;
  const PPM_LO = 0.3;
  const INK = '#17191c';
  const RULE = '#d9dad4';
  const FAINT = '#6b7178';
  const ACCENT = '#3a3486';

  let W = 0, H = 0, dpr = 1, progress = 0, active = -1;
  const PAD = { t: 34, r: 8, b: 30, l: 8 };

  const xOf = ppm => PAD.l + ((PPM_HI - ppm) / (PPM_HI - PPM_LO)) * (W - PAD.l - PAD.r);

  /* Sum of Lorentzians, which is the shape an NMR line actually has. */
  function intensityAt(ppm) {
    let y = 0;
    for (const p of PEAKS) {
      const d = (ppm - p.ppm) / p.w;
      y += p.h / (1 + d * d);
    }
    return y;
  }

  function measure() {
    const cssW = canvas.parentElement.clientWidth;
    const cssH = Math.max(190, Math.min(300, Math.round(cssW * 0.24)));
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = cssW;
    H = cssH;
  }

  const peakY = (p, base, plotH) =>
    base - Math.min(intensityAt(p.ppm), 1.08) * plotH * 0.92;

  function draw(t) {
    progress = t;
    ctx.clearRect(0, 0, W, H);

    const base = H - PAD.b;
    const plotH = base - PAD.t;
    const cut = PAD.l + (W - PAD.l - PAD.r) * t;

    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, base + 0.5);
    ctx.lineTo(W - PAD.r, base + 0.5);
    ctx.stroke();

    ctx.fillStyle = FAINT;
    ctx.font = '400 10.5px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let ppm = 9; ppm >= 1; ppm -= 1) {
      const x = xOf(ppm);
      ctx.strokeStyle = RULE;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x, base + 4);
      ctx.stroke();
      ctx.fillText(String(ppm), x, base + 8);
    }
    ctx.textAlign = 'right';
    ctx.fillText('ppm', W - PAD.r, base + 8);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cut, H);
    ctx.clip();

    ctx.beginPath();
    for (let x = PAD.l; x <= W - PAD.r; x += 0.5) {
      const ppm = PPM_HI - ((x - PAD.l) / (W - PAD.l - PAD.r)) * (PPM_HI - PPM_LO);
      const y = base - Math.min(intensityAt(ppm), 1.08) * plotH * 0.92;
      if (x === PAD.l) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    /* Labels, lifted onto a second row where neighbours crowd. The active
       peak is drawn in the accent with a marker on the trace. */
    ctx.textBaseline = 'alphabetic';
    ctx.font = '400 10.5px "Instrument Sans", system-ui, sans-serif';
    const labelled = NAMED.map(p => ({
      p, x: xOf(p.ppm), y: peakY(p, base, plotH), w: ctx.measureText(p.label).width,
    }));
    let prev = null;
    for (const L of labelled) {
      L.row = prev && (L.x - L.w / 2) < (prev.x + prev.w / 2 + 10) && prev.row === 0 ? 1 : 0;
      prev = L;
    }
    for (let i = 0; i < labelled.length; i++) {
      const L = labelled[i];
      if (L.x > cut) continue;
      const on = i === active;
      const labY = Math.max(13, L.y - 12 - L.row * 15);
      ctx.strokeStyle = on ? ACCENT : RULE;
      ctx.lineWidth = on ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y - 3);
      ctx.lineTo(L.x, labY + 3);
      ctx.stroke();
      if (on) {
        ctx.beginPath();
        ctx.arc(L.x, L.y - 7, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
      }
      ctx.fillStyle = on ? ACCENT : FAINT;
      ctx.font = (on ? '500 ' : '400 ') + '10.5px "Instrument Sans", system-ui, sans-serif';
      ctx.textAlign = L.x > W - 80 ? 'right' : 'center';
      ctx.fillText(L.p.label, L.x, labY);
    }
    ctx.restore();
  }

  /* ── The readout is the reason the canvas is interactive at all ─────── */
  const HINT = '<p class="readout-hint">Point at a peak, or press the arrow keys, to see what it is.</p>';

  function show(i) {
    if (i === active) return;
    active = i;
    if (readout) {
      if (i < 0) {
        readout.innerHTML = HINT;
      } else {
        const p = NAMED[i];
        readout.innerHTML =
          '<p class="readout-body"><span class="readout-name">' + p.label + '</span>' +
          '<span class="readout-ppm">' + p.ppm.toFixed(2) + ' ppm</span>' +
          '<span class="readout-note">' + p.note + '</span></p>';
      }
    }
    draw(progress || 1);
  }

  function nearest(clientX) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (W / r.width);
    let best = -1, bestD = 34;
    for (let i = 0; i < NAMED.length; i++) {
      const d = Math.abs(xOf(NAMED[i].ppm) - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  canvas.addEventListener('pointermove', e => show(nearest(e.clientX)));
  canvas.addEventListener('pointerleave', () => show(-1));
  canvas.addEventListener('pointerdown', e => { canvas.focus(); show(nearest(e.clientX)); });
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      show(Math.min(NAMED.length - 1, active + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      show(active <= 0 ? 0 : active - 1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      show(-1);
    }
  });

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run() {
    measure();
    if (still) { draw(1); return; }
    const t0 = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - t0) / 1150);
      draw(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(frame);
    })(t0);
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { measure(); draw(1); }, 140);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  else run();
})();


/* ── Question-first work section ──────────────────────────────────────
   The case studies start hidden, but only because this code is running and
   can bring them back. Without JavaScript nothing is hidden at all. ──── */
(function focusWork() {
  const work = document.getElementById('work');
  if (!work) return;
  const buttons = Array.from(work.querySelectorAll('.failure-list button[data-case]'));
  const entries = Array.from(work.querySelectorAll('.entry'));
  if (!buttons.length || !entries.length) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const how = still ? 'auto' : 'smooth';

  work.classList.add('focus');
  /* One click should reach the writing, so the disclosure is already open. */
  for (const e of entries) {
    for (const d of e.querySelectorAll('details')) d.open = true;
  }

  function setActive(id) {
    for (const b of buttons) {
      const on = b.dataset.case === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
  }

  function reveal(id, scroll) {
    let found = null;
    for (const e of entries) {
      const on = e.id === id;
      e.classList.toggle('shown', on);
      if (on) found = e;
    }
    setActive(id);
    if (found && scroll) found.scrollIntoView({ behavior: how, block: 'start' });
    return found;
  }

  function showAll() {
    for (const e of entries) e.classList.add('shown');
    setActive(null);
    entries[0].scrollIntoView({ behavior: how, block: 'start' });
  }

  function collapse() {
    for (const e of entries) e.classList.remove('shown');
    setActive(null);
    const list = work.querySelector('.failures');
    if (list) list.scrollIntoView({ behavior: how, block: 'start' });
  }

  for (const b of buttons) {
    b.setAttribute('aria-controls', b.dataset.case);
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => reveal(b.dataset.case, true));
  }
  for (const b of work.querySelectorAll('.show-all')) b.addEventListener('click', showAll);
  for (const b of work.querySelectorAll('.start-here')) {
    b.addEventListener('click', () => reveal(b.dataset.case, true));
  }
  for (const b of work.querySelectorAll('.back-to-list')) b.addEventListener('click', collapse);

  /* A link straight to a case study still works. */
  const hash = location.hash.replace('#', '');
  if (hash && entries.some(e => e.id === hash)) reveal(hash, false);
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (entries.some(e => e.id === id)) reveal(id, true);
  });
})();


/* ── Project gallery: one screen at a time, moved only on request ────── */
(function gallery() {
  const navs = document.querySelectorAll('.gallery-nav button[data-g]');
  if (!navs.length) return;

  function sync(track) {
    const max = track.scrollWidth - track.clientWidth - 2;
    const scrollable = track.scrollWidth > track.clientWidth + 2;
    for (const b of document.querySelectorAll('.gallery-nav button[data-g="' + track.id + '"]')) {
      const back = Number(b.dataset.dir) < 0;
      b.disabled = back ? track.scrollLeft <= 2 : track.scrollLeft >= max;
      /* At wide widths every screen fits at once, so the controls would be
         two permanently dead buttons. Hide them until they mean something. */
      const nav = b.closest('.gallery-nav');
      if (nav) nav.hidden = !scrollable;
    }
  }

  const tracks = new Set();
  for (const b of navs) {
    const track = document.getElementById(b.dataset.g);
    if (!track) continue;
    tracks.add(track);
    b.addEventListener('click', () => {
      const first = track.querySelector('figure');
      const step = first ? first.getBoundingClientRect().width + 16 : track.clientWidth;
      track.scrollBy({ left: step * Number(b.dataset.dir), behavior: 'smooth' });
    });
  }
  for (const t of tracks) {
    sync(t);
    t.addEventListener('scroll', () => sync(t), { passive: true });
    window.addEventListener('resize', () => sync(t));
  }
})();


/* ── Steppable figures. Nothing animates on its own; a step highlights the
      path it describes and explains it. Clicking the active step clears it. ── */
(function figureSteps() {
  for (const fig of document.querySelectorAll('.fig[data-step]')) {
    const note = fig.querySelector('.step-note');
    const buttons = Array.from(fig.querySelectorAll('.steps button'));
    if (!buttons.length) continue;

    for (const b of buttons) {
      b.addEventListener('click', () => {
        const alreadyOn = fig.dataset.step === b.dataset.step;
        fig.dataset.step = alreadyOn ? '0' : b.dataset.step;
        for (const other of buttons) {
          other.setAttribute('aria-pressed', String(!alreadyOn && other === b));
        }
        if (note) note.textContent = alreadyOn ? '' : (b.dataset.note || '');
      });
    }
  }
})();


/* ── Commit counts for the two public repositories ───────────────────── */
(function repoStats() {
  const slots = document.querySelectorAll('.repo-stat[data-repo]');
  if (!slots.length) return;

  fetch('stats.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(data => {
      const by = new Map((data.repos || []).map(r => [r.name, r]));
      for (const slot of slots) {
        const r = by.get(slot.dataset.repo);
        if (!r || !r.available || !r.commits) continue;
        const when = r.lastCommitAt
          ? new Date(r.lastCommitAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
          : null;
        slot.textContent = when ? r.commits + ' commits, last ' + when : r.commits + ' commits';
      }
    })
    .catch(() => { /* the page reads fine without these */ });
})();
