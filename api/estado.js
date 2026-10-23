import { getCfg, getNums } from './_db.js';

export default async function handler(req, res) {
  try {
    const [nums, cfg] = await Promise.all([getNums(), getCfg()]);
    const pub = {};
    let comprometido = 0, pagado = 0;
    for (const [k, d] of Object.entries(nums)) {
      const a = Number(d.aporte) || 0;
      comprometido += a;
      if (d.pagado) pagado += a;
      pub[k] = { quien: d.nombre.split(/\s+/)[0] + (d.apellido ? ' ' + d.apellido[0] + '.' : ''), pagado: !!d.pagado };
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ nums: pub, cfg, comprometido, pagado });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar los números.' });
  }
}
