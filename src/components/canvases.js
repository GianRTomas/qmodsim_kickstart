/**
 * Theme-Reactive HTML5 Canvas Renderers for all FATAMA-QMODSIM Modules.
 * Every renderer reads `document.documentElement.dataset.theme === 'light'` on each frame
 * so gridlines, axes, labels, and waveform strokes preserve crisp contrast in Dark & Light modes.
 */

function getThemePalette() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return isLight
    ? {
        bg: '#f8fafc',
        grid: '#e2e8f0',
        axis: '#94a3b8',
        text: '#334155',
        muted: '#64748b',
        crimson: '#e11d48',
        crimsonFill: 'rgba(225, 29, 72, 0.14)',
        cyan: '#0284c7',
        cyanFill: 'rgba(2, 132, 199, 0.14)',
        emerald: '#16a34a',
        emeraldFill: 'rgba(22, 163, 74, 0.14)',
        gold: '#d97706',
        goldFill: 'rgba(217, 119, 6, 0.15)',
        card: '#ffffff',
      }
    : {
        bg: '#090d16',
        grid: '#1e293b',
        axis: '#475569',
        text: '#cbd5e1',
        muted: '#64748b',
        crimson: '#f43f5e',
        crimsonFill: 'rgba(244, 63, 94, 0.18)',
        cyan: '#22d3ee',
        cyanFill: 'rgba(34, 211, 238, 0.16)',
        emerald: '#34d399',
        emeraldFill: 'rgba(52, 211, 153, 0.16)',
        gold: '#f59e0b',
        goldFill: 'rgba(245, 158, 11, 0.16)',
        card: '#0f172a',
      };
}

function setupCanvas(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h, p: getThemePalette() };
}

/**
 * 1. NHPP Sunday 10:45–11:15 AM Check-In Burst Curve
 */
export function drawNhppCanvas(canvas, profile, currentT, lambdaBase, currentRate) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  // Horizontal gridlines
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  for (let y = 24; y < h - 28; y += 34) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
  }

  const maxY = Math.max(10, profile.peakRate * 1.18);
  const mapX = (t) => 42 + (t / 30) * (w - 64);
  const mapY = (r) => h - 28 - (r / maxY) * (h - 46);

  // Baseline dashed λ_base
  ctx.strokeStyle = p.cyan;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(42, mapY(lambdaBase));
  ctx.lineTo(w - 22, mapY(lambdaBase));
  ctx.stroke();
  ctx.setLineDash([]);

  // Filled area under λ(t)
  ctx.fillStyle = p.crimsonFill;
  ctx.beginPath();
  ctx.moveTo(mapX(0), mapY(0));
  profile.curve.forEach((pt) => ctx.lineTo(mapX(pt.t), mapY(pt.rate)));
  ctx.lineTo(mapX(30), mapY(0));
  ctx.closePath();
  ctx.fill();

  // Curve stroke
  ctx.strokeStyle = p.crimson;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  profile.curve.forEach((pt, idx) => {
    const x = mapX(pt.t);
    const y = mapY(pt.rate);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Scrubber cursor
  const cx = mapX(currentT);
  const cy = mapY(currentRate);
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 12);
  ctx.lineTo(cx, h - 28);
  ctx.stroke();

  ctx.fillStyle = p.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Axis labels
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = p.muted;
  ctx.fillText('10:45 AM', 36, h - 8);
  ctx.fillText('11:00 AM (Class)', mapX(15) - 52, h - 8);
  ctx.fillText('11:15 AM', w - 66, h - 8);
  ctx.fillText(`${maxY.toFixed(0)}/m`, 4, 22);
  ctx.fillText('0', 22, h - 28);
}

/**
 * 2. M/M/c/K State Distribution Histogram (Lobby Occupancy P_0 .. P_K)
 */
export function drawMmckCanvas(canvas, queueRes) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const dist = queueRes.stateDistribution;
  const maxP = Math.max(0.06, ...dist);
  const padL = 36;
  const padR = 20;
  const plotW = w - padL - padR;
  const barW = Math.max(3, plotW / dist.length);

  dist.forEach((prob, n) => {
    const barH = (prob / maxP) * (h - 48);
    const x = padL + n * barW;
    const y = h - 26 - barH;

    if (n <= queueRes.c) ctx.fillStyle = p.emerald;
    else if (n < queueRes.K) ctx.fillStyle = p.cyan;
    else ctx.fillStyle = p.crimson;

    ctx.fillRect(x, y, Math.max(1.5, barW - 1.5), barH);
  });

  // Capacity K cutoff line
  const kx = padL + queueRes.K * barW;
  ctx.strokeStyle = p.crimson;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(kx, 14);
  ctx.lineTo(kx, h - 26);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = p.muted;
  ctx.fillText('n=0 (Empty)', padL, h - 8);
  ctx.fillText(`c=${queueRes.c} Tablets`, padL + queueRes.c * barW, 18);
  ctx.fillStyle = p.crimson;
  ctx.fillText(`Cap K=${queueRes.K}`, Math.max(padL, kx - 52), h - 8);
}

