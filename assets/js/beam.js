function uid() {
  return 'ld-' + Math.random().toString(36).slice(2, 9);
}

function parseNum(id) {
  return parseFloat(document.getElementById(id).value);
}

function getSupportType() {
  return document.getElementById('bm-support').value;
}

function getLoads() {
  const rows = [...document.querySelectorAll('.bm-load-row')];
  return rows.map((row) => {
    const type = row.querySelector('.bm-load-type').value;
    const mag = parseFloat(row.querySelector('.bm-load-mag').value);
    const x1 = parseFloat(row.querySelector('.bm-load-x1').value);
    const x2 = parseFloat(row.querySelector('.bm-load-x2').value);
    return { type, mag, x1, x2 };
  });
}

function equivalentForces(loads) {
  let totalF = 0;
  let totalMA = 0;

  loads.forEach((l) => {
    if (l.type === 'point') {
      totalF += l.mag;
      totalMA += l.mag * l.x1;
    }
    if (l.type === 'udl') {
      const len = Math.max(0, l.x2 - l.x1);
      const f = l.mag * len;
      totalF += f;
      totalMA += f * (l.x1 + len / 2);
    }
    if (l.type === 'moment') {
      totalMA += l.mag;
    }
  });

  return { totalF, totalMA };
}

function reactions(L, support, loads) {
  const { totalF, totalMA } = equivalentForces(loads);

  if (support === 'simply') {
    const RB = totalMA / L;
    const RA = totalF - RB;
    return { RA, RB, MA: 0 };
  }

  return { RA: totalF, RB: 0, MA: totalMA };
}

function sectionProps() {
  const mode = document.getElementById('bm-sec-mode').value;

  if (mode === 'basic') {
    return {
      I: parseNum('bm-I-basic'),
      c: parseNum('bm-c-basic'),
      desc: 'Basic (I, c entered directly)'
    };
  }

  const shape = document.getElementById('bm-shape').value;
  if (shape === 'rect') {
    const b = parseNum('bm-r-b');
    const h = parseNum('bm-r-h');
    return { I: (b * h ** 3) / 12, c: h / 2, desc: `Rectangle ${b}×${h} mm` };
  }
  if (shape === 'circle') {
    const d = parseNum('bm-c-d');
    return { I: (Math.PI * d ** 4) / 64, c: d / 2, desc: `Solid circular Ø${d} mm` };
  }
  if (shape === 'hollow_circle') {
    const D = parseNum('bm-hc-D');
    const t = parseNum('bm-hc-t');
    const d = D - 2 * t;
    return { I: (Math.PI * (D ** 4 - d ** 4)) / 64, c: D / 2, desc: `Hollow circular Ø${D}×${t} mm` };
  }

  const h = parseNum('bm-i-h');
  const bf = parseNum('bm-i-bf');
  const tw = parseNum('bm-i-tw');
  const tf = parseNum('bm-i-tf');
  const webH = h - 2 * tf;
  const I = (tw * webH ** 3) / 12 + 2 * ((bf * tf ** 3) / 12 + bf * tf * (h / 2 - tf / 2) ** 2);
  return { I, c: h / 2, desc: `I-section h=${h}, bf=${bf}, tw=${tw}, tf=${tf} mm` };
}

function shearAt(x, r, loads) {
  let V = r.RA;
  loads.forEach((l) => {
    if (l.type === 'point' && x >= l.x1) V -= l.mag;
    if (l.type === 'udl') {
      const covered = Math.max(0, Math.min(x, l.x2) - l.x1);
      V -= l.mag * covered;
    }
  });
  return V;
}

function momentAt(x, r, loads, support) {
  let M = support === 'cantilever' ? -r.MA : 0;
  M += r.RA * x;

  loads.forEach((l) => {
    if (l.type === 'point' && x >= l.x1) M -= l.mag * (x - l.x1);
    if (l.type === 'udl') {
      const covered = Math.max(0, Math.min(x, l.x2) - l.x1);
      if (covered > 0) {
        const f = l.mag * covered;
        M -= f * (x - (l.x1 + covered / 2));
      }
    }
    if (l.type === 'moment' && x >= l.x1) M -= l.mag;
  });

  return M;
}

function solveProfiles(L, support, loads) {
  const n = 300;
  const dx = L / n;
  const r = reactions(L, support, loads);

  const xs = [];
  const Vs = [];
  const Ms = [];

  for (let i = 0; i <= n; i += 1) {
    const x = i * dx;
    xs.push(x);
    Vs.push(shearAt(x, r, loads));
    Ms.push(momentAt(x, r, loads, support));
  }

  if (support === 'simply') {
    for (let i = 0; i <= n; i += 1) {
      Vs[i] += i === n ? -r.RB : 0;
    }
  }

  return { xs, Vs, Ms, r, dx };
}

