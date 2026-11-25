/**
 * FATAMA-QMODSIM Guided Scenarios (Episodes 1-8)
 * Supports Simplified (~2m) and Extended (5m) editions + real-time parameter decision forks.
 * Zero raw LaTeX syntax: clean Unicode math throughout.
 */

export const SCENARIO_EPISODES = [
  {
    id: 1,
    moduleCode: 'Modules 1 & 3',
    title: 'Sunday 11:00 AM Check-In Bursts & NHPP Arrivals',
    subtitle: 'Stationary Poisson Inter-Arrivals vs. Pre-Warmup Rush-Hour Surges',
    durationSimplified: '2:10',
    durationExtended: '4:45',
    interactiveType: 'nhpp',
    clinicalThreat:
      '40+ student-athletes arrive within a compressed 15-minute window before the 11:00 AM Sunday session at Robinsons Luisita, spiking QR/ID login concurrency.',
    mathematicalDriver:
      'Non-Homogeneous Poisson Process λ(t) = λ_base + λ_peak · exp(-(t - t_class)² / (2σ²)) and Exponential inter-arrivals f(t) = λ · e^(-λt).',
    decisionFork: {
      prompt: 'Choose Lobby Check-In Scheduling Policy:',
      options: [
        {
          id: 'single_gate',
          label: 'Single 11:00 AM Mass Call (σ = 3.0m)',
          impact: 'Concentrates 48 students into a sharp 6-minute burst (peak > 8.2 students/min).',
          params: { lambdaBase: 0.6, lambdaPeak: 7.8, sigma: 3.0 },
        },
        {
          id: 'staggered_batches',
          label: 'Staggered Belt Arrival Windows (σ = 6.5m)',
          impact: 'Spreads White/Yellow vs. Senior belts smoothly, cutting peak burst intensity by 44%.',
          params: { lambdaBase: 0.8, lambdaPeak: 4.1, sigma: 6.5 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: '10:52 AM at Robinsons Luisita! Watch the check-in monitor—35 Taekwondo students just stepped off the shuttle together before warm-ups.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'During quiet mid-week hours, arrivals follow a stationary Poisson stream f(t) = λ · e^(-λt). Today we have a Gaussian NHPP rush-hour spike!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Exactly. With λ(t) peaking at t_class = 15 min (11:00 AM), inter-arrival intervals shrink from 75 seconds down to ~7 seconds.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Try switching the Decision Fork below to Staggered Belt Windows—you will see the peak arrival curve flatten immediately.',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'Look at the Sunday 11:00 AM roster. Every student logs attendance and deducts their ₱200 session balance on the portal right before bow-in.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'curious',
        text: 'If we used a constant arrival rate λ, our simulation would miss the 10:50–11:05 AM crush that freezes the front-desk tablet!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'That is why QMODSIM Module 3 models arrivals as a Non-Homogeneous Poisson Process: λ(t) = λ_base + λ_peak · exp(-(t - t_class)² / (2σ²)).',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Under stationary segments, inter-arrival intervals follow f(t) = λ · e^(-λt) with theoretical mean E[X] = 1/λ and variance 1/λ².',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'When σ is tight (3.0 min), simultaneous QR scans hit the Supabase API in bursts. Widening σ via staggered belt arrival windows protects concurrency.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Toggle the Decision Fork to compare Single Mass Call vs. Staggered Belt Windows and inspect the live expected arrivals integral.',
      },
    ],
    pythonSnippet: `import math

def nhpp_intensity(t, lambda_base=0.6, lambda_peak=7.8, t_class=15.0, sigma=3.0):
    """Sunday 10:45-11:15 AM check-in intensity λ(t) in students/min."""
    return lambda_base + lambda_peak * math.exp(-((t - t_class) ** 2) / (2 * sigma ** 2))

for minute in range(0, 31, 5):
    print(f"t={minute:02d}m -> λ(t)={nhpp_intensity(minute):.2f} students/min")`,
  },
  {
    id: 2,
    moduleCode: 'Module 6',
    title: 'Dojang Entrance Verification Queue (M/M/c/K)',
    subtitle: 'Multi-Tablet Check-In Bottlenecks & Little’s Law Conservation',
    durationSimplified: '2:20',
    durationExtended: '5:00',
    interactiveType: 'queueing',
    clinicalThreat:
      'Instructors must verify attendance, ₱200 fee status, and medical disclosures. One tablet causes a 12-minute line, making students miss warm-ups.',
    mathematicalDriver:
      'Finite-capacity multi-server queue M/M/c/K: ρ = λ/(c·μ), blocking probability P_K, and Little’s Law L = λ_eff · W.',
    decisionFork: {
      prompt: 'Select Front-Desk Tablet & Lobby Buffer Configuration:',
      options: [
        {
          id: 'one_tablet',
          label: '1 Check-In Tablet (c = 1, K = 16)',
          impact: 'Overloaded (ρ > 1.0): students wait > 6 min and spill outside lobby capacity.',
          params: { lambda: 3.4, mu: 1.9, c: 1, K: 16 },
        },
        {
          id: 'two_tablets',
          label: '2 Instructor Tablets (c = 2, K = 24)',
          impact: 'Balanced (ρ ≈ 0.89): drops queue overflow P_K < 2% and clears warm-up line.',
          params: { lambda: 3.4, mu: 1.9, c: 2, K: 24 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'Coach Beanna is verifying medical notes and GCash receipts on a single tablet while 3.4 students arrive per minute!',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Because λ = 3.4 exceeds μ = 1.9 students/min, utilization ρ = 178%—the lobby queue hits capacity K = 16 and turns families away.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Adding a second instructor tablet (c = 2) brings utilization below 100% and satisfies Little’s Law L = λ_eff · W cleanly.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Switch between 1 Tablet and 2 Tablets below to watch the P_n state bars shift from red saturation into green flow!',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'At Robinsons Luisita Covered Area, the entrance mat holds at most K = 16 to 24 waiting students safely.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'In Kendall’s M/M/c/K notation, c is the number of active instructor devices (c ∈ {1,2,3}) and K is total system capacity.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'How do we verify the simulation obeys steady-state physics across every slider combination?',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'We enforce Little’s Law: L = λ_eff · W, where λ_eff = λ · (1 - P_K). Our engine keeps |L - λ_eff·W| < 10⁻⁵.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'With c = 2 tablets and pre-checked medical profiles, average wait W drops under 90 seconds so zero athletes miss warm-ups.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Use the Decision Fork to deploy the second tablet and verify P_K drop rate.',
      },
    ],
    pythonSnippet: `def mmck_metrics(lam, mu, c, K):
    a = lam / mu
    weights = [1.0]
    for n in range(1, K + 1):
        weights.append(weights[-1] * (a / min(n, c)))
    p0 = 1.0 / sum(weights)
    probs = [w * p0 for w in weights]
    pK = probs[K]
    lam_eff = lam * (1.0 - pK)
    L = sum(n * p for n, p in enumerate(probs))
    W = L / lam_eff
    return {"rho": a / c, "P_drop": pK, "L": L, "W_min": W, "littles_diff": abs(L - lam_eff * W)}`,
  },
  {
    id: 3,
    moduleCode: 'Module 5',
    title: 'Belt Progression & Retention Dynamics (DTMC)',
    subtitle: 'Absorbing Markov Chain N = (I - Q)⁻¹ Across White-to-Black Hierarchy',
    durationSimplified: '2:15',
    durationExtended: '4:50',
    interactiveType: 'dtmc',
    clinicalThreat:
      'High early drop-out among White and Yellow belts erodes long-term Black Belt yield and Sunday tuition stability.',
    mathematicalDriver:
      'Canonical P = [Q R ; 0 I], Fundamental Matrix N = (I - Q)⁻¹, and Absorption Matrix B = N · R.',
    decisionFork: {
      prompt: 'Select Dojang Student Retention & Grading Program:',
      options: [
        {
          id: 'unstructured',
          label: 'Unstructured Drop-In (No Streaks/Feedback)',
          impact: 'White-to-Black absorption yield drops to ~13%; high early 10th-Gup attrition.',
          params: { policy: 'unstructured' },
        },
        {
          id: 'mentored',
          label: 'FATAMA Portal Badges + Mentor Check-ins',
          impact: 'Raises Black Belt yield B[S0, Black] above 69% and stabilizes tuition yield.',
          params: { policy: 'mentored' },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Every Fatama student starts at White Belt (S0) and trains through Yellow, Green, Blue, and Red toward Black Belt (S5) or Drop-out (S_D).',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Because Black Belt and Drop-out are absorbing states, we partition P into transient matrix Q and absorption matrix R!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Inverting N = (I - Q)⁻¹ tells us the exact expected promotion cycles a student spends at each belt before absorption.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Compare Unstructured Drop-In vs. FATAMA Portal Badges below to watch all 48 cohort tiles advance across cycles!',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'Our Taekwondo curriculum spans 5 transient colored-belt tiers (S0–S4) plus two absorbing outcomes: Black Belt (S5) and Inactive Drop-out (S_D).',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Each row of P must be strictly row-stochastic: Σ P_ij = 1.0000 across stay, promote, and drop-out probabilities.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'From the Fundamental Matrix N = (I - Q)⁻¹, entry n_ij equals expected grading cycles spent in belt j starting from belt i.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Then B = N · R gives exact long-run absorption probabilities: B[0,0] for Black Belt graduation and B[0,1] for attrition.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Notice how FATAMA’s Awards & Belts badges and coach reminders cut early White/Yellow attrition in half.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Toggle the retention policy in the Decision Fork and step through the 48-athlete cohort grid.',
      },
    ],
    pythonSnippet: `import numpy as np

def analyze_belt_dtmc(Q, R):
    I = np.eye(Q.shape[0])
    N = np.linalg.inv(I - Q)   # Fundamental matrix
    B = N @ R                  # Absorption probabilities [Black, Drop-out]
    cycles = N.sum(axis=1)     # Expected cycles to absorption
    return N, B, cycles`,
  },
  {
    id: 4,
    moduleCode: 'Module 4',
    title: 'RA 10173 Minor SPI Risk & FAIR Monte Carlo',
    subtitle: '10,000-Trial Beta-PERT & Lognormal Breach Loss Modeling (PHP ₱)',
    durationSimplified: '2:25',
    durationExtended: '5:10',
    interactiveType: 'fair',
    clinicalThreat:
      'FATAMA stores minor athletes’ medical notes, blood types, injury waivers, and guardian contacts—a leak triggers NPC fines under RA 10173.',
    mathematicalDriver:
      'TEF ~ Beta-PERT(1, 6, 25), LM ~ Lognormal(μ = 11.5, σ = 1.2) PHP, 10,000-trial LEC, ALE, VaR₉₅, and ROSI.',
    decisionFork: {
      prompt: 'Select Database Access & Encryption Architecture:',
      options: [
        {
          id: 'unhardened',
          label: 'Flat Table Access (No RLS / Plaintext SPI)',
          impact: '42% breach susceptibility; ALE exceeds ₱1.0M/yr with severe VaR₉₅ tail risk.',
          params: { rlsMitigated: false, tefMode: 6 },
        },
        {
          id: 'rls_encrypted',
          label: 'Supabase RLS + AES-256 Field Encryption',
          impact: 'Cuts susceptibility to 6%, slashes ALE by ~85%, delivering positive ROSI.',
          params: { rlsMitigated: true, tefMode: 6 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'Our `profiles` and `registrations` tables hold minors’ medical disclosures, blood types, and emergency contacts—Sensitive Personal Information under RA 10173!',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Under FAIR, we sample annual credential-stuffing attacks via Beta-PERT(1, 6, 25) and heavy-tailed NPC regulatory losses via Lognormal(11.5, 1.2) in ₱.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Running 10,000 Monte Carlo trials proves how Supabase Row-Level Security (is_instructor()) plus field encryption pays for itself via ROSI.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Switch the Decision Fork between Flat Access and RLS + AES-256 to inspect the live Loss Exceedance Curve!',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Section 13 of the Philippine Data Privacy Act (RA 10173) imposes heightened penalties when health and minor records are exposed.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Point averages hide catastrophic tail events. So we run 10,000 vectorized Float64Array Monte Carlo trials for every control posture.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'Walk me through the ROSI calculation for deploying PostgreSQL RLS policies and encrypted backups.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'ROSI = (ALE_base - ALE_mitigated - C_control) / C_control. With C_control = ₱48,000/yr, mitigating SPI leaks yields >1,500% risk-adjusted return.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'And our Convergence Validation check confirms Seed A and Seed B agree within tight statistical error.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Click the Decision Fork to compare unhardened vs. RLS-protected Loss Exceedance Curves in real time.',
      },
    ],
    pythonSnippet: `import numpy as np

def fair_monte_carlo(trials=10000, vuln=0.06, mu=11.5, sigma=1.2):
    a, m, b = 1.0, 6.0, 25.0
    alpha, beta = 1 + 4*(m-a)/(b-a), 1 + 4*(b-m)/(b-a)
    tef = a + np.random.beta(alpha, beta, trials) * (b - a)
    losses = np.array([
        np.sum(np.random.lognormal(mu, sigma, np.random.poisson(t * vuln)))
        for t in tef
    ])
    losses.sort()
    return {"ALE_PHP": losses.mean(), "VaR95_PHP": losses[int(0.95 * trials)]}`,
  },
  {
    id: 5,
    moduleCode: 'Module 7',
    title: 'Session Credit Integrity & Fraud Game Theory',
    subtitle: '2×2 Normal-Form Payoffs & Mixed-Strategy Nash Equilibrium',
    durationSimplified: '2:05',
    durationExtended: '4:40',
    interactiveType: 'gameTheory',
    clinicalThreat:
      'Guardians or trainees attempt shared logins or unlogged attendance disputes against ₱200/session fees unless strategic audits deter abuse.',
    mathematicalDriver:
      '2×2 strategic game between User U and Dojang D; Mixed Nash Equilibrium (σ_U*, σ_D*) balancing audit friction and fraud deterrence.',
    decisionFork: {
      prompt: 'Select Dojang Verification & Deterrence Posture:',
      options: [
        {
          id: 'passive_low_penalty',
          label: 'High Audit Friction, Low Penalty (₱150)',
          impact: 'Requires >57% strict audit rate to deter sharing, creating heavy lobby friction.',
          params: { penaltyFee: 150, auditOverhead: 45, lobbyFriction: 15 },
        },
        {
          id: 'pinned_deterrence',
          label: 'Device Pinning + ₱500 Fraud Penalty',
          impact: 'Lowers optimal audit frequency q* to ~29% while cutting equilibrium fraud p* < 5%.',
          params: { penaltyFee: 500, auditOverhead: 25, lobbyFriction: 5 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'If instructors audit every GCash screenshot manually at the door, the lobby stalls. If we never verify, shared logins leak ₱200 session revenue.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Game Theory solves this exact tradeoff! Under Mixed-Strategy Nash Equilibrium, we compute the exact verification rate q* that makes fraud unprofitable.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Pairing lightweight device pinning (`user_devices`) with clear ₱500 ledger penalties slashes the needed audit frequency.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Toggle the Decision Fork to see how penalty fees and audit overhead shift the Nash Equilibrium point (σ_U*, σ_D*).',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Pure strategies fail here: 100% passive trust invites credit exploitation, while 100% manual audits frustrate paying parents.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'By setting expected user utility equal across Legitimate Check-in and Shared Login, we solve q* = F / (F + P - friction).',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'And setting Admin indifference across Passive Trust vs. Strict Verification yields equilibrium exploitation rate p* = C_audit / (F + P).',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'happy',
        text: 'Lower audit overhead (via QR refresh + `user_devices` check) directly drives p* down toward zero!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'That gives us mathematical proof of optimal random spot-check frequency without hurting parent satisfaction.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Compare both deterrence postures in the interactive payoff matrix below.',
      },
    ],
    pythonSnippet: `def solve_credit_nash(fee=200, penalty=500, audit_cost=25, friction=5):
    q_star = fee / (fee + penalty - friction)       # Optimal strict audit rate
    p_star = audit_cost / (fee + penalty)           # Equilibrium exploit attempt rate
    return {"sigma_U_star": p_star, "sigma_D_star": q_star}`,
  },
  {
    id: 6,
    moduleCode: 'Modules 2 & 10',
    title: 'Check-In Token Entropy & Forgery Resistance',
    subtitle: 'Shannon Entropy H(X), Keyspace |Σ|^L & Rolling HMAC-QR Tokens',
    durationSimplified: '2:00',
    durationExtended: '4:30',
    interactiveType: 'entropy',
    clinicalThreat:
      'Predictable 4-digit check-in PINs can be brute-forced or shared to forge Sunday attendance for belt promotion eligibility.',
    mathematicalDriver:
      'H(X) = -Σ P(x_i) log₂ P(x_i) = log₂(|Σ|^L), keyspace S = |Σ|^L, and time-to-compromise T = S / (2 · R_rate).',
    decisionFork: {
      prompt: 'Choose Student Check-In Credential Mechanism:',
      options: [
        {
          id: 'pin_4digit',
          label: 'Static 4-Digit Numeric PIN (|Σ|=10, L=4)',
          impact: 'Only 13.3 bits of entropy (10,000 keys) — cracked in ~5 seconds at 1,000 req/s.',
          params: { alphabetSize: 10, length: 4, rate: 1000 },
        },
        {
          id: 'hmac_qr',
          label: 'Rolling 32-Hex HMAC-SHA256 QR (|Σ|=16, L=32)',
          impact: '128 bits of entropy (3.4×10³⁸ keys) — infeasible even at 10⁶ req/s.',
          params: { alphabetSize: 16, length: 32, rate: 1000000 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'A student tried guessing 4-digit check-in codes to log phantom attendance ahead of Red Belt promotion grading!',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: '4-digit PINs only hold H(X) = log₂(10⁴) = 13.29 bits of Shannon Entropy—half the keyspace falls in 5,000 guesses!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Replacing static PINs with Web Crypto `crypto.getRandomValues()` rolling HMAC-SHA-256 QR tokens boosts entropy to 128 bits.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Click "Generate Live Web Crypto Tokens" below to inspect real browser CSPRNG output and time-to-compromise.',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Promotion eligibility at FATAMA depends on verified attendance count—so check-in tokens must resist forgery.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Notice how we also use `crypto.getRandomValues()` instead of `Math.random()` so token generation itself has zero predictable seed bias.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'What happens if an attacker scales to 1,000,000 guesses/second against a 32-char hex HMAC token?',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Keyspace S = 16³² ≈ 3.4 × 10³⁸. Even at 10⁶ attempts/sec, expected crack time exceeds 5 × 10²⁴ years—while the QR expires every 30 seconds!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Pair that with 2FA email codes (`login_2fa_codes`) and failed-attempt locking, and brute-force attacks are mathematically neutralized.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Compare the 4-digit PIN vs. Rolling HMAC-QR posture in the Decision Fork below.',
      },
    ],
    pythonSnippet: `import hmac, hashlib, secrets, math, time

def generate_rolling_qr_token(student_id: str, secret: bytes):
    bucket = int(time.time() // 30)
    msg = f"{student_id}:{bucket}".encode()
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()[:32]

entropy_bits = 32 * math.log2(16)  # 128.0 bits`,
  },
  {
    id: 7,
    moduleCode: 'Module 11',
    title: 'Streaming Z-Score Ledger & Attendance Guard',
    subtitle: 'O(1) Circular Window Anomaly Detection on ₱200 Payment & Check-In Logs',
    durationSimplified: '2:10',
    durationExtended: '4:40',
    interactiveType: 'anomaly',
    clinicalThreat:
      'Unauthorized payment void spikes or bulk retroactive attendance edits threaten ledger accuracy unless flagged instantaneously.',
    mathematicalDriver:
      'Sliding-window mean μ_t, variance σ_t² (W = 30), and standardized anomaly criterion Z_t = |x_t - μ_t| / σ_t ≥ τ_crit.',
    decisionFork: {
      prompt: 'Select Anomaly Sensitivity Threshold (τ_crit):',
      options: [
        {
          id: 'loose_5sigma',
          label: 'Loose Threshold (τ = 5.5σ)',
          impact: 'Misses subtle ₱75 ledger skimming or 2-3 phantom check-in spikes.',
          params: { threshold: 5.5, injectSpike: true },
        },
        {
          id: 'strict_35sigma',
          label: 'Calibrated Guard (τ = 3.5σ, W = 30)',
          impact: 'Flags tampering ≥ 3.5σ within 1 cycle (TPR ≥ 99.0%, FPR ≤ 0.1%).',
          params: { threshold: 3.5, injectSpike: true },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'Someone voided multiple ₱200 Studio Cash entries right after Sunday class ended—manual end-of-month Excel checks catch it too late!',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'We run a zero-allocation circular Float64Array of window W = 30 that tracks μ_t and σ_t in O(1) time per ledger event.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Whenever |x_t - μ_t| / σ_t ≥ 3.5σ, the guard isolates the spike immediately without poisoning the clean baseline.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Inject a ledger tamper event below to watch the Z-Score cross the red ±3.5σ threshold band!',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Every Sunday generates a predictable stream of ₱200 attendance_logs and GCash/Maya payment confirmations.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Instead of scanning the whole array on every tick, our `CircularZScoreDetector` maintains running sum and sumSq in O(1) operations.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'curious',
        text: 'What prevents a sudden large tamper value from inflating σ_t and hiding subsequent attacks?',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Outlier gating! When Z_t ≥ τ_crit, the detector flags the alert and refuses to push that contaminated value into the baseline window.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'That keeps our True Positive Rate above 99.0% while keeping false alarms on busy tournament days below 0.1%.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Toggle τ_crit in the Decision Fork and trigger synthetic tampering spikes.',
      },
    ],
    pythonSnippet: `from collections import deque
import math

class SlidingZScore:
    def __init__(self, W=30, tau=3.5):
        self.W, self.tau = W, tau
        self.win = deque(maxlen=W)

    def check(self, x):
        if len(self.win) >= 5:
            mu = sum(self.win) / len(self.win)
            var = max(1e-6, sum((v - mu)**2 for v in self.win) / len(self.win))
            z = abs(x - mu) / math.sqrt(var)
            if z >= self.tau:
                return True, z
        self.win.append(x)
        return False, 0.0`,
  },
  {
    id: 8,
    moduleCode: 'Module 12',
    title: 'Dojang RBD & Offline LocalStorage Sync',
    subtitle: 'Series-Parallel Availability & Zero-Downtime Robinsons Luisita Failover',
    durationSimplified: '2:15',
    durationExtended: '4:45',
    interactiveType: 'reliability',
    clinicalThreat:
      'Covered-court mall Wi-Fi dropouts during Sunday check-ins break strict series paths unless browser LocalStorage queueing fails over.',
    mathematicalDriver:
      'Series R_sys = R_net · R_srv · R_db · R_stor, Parallel failover R_par = 1 - (1 - R_online)(1 - R_local), and Availability A = MTBF/(MTBF+MTTR).',
    decisionFork: {
      prompt: 'Choose Dojang Outage Resilience Architecture:',
      options: [
        {
          id: 'online_only',
          label: 'Strict Online-Only Portal (No Local Cache)',
          impact: 'Mall Wi-Fi drop drags end-to-end reliability down to ~95.8% (hours of lost logs/yr).',
          params: { offlineLocalSync: false, rNetwork: 0.965 },
        },
        {
          id: 'offline_sync',
          label: 'Offline Browser LocalStorage Sync Queue',
          impact: 'Parallel local path boosts reliability above 99.89% and cuts effective MTTR to 3 min.',
          params: { offlineLocalSync: true, rNetwork: 0.965 },
        },
      ],
    },
    dialogueSimplified: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'surprised',
        text: 'Cellular and mall Wi-Fi inside Robinsons Luisita Covered Area just dipped right as 30 parents lined up for check-in!',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'In a pure series Reliability Block Diagram (Router → Web Server → PostgreSQL → Storage), one weak link pulls R_sys down multiplicatively!',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Enabling our parallel Offline LocalStorage Sync queue lets instructors log attendance locally and auto-sync when Wi-Fi returns.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Switch the Decision Fork to Offline LocalStorage Sync to see Inherent Availability jump toward Four Nines!',
      },
    ],
    dialogueExtended: [
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'Single-tenant portals running on low-cost cloud tiers face two failure modes: local mall Wi-Fi blackouts and brief server restarts.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'Without redundancy, R_sys(t) = R_network · R_server · R_database · R_storage. If R_network = 0.965, system reliability never exceeds 96.5%.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'explaining',
        text: 'By placing browser `localStorage` queueing in parallel across Network + Server + DB, R_parallel = 1 - (1 - R_online)(1 - R_local).',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'explaining',
        text: 'And Inherent Availability A = MTBF / (MTBF + MTTR) improves dramatically because instructors experience sub-minute recovery.',
      },
      {
        speaker: 'mentor',
        name: 'Master Bruce',
        emotion: 'happy',
        text: 'Zero missed Sunday check-ins, zero lost ₱200 attendance entries, and automatic reconciliation upon reconnect.',
      },
      {
        speaker: 'apprentice',
        name: 'Kiko',
        emotion: 'sparkle',
        text: 'Toggle the failover block in the Decision Fork to inspect series vs. parallel availability.',
      },
    ],
    pythonSnippet: `def dojang_rbd(r_net=0.965, r_srv=0.996, r_db=0.998, r_stor=0.999, offline_sync=True):
    r_series = r_net * r_srv * r_db * r_stor
    if not offline_sync:
        return r_series
    r_online_core = r_net * r_srv * r_db
    r_parallel_core = 1.0 - (1.0 - r_online_core) * (1.0 - 0.9995)
    return r_parallel_core * r_stor`,
  },
];