/**
 * 3. FAIR Monte Carlo Loss Exceedance Curve (PHP ₱)
 */
export function drawFairLecCanvas(canvas, fairRes) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const lec = fairRes.lossExceedanceCurve;
  if (!lec || lec.length === 0) return;
  const maxLoss = Math.max(100000, fairRes.maxLoss);

  const mapX = (loss) => 46 + (loss / maxLoss) * (w - 66);
  const mapY = (prob) => h - 28 - prob * (h - 46);

  // Axes
  ctx.strokeStyle = p.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(46, 12);
  ctx.lineTo(46, h - 28);
  ctx.lineTo(w - 18, h - 28);
  ctx.stroke();

  // Fill + Stroke LEC
  ctx.fillStyle = p.crimsonFill;
  ctx.beginPath();
  ctx.moveTo(mapX(lec[0].loss), mapY(0));
  lec.forEach((pt) => ctx.lineTo(mapX(pt.loss), mapY(pt.exceedanceProbability)));
  ctx.lineTo(mapX(lec[lec.length - 1].loss), mapY(0));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = p.crimson;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  lec.forEach((pt, idx) => {
    const x = mapX(pt.loss);
    const y = mapY(pt.exceedanceProbability);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ALE marker
  const aleX = mapX(fairRes.ale);
  ctx.strokeStyle = p.cyan;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(aleX, 16);
  ctx.lineTo(aleX, h - 28);
  ctx.stroke();

  // VaR95 marker
  const varX = mapX(fairRes.var95);
  ctx.strokeStyle = p.gold;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(varX, 16);
  ctx.lineTo(varX, h - 28);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = p.cyan;
  ctx.fillText(`ALE ₱${(fairRes.ale / 1000).toFixed(0)}k`, Math.min(w - 90, aleX + 4), 24);
  ctx.fillStyle = p.gold;
  ctx.fillText(`VaR₉₅ ₱${(fairRes.var95 / 1000).toFixed(0)}k`, Math.min(w - 110, varX + 4), 40);
  ctx.fillStyle = p.muted;
  ctx.fillText('100%', 8, 22);
  ctx.fillText('0%', 20, h - 28);
  ctx.fillText('₱0', 44, h - 8);
  ctx.fillText(`₱${(maxLoss / 1e6).toFixed(1)}M`, w - 58, h - 8);
}

/**
 * 4. Game Theory Mixed-Strategy Nash Equilibrium Best-Response Canvas
 */
export function drawGameTheoryCanvas(canvas, gameRes) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const padL = 50;
  const padB = 32;
  const padT = 20;
  const padR = 24;
  const pw = w - padL - padR;
  const ph = h - padT - padB;

  const mapX = (q) => padL + q * pw; // q = Admin Strict Verification prob
  const mapY = (prob) => padT + (1 - prob) * ph; // p = User Credit Exploit prob

  // Grid
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1.0].forEach((v) => {
    ctx.beginPath();
    ctx.moveTo(mapX(v), padT);
    ctx.lineTo(mapX(v), padT + ph);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padL, mapY(v));
    ctx.lineTo(padL + pw, mapY(v));
    ctx.stroke();
  });

  // Axes
  ctx.strokeStyle = p.axis;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + ph);
  ctx.lineTo(padL + pw, padT + ph);
  ctx.stroke();

  const qStar = gameRes.qStar;
  const pStar = gameRes.pStar;

  // User best response step function (cyan): wants p=1 if q < q*, p=0 if q > q*
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(mapX(0), mapY(1));
  ctx.lineTo(mapX(qStar), mapY(1));
  ctx.lineTo(mapX(qStar), mapY(0));
  ctx.lineTo(mapX(1), mapY(0));
  ctx.stroke();

  // Admin best response step function (crimson): wants q=0 if p < p*, q=1 if p > p*
  ctx.strokeStyle = p.crimson;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(mapX(0), mapY(0));
  ctx.lineTo(mapX(0), mapY(pStar));
  ctx.lineTo(mapX(1), mapY(pStar));
  ctx.lineTo(mapX(1), mapY(1));
  ctx.stroke();

  // Nash Equilibrium intersection point
  const nx = mapX(qStar);
  const ny = mapY(pStar);
  ctx.fillStyle = p.gold;
  ctx.beginPath();
  ctx.arc(nx, ny, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.bg;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = p.gold;
  ctx.fillText(`Nash (q*=${(qStar * 100).toFixed(1)}%, p*=${(pStar * 100).toFixed(1)}%)`, Math.min(w - 195, nx + 10), Math.max(24, ny - 10));
  ctx.fillStyle = p.muted;
  ctx.fillText('Admin Strict Audit Rate q →', padL + pw * 0.34, h - 8);
  ctx.fillText('p=1', 14, padT + 8);
  ctx.fillText('p=0', 14, padT + ph);
}

/**
 * 5. Streaming Z-Score Ledger Anomaly Timeline Canvas
 */
