import { redis, K_NUMS, K_CFG, getCfg, getNums, isAdmin, readBody } from './_db.js';

export default async function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'Falta configurar ADMIN_PASSWORD en Vercel.' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta.' });
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const [nums, cfg] = await Promise.all([getNums(), getCfg()]);
    return res.status(200).json({ nums, cfg });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const b = readBody(req);
  const numero = String(b.numero || '').padStart(2, '0');
  switch (b.accion) {
    case 'liberar':
      await redis.hdel(K_NUMS, numero);
      break;
    case 'pagado':
    case 'aporte': {
      const raw = await redis.hget(K_NUMS, numero);
      if (!raw) return res.status(404).json({ error: 'Ese número no está apartado.' });
      const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (b.accion === 'pagado') d.pagado = !!b.valor;
      else {
        const v = Number(String(b.valor || '').replace(/\D/g, '')) || 0;
        if (v <= 0) return res.status(400).json({ error: 'Aporte inválido.' });
        d.aporte = v;
      }
      await redis.hset(K_NUMS, { [numero]: JSON.stringify(d) });
      break;
    }
    case 'asignar': {
      const nombre = String(b.nombre || '').trim().slice(0, 40), apellido = String(b.apellido || '').trim().slice(0, 40);
      const aporte = Number(String(b.aporte || '').replace(/\D/g, '')) || 0;
      if (!/^\d\d$/.test(numero) || !nombre || !apellido || !aporte) return res.status(400).json({ error: 'Completa número, nombre, apellido y aporte.' });
      const ok = await redis.hsetnx(K_NUMS, numero, JSON.stringify({ nombre, apellido, aporte, pagado: false, ts: Date.now() }));
      if (!ok) return res.status(409).json({ error: 'Ese número ya está apartado.' });
      break;
    }
    case 'config': {
      const c = b.cfg || {};
      const clean = {};
      for (const k of ['loteria', 'fecha', 'nequi', 'titular', 'whatsapp']) clean[k] = String(c[k] || '').slice(0, 80);
      for (const k of ['meta', 'minimo']) clean[k] = Number(String(c[k] || '').replace(/\D/g, '')) || '';
      for (const k of Object.keys(clean)) if (clean[k] === '') delete clean[k];
      await redis.hset(K_CFG, clean);
      break;
    }
    default:
      return res.status(400).json({ error: 'Acción desconocida.' });
  }
  const [nums, cfg] = await Promise.all([getNums(), getCfg()]);
  res.status(200).json({ nums, cfg });
}
