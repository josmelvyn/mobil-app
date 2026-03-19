export const API = "https://miyoko-unreleased-overfavorably.ngrok-free.dev"; 

// 1. LOGIN
export async function login(usuario, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true" 
    },
    body: JSON.stringify({ usuario, password })
  });
  return await res.json();
}

// 2. OBTENER CLIENTES (Unificada y corregida con /api)
export async function obtenerClientes(ruta_id) {
  try {
    // 🚩 CORRECCIÓN: Se agrega /api/ para que coincida con el servidor
    const response = await fetch(`${API}/api/clientes?ruta_id=${ruta_id}`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    
    if (!response.ok) throw new Error("Error en el servidor");
    
    const data = await response.json();
    
    // Guardamos respaldo para modo offline
    localStorage.setItem("respaldo_clientes", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error en obtenerClientes:", error);
    // Si falla la red, devolvemos lo que tengamos guardado
    const local = localStorage.getItem("respaldo_clientes");
    return local ? JSON.parse(local) : [];
  }
}

// 3. ENVIAR PUNTEO
export async function enviarPunteo(data) {
  const res = await fetch(`${API}/api/punteo`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Error al subir a Access");
  return await res.json();
}