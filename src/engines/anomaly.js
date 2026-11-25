/**
 * Pure Mathematical Engine: Module 11 — Zero-Allocation Streaming Z-Score Anomaly Detector
 * Fixed-capacity circular Float64Array (W = 30) maintaining running sums in O(1) time.
 * Flags abnormal payment receipt void spikes, GCash reference anomalies, or attendance ledger tampering.
 */

export class CircularZScoreDetector {
  /**
   * @param {number} windowSize - Sliding window width W (default 30)
   * @param {number} threshold - Critical Z-score threshold τ_crit (default 3.5σ)
   */
  constructor(windowSize = 30, threshold = 3.5) {
    this.W = Math.max(5, Math.min(200, Math.round(windowSize)));
    this.threshold = Math.max(1.5, threshold);
    this.buffer = new Float64Array(this.W);
    this.head = 0;
    this.count = 0;
    this.sum = 0;
    this.sumSq = 0;
  }

  reset(threshold = this.threshold) {
    this.threshold = Math.max(1.5, threshold);
    this.buffer.fill(0);
    this.head = 0;
    this.count = 0;
    this.sum = 0;
    this.sumSq = 0;
  }

  /**
   * Evaluate incoming telemetry/ledger sample x_t against current window before pushing into buffer.
   * Prevents tampered spikes from poisoning the baseline mean/variance immediately when flagged.
   * @param {number} x - Current observation (e.g. ₱ session ledger delta or check-in rate)
   * @returns {{ value: number, mean: number, stdDev: number, zScore: number, isAnomaly: boolean }}
   */
  push(x) {
    let mean = x;
    let stdDev = 0;
    let zScore = 0;
    let isAnomaly = false;

    if (this.count >= 5) {
      mean = this.sum / this.count;
      const variance = Math.max(1e-6, this.sumSq / this.count - mean * mean);
      stdDev = Math.sqrt(variance);
      zScore = Math.abs(x - mean) / stdDev;
      isAnomaly = zScore >= this.threshold;
    }

    // Only update baseline window if observation is non-anomalous (or during warmup)
    if (!isAnomaly || this.count < 5) {
      if (this.count === this.W) {
        const old = this.buffer[this.head];
        this.sum -= old;
        this.sumSq -= old * old;
      } else {
        this.count += 1;
      }
      this.buffer[this.head] = x;
      this.sum += x;
      this.sumSq += x * x;
      this.head = (this.head + 1) % this.W;
    }

    return { value: x, mean, stdDev, zScore, isAnomaly };
  }
}

/**
 * Run deterministic synthetic anomaly detection verification (TPR & FPR check at ≥ 3.5σ).
 * @param {number} threshold
 * @returns {{ truePositiveRate: number, falsePositiveRate: number, totalInjected: number, detected: number }}
 */
export function evaluateZScoreFidelity(threshold = 3.5) {
  const detector = new CircularZScoreDetector(30, threshold);
  // Warmup 40 normal ₱200±12 ledger batches (deterministic smooth oscillation + pseudo-noise)
  let fp = 0;
  const normalCount = 200;
  for (let i = 0; i < normalCount; i++) {
    const noise = Math.sin(i * 1.7) * 8 + Math.cos(i * 0.9) * 5;
    const res = detector.push(200 + noise);
    if (i >= 30 && res.isAnomaly) fp++;
  }

  // Inject 20 tampering spikes (≥ 4.5σ away)
  const injected = 20;
  let tp = 0;
  for (let i = 0; i < injected; i++) {
    const spike = 200 + (i % 2 === 0 ? 75 : -75);
    const res = detector.push(spike);
    if (res.isAnomaly) tp++;
  }

  return {
    truePositiveRate: tp / injected,
    falsePositiveRate: fp / (normalCount - 30),
    totalInjected: injected,
    detected: tp,
  };
}

