export function calcBuckling() {
  const L = parseFloat(document.getElementById('bk-L').value);
  const Ksel = document.getElementById('bk-K').value;
  const K = Ksel === 'custom' ? parseFloat(document.getElementById('bk-K-custom').value) : parseFloat(Ksel);
  const E = parseFloat(document.getElementById('bk-E').value) * 1000;
  const Sy = parseFloat(document.getElementById('bk-Sy').value);
  const A = parseFloat(document.getElementById('bk-A').value);
  const I = parseFloat(document.getElementById('bk-I').value);
  const P = parseFloat(document.getElementById('bk-P').value);

  const KLm = K * L;
  const KLmm = KLm * 1000;
  const r = Math.sqrt(I / A);
  const lambda = KLmm / r;
  const Cc = Math.sqrt((2 * Math.PI * Math.PI * E) / Sy);

  const Pe = (Math.PI * Math.PI * E * I) / (KLmm * KLmm) / 1000;
  const sigmaJ = Sy * (1 - (Sy * lambda * lambda) / (4 * Math.PI * Math.PI * E));
  const Pj = Math.max(0, sigmaJ) * A / 1000;

  const useEuler = lambda >= Cc;
  const Pgov = useEuler ? Pe : Math.min(Pe, Pj);
  const SF = Pgov / P;

  document.getElementById('bk-KL').textContent = KLm.toFixed(3);
  document.getElementById('bk-r').textContent = r.toFixed(3);
  document.getElementById('bk-lambda').textContent = lambda.toFixed(2);
  document.getElementById('bk-Cc').textContent = Cc.toFixed(2);
  document.getElementById('bk-Pe').textContent = Pe.toFixed(2);
  document.getElementById('bk-Pj').textContent = Pj.toFixed(2);
  document.getElementById('bk-Pgov').textContent = Pgov.toFixed(2);
  document.getElementById('bk-SF').textContent = SF.toFixed(2);

  const st = document.getElementById('bk-status');
  const regime = useEuler ? 'Euler (long column)' : 'Johnson (intermediate column)';
  if (SF < 1.0) {
    st.className = 'status-strip warn';
    st.textContent = `✗ FAIL — Buckling risk. SF = ${SF.toFixed(2)} | Regime: ${regime}. Increase I, reduce KL, or reduce load.`;
  } else if (SF < 1.5) {
    st.className = 'status-strip warn';
    st.textContent = `⚠ Marginal buckling margin. SF = ${SF.toFixed(2)} | Regime: ${regime}. Consider SF ≥ 1.5 for design reserve.`;
  } else {
    st.className = 'status-strip ok';
    st.textContent = `✓ Pass — Buckling SF = ${SF.toFixed(2)} | Regime: ${regime}.`;
  }

  document.getElementById('bk-results').classList.add('show');
}