export function drawZScoreCanvas(canvas, history, threshold) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  if (!history || history.length === 0) return;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 26;
  const pw = w - padL - padR;
  const ph = h - padT - padB;

  const vals = history.map((d) => d.value);
  const minV = Math.min(100, ...vals) - 10;
  const maxV = Math.max(300, ...vals) + 15;
  const mapX = (i) => padL + (i / Math.max(1, history.length - 1)) * pw;
  const mapY = (v) => padT + ph - ((v - minV) / (maxV - minV)) * ph;

  // ±threshold·σ confidence band
  ctx.fillStyle = p.cyanFill;
  ctx.beginPath();
  history.forEach((d, i) => {
    const upper = d.mean + threshold * Math.max(6, d.stdDev);
    if (i === 0) ctx.moveTo(mapX(i), mapY(upper));
    else ctx.lineTo(mapX(i), mapY(upper));
  });
  for (let i = history.length - 1; i >= 0; i--) {
    const d = history[i];
    const lower = d.mean - threshold * Math.max(6, d.stdDev);
    ctx.lineTo(mapX(i), mapY(lower));
  }
  ctx.closePath();
  ctx.fill();

  // Mean line
  ctx.strokeStyle = p.cyan;
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  history.forEach((d, i) => {
    if (i === 0) ctx.moveTo(mapX(i), mapY(d.mean));
    else ctx.lineTo(mapX(i), mapY(d.mean));
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Ledger stream line
  ctx.strokeStyle = p.emerald;
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((d, i) => {
    if (i === 0) ctx.moveTo(mapX(i), mapY(d.value));
    else ctx.lineTo(mapX(i), mapY(d.value));
  });
  ctx.stroke();

  // Flagged anomalies
  history.forEach((d, i) => {
    if (d.isAnomaly) {
      ctx.fillStyle = p.crimson;
      ctx.beginPath();
      ctx.arc(mapX(i), mapY(d.value), 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = p.muted;
  ctx.fillText(`₱${maxV.toFixed(0)}`, 4, padT + 8);
  ctx.fillText(`₱${minV.toFixed(0)}`, 4, padT + ph);
  ctx.fillText(`Shaded Band: μ_t ± ${threshold.toFixed(1)}σ (W=30)`, padL, h - 6);
}

/**
 * 6. Dojang System Reliability Block Diagram (RBD) Interactive Canvas
 */
export function drawRbdCanvas(canvas, rbdRes) {
  const s = setupCanvas(canvas);
  if (!s) return;
  const { ctx, w, h, p } = s;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const nodes = [
    { label: 'Lobby Wi-Fi', val: rbdRes.rNetwork, x: 32, y: 42 },
    { label: 'Web Portal', val: rbdRes.rServer, x: 182, y: 42 },
    { label: 'PostgreSQL', val: rbdRes.rDatabase, x: 332, y: 42 },
    { label: 'Media Store', val: rbdRes.rStorage, x: 492, y: 84 },
  ];

  // Connectors for online series core
  ctx.strokeStyle = p.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(12, 68);
  ctx.lineTo(32, 68);
  ctx.moveTo(148, 68);
  ctx.lineTo(182, 68);
  ctx.moveTo(298, 68);
  ctx.lineTo(332, 68);
  ctx.moveTo(448, 68);
  ctx.lineTo(470, 68);
  ctx.lineTo(470, 110);
  ctx.lineTo(492, 110);
  ctx.moveTo(608, 110);
  ctx.lineTo(w - 14, 110);
  ctx.stroke();

  // Parallel Offline Browser LocalStorage Sync Branch
  const offlineActive = rbdRes.offlineLocalSync;
  ctx.strokeStyle = offlineActive ? p.emerald : p.muted;
  if (!offlineActive) ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(20, 68);
  ctx.lineTo(20, 152);
  ctx.lineTo(182, 152);
  ctx.moveTo(398, 152);
  ctx.lineTo(470, 152);
  ctx.lineTo(470, 110);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw series nodes
  nodes.forEach((n) => {
    const healthy = n.val >= 0.98;
    ctx.fillStyle = p.card;
    ctx.strokeStyle = healthy ? p.cyan : p.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(n.x, n.y, 116, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = p.text;
    ctx.fillText(n.label, n.x + 10, n.y + 22);
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = healthy ? p.emerald : p.gold;
    ctx.fillText(`R=${(n.val * 100).toFixed(2)}%`, n.x + 10, n.y + 40);
  });

  // Draw Offline LocalStorage Node
  ctx.fillStyle = p.card;
  ctx.strokeStyle = offlineActive ? p.emerald : p.crimson;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(182, 126, 216, 48, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = p.text;
  ctx.fillText('Offline LocalStorage Sync', 194, 146);
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = offlineActive ? p.emerald : p.crimson;
  ctx.fillText(offlineActive ? 'ACTIVE · R_local=99.95%' : 'BYPASSED (Series Only)', 194, 164);
}

