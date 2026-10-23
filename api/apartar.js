import { redis, K_NUMS, getCfg, readBody } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const b = readBody(req);
  const numero = String(b.numero || '').padStart(2, '0');
  const nombre = String(b.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const apellido = String(b.apellido || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const aporte = Number(String(b.aporte || '').replace(/\D/g, '')) || 0;
  const cfg = await getCfg();
  if (!/^\d\d$/.test(numero)) return res.status(400).json({ error: 'Número inválido.' });
  if (!nombre || !apellido) return res.status(400).json({ error: 'Escribe nombre y apellido.' });
  if (aporte < cfg.minimo) return res.status(400).json({ error: 'El aporte mínimo es $' + cfg.minimo.toLocaleString('es-CO') + '.' });
  if (aporte > 10000000) return res.status(400).json({ error: 'Revisa el valor del aporte.' });
  // HSETNX es atómico: si dos personas piden el mismo número, solo una lo obtiene.
  const ok = await redis.hsetnx(K_NUMS, numero, JSON.stringify({ nombre, apellido, aporte, pagado: false, ts: Date.now() }));
  if (!ok) return res.status(409).json({ error: 'OCUPADO' });
  res.status(200).json({ ok: true });
}
