import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import { getClientes, enviarPunteo } from "../api/api"
import { guardarOffline, obtenerOffline, limpiarOffline } from "../db/indexedDB"

export default function Clientes({ user }) {
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const clientesMarkersRef = useRef([])

  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState("")
  const [vistaMapa, setVistaMapa] = useState(true)
  const [miUbicacion, setMiUbicacion] = useState(null)
  const [haCentrado, setHaCentrado] = useState(false)
  const [verCompletados, setVerCompletados] = useState(false)

  // 💾 PERSISTENCIA: Cargar desde memoria del celular
  const [visitados, setVisitados] = useState(() => {
    const saved = localStorage.getItem("clientes_visitados")
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem("clientes_visitados", JSON.stringify(visitados))
  }, [visitados])

  // 🚀 INICIAR MAPA
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map("map", { zoomControl: false }).setView([19.4517, -70.6970], 14)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)
    mapRef.current = map
  }, [])

  // 📍 GPS + AUTO-CENTRADO AL ABRIR
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const coords = [lat, lon]
        setMiUbicacion(coords)

        if (mapRef.current) {
          if (!haCentrado) {
            mapRef.current.flyTo(coords, 16)
            setHaCentrado(true)
          }
          if (!userMarkerRef.current) {
            userMarkerRef.current = L.circleMarker(coords, {
              radius: 9, fillColor: "#3b82f6", color: "white", weight: 3, fillOpacity: 0.9
            }).addTo(mapRef.current).bindPopup("Estás aquí")
          } else {
            userMarkerRef.current.setLatLng(coords)
          }
        }
      },
      null, { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [haCentrado])

  // 👥 CARGAR CLIENTES
  useEffect(() => {
  async function cargarDatos() {
    if (!user) return;

    try {
      // 1. Intentar traer de la API
      const datos = await getClientes(user.ruta_id);
      
      if (datos && datos.length > 0) {
        setClientes(datos);
        // 2. Guardar una copia fresca en el celular
        localStorage.setItem("respaldo_clientes", JSON.stringify(datos));
      }
    } catch (error) {
      console.log("Offline: Cargando clientes desde memoria interna");
      
      // 3. Si falla la API (offline), cargar del localStorage
      const respaldo = localStorage.getItem("respaldo_clientes");
      if (respaldo) {
        setClientes(JSON.parse(respaldo));
      }
    }
  }

  cargarDatos();
}, [user]);

  const clientesFiltrados = clientes.filter(c => {
    const coincide = c.cliente.toLowerCase().includes(filtro.toLowerCase())
    const visitado = visitados.includes(c.id_cliente)
    return verCompletados ? (coincide && visitado) : (coincide && !visitado)
  })

  // 📍 DIBUJAR MARCADORES
 // --- Busca la parte de DIBUJAR MARCADORES y reemplázala por esta ---
useEffect(() => {
  if (!mapRef.current || !vistaMapa) return
  clientesMarkersRef.current.forEach(m => m.remove())
  
  clientesMarkersRef.current = clientesFiltrados.map(c => {
    const marker = L.marker([c.lat, c.lon]).addTo(mapRef.current)
    
    // FIX: Añadimos autoPan: false para que el mapa no salte al tocar
    marker.bindPopup(`
      <div style="width:190px; font-family:sans-serif;">
        <b style="font-size:14px; color:#1e293b;">${c.cliente}</b>
        ${!verCompletados ? `
          <textarea id="pop-note-${c.id_cliente}" 
            placeholder="Escribe un comentario..." 
            style="width:100%; margin-top:8px; border-radius:8px; border:1px solid #ddd; 
            padding:10px; font-size:16px; box-sizing:border-box; outline:none; height:60px;"></textarea>
          <button id="btn-${c.id_cliente}" 
            style="margin-top:10px; width:100%; background:#2563eb; color:white; 
            border:none; padding:12px; border-radius:10px; font-weight:bold; font-size:14px;">
            Guardar Visita 📦
          </button>` : `<p style="color:green; font-weight:bold; margin-top:10px; font-size:14px;">✅ Visita completada</p>`}
      </div>
    `, { autoPan: false }) // 👈 IMPORTANTE: Evita que el mapa se desplace solo

    if (!verCompletados) {
      marker.on("popupopen", () => {
        document.getElementById(`btn-${c.id_cliente}`).onclick = () => {
          const nota = document.getElementById(`pop-note-${c.id_cliente}`).value
          visitar(c, nota)
        }
      })
    }
    return marker
  })
}, [clientesFiltrados, vistaMapa, verCompletados])

  // 🚀 LÓGICA DE PUNTEO CON LÍMITE (50 METROS)
  async function visitar(cliente, comentario = "") {
    if (!miUbicacion) return alert("Esperando señal GPS... 📍")
    
    // 📏 CALCULAR DISTANCIA (Nativo de Leaflet)
    const distanciaMetros = L.latLng(miUbicacion).distanceTo([cliente.lat, cliente.lon])

    if (distanciaMetros > 10000) {
      alert(`⚠️ Estás muy lejos del cliente (${Math.round(distanciaMetros)} metros). Debes estar a menos de 50 metros.`)
      return
    }

    const data = { 
      cliente_id: Number(cliente.id_cliente), 
      lat: miUbicacion[0], 
      lon: miUbicacion[1], 
      comentario 
    }

    await guardarOffline(data)
    setVisitados(prev => [...prev, cliente.id_cliente])
    alert("Guardado en memoria del celular 📦")
  }

