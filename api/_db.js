import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const K_NUMS = 'rifa:nums';
export const K_CFG = 'rifa:cfg';

const DEFAULT_CFG = { loteria: 'Lotería de Bogotá', fecha: '', nequi: '', titular: '', whatsapp: '', meta: 3000000, minimo: 20000 };

export async function getCfg() {
  const c = (await redis.hgetall(K_CFG)) || {};
  const cfg = { ...DEFAULT_CFG, ...c };
  cfg.meta = Number(cfg.meta) || DEFAULT_CFG.meta;
  cfg.minimo = Number(cfg.minimo) || DEFAULT_CFG.minimo;
  for (const k of ['loteria', 'fecha', 'nequi', 'titular', 'whatsapp']) cfg[k] = cfg[k] ? String(cfg[k]) : '';
  return cfg;
}

export async function getNums() {
  const raw = (await redis.hgetall(K_NUMS)) || {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const d = typeof v === 'string' ? JSON.parse(v) : v;
    if (d && d.nombre) out[k] = d;
  }
  return out;
}

export function isAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && req.headers['x-admin-password'] === pw;
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