function solveDeflection(xs, Ms, E, I, support) {
  const n = xs.length - 1;
  const dx = xs[1] - xs[0];
  const kappa = Ms.map((m) => (m * 1000) / (E * I));

  function integrateWithSlope(slope0) {
    const theta = new Array(n + 1).fill(0);
    const y = new Array(n + 1).fill(0);
    theta[0] = slope0;
    y[0] = 0;

    for (let i = 1; i <= n; i += 1) {
      theta[i] = theta[i - 1] + 0.5 * (kappa[i - 1] + kappa[i]) * dx;
      y[i] = y[i - 1] + 0.5 * (theta[i - 1] + theta[i]) * dx;
    }
    return { y, theta };
  }

  if (support === 'cantilever') return integrateWithSlope(0).y;

  const y0 = integrateWithSlope(0).y;
  const y1 = integrateWithSlope(1).y;
  const slope = -y0[n] / (y1[n] - y0[n]);
  return integrateWithSlope(slope).y;
}

function drawLoadsAndBeam(canvas, L, support, loads, r) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const x0 = 40;
  const x1 = w - 30;
  const y = h * 0.55;
  const sx = (x) => x0 + (x / L) * (x1 - x0);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a1209';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();

  ctx.fillStyle = '#4a3f2f';
  if (support === 'simply') {
    ctx.beginPath();
    ctx.moveTo(x0, y + 2);
    ctx.lineTo(x0 - 13, y + 18);
    ctx.lineTo(x0 + 13, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x1, y + 14, 9, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    ctx.fillRect(x0 - 16, y - 32, 16, 64);
  }

  loads.forEach((l) => {
    ctx.strokeStyle = '#8b3a0f';
    ctx.fillStyle = '#8b3a0f';
    if (l.type === 'point') {
      const x = sx(l.x1);
      ctx.beginPath();
      ctx.moveTo(x, y - 56);
      ctx.lineTo(x, y - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 16);
      ctx.lineTo(x, y - 6);
      ctx.lineTo(x + 6, y - 16);
      ctx.fill();
    }
    if (l.type === 'udl') {
      const xa = sx(l.x1);
      const xb = sx(l.x2);
      ctx.strokeRect(xa, y - 62, xb - xa, 8);
      for (let x = xa + 6; x < xb; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, y - 54);
        ctx.lineTo(x, y - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 18);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x + 4, y - 18);
        ctx.fill();
      }
    }
    if (l.type === 'moment') {
      const x = sx(l.x1);
      ctx.beginPath();
      ctx.arc(x, y - 30, 14, -Math.PI / 2, (Math.PI * 1.3));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 45);
      ctx.lineTo(x + 10, y - 47);
      ctx.lineTo(x + 8, y - 39);
      ctx.fill();
    }
  });

  ctx.fillStyle = '#1a3a6b';
  ctx.font = '12px monospace';
  ctx.fillText(`RA=${r.RA.toFixed(2)} kN`, x0 + 6, y + 34);
  if (support === 'simply') ctx.fillText(`RB=${r.RB.toFixed(2)} kN`, x1 - 86, y + 34);
  if (support === 'cantilever') ctx.fillText(`MA=${r.MA.toFixed(2)} kN·m`, x0 + 6, y + 50);
}

function drawDiagram(canvas, xs, ys, color, title) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const x0 = 38;
  const y0 = h * 0.5;
  const x1 = w - 16;
  const top = 26;
  const bot = h - 20;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const maxAbs = Math.max(1e-9, Math.abs(minY), Math.abs(maxY));

  const sx = (x) => x0 + (x / xs[xs.length - 1]) * (x1 - x0);
  const sy = (v) => y0 - (v / maxAbs) * ((y0 - top) * 0.9);

  ctx.strokeStyle = '#9a8e7f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx(xs[0]), sy(ys[0]));
  for (let i = 1; i < xs.length; i += 1) ctx.lineTo(sx(xs[i]), sy(ys[i]));
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '12px monospace';
  ctx.fillText(title, x0, 16);
  ctx.fillText(`max: ${maxY.toFixed(2)} | min: ${minY.toFixed(2)}`, x0 + 120, 16);
  ctx.fillStyle = '#4a3f2f';
  ctx.fillText('0', x0 - 18, y0 + 4);
  ctx.fillText(xs[xs.length - 1].toFixed(2) + ' m', x1 - 42, bot);
}

