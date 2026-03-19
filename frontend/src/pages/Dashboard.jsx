import React, { useMemo, useState, useEffect } from "react";
import { obtenerOffline, limpiarOffline } from "../db/indexedDB";
import { enviarPunteo } from "../api/api";

export default function Dashboard({ onVerMapa, user }) {
  const [visitados, setVisitados] = useState([]); // 🚩 Estado para recarga dinámica
  const [pendientesSync, setPendientesSync] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  // 🔄 EFECTO: Carga datos frescos cada vez que entras al Dashboard
  useEffect(() => {
    const llaveUser = `visitados_user_${user?.id_usuario || user?.id || 'anonimo'}`;
    const datos = JSON.parse(localStorage.getItem(llaveUser) || "[]");
    setVisitados(datos);
    
    // Actualizar contador de IndexedDB
    obtenerOffline().then(datosDB => setPendientesSync(datosDB.length));
  }, [user]); 

  // 👥 CLIENTES: Filtrados por la ruta del chofer actual
  const clientes = useMemo(() => {
    const res = localStorage.getItem("respaldo_clientes");
    const todos = res ? JSON.parse(res) : [];
    if (!user) return todos;
    return todos.filter(c => Number(c.ruta_id) === Number(user.ruta_id));
  }, [user]);

  // Métricas
  const total = clientes.length;
  const completados = visitados.length;
  const porcen = total > 0 ? Math.round((completados / total) * 100) : 0;

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
      <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#1e293b", marginBottom: "20px" }}>
        Hola, {user?.usuario || 'Chofer'} 👋
      </h1>

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

      {/* BOTÓN SINCRONIZAR */}
      {pendientesSync > 0 && (
        <button onClick={manejarSincronizacion} disabled={sincronizando} style={{
          width: "100%", background: "#10b981", color: "white", border: "none", padding: "16px", borderRadius: "16px", 
          fontWeight: "bold", marginBottom: "20px", width: "100%", boxShadow: "0 4px 12px rgba(16,185,129,0.2)"
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
        padding: "16px", borderRadius: "16px", fontWeight: "bold", width: "100%"
      }}>
        Ver Mapa de Ruta 📍
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