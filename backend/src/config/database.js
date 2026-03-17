const odbc = require("odbc")

async function connectDB() {
  return await odbc.connect(
    "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=\\\\10.0.0.20\\Gestion de Ventas\\bd\\GESTION VENTAS_be.accdb;"
  )
}

module.exports = { connectDB }

