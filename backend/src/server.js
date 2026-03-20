const { connectDB } = require("./config/database"); // Asegúrate de que la ruta sea correcta
const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");


const authRoutes = require("./routes/authRoutes");
const clientesRoutes = require("./routes/clientesRoutes");
const punteoRoutes = require("./routes/punteoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/punteo", punteoRoutes);

// 🛡️ CONFIGURACIÓN HTTPS DINÁMICA
try {
  // Buscamos la carpeta certs al lado de este archivo o en la raíz
  const certPath = fs.existsSync(path.join(__dirname, "certs")) 
    ? path.join(__dirname, "certs") 
    : path.join(process.cwd(), "certs");

  const opciones = {
    // 🚩 IMPORTANTE: Usamos los nombres reales que generó el comando de Office
    key: fs.readFileSync(path.join(certPath, "localhost.key")), 
    cert: fs.readFileSync(path.join(certPath, "localhost.crt")) 
  };
  app.get("/", (req, res) => {
  res.send("Servidor Activo 🚀");
});
  const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor listo para ngrok en http://localhost:${PORT}`);
});
// https.createServer(opciones, app).listen(3000, "0.0.0.0", () => {
//     console.log("🚀 Servidor Access SEGURO en https://10.0.0.52:3000");
//   });
} catch (error) {
  console.error("❌ ERROR AL INICIAR HTTPS:");
  console.error("Asegúrate de que los archivos 'localhost.key' y 'localhost.crt' estén en la carpeta /certs");
  console.error("Detalle:", error.message);
}

app.get('/api/lista-rutas', async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    // Obtenemos los números de ruta únicos
    const sql = `SELECT DISTINCT ruta_id FROM CLIENTES_wialon WHERE ruta_id IS NOT NULL ORDER BY ruta_id ASC`;
    const rows = await connection.query(sql);
    res.json(rows); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});
app.get('/api/monitoreo/:ruta_id', async (req, res) => {
  const rutaId = req.params.ruta_id;
  let connection;
  try {
    connection = await connectDB();
    const sql = `
      SELECT 
          c.id_cliente, c.cliente, c.lat AS lat_cliente, c.lon AS lon_cliente, c.frecuencia,
          p.lat AS lat_punteo, p.lon AS lon_punteo, p.fecha, p.comentario
      FROM CLIENTES_wialon AS c
      LEFT JOIN (
          SELECT * FROM punteos WHERE DateValue(fecha) = Date()
      ) AS p ON c.id_cliente = p.cliente_id
      WHERE c.ruta_id = ${rutaId}
    `;
    const rows = await connection.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});