function writeLoadRows() {
  const tbody = document.getElementById('bm-load-body');
  tbody.innerHTML = '';

  const defaults = [
    { id: uid(), type: 'point', mag: 10, x1: 2, x2: 2 }
  ];

  defaults.forEach((l) => addLoadRow(l));
}

export function addLoadRow(load = null) {
  const l = load || { id: uid(), type: 'point', mag: 5, x1: 1, x2: 2 };
  const tbody = document.getElementById('bm-load-body');
  const tr = document.createElement('tr');
  tr.className = 'bm-load-row';
  tr.innerHTML = `
    <td>
      <select class="bm-load-type">
        <option value="point" ${l.type === 'point' ? 'selected' : ''}>Point load (kN)</option>
        <option value="udl" ${l.type === 'udl' ? 'selected' : ''}>UDL (kN/m)</option>
        <option value="moment" ${l.type === 'moment' ? 'selected' : ''}>Moment (kN·m)</option>
      </select>
    </td>
    <td><input class="bm-load-mag" type="number" step="0.1" value="${l.mag}"></td>
    <td><input class="bm-load-x1" type="number" step="0.1" value="${l.x1}"></td>
    <td><input class="bm-load-x2" type="number" step="0.1" value="${l.x2}"></td>
    <td><button type="button" class="calc-btn" style="padding:0.25rem 0.7rem" onclick="removeLoadRow(this)">✕</button></td>
  `;
  tbody.appendChild(tr);
}

export function removeLoadRow(btn) {
  btn.closest('tr').remove();
}

export function updateBeamSectionMode() {
  const mode = document.getElementById('bm-sec-mode').value;
  document.getElementById('bm-basic-sec').style.display = mode === 'basic' ? 'grid' : 'none';
  document.getElementById('bm-adv-sec').style.display = mode === 'advanced' ? 'grid' : 'none';
}

export function updateBeamSectionDims() {
  const shape = document.getElementById('bm-shape').value;
  document.querySelectorAll('.bm-shape-group').forEach((el) => {
    el.style.display = el.dataset.shape === shape ? 'contents' : 'none';
  });
}

export function calcBeam() {
  const L = parseNum('bm-L');
  const E = parseNum('bm-E') * 1e9;
  const support = getSupportType();
  const loads = getLoads().filter((l) => !Number.isNaN(l.mag) && !Number.isNaN(l.x1));

  const clippedLoads = loads.map((l) => ({
    ...l,
    x1: Math.max(0, Math.min(L, l.x1)),
    x2: Math.max(0, Math.min(L, l.x2))
  }));

  const sec = sectionProps();
  const I = sec.I * 1e-12;
  const c = sec.c / 1000;

  const { xs, Vs, Ms, r } = solveProfiles(L, support, clippedLoads);
  const ys = solveDeflection(xs, Ms, E, I, support);

  const Vmax = Math.max(...Vs.map((v) => Math.abs(v)));
  const Mmax = Math.max(...Ms.map((m) => Math.abs(m)));
  const ymax = Math.max(...ys.map((yy) => Math.abs(yy))) * 1000;
  const sigmaMax = (Mmax * 1000 * c) / I / 1e6;

  document.getElementById('bm-RA').textContent = r.RA.toFixed(3);
  document.getElementById('bm-RB').textContent = r.RB.toFixed(3);
  document.getElementById('bm-MA').textContent = r.MA.toFixed(3);
  document.getElementById('bm-Vmax').textContent = Vmax.toFixed(3);
  document.getElementById('bm-Mmax').textContent = Mmax.toFixed(3);
  document.getElementById('bm-ymax').textContent = ymax.toFixed(3);
  document.getElementById('bm-sigma-max').textContent = sigmaMax.toFixed(3);

  drawLoadsAndBeam(document.getElementById('bm-canvas-load'), L, support, clippedLoads, r);
  drawDiagram(document.getElementById('bm-canvas-sfd'), xs, Vs, '#8b3a0f', 'SFD (kN)');
  drawDiagram(document.getElementById('bm-canvas-bmd'), xs, Ms, '#1a3a6b', 'BMD (kN·m)');

  const st = document.getElementById('bm-status');
  st.className = 'status-strip info';
  st.textContent = `${support === 'simply' ? 'Simply supported' : 'Cantilever'} | ${clippedLoads.length} loads | ${sec.desc}`;

  document.getElementById('bm-results').classList.add('show');
}

export function initBeam() {
  writeLoadRows();
  updateBeamSectionMode();
  updateBeamSectionDims();
}
