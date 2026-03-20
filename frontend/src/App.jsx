import { useState, useEffect } from "react"
import Login from "./pages/Login"
import Clientes from "./pages/Clientes"
import Dashboard from "./pages/Dashboard"
import MonitorOficina from "./pages/MonitorOficina"
import { obtenerOffline } from "./db/indexedDB" 
import "leaflet/dist/leaflet.css"

function App() {
  // 1️⃣ MODIFICADO: Leer usuario del celular al iniciar
  const [user, setUser] = useState(() => {
    const sesionGuardada = localStorage.getItem("sesion_usuario");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const [vista, setVista] = useState("dash")
  const [alertas, setAlertas] = useState(0)

  // 2️⃣ NUEVO: Guardar o borrar la sesión en el celular automáticamente
  useEffect(() => {
    if (user) {
      localStorage.setItem("sesion_usuario", JSON.stringify(user));
    } else {
      localStorage.removeItem("sesion_usuario");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return; 
    
    const revisar = async () => {
      try {
        const datos = await obtenerOffline();
        const hoy = new Date().toDateString();

        const pendientesDeHoy = datos.filter(d => {
          const fechaDato = d.fecha ? new Date(d.fecha).toDateString() : hoy; 
          return fechaDato === hoy;
        });

        setAlertas(pendientesDeHoy.length);
      } catch (err) { console.log(err) }
    };
    
    revisar();
    const interval = setInterval(revisar, 15000); 
    return () => clearInterval(interval);
  }, [user]);

  // Si no hay usuario (ni en estado ni en localStorage), mostrar Login
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
        
        {vista === "mapa" && <Clientes user={user} />}

        {vista === "admin" && (user?.PRUEBA == 1) ? (
          <MonitorOficina rutaId={user?.ruta_id || user?.RUTA_ID} />
        ) : vista === "admin" && (
          <div style={{ padding: "20px", textAlign: "center" }}>Acceso denegado 🚫</div>
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

        {user?.PRUEBA == 1 && (
          <button 
            onClick={() => setVista("admin")} 
            style={{ ...btnStyle(vista === "admin"), position: "relative" }}
          >
            <span style={{ fontSize: "20px" }}>👁️</span>
            <span style={{ fontSize: "10px", fontWeight: "bold" }}>MONITOR</span>
            
            {alertas > 0 && (
              <div style={{
                position: "absolute", top: "5px", right: "15px",
                width: "10px", height: "10px", backgroundColor: "#ef4444",
                borderRadius: "50%", border: "2px solid white"
              }}></div>
            )}
          </button>
        )}
      </nav>
    </div>
  )
}

const btnStyle = (activo) => ({
  border: "none", background: "none", 
  color: activo ? "#2563eb" : "#94a3b8",
  display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
  cursor: "pointer"
});

export default App;