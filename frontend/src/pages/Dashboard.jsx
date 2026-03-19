import React, { useMemo, useState, useEffect } from "react";
import { obtenerOffline, limpiarOffline } from "../db/indexedDB";
import { enviarPunteo, obtenerClientes } from "../api/api";
import Login from "./Login";

// 🚩 IMPORTANTE: Asegúrate de recibir 'setUser' desde el componente padre (App.jsx)
export default function Dashboard({ onVerMapa, user, setUser }) {
  const [visitados, setVisitados] = useState([]);
  const [pendientesSync, setPendientesSync] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    const llaveUser = `visitados_user_${user?.id_usuario || user?.id || 'anonimo'}`;
    const datos = JSON.parse(localStorage.getItem(llaveUser) || "[]");
    setVisitados(datos);
    
    obtenerOffline().then(datosDB => setPendientesSync(datosDB.length));
  }, [user]); 

  const clientes = useMemo(() => {
    const res = localStorage.getItem("respaldo_clientes");
    const todos = res ? JSON.parse(res) : [];
    if (!user) return todos;
    return todos.filter(c => Number(c.ruta_id) === Number(user.ruta_id));
  }, [user]);

  const total = clientes.length;
  const completados = visitados.length;
  const porcen = total > 0 ? Math.round((completados / total) * 100) : 0;

  // 🚪 FUNCIÓN CERRAR SESIÓN
  function manejarCerrarSesion() {
    if (window.confirm("¿Estás seguro que deseas salir?")) {
      localStorage.removeItem("off_user");
      localStorage.removeItem("off_pass");
      localStorage.removeItem("off_data");
      // Opcional: localStorage.removeItem("respaldo_clientes");
      setUser(null); // Esto nos regresa al Login
    }
  }

  async function actualizarRuta() {
    if (!navigator.onLine) {
      alert("Necesitas internet 🌐");
      return;
    }

    const idParaConsulta = user?.ruta_id || JSON.parse(localStorage.getItem("off_data"))?.ruta_id;

    if (!idParaConsulta) {
      alert("❌ Error: No se encontró tu ID de ruta.");
      return;
    }

    setActualizando(true);
    try {
      const nuevosDatos = await obtenerClientes(idParaConsulta); 
      if (nuevosDatos && nuevosDatos.length > 0) {
        localStorage.setItem("respaldo_clientes", JSON.stringify(nuevosDatos));
        alert(`✅ Se cargaron ${nuevosDatos.length} clientes.`);
        window.location.reload(); 
      } else {
        alert("⚠️ No hay clientes nuevos asignados.");
      }
    } catch (err) {
      alert("❌ Error de conexión con el servidor.");
    } finally {
      setActualizando(false);
    }
  }

  async function manejarSincronizacion() {
    if (pendientesSync === 0) return;
    setSincronizando(true);
    try {
      const pendientes = await obtenerOffline();
      for (let p of pendientes) { await enviarPunteo(p); }
      await limpiarOffline();
      setPendientesSync(0);
      alert("¡Sincronización Exitosa! 🚀");
    } catch (err) {
      alert("❌ Error de conexión al servidor.");
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <div style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh", paddingBottom: "100px", fontFamily: "sans-serif" }}>
      
      {/* CABECERA CON BOTÓN SALIR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#1e293b", margin: 0 }}>
          Hola, {user?.usuario || 'Chofer'} 👋
        </h1>
        <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#095feb", margin: 0 }}>
          AGUA MARIA
        </h1>
        <button onClick={manejarCerrarSesion} style={{
          background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 12px", 
          borderRadius: "12px", fontWeight: "bold", fontSize: "12px"
        }}>
          Salir 🚪
        </button>
      </div>

      {/* GRÁFICO DE PROGRESO */}
      <div style={{ background: "white", padding: "30px", borderRadius: "28px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginBottom: "20px", textAlign: "center" }}>
        <div style={{ 
          position: "relative", width: "140px", height: "140px", margin: "0 auto",
          borderRadius: "50%", background: `conic-gradient(#2563eb ${porcen * 3.6}deg, #f1f5f9 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ width: "110px", height: "110px", background: "white", borderRadius: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "30px", fontWeight: "900", color: "#1e293b" }}>{porcen}%</span>
            <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "800" }}>COMPLETADO</span>
          </div>
        </div>
      </div>

      {/* 🔄 BOTÓN ACTUALIZAR CLIENTES */}
      <button 
        onClick={actualizarRuta} 
        disabled={actualizando}
        style={{
          width: "100%", background: "white", color: "#2563eb", border: "2px solid #2563eb", 
          padding: "14px", borderRadius: "16px", fontWeight: "bold", marginBottom: "15px",
          boxShadow: "0 4px 6px rgba(37,99,235,0.1)", cursor: "pointer"
        }}
      >
        {actualizando ? "Descargando... ⏳" : "🔄 Actualizar Clientes Asignados"}
      </button>

      {/* BOTÓN SINCRONIZAR */}
      {pendientesSync > 0 && (
        <button onClick={manejarSincronizacion} disabled={sincronizando} style={{
          width: "100%", background: "#10b981", color: "white", border: "none", padding: "16px", borderRadius: "16px", 
          fontWeight: "bold", marginBottom: "20px", boxShadow: "0 4px 12px rgba(16,185,129,0.2)"
        }}>
          {sincronizando ? "Subiendo... ⏳" : `Sincronizar ${pendientesSync} datos 🚀`}
        </button>
      )}

      {/* ESTADÍSTICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <StatCard label="Mis Clientes" value={total} icon="👥" />
        <StatCard label="Pendientes" value={total - completados} icon="⏳" />
      </div>

      <button onClick={onVerMapa} style={{
        marginTop: "20px", width: "100%", background: "#1e293b", color: "white", border: "none", 
        padding: "16px", borderRadius: "16px", fontWeight: "bold"
      }}>
        Ver Mapa de Ruta 📍
      </button>

      {/* BOTÓN CERRAR SESIÓN AL FINAL */}
      <button onClick={manejarCerrarSesion} style={{
        marginTop: "40px", width: "100%", background: "transparent", color: "#94a3b8", 
        border: "none", fontSize: "13px", fontWeight: "600", textDecoration: "underline"
      }}>
        Cerrar Sesión
      </button>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "left" }}>
      <div style={{ fontSize: "18px", marginBottom: "5px" }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: "900", color: "#1e293b" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}