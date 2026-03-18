export const API = "http://localhost:3000"

export async function login(usuario, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  })

  return await res.json()
}

export async function getClientes(ruta_id) {
  const res = await fetch(`${API}/clientes?ruta_id=${ruta_id}`)
  return await res.json()
}

export async function enviarPunteo(data) {
  await fetch(`${API}/punteo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
}