const db = require("../config/database");

const listar = async (req, res) => {
  try {
    const { ruta_id } = req.query;
    if (!ruta_id || ruta_id === 'NaN') return res.status(400).json({ error: "Ruta ID inválida" });

    const conn = await db.connectDB();

    // 🚩 OPCIÓN A (Para campos numéricos): Sin comillas
    // 🚩 OPCIÓN B (Para campos de texto): Usa '${ruta_id}'
    // Probaremos con la sintaxis más segura para ODBC:
    const query = `
  SELECT id_cliente, cliente, lat, lon, ruta_id, frecuencia
  FROM CLIENTES_wialon
  WHERE ruta_id = ${ruta_id}
`;

    console.log("🔍 Ejecutando SQL:", query);

    const result = await conn.query(query);

    // 🚩 IMPORTANTE: ODBC a veces devuelve un objeto con 'recordset' 
    // y otras veces el array directamente.
    const datos = Array.isArray(result) ? result : (result.recordset || result);

    console.log(`✅ Éxito: Enviando ${datos?.length || 0} clientes.`);
    res.json(datos);

  } catch (error) {
    // 🛡️ ESTO MOSTRARÁ EL ERROR REAL EN TU CONSOLA
    console.error("❌ ERROR DETALLADO (ODBC):", error);
    res.status(500).json({ 
      error: "Fallo en ejecución SQL", 
      detalle: error.message 
    });
  }
};

module.exports = { listar };