const BEAM_CASES = {
  simply_point_center: {
    label: 'Simply supported + center point load',
    loadUnit: 'kN',
    showA: false,
    reactions: (L, P) => ({ RA: P / 2, RB: P / 2 }),
    maxShear: (L, P) => P / 2,
    maxMoment: (L, P) => (P * L) / 4,
    deflection: (L, P, E, I) => (P * Math.pow(L, 3)) / (48 * E * I),
    points: (L, P) => [
      { x: 0, V: P / 2, M: 0 },
      { x: L / 2, V: -P / 2, M: (P * L) / 4 },
      { x: L, V: -P / 2, M: 0 }
    ]
  },
  simply_point_offset: {
    label: 'Simply supported + eccentric point load',
    loadUnit: 'kN',
    showA: true,
    reactions: (L, P, a) => ({ RA: (P * (L - a)) / L, RB: (P * a) / L }),
    maxShear: (L, P, a) => Math.max((P * (L - a)) / L, (P * a) / L),
    maxMoment: (L, P, a) => (P * a * (L - a)) / L,
    deflection: (L, P, E, I, a) => {
      const b = L - a;
      const c1 = (P * b * a) / (6 * L * E * I);
      return c1 * Math.sqrt(a * b * (L + Math.min(a, b)));
    },
    points: (L, P, a) => {
      const RA = (P * (L - a)) / L;
      const RB = (P * a) / L;
      return [
        { x: 0, V: RA, M: 0 },
        { x: a, V: RA - P, M: RA * a },
        { x: L, V: -RB, M: 0 }
      ];
    }
  },
  simply_udl_full: {
    label: 'Simply supported + full-span UDL',
    loadUnit: 'kN/m',
    showA: false,
    reactions: (L, w) => ({ RA: (w * L) / 2, RB: (w * L) / 2 }),
    maxShear: (L, w) => (w * L) / 2,
    maxMoment: (L, w) => (w * L * L) / 8,
    deflection: (L, w, E, I) => (5 * w * Math.pow(L, 4)) / (384 * E * I),
    points: (L, w) => [
      { x: 0, V: (w * L) / 2, M: 0 },
      { x: L / 2, V: 0, M: (w * L * L) / 8 },
      { x: L, V: -(w * L) / 2, M: 0 }
    ]
  },
  cantilever_end_point: {
    label: 'Cantilever + end point load',
    loadUnit: 'kN',
    showA: false,
    reactions: (L, P) => ({ RA: P, RB: 0 }),
    maxShear: (L, P) => P,
    maxMoment: (L, P) => P * L,
    deflection: (L, P, E, I) => (P * Math.pow(L, 3)) / (3 * E * I),
    points: (L, P) => [
      { x: 0, V: P, M: -P * L },
      { x: L, V: 0, M: 0 }
    ]
  },
  cantilever_udl_full: {
    label: 'Cantilever + full-span UDL',
    loadUnit: 'kN/m',
    showA: false,
    reactions: (L, w) => ({ RA: w * L, RB: 0 }),
    maxShear: (L, w) => w * L,
    maxMoment: (L, w) => (w * L * L) / 2,
    deflection: (L, w, E, I) => (w * Math.pow(L, 4)) / (8 * E * I),
    points: (L, w) => [
      { x: 0, V: w * L, M: -(w * L * L) / 2 },
      { x: L, V: 0, M: 0 }
    ]
  },
  fixed_udl_full: {
    label: 'Fixed-fixed + full-span UDL',
    loadUnit: 'kN/m',
    showA: false,
    reactions: (L, w) => ({ RA: (w * L) / 2, RB: (w * L) / 2 }),
    maxShear: (L, w) => (w * L) / 2,
    maxMoment: (L, w) => (w * L * L) / 12,
    deflection: (L, w, E, I) => (w * Math.pow(L, 4)) / (384 * E * I),
    points: (L, w) => [
      { x: 0, V: (w * L) / 2, M: -(w * L * L) / 12 },
      { x: L / 2, V: 0, M: (w * L * L) / 24 },
      { x: L, V: -(w * L) / 2, M: -(w * L * L) / 12 }
    ]
  }
};

export function updateBeamLoadInputs() {
  const type = document.getElementById('bm-type').value;
  const cfg = BEAM_CASES[type];
  document.getElementById('bm-load-unit').textContent = cfg.loadUnit;
  document.getElementById('bm-a-wrap').style.display = cfg.showA ? 'flex' : 'none';
}

