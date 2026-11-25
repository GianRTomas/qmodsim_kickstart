/**
 * Pure Mathematical Engine: Modules 2 & 10 — Information Entropy & Check-In Token Security
 * Evaluates Shannon Entropy H(X), Brute-Force Keyspace S = |Σ|^L, and Time-to-Compromise T = S / (2 · R_rate).
 * Uses Web Crypto API (crypto.getRandomValues & SubtleCrypto HMAC-SHA-256) for live token generation.
 */

/**
 * Compute Shannon Entropy H(X) = -Σ P(x_i) log₂ P(x_i) from a frequency histogram or uniform alphabet.
 * @param {string} sampleOrAlphabetSize - Either observed token string (empirical entropy) or numeric alphabet size
 * @returns {number} Entropy in bits per symbol
 */
export function computeEmpiricalShannonEntropy(tokenString) {
  if (!tokenString || tokenString.length === 0) return 0;
  const counts = new Map();
  for (const ch of tokenString) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  let entropy = 0;
  const n = tokenString.length;
  for (const count of counts.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Evaluate full token security metrics for FATAMA check-in schemes.
 * @param {number} alphabetSize - |Σ| (e.g. 10 for numeric PIN, 16 for hex HMAC, 62 for Base62 QR)
 * @param {number} length - Token length L
 * @param {number} attemptsPerSec - Attacker brute-force rate R_rate (guesses/sec)
 * @returns {{
 *   alphabetSize: number,
 *   length: number,
 *   entropyBits: number,
 *   keyspaceLog10: number,
 *   keyspaceExact: number,
 *   avgCrackSeconds: number,
 *   humanCrackTime: string
 * }}
 */
export function analyzeTokenSecurity(alphabetSize, length, attemptsPerSec = 1000) {
  const sigma = Math.max(2, Math.round(alphabetSize));
  const L = Math.max(1, Math.round(length));
  const rate = Math.max(0.01, attemptsPerSec);

  const entropyBits = L * Math.log2(sigma);
  const keyspaceLog10 = L * Math.log10(sigma);
  const keyspaceExact = keyspaceLog10 < 15 ? Math.pow(sigma, L) : Infinity;
  const avgCrackSeconds =
    keyspaceLog10 < 300
      ? Math.pow(sigma, L) / (2 * rate)
      : Infinity;

  return {
    alphabetSize: sigma,
    length: L,
    entropyBits,
    keyspaceLog10,
    keyspaceExact,
    avgCrackSeconds,
    humanCrackTime: formatDuration(avgCrackSeconds),
  };
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds > 1e18) return '> 10⁹ years (Infeasible)';
  if (seconds < 1) return `${(seconds * 1000).toFixed(1)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} sec`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hrs`;
  if (seconds < 31557600) return `${(seconds / 86400).toFixed(1)} days`;
  const years = seconds / 31557600;
  if (years > 1e6) return `${years.toExponential(2)} years`;
  return `${years.toFixed(1)} years`;
}

/**
 * Cryptographically secure random 4-digit PIN vs rolling HMAC-SHA-256 QR token using Web Crypto API.
 * Strictly avoids Math.random().
 * @param {string} studentCode
 * @returns {Promise<{ pin: string, hmacToken: string, pinEntropyBits: number, hmacEntropyBits: number }>}
 */
export async function generateComparisonTokens(studentCode = 'FFD-2026-042') {
  const pinBytes = new Uint32Array(1);
  crypto.getRandomValues(pinBytes);
  const pin = String(pinBytes[0] % 10000).padStart(4, '0');

  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonceHex = Array.from(nonceBytes, (b) => b.toString(16).padStart(2, '0')).join('');

  const timeBucket = Math.floor(Date.now() / 30000);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(`fatama-dojang-secret-${nonceHex}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${studentCode}:${timeBucket}`));
  const hmacToken = Array.from(new Uint8Array(sig).slice(0, 16), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return {
    pin,
    hmacToken,
    pinEntropyBits: 4 * Math.log2(10),
    hmacEntropyBits: 128,
  };
}

