import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { obtenerEstadoRuta, obtenerListaRutas } from "../api/api";

// 📅 Función para obtener el número de día (Lunes=1 ... Domingo=7)
const obtenerDiaNumero = () => {
  const diaJS = new Date().getDay();
  return diaJS === 0 ? 7 : diaJS;
};

export default function MonitorOficina() {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [rutas, setRutas] = useState([]);
  const [idSeleccionado, setIdSeleccionado] = useState("");
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    obtenerListaRutas()
      .then(data => {
        setRutas(data);
        if (data && data.length > 0) {
          setIdSeleccionado(data[0].ruta_id); 
        }
      })
      .catch(err => console.error("Error:", err));
  }, []);

  useEffect(() => {
    if (!idSeleccionado) return;
    const cargarMonitor = async () => {
      try {
        const res = await obtenerEstadoRuta(idSeleccionado);
        setDatos(res);
        actualizarMapa(res);
      } catch (err) { console.error("Error en puntos:", err); }
    };
    cargarMonitor();
    const timer = setInterval(cargarMonitor, 30000);
    return () => clearInterval(timer);
  }, [idSeleccionado]);

  const actualizarMapa = (puntos) => {
    if (!mapRef.current) {
      mapRef.current = L.map("map-admin").setView([19.45, -70.69], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 🔍 FILTRO DE FRECUENCIA (Día actual)
    const diaHoy = obtenerDiaNumero().toString();
    
    const puntosFiltrados = puntos.filter(p => {
      // Solo incluimos si tiene coordenadas válidas
      const tieneCoordenadas = p.lat_cliente && p.lon_cliente;
      
      // Verificamos frecuencia (ej: "1,4")
      const frecuencia = p.frecuencia ? p.frecuencia.toString() : "";
      const tocaHoy = frecuencia === "" || frecuencia.includes(diaHoy);
      
      return tieneCoordenadas && tocaHoy;
    });

    if (puntosFiltrados.length > 0) {
      const coords = puntosFiltrados.map(p => [p.lat_cliente, p.lon_cliente]);
      mapRef.current.fitBounds(coords, { padding: [40, 40] });
    }

    puntosFiltrados.forEach(c => {
      const visitado = !!c.fecha;
      let color = "#94a3b8"; // Gris (Pendiente)
      let borde = "white";
      let infoExtra = "";

      if (visitado && c.lat_punteo && c.lon_punteo) {
        const dist = L.latLng(c.lat_cliente, c.lon_cliente).distanceTo([c.lat_punteo, c.lon_punteo]);
        if (dist > 200) {
          color = "#facc15"; // Amarillo (Lejos)
          borde = "#ef4444"; // Borde Rojo
          infoExtra = `<br/><b style="color:red;">⚠️ Marcó a ${Math.round(dist)}m</b>`;
        } else {
          color = "#10b981"; // Verde (OK)
        }
      }

      const icon = L.divIcon({
        html: `<div style="background:${color}; width:16px; height:16px; border-radius:50%; border:2px solid ${borde}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: ""
      });

      const m = L.marker([c.lat_cliente, c.lon_cliente], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif;">
            <b>${c.cliente}</b><br/>
            ${visitado ? `✅ Visitado: ${new Date(c.fecha).toLocaleTimeString()}` : "⏳ Pendiente"}
            ${infoExtra}
            ${c.comentario ? `<br/><i>"${c.comentario}"</i>` : ""}
          </div>
        `);
      markersRef.current.push(m);
    });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px", background: "#1e293b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "16px" }}>Monitor Oficina</h2>
          <small style={{ color: "#94a3b8" }}>Hoy: {new Date().toLocaleDateString()}</small>
        </div>
        
        <select 
          value={idSeleccionado} 
          onChange={(e) => setIdSeleccionado(e.target.value)}
          style={{ padding: "8px", borderRadius: "8px", fontWeight: "bold", border: "none" }}
        >
          {rutas.map((r, index) => (
            <option key={index} value={r.ruta_id}>Ruta #{r.ruta_id}</option>
          ))}
        </select>
      </div>
      <div id="map-admin" style={{ flex: 1, zIndex: 1 }}></div>
    </div>
  );
}