/**
 * Pure Mathematical Engine: Module 7 — Game Theory in Session Credit Integrity & Fraud Prevention
 * 2x2 Strategic Normal-Form Game:
 * User/Guardian Actions: U = { Legitimate Single-User Check-in, Shared Login / Credit Exploitation }
 * Dojang Admin Actions:  D = { Passive Trust (Audit on Complaint), Strict Verification (IP/Device Pinning + QR Refresh) }
 */

/**
 * Solve the 2x2 strategic normal-form game for Mixed-Strategy Nash Equilibrium (σ_U*, σ_D*).
 * Payoff notation per interaction (in PHP ₱):
 *   - sessionFee (F): ₱200 revenue per legitimate session
 *   - exploitGain (G): ₱200 avoided fee per shared/spoofed check-in
 *   - penaltyFee (P): ₱500 fine + credit freeze when caught under Strict Verification
 *   - auditOverhead (C_audit): ₱35 instructor lobby friction / verification overhead per check-in
 *   - missedLeakageLoss (L_leak): ₱200 revenue lost by dojang if Shared Login passes Passive Trust
 *
 * Payoff Matrix (U_user, U_admin):
 *   (Legit, Passive):  (0, +F)
 *   (Legit, Strict):   (-friction, +F - C_audit)
 *   (Shared, Passive): (+G, -L_leak)
 *   (Shared, Strict):  (-P, +P - C_audit)
 *
 * @param {{
 *   sessionFee?: number,
 *   penaltyFee?: number,
 *   auditOverhead?: number,
 *   lobbyFriction?: number
 * }} params
 */
export function solveCreditIntegrityGame(params = {}) {
  const sessionFee = Math.max(50, params.sessionFee ?? 200);
  const penaltyFee = Math.max(50, params.penaltyFee ?? 500);
  const auditOverhead = Math.max(5, params.auditOverhead ?? 35);
  const lobbyFriction = Math.max(0, params.lobbyFriction ?? 10);

  const G = sessionFee;
  const L_leak = sessionFee;

  // Payoff matrix [row: User][col: Admin] = { u: userPayoff, d: adminPayoff }
  const matrix = {
    legitPassive: { u: 0, d: sessionFee },
    legitStrict: { u: -lobbyFriction, d: sessionFee - auditOverhead },
    sharedPassive: { u: G, d: -L_leak },
    sharedStrict: { u: -penaltyFee, d: penaltyFee - auditOverhead },
  };

  // Admin indifference condition: E[U_user(Legit)] = E[U_user(Shared)]
  // 0*(1-q) + (-lobbyFriction)*q = G*(1-q) + (-penaltyFee)*q
  // => q* * (G + penaltyFee - lobbyFriction) = G
  const denomQ = Math.max(1, G + penaltyFee - lobbyFriction);
  const qStar = Math.max(0, Math.min(1, G / denomQ)); // Optimal Strict Verification probability σ_D*

  // User indifference condition: E[U_admin(Passive)] = E[U_admin(Strict)]
  // sessionFee*(1-p) + (-L_leak)*p = (sessionFee - auditOverhead)*(1-p) + (penaltyFee - auditOverhead)*p
  // => auditOverhead = p * (L_leak + penaltyFee)
  const denomP = Math.max(1, L_leak + penaltyFee);
  const pStar = Math.max(0, Math.min(1, auditOverhead / denomP)); // Equilibrium fraud attempt rate σ_U*

  // Expected payoffs at Mixed Nash Equilibrium
  const expectedUserPayoff = -lobbyFriction * qStar;
  const expectedAdminRevenue = sessionFee * (1 - pStar) + (-L_leak) * pStar;
  const revenueSavedVsNoAudit = expectedAdminRevenue - (-L_leak);

  return {
    matrix,
    pStar, // Optimal / equilibrium probability User attempts credit exploitation (σ_U*)
    qStar, // Optimal Strict Verification / QR Audit frequency (σ_D*)
    expectedUserPayoff,
    expectedAdminRevenue,
    revenueSavedVsNoAudit,
    indifferenceCheckUser: Math.abs(
      (0 * (1 - qStar) - lobbyFriction * qStar) -
      (G * (1 - qStar) - penaltyFee * qStar)
    ),
    indifferenceCheckAdmin: Math.abs(
      (sessionFee * (1 - pStar) - L_leak * pStar) -
      ((sessionFee - auditOverhead) * (1 - pStar) + (penaltyFee - auditOverhead) * pStar)
    ),
  };
}

