export const API = "https://10.0.0.52:3000"; 

export async function login(usuario, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  });
  return await res.json();
}

export const getClientes = async (ruta_id) => {
  try {
    // 🚩 CAMBIO 2: Usar la constante API
    const response = await fetch(`${API}/api/clientes?ruta_id=${ruta_id}`);
    if (!response.ok) throw new Error("Error en red");
    const data = await response.json();
    
    localStorage.setItem("respaldo_clientes", JSON.stringify(data));
    return data;
  } catch (error) {
    const local = localStorage.getItem("respaldo_clientes");
    return local ? JSON.parse(local) : [];
  }
};

export async function enviarPunteo(data) {
  // 🚩 CAMBIO 3: Ruta limpia hacia el puerto 3000
  const res = await fetch(`${API}/api/punteo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Error al subir a Access");
  return await res.json();
}