export const API = "/api"

export async function login(usuario, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  })

  return await res.json()
}

export const getClientes = async (ruta_id) => {
  try {
    const response = await fetch(`/api/clientes?ruta_id=${ruta_id}`);
    if (!response.ok) throw new Error("Error en red");
    const data = await response.json();
    
    // Guardamos una copia aquí también por si acaso
    localStorage.setItem("respaldo_clientes", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error cargando clientes de API, buscando en local...");
    const local = localStorage.getItem("respaldo_clientes");
    return local ? JSON.parse(local) : []; // Si no hay internet, devuelve lo guardado
  }
};

export async function enviarPunteo(data) {
  await fetch(`${API}/punteo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
}