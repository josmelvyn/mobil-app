const jwt = require("jsonwebtoken")
const db = require("../config/database")

exports.login = async (req,res)=>{

const {usuario,password} = req.body

const data = await db.query(`
SELECT id,ruta_id
FROM usuarios
WHERE usuario='${usuario}'
AND password='${password}'
AND activo=true
`)

if(data.length===0)
return res.status(401).json({error:"Credenciales incorrectas"})

const token = jwt.sign(
{ id:data[0].id, ruta_id:data[0].ruta_id },
process.env.SECRET,
{ expiresIn:"8h"}
)

res.json({token})

}