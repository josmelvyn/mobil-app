import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { obtenerEstadoRuta, obtenerListaRutas } from "../api/api";

const obtenerDiaNumero = () => {
  const diaJS = new Date().getDay();
  return diaJS === 0 ? 7 : diaJS;
};

// 🕒 Función para formatear la hora bonita
const formatearHora = (fechaISO) => {
  if (!fechaISO) return "Pendiente";
  const fecha = new Date(fechaISO);
  
  // Si la hora sigue siendo exactamente 00:00:00, es que Access no la guardó
  if (fecha.getHours() === 0 && fecha.getMinutes() === 0) {
    return "Solo Fecha: " + fecha.toLocaleDateString();
  }

  return fecha.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

export default function MonitorOficina() {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [rutas, setRutas] = useState([]);
  const [idSeleccionado, setIdSeleccionado] = useState("");
  const [datos, setDatos] = useState([]);

  // 1. Cargar lista de rutas al inicio
  useEffect(() => {
    obtenerListaRutas()
      .then(data => {
        setRutas(data);
        if (data && data.length > 0) {
          setIdSeleccionado(data[0].ruta_id); 
        }
      })
      .catch(err => console.error("Error al cargar rutas:", err));
  }, []);

  // 2. Cargar datos de la ruta seleccionada cada 30 segundos
  useEffect(() => {
    if (!idSeleccionado) return;

    const cargarMonitor = async () => {
      try {
        const res = await obtenerEstadoRuta(idSeleccionado);
        setDatos(res);
        dibujarMapa(res);
      } catch (err) { console.error("Error al cargar estado:", err); }
    };

    cargarMonitor();
    const timer = setInterval(cargarMonitor, 30000);
    return () => clearInterval(timer);
  }, [idSeleccionado]);

  const dibujarMapa = (puntos) => {
    // Inicializar mapa si no existe
    if (!mapRef.current) {
      mapRef.current = L.map("map-admin").setView([19.45, -70.69], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    }

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const diaHoy = obtenerDiaNumero().toString();
    
    // Filtrar por frecuencia del día de hoy
    const puntosHoy = puntos.filter(p => {
      const frecuencia = p.frecuencia ? p.frecuencia.toString() : "";
      return (frecuencia === "" || frecuencia.includes(diaHoy)) && p.lat_cliente;
    });

    puntosHoy.forEach(c => {
      const visitado = !!c.fecha;
      let color = "#94a3b8"; // Gris (Pendiente)
      let borde = "white";
      let alertaDistancia = "";

      if (visitado) {
        if (c.lat_punteo && c.lon_punteo) {
          const dist = L.latLng(c.lat_cliente, c.lon_cliente).distanceTo([c.lat_punteo, c.lon_punteo]);
          if (dist > 300) { // Si marcó a más de 300 metros
            color = "#facc15"; // Amarillo alerta
            borde = "#ef4444"; // Borde rojo
            alertaDistancia = `<p style="color:#ef4444; font-weight:bold; margin:5px 0;">⚠️ Marcó a ${Math.round(dist)}m de distancia</p>`;
          } else {
            color = "#10b981"; // Verde OK
          }
        } else {
          color = "#10b981"; // Verde si no hay coordenadas de punteo pero hay fecha
        }
      }

      const icon = L.divIcon({
        html: `<div style="background:${color}; width:18px; height:18px; border-radius:50%; border:2px solid ${borde}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        className: "custom-marker-admin"
      });

      const m = L.marker([c.lat_cliente, c.lon_cliente], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif; min-width:150px;">
            <b style="font-size:14px;">${c.cliente}</b>
            <hr style="margin:8px 0; border:0; border-top:1px solid #eee;">
            <p style="margin:0;"><b>Estado:</b> ${visitado ? "✅ Visitado" : "⏳ Pendiente"}</p>
            ${visitado ? `<p style="margin:5px 0;"><b>Hora:</b> ${formatearHora(c.fecha)}</p>` : ""}
            ${alertaDistancia}
            ${c.comentario ? `<p style="margin:5px 0; font-style:italic; color:#64748b;">"${c.comentario}"</p>` : ""}
          </div>
        `);
      markersRef.current.push(m);
    });

    // Ajustar cámara para ver todos los puntos
    if (puntosHoy.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  };

 return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      {/* Cabecera (la que ya tienes) */}
      <div style={{ padding: "15px", background: "#1e293b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>Monitor Oficina 👁️</h2>
        <select value={idSeleccionado} onChange={(e) => setIdSeleccionado(e.target.value)} style={{ padding: "8px", borderRadius: "10px" }}>
          {rutas.map((r, idx) => <option key={idx} value={r.ruta_id}>Ruta #{r.ruta_id}</option>)}
        </select>
      </div>

      {/* CUERPO PRINCIPAL: Mapa + Lista Lateral */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* 🗺️ MAPA (Ocupa el 70%) */}
        <div id="map-admin" style={{ flex: 3, zIndex: 1 }}></div>

        {/* 📝 LISTA LATERAL (Ocupa el 30%) */}
        <div style={{ flex: 1, background: "white", borderLeft: "1px solid #e2e8f0", overflowY: "auto", minWidth: "280px" }}>
          <div style={{ padding: "15px", borderBottom: "2px solid #f1f5f9", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
            <b style={{ fontSize: "14px", color: "#1e293b" }}>Últimas Visitas</b>
          </div>

          {/* Aquí pegamos tu código de mapeo adaptado a tus variables */}
          {datos.filter(v => v.fecha).reverse().map((v, index) => (
            <div key={index} style={{ 
              padding: "12px", 
              borderBottom: "1px solid #f1f5f9",
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div style={{ flex: 1 }}>
                <b style={{ color: "#1e293b", fontSize: "13px", display: "block" }}>{v.cliente}</b>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
                  {v.comentario || "Sin comentario"}
                </p>
              </div>
              
              <div style={{ marginLeft: "10px" }}>
                <span style={{ 
                  background: "#eff6ff", 
                  padding: "4px 8px", 
                  borderRadius: "6px", 
                  fontSize: "10px", 
                  fontWeight: "bold",
                  color: "#2563eb",
                  whiteSpace: "nowrap"
                }}>
                  {formatearHora(v.fecha)}
                </span>
              </div>
            </div>
          ))}

          {datos.filter(v => v.fecha).length === 0 && (
            <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontSize: "13px" }}>No hay visitas hoy</p>
          )}
        </div>

      </div>
    </div>
  );
}