async function sincronizar() {
  const pendientes = await obtenerOffline()
  if (pendientes.length === 0) return alert("No hay datos nuevos para subir 🏁")

  // 1. Validar conexión rápida al Proxy de la empresa
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seg de espera

    // Intentamos tocar el proxy para ver si el servidor .52 responde
    const check = await fetch("/api/clientes?ruta_id=1", { 
      method: 'GET', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    if (!check.ok) throw new Error();

    // 2. Si hay conexión, procedemos con TU LÓGICA QUE YA FUNCIONA
    for (let p of pendientes) { 
      await enviarPunteo(p) 
    }

    await limpiarOffline()
    alert("¡Sincronización Exitosa! 🚀")

  } catch (err) {
    alert("❌ Error: No se puede conectar al servidor. Conéctate al Wi-Fi de la empresa para subir los datos.")
  }
}

  return (
    <div style={{ height: "100dvh", width: "100%", position: "relative", background: "#f8fafc", overflow: "hidden" }}>
      
      {/* HEADER TÁCTIL */}
      <div style={{
        position: "absolute", top: 10, left: 10, right: 10, zIndex: 1000,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        padding: "12px", borderRadius: "22px", boxShadow: "0 8px 25px rgba(0,0,0,0.12)"
      }}>
        <input type="text" placeholder="Buscar cliente..." value={filtro} onChange={(e) => setFiltro(e.target.value)} 
          style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: "16px", marginBottom: "12px", padding: "4px" }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "10px" }}>
            <button onClick={() => setVerCompletados(false)} style={{ border: "none", background: !verCompletados ? "white" : "transparent", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", color: !verCompletados ? "#2563eb" : "#64748b", boxShadow: !verCompletados ? "0 2px 5px rgba(0,0,0,0.05)" : "none" }}>Pendientes</button>
            <button onClick={() => setVerCompletados(true)} style={{ border: "none", background: verCompletados ? "white" : "transparent", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", color: verCompletados ? "#2563eb" : "#64748b", boxShadow: verCompletados ? "0 2px 5px rgba(0,0,0,0.05)" : "none" }}>Historial ({visitados.length})</button>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => { setVistaMapa(!vistaMapa); if(!vistaMapa) setTimeout(()=>mapRef.current.invalidateSize(), 200) }} style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>{vistaMapa ? "LISTA" : "MAPA"}</button>
            <button onClick={sincronizar} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>SUBIR ⬆️</button>
          </div>
        </div>
      </div>

      <div id="map" style={{ height: "100%", width: "100%", display: vistaMapa ? "block" : "none" }} />

      {!vistaMapa && (
        <div style={{ padding: "120px 15px 30px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
          {clientesFiltrados.map(c => (
            <div key={c.id_cliente} style={{ background: "white", padding: "18px", borderRadius: "22px", marginBottom: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.03)", border: verCompletados ? "1px solid #dcfce7" : "1px solid #f1f5f9" }}>
              <div style={{ fontWeight: "800", color: "#1e293b", marginBottom: "12px" }}>{c.cliente}</div>
              {!verCompletados && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input id={`list-c-${c.id_cliente}`} placeholder="Nota..." style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" }} />
                  <button onClick={() => visitar(c, document.getElementById(`list-c-${c.id_cliente}`).value)} style={{ background: "#2563eb", color: "white", border: "none", padding: "0 18px", borderRadius: "12px", fontWeight: "bold" }}>OK</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => { if(confirm("¿Restablecer ruta?")) { setVisitados([]); localStorage.removeItem("clientes_visitados"); }}} style={{ width: "100%", padding: "12px", background: "none", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "12px", marginTop: "20px", fontSize: "11px", fontWeight: "bold" }}>BORRAR HISTORIAL LOCAL 🗑️</button>
        </div>
      )}

      {/* BOTÓN FLOTANTE GPS */}
      {vistaMapa && miUbicacion && (
        <button onClick={() => mapRef.current.flyTo(miUbicacion, 17)} style={{ position: "absolute", bottom: 25, right: 20, zIndex: 1000, background: "white", border: "none", width: "54px", height: "54px", borderRadius: "27px", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</button>
      )}
    </div>
  )
}