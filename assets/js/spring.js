export const springMatDB = {
  'hard-drawn': { G: 79.3, rho_mat: 7850 },
  'chrome-vanadate': { G: 77.2, rho_mat: 7850 },
  stainless: { G: 68.9, rho_mat: 7900 },
  phosphor: { G: 41.4, rho_mat: 8900 }
};

export function updateSpringMat() {
  const sel = document.getElementById('sp-mat').value;
  document.getElementById('sp-G').value = springMatDB[sel].G;
}

export function calcSpring() {
  const d = parseFloat(document.getElementById('sp-d').value);
  const D = parseFloat(document.getElementById('sp-D').value);
  const Na = parseFloat(document.getElementById('sp-Na').value);
  const L0 = parseFloat(document.getElementById('sp-L0').value);
  const F = parseFloat(document.getElementById('sp-F').value);
  const G = parseFloat(document.getElementById('sp-G').value) * 1000;
  const tauAll = parseFloat(document.getElementById('sp-tau-all').value);

  const C = D / d;
  const Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
  const k = (G * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * Na);
  const delta = F / k;
  const tau = Kw * 8 * F * D / (Math.PI * Math.pow(d, 3));
  const Hs = (Na + 2) * d;
  const rhoMat = springMatDB[document.getElementById('sp-mat').value]?.rho_mat || 7850;
  const fn =
    (d / 1000) / (Math.PI * Math.pow(D / 1000, 2) * Na) * Math.sqrt((G * 1e6) / (2 * rhoMat));

  const SF = tauAll / tau;

  document.getElementById('sp-C').textContent = C.toFixed(2);
  document.getElementById('sp-Kw').textContent = Kw.toFixed(4);
  document.getElementById('sp-k').textContent = k.toFixed(3);
  document.getElementById('sp-tau').textContent = tau.toFixed(1);
  document.getElementById('sp-delta').textContent = delta.toFixed(2);
  document.getElementById('sp-Hs').textContent = Hs.toFixed(1);
  document.getElementById('sp-fn').textContent = fn.toFixed(1);
  document.getElementById('sp-SF').textContent = SF.toFixed(2);

  const st = document.getElementById('sp-status');
  const msgs = [];
  if (C < 4) msgs.push('⚠ Spring index C < 4 — difficult to manufacture');
  if (C > 12) msgs.push('⚠ Spring index C > 12 — prone to tangling');
  if (SF < 1.2) {
    st.className = 'status-strip warn';
    msgs.push('✗ FAIL — shear stress exceeds allowable!');
  } else if (SF < 1.5) {
    st.className = 'status-strip warn';
    msgs.push(`⚠ Marginal safety factor ${SF.toFixed(2)}`);
  } else {
    st.className = 'status-strip ok';
    msgs.push(`✓ Pass — SF = ${SF.toFixed(2)}`);
  }
  if (L0 - delta < Hs + 1) msgs.push('⚠ Possible coil clash at deflection (check Ls vs L0−δ)');
  st.textContent = msgs.join(' | ');

  document.getElementById('sp-results').classList.add('show');
}
