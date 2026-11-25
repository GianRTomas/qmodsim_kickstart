/**
 * Pure Mathematical Engine: Module 12 — System Reliability Block Diagram (RBD) & Availability
 * Models FATAMA end-to-end check-in operational path:
 * Lobby Internet / Router -> Cloud Web Server -> Relational Database (Supabase PostgreSQL) -> Tournament / Media Storage
 * Evaluates Offline Browser LocalStorage Syncing failover during Robinsons Luisita Wi-Fi blackouts.
 */

/**
 * Compute series vs. offline-failover reliability and Inherent Availability A = MTBF / (MTBF + MTTR).
 * @param {{
 *   rNetwork?: number,
 *   rServer?: number,
 *   rDatabase?: number,
 *   rStorage?: number,
 *   offlineLocalSync?: boolean,
 *   mtbfHours?: number,
 *   mttrHours?: number
 * }} params
 */
export function computeDojangReliability(params = {}) {
  const clampR = (v) => Math.max(0.5, Math.min(0.99999, v));
  const rNetwork = clampR(params.rNetwork ?? 0.965);
  const rServer = clampR(params.rServer ?? 0.996);
  const rDatabase = clampR(params.rDatabase ?? 0.998);
  const rStorage = clampR(params.rStorage ?? 0.999);
  const offlineLocalSync = params.offlineLocalSync ?? true;

  // Baseline series path without local offline queueing
  const seriesReliability = rNetwork * rServer * rDatabase * rStorage;

  // With Offline Browser LocalStorage Queueing (parallel local check-in path during Wi-Fi/cloud outage)
  // Local device browser cache has R_local = 0.9995 while online path is rNetwork * rServer * rDatabase
  const rOnlineCore = rNetwork * rServer * rDatabase;
  const rLocalCache = 0.9995;
  const parallelCheckInPath = 1 - (1 - rOnlineCore) * (1 - rLocalCache);
  const resilientReliability = offlineLocalSync ? parallelCheckInPath * rStorage : seriesReliability;

  const mtbfHours = Math.max(10, params.mtbfHours ?? 720);
  const rawMttr = Math.max(0.05, params.mttrHours ?? 2.5);
  const effectiveMttr = offlineLocalSync ? Math.min(rawMttr, 0.05) : rawMttr;

  const baselineAvailability = mtbfHours / (mtbfHours + rawMttr);
  const effectiveAvailability = mtbfHours / (mtbfHours + effectiveMttr);
  const annualDowntimeMinutes = (1 - effectiveAvailability) * 365 * 24 * 60;

  return {
    rNetwork,
    rServer,
    rDatabase,
    rStorage,
    offlineLocalSync,
    seriesReliability,
    resilientReliability,
    effectiveReliability: resilientReliability,
    baselineAvailability,
    effectiveAvailability,
    annualDowntimeMinutes,
    ninesLabel:
      effectiveAvailability >= 0.99999
        ? 'Five Nines (99.999%)'
        : effectiveAvailability >= 0.9999
          ? 'Four Nines (99.99%)'
          : effectiveAvailability >= 0.999
            ? 'Three Nines (99.9%)'
            : 'Below 99.9%',
  };
}

