export function calcShaft() {
  const d = parseFloat(document.getElementById('sh-d').value) / 1000;
  const Ma = parseFloat(document.getElementById('sh-Ma').value);
  const Mm = parseFloat(document.getElementById('sh-Mm').value);
  const Ta = parseFloat(document.getElementById('sh-Ta').value);
  const Tm = parseFloat(document.getElementById('sh-Tm').value);
  const Sut = parseFloat(document.getElementById('sh-Sut').value);
  const ka = parseFloat(document.getElementById('sh-ka').value);
  const Kf = parseFloat(document.getElementById('sh-Kf').value);
  const kd = parseFloat(document.getElementById('sh-kd').value);

  const SePrime = 0.5 * Sut;
  const kb = 1.24 * Math.pow(d * 1000, -0.107);
  const kc = 1.0;
  const Se = ka * kb * kc * kd * SePrime;

  const I = Math.PI * Math.pow(d, 4) / 64;
  const J = Math.PI * Math.pow(d, 4) / 32;
  const c = d / 2;

  const sigmaABend = (Kf * Ma * c) / I / 1e6;
  const tauA = (Kf * Ta * c) / J / 1e6;
  const sigmaMBend = (Kf * Mm * c) / I / 1e6;
  const tauM = (Kf * Tm * c) / J / 1e6;

  const sigmaAPrime = Math.sqrt(sigmaABend ** 2 + 3 * tauA ** 2);
  const sigmaMPrime = Math.sqrt(sigmaMBend ** 2 + 3 * tauM ** 2);

  const nf = 1 / (sigmaAPrime / Se + sigmaMPrime / Sut);
  const Sy = 0.6 * Sut;
  const ny = Sy / (sigmaAPrime + sigmaMPrime);

  document.getElementById('sh-Se').textContent = Se.toFixed(1);
  document.getElementById('sh-sigma-a').textContent = sigmaAPrime.toFixed(2);
  document.getElementById('sh-sigma-m').textContent = sigmaMPrime.toFixed(2);
  document.getElementById('sh-nf').textContent = nf.toFixed(3);
  document.getElementById('sh-ny').textContent = ny.toFixed(3);

  const st = document.getElementById('sh-status');
  if (nf < 1.0) {
    st.className = 'status-strip warn';
    st.textContent =
      '✗ FAIL — fatigue life < 1 (infinite life not achievable at this load). Reduce load or increase diameter.';
  } else if (nf < 1.5) {
    st.className = 'status-strip warn';
    st.textContent = `⚠ Marginal — nf = ${nf.toFixed(2)}. Recommended nf ≥ 1.5 (dynamic machinery).`;
  } else {
    st.className = 'status-strip ok';
    st.textContent = `✓ DE-Goodman pass — nf = ${nf.toFixed(2)} | ny = ${ny.toFixed(2)} | Se = ${Se.toFixed(0)} MPa`;
  }

  document.getElementById('sh-results').classList.add('show');
}
