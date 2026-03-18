const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const clientesRoutes = require("./routes/clientesRoutes")
const punteoRoutes = require("./routes/punteoRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/auth", authRoutes)
app.use("/clientes", clientesRoutes)
app.use("/punteo", punteoRoutes)

app.listen(3000, "0.0.0.0", () => {
  console.log("API funcionando en puerto 3000")
  
})