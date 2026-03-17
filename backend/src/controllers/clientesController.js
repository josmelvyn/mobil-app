const db = require("../config/database")

const listar = async (req, res) => {
  try {
    const ruta_id = req.query.ruta_id

    const conn = await db.connectDB()

    const query = `
      SELECT id_cliente, cliente, lat, lon
      FROM [CLIENTES_wialon]
      WHERE ruta_id = '${ruta_id}'
    `

    const result = await conn.query(query)

    res.json(result)


   

  } catch (error) {
    console.error("ERROR REAL:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { listar }