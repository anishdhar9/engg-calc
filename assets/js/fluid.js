export const fluidDB = {
  water20: { rho: 998.2, mu: 1.002 },
  water60: { rho: 983.2, mu: 0.467 },
  oil: { rho: 875, mu: 46 },
  air: { rho: 1.204, mu: 0.01813 }
};

export function updateFluidProps() {
  const sel = document.getElementById('f-fluid').value;
  if (sel === 'custom') return;
  const f = fluidDB[sel];
  document.getElementById('f-rho').value = f.rho;
  document.getElementById('f-mu').value = f.mu;
}

export function calcPipeFlow() {
  const D = parseFloat(document.getElementById('f-D').value) / 1000;
  const L = parseFloat(document.getElementById('f-L').value);
  const Q = parseFloat(document.getElementById('f-Q').value) / 60000;
  const eps = parseFloat(document.getElementById('f-eps').value) / 1000;
  const rho = parseFloat(document.getElementById('f-rho').value);
  const mu = parseFloat(document.getElementById('f-mu').value) / 1000;
  const K = parseFloat(document.getElementById('f-K').value);

  const A = Math.PI * D * D / 4;
  const V = Q / A;
  const Re = rho * V * D / mu;

  let f;
  if (Re < 2300) {
    f = 64 / Re;
  } else if (Re < 4000) {
    f = 64 / Re;
  } else {
    f = 0.02;
    for (let i = 0; i < 100; i++) {
      const rhs = -2 * Math.log10(eps / (3.7 * D) + 2.51 / (Re * Math.sqrt(f)));
      const fNew = 1 / (rhs * rhs);
      if (Math.abs(fNew - f) < 1e-10) break;
      f = fNew;
    }
  }

  const dPMaj = f * (L / D) * (0.5 * rho * V * V) / 1000;
  const dPMin = K * 0.5 * rho * V * V / 1000;
  const dPTot = dPMaj + dPMin;

  document.getElementById('pf-v').textContent = V.toFixed(3);
  document.getElementById('pf-re').textContent = Re.toFixed(0);
  document.getElementById('pf-f').textContent = f.toFixed(5);
  document.getElementById('pf-dp-maj').textContent = dPMaj.toFixed(3);
  document.getElementById('pf-dp-min').textContent = dPMin.toFixed(3);
  document.getElementById('pf-dp-tot').textContent = dPTot.toFixed(3);

  const reg = document.getElementById('pf-regime');
  if (Re < 2300) {
    reg.className = 'status-strip ok';
    reg.textContent = `✓ Laminar flow (Re = ${Re.toFixed(0)} < 2300). f = 64/Re.`;
  } else if (Re < 4000) {
    reg.className = 'status-strip warn';
    reg.textContent = '⚠ Transition zone (2300 < Re < 4000) — unstable regime. Results approximate.';
  } else {
    reg.className = 'status-strip info';
    reg.textContent = `✓ Turbulent (Re = ${Re.toFixed(0)}). Colebrook–White converged. ε/D = ${(eps / D).toExponential(3)}`;
  }

  document.getElementById('pf-results').classList.add('show');
}

export function calcOrifice() {
  const d1 = parseFloat(document.getElementById('or-d1').value) / 1000;
  const d2 = parseFloat(document.getElementById('or-d2').value) / 1000;
  const dP = parseFloat(document.getElementById('or-dp').value) * 1000;
  const Cd = parseFloat(document.getElementById('or-type').value);
  const rho = parseFloat(document.getElementById('or-rho').value);

  const beta = d2 / d1;
  const A2 = Math.PI * d2 * d2 / 4;
  const Q = Cd * A2 * Math.sqrt(2 * dP / (rho * (1 - Math.pow(beta, 4))));
  const v2 = Q / A2;

  document.getElementById('or-beta').textContent = beta.toFixed(4);
  document.getElementById('or-Q').textContent = (Q * 60000).toFixed(2);
  document.getElementById('or-v2').textContent = v2.toFixed(3);

  const note = document.getElementById('or-note');
  note.className = 'status-strip info';
  note.textContent =
    `β = ${beta.toFixed(3)} | ISO 5167 valid range: 0.20 ≤ β ≤ 0.75. ` +
    (beta < 0.2 || beta > 0.75 ? '⚠ Outside standard range!' : '✓ Within standard range.');

  document.getElementById('or-results').classList.add('show');
}
