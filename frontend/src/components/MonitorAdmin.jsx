import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { obtenerEstadoRuta } from "../api/api"; // Debes crear esta función en tu api.js

export default function MonitorAdmin({ rutaId }) {
  const mapRef = useRef(null);
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    // Inicializar mapa centrado en la ciudad
    if (!mapRef.current) {
      mapRef.current = L.map("map-admin").setView([19.4517, -70.6970], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    }

    const cargarMonitoreo = async () => {
      try {
        const res = await obtenerEstadoRuta(rutaId);
        setDatos(res);
        dibujarMarcadores(res);
      } catch (err) { console.error("Error cargando monitor", err); }
    };

    cargarMonitoreo();
    const interval = setInterval(cargarMonitoreo, 30000); // Recarga cada 30 segundos
    return () => clearInterval(interval);
  }, [rutaId]);

  const dibujarMarcadores = (clientes) => {
    // Limpiar marcadores anteriores si existen
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) mapRef.current.removeLayer(layer);
    });

    clientes.forEach(c => {
      const visitado = !!c.fecha; // Si tiene fecha, es que hay un punteo hoy
      const color = visitado ? "#10b981" : "#94a3b8"; // Verde o Gris
      
      const icon = L.divIcon({
        className: "admin-marker",
        html: `<div style="background:${color}; width:15px; height:15px; border-radius:50%; border:2px solid white;"></div>`
      });

      L.marker([c.lat_cliente, c.lon_cliente], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <b>${c.cliente}</b><br/>
          Estado: ${visitado ? "✅ Visitado" : "⏳ Pendiente"}<br/>
          ${visitado ? `Hora: ${new Date(c.fecha).toLocaleTimeString()}<br/>Comentario: ${c.comentarios}` : ""}
        `);
    });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "15px", background: "#1e293b", color: "white" }}>
        <h2 style={{ margin: 0 }}>Monitor de Ruta: {rutaId}</h2>
        <small>Puntos verdes: Visitados | Puntos grises: Pendientes</small>
      </div>
      <div id="map-admin" style={{ flex: 1 }}></div>
    </div>
  );
}