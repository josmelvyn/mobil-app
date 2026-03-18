import { useState } from "react"
import { login } from "../api/api"

export default function Login({ setUser }) {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [cargando, setCargando] = useState(false)

 async function handleLogin() {
  const inputUser = usuario.trim().toLowerCase();
  const inputPass = password;

  // 1. INTENTO CON INTERNET
  if (navigator.onLine) {
    try {
      const res = await login(usuario, password);
      if (res && res.ok) {
        // Guardamos exactamente lo que funcionó en el servidor
        localStorage.setItem("off_user", inputUser);
        localStorage.setItem("off_pass", inputPass);
        localStorage.setItem("off_data", JSON.stringify(res.usuario));
        
        console.log("✅ Guardado para offline:", inputUser);
        setUser(res.usuario);
        return;
      }
    } catch (e) {
      console.log("🌐 Servidor no alcanzado, probando Offline...");
    }
  }

  // 2. MODO OFFLINE
  const savedUser = localStorage.getItem("off_user");
  const savedPass = localStorage.getItem("off_pass");
  const savedData = localStorage.getItem("off_data");

  if (savedUser && savedPass) {
    // COMPARACIÓN LOG: Mira esto en la consola si falla
    console.log("Comparando:", { 
      escribiste: inputUser, guardado: savedUser,
      passOK: inputPass === savedPass 
    });

    if (inputUser === savedUser && inputPass === savedPass) {
      alert("Acceso Offline OK 📦");
      setUser(JSON.parse(savedData));
    } else {
      alert("Usuario o contraseña incorrectos (Modo Offline) ❌");
    }
  } else {
    alert("❌ Error: No hay sesión guardada en este equipo.");
  }



}

  return (
    <div style={{
      height: "100dvh", // Altura dinámica para móviles
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      
      {/* CONTENEDOR PRINCIPAL TIPO CARD MÓVIL */}
      <div style={{
        width: "100%",
        maxWidth: "400px",
        textAlign: "center"
      }}>
        
        {/* LOGO CIRCULAR */}
        <div style={{
          width: "80px",
          height: "80px",
          backgroundColor: "#2563eb",
          borderRadius: "24px",
          margin: "0 auto 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "40px",
          boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
          transform: "rotate(-5deg)"
        }}>
          📦
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>
          Logística Pro
        </h1>
        <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "40px" }}>
          Ingresa para iniciar tu ruta hoy
        </p>

        {/* FORMULARIO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginLeft: "4px", textTransform: "uppercase" }}>Usuario</label>
            <input 
              placeholder="Nombre de usuario" 
              onChange={e => setUsuario(e.target.value)} 
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "2px solid #e2e8f0",
                fontSize: "16px", // Evita el zoom automático en iOS
                marginTop: "6px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginLeft: "4px", textTransform: "uppercase" }}>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              onChange={e => setPassword(e.target.value)} 
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "2px solid #e2e8f0",
                fontSize: "16px",
                marginTop: "6px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button 
            onClick={handleLogin}
            disabled={cargando}
            style={{
              width: "100%",
              padding: "18px",
              backgroundColor: cargando ? "#94a3b8" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "18px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              marginTop: "10px",
              boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
              transition: "transform 0.1s active"
            }}
          >
            {cargando ? "Verificando..." : "Iniciar Sesión"}
          </button>

        </div>

        <p style={{ marginTop: "40px", fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>
          ¿Problemas de acceso? <span style={{ color: "#2563eb" }}>Contactar Soporte</span>
        </p>
      </div>
    </div>
  )
}