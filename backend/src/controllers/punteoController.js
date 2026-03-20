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
  // 1️⃣ Extraemos 'fecha' del cuerpo de la petición (la que envió el celular)
  const { cliente_id, lat, lon, comentario, fecha } = req.body
  console.log("📥 Recibido punteo para cliente:", cliente_id);

  try {
    const db = await connectDB()

    // 2️⃣ Procesamos la fecha que viene del celular (ISO String)
    const d = new Date(fecha || new Date()); // Si no trae fecha, usa la actual por seguridad
    
    // Formato para el SELECT (Solo día)
    const soloDia = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    
    // Formato para el INSERT (Día + Hora del momento del punteo)
    const fechaConHora = `${soloDia} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
    
    console.log("📅 Hora original del punteo (Offline/Online):", fechaConHora);

    // 🔍 3️⃣ Verificar duplicados (Usamos solo el día)
    const existe = await db.query(`SELECT * FROM punteos WHERE cliente_id=${cliente_id} AND fecha=#${soloDia}#`);
    if (existe.length > 0) {
      return res.json({ ok: false, mensaje: "Ya visitado hoy" });
    }

    // 📍 4️⃣ Obtener coordenadas y validar distancia
    const datosCliente = await db.query(`SELECT lat, lon FROM CLIENTES_wialon WHERE id_cliente=${cliente_id}`);
    if (datosCliente.length > 0) {
      const cLat = parseFloat(datosCliente[0].lat);
      const cLon = parseFloat(datosCliente[0].lon);
      const distancia = distanciaMetros(lat, lon, cLat, cLon);

      if (distancia > 1000000) { 
        return res.json({ ok: false, mensaje: `Muy lejos: ${Math.round(distancia)}m.` });
      }
    }

    // 💾 5️⃣ INSERTAR CON LA HORA ORIGINAL
    await db.query(`
      INSERT INTO punteos (cliente_id, fecha, lat, lon, comentario)
      VALUES (${cliente_id}, #${fechaConHora}#, ${lat}, ${lon}, '${comentario || ""}')
    `);

    console.log("✅ Insertado con éxito con su hora original");
    res.json({ ok: true });

  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN ACCESS:", err);
    res.status(500).json({ ok: false, error: "Fallo en BD" });
  }
}

module.exports = { registrar }