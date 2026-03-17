const ADODB = require("node-adodb")

const connection = ADODB.open(
  "Provider=Microsoft.ACE.OLEDB.16.0;Data Source=\\\\10.0.0.20\\Gestion de Ventas\\bd\\GESTION VENTAS_be.accdb;"
)

connection.query("SELECT 1 AS test")
  .then(data => console.log("OK:", data))
  .catch(err => console.error("ERROR:", err))