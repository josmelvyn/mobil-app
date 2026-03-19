import { useState } from "react"
import Login from "./pages/Login"
import Clientes from "./pages/Clientes"
import Dashboard from "./pages/Dashboard" // 👈 Asegúrate de crear este archivo
import "leaflet/dist/leaflet.css"

function App() {
  const [user, setUser] = useState(null)
  const [vista, setVista] = useState("dash") // "dash" será la primaria tras el login

  // 1. Si no hay usuario, mostramos Login
  if (!user) {
    return <Login setUser={setUser} />
  }

  // 2. Si hay usuario, mostramos la interfaz con navegación
  return (
    <div style={{ background: "#f8fafc", minHeight: "100dvh", position: "relative" }}>
      
      {/* CONTENIDO PRINCIPAL */}
      <main style={{ paddingBottom: "80px" }}>
        {vista === "dash" ? (
          <Dashboard onVerMapa={() => setVista("mapa")} 
          user={user}                       // 👈 Pasamos el usuario
            setUser={setUser}
          />
          
        ) : (
          <Clientes user={user} />
          
        )}
      </main>

      {/* 📱 BARRA DE NAVEGACIÓN INFERIOR (Solo visible si está logueado) */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "70px",
        background: "white", display: "flex", justifyContent: "space-around",
        alignItems: "center", borderTop: "1px solid #e2e8f0", zIndex: 2000,
        boxShadow: "0 -5px 15px rgba(0,0,0,0.05)", paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        <button 
          onClick={() => setVista("dash")}
          style={{ 
            border: "none", background: "none", 
            color: vista === "dash" ? "#2563eb" : "#94a3b8",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px"
          }}>
          <span style={{ fontSize: "22px" }}>📊</span>
          <span style={{ fontSize: "10px", fontWeight: "bold" }}>INICIO</span>
        </button>
        
        <button 
          onClick={() => setVista("mapa")}
          style={{ 
            border: "none", background: "none", 
            color: vista === "mapa" ? "#2563eb" : "#94a3b8",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px"
          }}>
          <span style={{ fontSize: "22px" }}>📍</span>
          <span style={{ fontSize: "10px", fontWeight: "bold" }}>MAPA</span>
        </button>
      </nav>
    </div>
  )
}

export default App