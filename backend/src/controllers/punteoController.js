const { connectDB } = require("../config/database")

// 🔥 Función para calcular distancia en metros (Haversine)
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Radio de la Tierra en metros
  const toRad = (x) => (x * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // distancia en metros
}

const registrar = async (req, res) => {
  const { cliente_id, lat, lon, comentario } = req.body

  try {
    const db = await connectDB()

    const fecha = new Date().toISOString().slice(0, 10)

    // 1️⃣ Verificar si ya visitó hoy
    const existe = await db.query(`
      SELECT * FROM punteos 
      WHERE cliente_id=${cliente_id}
      AND fecha=#${fecha}#  `
  )

    if (existe.length > 0) {
      return res.json({ ok: false, mensaje: "Ya visitado hoy" })
    }

    // 2️⃣ Obtener ubicación del cliente
    const cliente = await db.query(`
      SELECT lat, lon 
      FROM CLIENTES_wialon 
      WHERE id_cliente=${cliente_id}
    `)

    if (cliente.length === 0) {
      return res.json({ ok: false, mensaje: "Cliente no encontrado" })
    }

    const clienteLat = parseFloat(cliente[0].lat)
    const clienteLon = parseFloat(cliente[0].lon)

    // 3️⃣ Calcular distancia
    const distancia = distanciaMetros(lat, lon, clienteLat, clienteLon)

    // 🔥 Radio permitido (30 metros)
    if (distancia > 10000) {
      return res.json({
        ok: false,
        mensaje: `Estás muy lejos del cliente (${Math.round(distancia)} m)`
      })
    }

    // 4️⃣ Guardar punteo
    await db.query(`
      INSERT INTO punteos (cliente_id, fecha, lat, lon, comentario)
      VALUES (${cliente_id}, #${fecha}#, ${lat}, ${lon}, '${comentario || ""}')
    `)

    res.json({ ok: true })

  } catch (err) {
    console.error("ERROR PUNTEO:", err)
    res.status(500).json({ error: "Error al guardar" })
  }
}

module.exports = { registrar }