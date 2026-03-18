const ABODB = require("node-adodb")

const connection = ABODB.open (
    "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=\\10.0.0.20\Gestion de Ventas\bd\GESTION VENTAS_be.accdb"

)

async function obtenerClientePorRuta(ruta_id){
    const query= `
    SELECT id_cliente, cliente, lat, lon
    FROM clientes
    WHERE ruta_id = ${ruta_id}`

    return await connection.query(query)
}
module.exports = {obtenerClientePorRuta}