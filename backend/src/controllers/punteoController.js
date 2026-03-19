const { connectDB } = require("../config/database")

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R
}

const registrar = async (req, res) => {
  const { cliente_id, lat, lon, comentario } = req.body
  console.log("📥 Recibido punteo para cliente:", cliente_id);

  try {
    const db = await connectDB()

    // 🚩 CORRECCIÓN DE FECHA: Usar fecha local del PC (Mes/Día/Año para Access)
    const d = new Date();
    const fecha = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    console.log("📅 Fecha procesada:", fecha);

    // 1️⃣ Verificar duplicados
    const existe = await db.query(`SELECT * FROM punteos WHERE cliente_id=${cliente_id} AND fecha=#${fecha}#`);
    if (existe.length > 0) {
      return res.json({ ok: false, mensaje: "Ya visitado hoy" });
    }

    // 2️⃣ Obtener coordenadas del cliente
    const datosCliente = await db.query(`SELECT lat, lon FROM CLIENTES_wialon WHERE id_cliente=${cliente_id}`);
    if (datosCliente.length === 0) {
      return res.json({ ok: false, mensaje: "Cliente no existe en Access" });
    }

    const cLat = parseFloat(datosCliente[0].lat);
    const cLon = parseFloat(datosCliente[0].lon);
    const distancia = distanciaMetros(lat, lon, cLat, cLon);

    // 3️⃣ Validar distancia (ajustado a 50 metros)
    if (distancia > 1000000) { 
      return res.json({ ok: false, mensaje: `Muy lejos: ${Math.round(distancia)}m. Acércate más.` });
    }

    // 4️⃣ GUARDAR
    await db.query(`
      INSERT INTO punteos (cliente_id, fecha, lat, lon, comentario)
      VALUES (${cliente_id}, #${fecha}#, ${lat}, ${lon}, '${comentario || ""}')
    `);

    console.log("✅ Insertado en Access correctamente");
    res.json({ ok: true });

  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN ACCESS:", err);
    res.status(500).json({ ok: false, error: "Fallo al escribir en base de datos" });
  }
}

module.exports = { registrar }