const lewisY = {
  20: {
    12: 0.245, 13: 0.261, 14: 0.277, 15: 0.29, 16: 0.296, 17: 0.303, 18: 0.309,
    20: 0.322, 22: 0.331, 25: 0.34, 28: 0.346, 30: 0.358, 34: 0.371, 38: 0.384,
    40: 0.389, 45: 0.399, 50: 0.408, 60: 0.422, 75: 0.435, 100: 0.447, 150: 0.46,
    200: 0.466, 300: 0.472, 400: 0.48
  },
  25: {
    12: 0.277, 13: 0.293, 14: 0.307, 15: 0.32, 16: 0.332, 17: 0.342, 18: 0.352,
    20: 0.369, 22: 0.383, 25: 0.401, 28: 0.415, 30: 0.425, 35: 0.442, 40: 0.457,
    45: 0.471, 50: 0.481, 60: 0.499, 75: 0.522, 100: 0.541, 150: 0.559, 200: 0.567
  }
};

function getLewisY(N, phi) {
  const tab = lewisY[phi] || lewisY[20];
  const keys = Object.keys(tab).map(Number).sort((a, b) => a - b);
  if (N <= keys[0]) return tab[keys[0]];
  if (N >= keys[keys.length - 1]) return tab[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (N >= keys[i] && N <= keys[i + 1]) {
      const t = (N - keys[i]) / (keys[i + 1] - keys[i]);
      return tab[keys[i]] + t * (tab[keys[i + 1]] - tab[keys[i]]);
    }
  }
  return 0.35;
}

export function calcGear() {
  const m = parseFloat(document.getElementById('gr-m').value);
  const Np = parseInt(document.getElementById('gr-Np').value, 10);
  const Ng = parseInt(document.getElementById('gr-Ng').value, 10);
  const F = parseFloat(document.getElementById('gr-F').value);
  const np = parseFloat(document.getElementById('gr-n').value);
  const Wt = parseFloat(document.getElementById('gr-Wt').value);
  const phi = parseInt(document.getElementById('gr-phi').value, 10);
  const Sut = parseFloat(document.getElementById('gr-Sut').value);

  const dp = m * Np;
  const dg = m * Ng;
  const cd = (dp + dg) / 2;
  const V = Math.PI * dp * np / 60000;
  const GR = Ng / Np;
  const ng = np / GR;
  const Tout = Wt * (dg / 2) / 1000;

  const Y = getLewisY(Np, phi);
  const sigmaB = Wt / (F * m * Y);

  const sigmaBAll = 0.36 * Sut;
  const SF = sigmaBAll / sigmaB;

  document.getElementById('gr-GR').textContent = GR.toFixed(3);
  document.getElementById('gr-cd').textContent = cd.toFixed(2);
  document.getElementById('gr-V').textContent = V.toFixed(3);
  document.getElementById('gr-Y').textContent = Y.toFixed(4);
  document.getElementById('gr-sb').textContent = sigmaB.toFixed(1);
  document.getElementById('gr-sb-all').textContent = sigmaBAll.toFixed(1);
  document.getElementById('gr-Tout').textContent = Tout.toFixed(1);
  document.getElementById('gr-SF').textContent = SF.toFixed(3);

  const st = document.getElementById('gr-status');
  const msgs = [];
  if (V > 25) msgs.push('⚠ Pitch velocity > 25 m/s — dynamic factor becomes significant, use full AGMA');
  if (Np < 17 && phi === 20) msgs.push('⚠ Np < 17 with 20° PA — check for undercutting');
  if (SF < 1.2) {
    st.className = 'status-strip warn';
    msgs.unshift('✗ FAIL bending');
  } else if (SF < 1.5) {
    st.className = 'status-strip warn';
    msgs.unshift(`⚠ Marginal SF = ${SF.toFixed(2)}`);
  } else {
    st.className = 'status-strip ok';
    msgs.unshift(`✓ Pass — SF = ${SF.toFixed(2)} | ng = ${ng.toFixed(0)} RPM`);
  }
  st.textContent = msgs.join(' | ');

  document.getElementById('gr-results').classList.add('show');
}
