import React, { useMemo, useState, useEffect } from "react";
import { obtenerOffline, limpiarOffline } from "../db/indexedDB";
import { enviarPunteo, obtenerClientes } from "../api/api";

// 📅 Función para obtener el número de día (Lunes=1 ... Domingo=7)
const obtenerDiaNumero = () => {
  const diaJS = new Date().getDay();
  return diaJS === 0 ? 7 : diaJS;
};

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

  // 📊 CÁLCULOS DE CLIENTES
  const { totalGeneral, hoyTotal, hoyPendientes, porcenHoy } = useMemo(() => {
    const res = localStorage.getItem("respaldo_clientes");
    const todos = res ? JSON.parse(res) : [];
    
    // 1. Clientes totales de la ruta del chofer
    const misClientes = todos.filter(c => Number(c.ruta_id) === Number(user?.ruta_id));
    
    // 2. Clientes que tocan HOY
    const diaHoy = obtenerDiaNumero().toString();
    const clientesDeHoy = misClientes.filter(c => {
        const frecuencia = c.frecuencia ? c.frecuencia.toString() : "";
        return frecuencia === "" || frecuencia.includes(diaHoy);
    });

    // 3. Pendientes de hoy (los de hoy que NO están en la lista de visitados)
    const pendientesDeHoy = clientesDeHoy.filter(c => !visitados.includes(c.id_cliente));

    const totalHoy = clientesDeHoy.length;
    const completadosHoy = totalHoy - pendientesDeHoy.length;

    return {
      totalGeneral: misClientes.length,
      hoyTotal: totalHoy,
      hoyPendientes: pendientesDeHoy.length,
      porcenHoy: totalHoy > 0 ? Math.round((completadosHoy / totalHoy) * 100) : 0
    };
  }, [user, visitados]);

  // ... (Funciones manejarCerrarSesion, actualizarRuta y manejarSincronizacion se mantienen igual)
  function manejarCerrarSesion() {
    if (window.confirm("¿Estás seguro que deseas salir?")) {
      localStorage.removeItem("off_user");
      localStorage.removeItem("off_pass");
      localStorage.removeItem("off_data");
      setUser(null);
    }
  }

  async function actualizarRuta() {
    if (!navigator.onLine) return alert("Necesitas internet 🌐");
    const idParaConsulta = user?.ruta_id;
    if (!idParaConsulta) return alert("❌ Error: No se encontró tu ID de ruta.");
    setActualizando(true);
    try {
      const nuevosDatos = await obtenerClientes(idParaConsulta); 
      if (nuevosDatos && nuevosDatos.length > 0) {
        localStorage.setItem("respaldo_clientes", JSON.stringify(nuevosDatos));
        alert(`✅ Se cargaron ${nuevosDatos.length} clientes.`);
        window.location.reload(); 
      }
    } catch (err) { alert("❌ Error de conexión"); } finally { setActualizando(false); }
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
    } catch (err) { alert("❌ Error"); } finally { setSincronizando(false); }
  }

  return (
    <div style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh", paddingBottom: "100px", fontFamily: "sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#1e293b", margin: 0 }}>Hola, {user?.usuario || 'Chofer'} 👋</h1>
          <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "bold" }}>AGUA MARIA</span>
        </div>
        <button onClick={manejarCerrarSesion} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 12px", borderRadius: "12px", fontWeight: "bold", fontSize: "11px" }}>Salir 🚪</button>
      </div>

      {/* PROGRESO DE HOY */}
      <div style={{ background: "white", padding: "25px", borderRadius: "28px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginBottom: "20px", textAlign: "center" }}>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", display: "block", marginBottom: "15px" }}>AVANCE DE LA RUTA (HOY)</span>
        <div style={{ 
          position: "relative", width: "120px", height: "120px", margin: "0 auto",
          borderRadius: "50%", background: `conic-gradient(#2563eb ${porcenHoy * 3.6}deg, #f1f5f9 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ width: "95px", height: "95px", background: "white", borderRadius: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: "900", color: "#1e293b" }}>{porcenHoy}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Ruta de Hoy" value={hoyTotal} icon="📅" color="#2563eb" />
        <StatCard label="Faltan Hoy" value={hoyPendientes} icon="🚩" color="#f59e0b" />
        <StatCard label="Total Clientes" value={totalGeneral} icon="👥" color="#64748b" />
        <StatCard label="Sinc. Pendiente" value={pendientesSync} icon="📦" color="#10b981" />
      </div>

      <button onClick={onVerMapa} style={{ width: "100%", background: "#1e293b", color: "white", border: "none", padding: "18px", borderRadius: "20px", fontWeight: "bold", fontSize: "16px", boxShadow: "0 10px 20px rgba(30,41,59,0.2)" }}>
        Ver Mapa de Ruta 📍
      </button>

      <button onClick={actualizarRuta} disabled={actualizando} style={{ marginTop: "15px", width: "100%", background: "none", color: "#2563eb", border: "2px solid #2563eb", padding: "12px", borderRadius: "16px", fontWeight: "bold", fontSize: "13px" }}>
        {actualizando ? "Actualizando..." : "🔄 Actualizar Lista"}
      </button>

      {pendientesSync > 0 && (
        <button onClick={manejarSincronizacion} disabled={sincronizando} style={{ marginTop: "15px", width: "100%", background: "#10b981", color: "white", border: "none", padding: "16px", borderRadius: "16px", fontWeight: "bold" }}>
          {sincronizando ? "Subiendo..." : `Sincronizar Datos 🚀`}
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
      <div style={{ fontSize: "20px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "24px", fontWeight: "900", color: color }}>{value}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", marginTop: "2px" }}>{label}</div>
    </div>
  );
}