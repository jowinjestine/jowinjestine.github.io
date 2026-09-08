/* ═══════════════════════════════════════════════════════════════════════
   Two behaviours only: draw the spectrum, and fill in repo commit counts.
   Everything else on this page is HTML and CSS on purpose.
   ═══════════════════════════════════════════════════════════════════════ */

(function spectrum() {
  const canvas = document.getElementById('spectrum');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  /* Real proton shifts from a urine spectrum. The gap either side of
     4.7 ppm is where the water resonance is suppressed, which is why a
     urine spectrum has a hole in the middle rather than its tallest peak. */
  const PEAKS = [
    { ppm: 8.46, h: 0.42, w: 0.010, label: 'Formate' },
    { ppm: 7.83, h: 0.30, w: 0.012, label: 'Histidine' },
    { ppm: 7.64, h: 0.38, w: 0.013, label: 'Hippurate' },
    { ppm: 7.55, h: 0.24, w: 0.011 },
    { ppm: 4.06, h: 0.34, w: 0.012 },
    { ppm: 3.57, h: 0.46, w: 0.011, label: 'Glycine' },
    { ppm: 3.04, h: 0.78, w: 0.010, label: 'Creatinine' },
    { ppm: 2.67, h: 0.62, w: 0.012, label: 'Citrate' },
    { ppm: 2.55, h: 0.54, w: 0.012 },
    { ppm: 2.45, h: 0.36, w: 0.013, label: 'Glutamine' },
    { ppm: 1.92, h: 0.44, w: 0.011, label: 'Acetate' },
    { ppm: 1.48, h: 0.58, w: 0.010, label: 'Alanine' },
    { ppm: 1.33, h: 1.00, w: 0.010, label: 'Lactate' },
    { ppm: 0.95, h: 0.50, w: 0.014, label: 'Valine, leucine' },
  ];

  const PPM_HI = 9.2;
  const PPM_LO = 0.3;
  const INK = '#17191c';
  const RULE = '#d9dad4';
  const FAINT = '#6b7178';

  let W = 0, H = 0, dpr = 1;
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

  function draw(progress) {
    ctx.clearRect(0, 0, W, H);

    const base = H - PAD.b;
    const plotH = base - PAD.t;
    const cut = PAD.l + (W - PAD.l - PAD.r) * progress;

    /* Axis: integer ticks, high shift on the left, as spectra are plotted. */
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

    /* The trace itself. */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cut, H);
    ctx.clip();

    ctx.beginPath();
    const step = 0.5;
    for (let x = PAD.l; x <= W - PAD.r; x += step) {
      const ppm = PPM_HI - ((x - PAD.l) / (W - PAD.l - PAD.r)) * (PPM_HI - PPM_LO);
      const y = base - Math.min(intensityAt(ppm), 1.08) * plotH * 0.92;
      if (x === PAD.l) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    /* Labels, with a leader line up from the peak. Peaks between roughly
       1 and 3 ppm sit close together, so labels are lifted onto a second
       row when a neighbour is too near to share one. */
    ctx.font = '400 10.5px "Instrument Sans", system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';

    const labelled = PEAKS.filter(p => p.label).map(p => ({
      p,
      x: xOf(p.ppm),
      peakY: base - Math.min(intensityAt(p.ppm), 1.08) * plotH * 0.92,
      w: ctx.measureText(p.label).width,
    }));

    let prev = null;
    for (const L of labelled) {
      const crowded = prev && (L.x - L.w / 2) < (prev.x + prev.w / 2 + 10);
      L.row = crowded && prev.row === 0 ? 1 : 0;
      prev = L;
    }

    for (const L of labelled) {
      if (L.x > cut) continue;
      const labY = Math.max(13, L.peakY - 12 - L.row * 15);
      ctx.strokeStyle = RULE;
      ctx.beginPath();
      ctx.moveTo(L.x, L.peakY - 3);
      ctx.lineTo(L.x, labY + 3);
      ctx.stroke();
      ctx.fillStyle = FAINT;
      ctx.textAlign = L.x > W - 80 ? 'right' : 'center';
      ctx.fillText(L.p.label, L.x, labY);
    }
    ctx.restore();
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run() {
    measure();
    if (still) { draw(1); return; }
    const t0 = performance.now();
    const dur = 1150;
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      /* Ease out; an acquisition sweeps and settles. */
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
        slot.textContent = when
          ? `${r.commits} commits, last ${when}`
          : `${r.commits} commits`;
      }
    })
    .catch(() => { /* the page reads fine without these */ });
})();
