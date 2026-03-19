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
  https.createServer(opciones, app).listen(3000, "0.0.0.0", () => {
    console.log("🚀 Servidor Access SEGURO en https://10.0.0.52:3000");
  });
} catch (error) {
  console.error("❌ ERROR AL INICIAR HTTPS:");
  console.error("Asegúrate de que los archivos 'localhost.key' y 'localhost.crt' estén en la carpeta /certs");
  console.error("Detalle:", error.message);
}