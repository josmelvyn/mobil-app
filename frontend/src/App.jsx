import { useState } from "react"
import Login from "./pages/Login"
import Clientes from "./pages/Clientes"
import Dashboard from "./pages/Dashboard"
import MonitorOficina from "./pages/MonitorOficina" // 👈 Importamos el nuevo componente
import "leaflet/dist/leaflet.css"

function App() {
  const [user, setUser] = useState(null)
  // Ahora tenemos 3 vistas: "dash", "mapa" y "admin"
  const [vista, setVista] = useState("dash") 

  if (!user) {
    return <Login setUser={setUser} />
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100dvh", position: "relative" }}>

      <main style={{ paddingBottom: "80px" }}>
        {vista === "dash" && (
          <Dashboard 
            onVerMapa={() => setVista("mapa")} 
            user={user} 
            setUser={setUser} 
          />
        )}
        
        {vista === "mapa" && (
          <Clientes user={user} />
        )}

        {/* 🖥️ VISTA DE OFICINA (MONITOR) */}
        {vista === "admin" && (
          <MonitorOficina rutaId={user.ruta_id} />
        )}
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "70px",
        background: "white", display: "flex", justifyContent: "space-around",
        alignItems: "center", borderTop: "1px solid #e2e8f0", zIndex: 2000,
        boxShadow: "0 -5px 15px rgba(0,0,0,0.05)", paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        <button onClick={() => setVista("dash")} style={btnStyle(vista === "dash")}>
          <span style={{ fontSize: "20px" }}>📊</span>
          <span style={{ fontSize: "10px", fontWeight: "bold" }}>INICIO</span>
        </button>
        
        <button onClick={() => setVista("mapa")} style={btnStyle(vista === "mapa")}>
          <span style={{ fontSize: "20px" }}>📍</span>
          <span style={{ fontSize: "10px", fontWeight: "bold" }}>MI RUTA</span>
        </button>

        {/* 👁️ BOTÓN MONITOR (Solo para oficina/pruebas) */}
        <button onClick={() => setVista("admin")} style={btnStyle(vista === "admin")}>
          <span style={{ fontSize: "20px" }}>👁️</span>
          <span style={{ fontSize: "10px", fontWeight: "bold" }}>MONITOR</span>
        </button>
      </nav>
    </div>
  )
}

// Función auxiliar para no repetir estilos en los botones
const btnStyle = (activo) => ({
  border: "none", background: "none", 
  color: activo ? "#2563eb" : "#94a3b8",
  display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
  cursor: "pointer"
});

export default App