export function updateBeamSectionMode() {
  const mode = document.getElementById('bm-sec-mode').value;
  document.getElementById('bm-basic-sec').style.display = mode === 'basic' ? 'grid' : 'none';
  document.getElementById('bm-adv-sec').style.display = mode === 'advanced' ? 'grid' : 'none';
}

export function updateBeamSectionDims() {
  const shape = document.getElementById('bm-shape').value;
  const groups = document.querySelectorAll('.bm-shape-group');
  groups.forEach((el) => {
    el.style.display = el.dataset.shape === shape ? 'contents' : 'none';
  });
}

function getSectionProps() {
  const mode = document.getElementById('bm-sec-mode').value;

  if (mode === 'basic') {
    const I = parseFloat(document.getElementById('bm-I-basic').value);
    const c = parseFloat(document.getElementById('bm-c-basic').value);
    return { I, c, desc: 'Basic (direct I, c)' };
  }

  const shape = document.getElementById('bm-shape').value;
  if (shape === 'rect') {
    const b = parseFloat(document.getElementById('bm-r-b').value);
    const h = parseFloat(document.getElementById('bm-r-h').value);
    return { I: (b * Math.pow(h, 3)) / 12, c: h / 2, desc: `Rectangle ${b}×${h} mm` };
  }
  if (shape === 'circle') {
    const d = parseFloat(document.getElementById('bm-c-d').value);
    return { I: (Math.PI * Math.pow(d, 4)) / 64, c: d / 2, desc: `Solid circular Ø${d} mm` };
  }
  if (shape === 'hollow_circle') {
    const D = parseFloat(document.getElementById('bm-hc-D').value);
    const t = parseFloat(document.getElementById('bm-hc-t').value);
    const d = D - 2 * t;
    return { I: (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4))) / 64, c: D / 2, desc: `Hollow circular Ø${D}×${t} mm` };
  }

  const h = parseFloat(document.getElementById('bm-i-h').value);
  const bf = parseFloat(document.getElementById('bm-i-bf').value);
  const tw = parseFloat(document.getElementById('bm-i-tw').value);
  const tf = parseFloat(document.getElementById('bm-i-tf').value);
  const webH = h - 2 * tf;
  const I = (tw * Math.pow(webH, 3)) / 12 + 2 * ((bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((h / 2 - tf / 2), 2));
  return { I, c: h / 2, desc: `I-section h=${h}, bf=${bf}, tw=${tw}, tf=${tf} mm` };
}

export function calcBeam() {
  const L = parseFloat(document.getElementById('bm-L').value);
  const load = parseFloat(document.getElementById('bm-load').value);
  const a = parseFloat(document.getElementById('bm-a').value);
  const E = parseFloat(document.getElementById('bm-E').value) * 1e9;
  const type = document.getElementById('bm-type').value;
  const cfg = BEAM_CASES[type];

  const sec = getSectionProps();
  const I = sec.I * 1e-12;
  const c = sec.c / 1000;

  const { RA, RB } = cfg.reactions(L, load, a);
  const Vmax = cfg.maxShear(L, load, a);
  const Mmax = cfg.maxMoment(L, load, a);
  const yMax = cfg.deflection(L, load, E, I, a) * 1000;
  const sigmaMax = (Mmax * 1000 * c) / I / 1e6;

  document.getElementById('bm-RA').textContent = RA.toFixed(3);
  document.getElementById('bm-RB').textContent = RB.toFixed(3);
  document.getElementById('bm-Vmax').textContent = Vmax.toFixed(3);
  document.getElementById('bm-Mmax').textContent = Mmax.toFixed(3);
  document.getElementById('bm-ymax').textContent = yMax.toFixed(3);
  document.getElementById('bm-sigma-max').textContent = sigmaMax.toFixed(3);

  const pointRows = cfg.points(L, load, a)
    .map((p) => `x=${p.x.toFixed(3)} m → V=${p.V.toFixed(3)} kN, M=${p.M.toFixed(3)} kN·m`)
    .join('<br>');

  const st = document.getElementById('bm-status');
  st.className = 'status-strip info';
  st.innerHTML = `${cfg.label} | ${sec.desc}<br>${pointRows}`;

  document.getElementById('bm-results').classList.add('show');
}
