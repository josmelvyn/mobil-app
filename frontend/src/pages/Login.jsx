import { useState } from "react"
import { login } from "../api/api"

export default function Login({ setUser }) {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin() {
  const res = await login(usuario, password)

  console.log(res) // 👈 AGREGA ESTO

 if (res.ok) {
  setUser( res.usuario ) // puedes guardar lo que quieras aquí
} else {
  alert("Error login")
}
}

  return (
    <div>
      <h2>Login</h2>

      <input placeholder="Usuario" onChange={e => setUsuario(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Entrar</button>
    </div>
  )
}