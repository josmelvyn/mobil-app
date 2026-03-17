const odbc = require("odbc")

async function test() {
  try {
    const connection = await odbc.connect(
      "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=\\\\10.0.0.20\\Gestion de Ventas\\bd\\GESTION VENTAS_be.accdb;"
    )

    const result = await connection.query("SELECT 1 AS test")

    console.log("OK:", result)

  } catch (err) {
    console.error("ERROR:", err)
  }
}

test()