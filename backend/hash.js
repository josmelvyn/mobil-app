const bcrypt = require("bcryptjs")

async function generar() {
  const hash = await bcrypt.hash("123456", 10)
  console.log(hash)
}

generar()