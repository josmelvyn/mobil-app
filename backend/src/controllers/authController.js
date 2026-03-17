const db = require("../config/database")

const login = async (req, res) => {
  try {
    const { usuario, password } = req.body

    const conn = await db.connectDB()

    const query = `
      SELECT * 
      FROM usuarios 
      WHERE usuario='${usuario}' AND pass='${password}'
    `

    const result = await conn.query(query)

    if (result.length > 0) {
      return res.json({
        ok: true,
        usuario: result[0]
      })
    }

    res.json({ ok: false })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { login }