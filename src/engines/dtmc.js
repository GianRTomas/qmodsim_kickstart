/**
 * Pure Mathematical Engine: Module 5 — Absorbing Discrete-Time Markov Chain (DTMC)
 * Models FATAMA Belt Progression Hierarchy:
 * Transient States: S0: White, S1: Yellow, S2: Green, S3: Blue, S4: Red
 * Absorbing States: S5: Black Belt (Absorbing), S_D: Drop-out / Inactive (Absorbing)
 */

export const BELT_STATES = [
  { id: 'S0', name: 'White Belt', gup: '10th–9th Gup', color: '#f8fafc', type: 'transient' },
  { id: 'S1', name: 'Yellow Belt', gup: '8th–7th Gup', color: '#facc15', type: 'transient' },
  { id: 'S2', name: 'Green Belt', gup: '6th–5th Gup', color: '#22c55e', type: 'transient' },
  { id: 'S3', name: 'Blue Belt', gup: '4th–3rd Gup', color: '#3b82f6', type: 'transient' },
  { id: 'S4', name: 'Red Belt', gup: '2nd–1st Gup', color: '#ef4444', type: 'transient' },
  { id: 'S5', name: 'Black Belt', gup: '1st Dan+ (Absorbing)', color: '#1e293b', type: 'absorbing' },
  { id: 'SD', name: 'Drop-out', gup: 'Inactive (Absorbing)', color: '#64748b', type: 'absorbing' },
];

/**
 * Build canonical transition matrix P = [Q R ; 0 I] for a selected dojang retention policy.
 * Each row strictly sums to 1.0.
 * @param {'baseline' | 'mentored' | 'unstructured'} policy
 * @param {number} retentionBoost - Optional additive retention shift in [0, 0.15]
 * @returns {{ Q: number[][], R: number[][], fullP: number[][] }}
 */
export function buildBeltTransitionMatrix(policy = 'baseline', retentionBoost = 0) {
  // Base per-evaluation-cycle probabilities for [stay, advance, drop]
  const presets = {
    unstructured: [
      [0.24, 0.50, 0.26], // White
      [0.25, 0.51, 0.24], // Yellow
      [0.26, 0.52, 0.22], // Green
      [0.28, 0.52, 0.20], // Blue
      [0.32, 0.50, 0.18], // Red
    ],
    baseline: [
      [0.18, 0.68, 0.14], // White
      [0.18, 0.70, 0.12], // Yellow
      [0.20, 0.70, 0.10], // Green
      [0.22, 0.70, 0.08], // Blue
      [0.25, 0.69, 0.06], // Red
    ],
    mentored: [
      [0.12, 0.82, 0.06], // White
      [0.12, 0.83, 0.05], // Yellow
      [0.14, 0.82, 0.04], // Green
      [0.15, 0.82, 0.03], // Blue
      [0.18, 0.80, 0.02], // Red
    ],
  };

  const rows = presets[policy] || presets.baseline;
  const boost = Math.max(-0.1, Math.min(0.15, retentionBoost));
  const Q = Array.from({ length: 5 }, () => Array(5).fill(0));
  const R = Array.from({ length: 5 }, () => Array(2).fill(0));

  for (let i = 0; i < 5; i++) {
    const [stayBase, advBase, dropBase] = rows[i];
    const drop = Math.max(0.01, Math.min(0.45, dropBase - boost * 0.6));
    const adv = Math.max(0.25, Math.min(0.92, advBase + boost * 0.6));
    const stay = Math.max(0.02, 1.0 - adv - drop);
    const norm = stay + adv + drop;

    Q[i][i] = stay / norm;
    if (i < 4) {
      Q[i][i + 1] = adv / norm;
    } else {
      R[i][0] = adv / norm; // Red -> Black Belt (S5)
    }
    R[i][1] = drop / norm;  // Any transient -> Drop-out (SD)
  }

  const fullP = Array.from({ length: 7 }, (_, r) => {
    if (r < 5) return [...Q[r], ...R[r]];
    const absRow = Array(7).fill(0);
    absRow[r] = 1.0;
    return absRow;
  });

  return { Q, R, fullP };
}

/**
 * Invert square matrix M via Gauss-Jordan elimination with partial pivoting.
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
export function invertMatrix(matrix) {
  const n = matrix.length;
  const aug = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error('Singular matrix in DTMC inversion');
    for (let c = 0; c < 2 * n; c++) aug[col][c] /= pivot;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let c = 0; c < 2 * n; c++) aug[r][c] -= factor * aug[col][c];
    }
  }
  return aug.map((row) => row.slice(n));
}

/**
 * Solve Absorbing DTMC Fundamental Matrix N = (I - Q)⁻¹, Absorption B = N·R, and Expected Cycles t = N·1.
 * @param {number[][]} Q
 * @param {number[][]} R
 * @returns {{
 *   fundamentalN: number[][],
 *   absorptionB: number[][],
 *   expectedCyclesToAbsorption: number[],
 *   isRowStochastic: boolean,
 *   blackBeltYieldFromWhite: number,
 *   dropoutProbFromWhite: number
 * }}
 */
export function solveAbsorbingDtmc(Q, R) {
  const n = Q.length;
  const IminusQ = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 - Q[i][j] : -Q[i][j]))
  );
  const fundamentalN = invertMatrix(IminusQ);

  // B = N * R
  const m = R[0].length;
  const absorptionB = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += fundamentalN[i][k] * R[k][j];
      return sum;
    })
  );

  const expectedCyclesToAbsorption = fundamentalN.map((row) =>
    row.reduce((acc, v) => acc + v, 0)
  );

  const fullCheck = Q.every((row, i) => {
    const rowSum = row.reduce((a, b) => a + b, 0) + R[i].reduce((a, b) => a + b, 0);
    return Math.abs(rowSum - 1.0) < 1e-5;
  });
  const bCheck = absorptionB.every(
    (row) => Math.abs(row.reduce((a, b) => a + b, 0) - 1.0) < 1e-5
  );

  return {
    fundamentalN,
    absorptionB,
    expectedCyclesToAbsorption,
    isRowStochastic: fullCheck && bCheck,
    blackBeltYieldFromWhite: absorptionB[0][0],
    dropoutProbFromWhite: absorptionB[0][1],
  };
}

