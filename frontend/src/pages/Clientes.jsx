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

  // 🚀 INICIAR MAPA
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map("map").setView([19.4517, -70.6970], 15)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
      .addTo(map)

    mapRef.current = map
  }, [])

  // 📍 UBICACIÓN EN TIEMPO REAL (FIX REAL)
  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude

        setMiUbicacion([lat, lon])

        if (!mapRef.current) return

        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([lat, lon])
            .addTo(mapRef.current)
            .bindPopup("Estás aquí 📍")
        } else {
          userMarkerRef.current.setLatLng([lat, lon])
        }

        mapRef.current.setView([lat, lon])
      },
      (err) => {
        console.log("Error ubicación:", err)
      },
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // 👥 CARGAR CLIENTES
  useEffect(() => {
    if (!user) return

    getClientes(user.ruta_id).then((data) => {
      setClientes(data)
    })
  }, [user])

  // 🎯 FILTRO
  const clientesFiltrados = clientes.filter(c =>
    c.cliente.toLowerCase().includes(filtro.toLowerCase())
  )

  // 📍 DIBUJAR CLIENTES EN MAPA
  useEffect(() => {
    if (!mapRef.current) return

    // limpiar marcadores anteriores
    clientesMarkersRef.current.forEach(m => m.remove())
    clientesMarkersRef.current = []

    clientesFiltrados.forEach((c) => {
      const marker = L.marker([c.lat, c.lon]).addTo(mapRef.current)

      marker.bindPopup(`
        <b>${c.cliente}</b><br/>
        <button id="btn-${c.id_cliente}">
          Puntear
        </button>
      `)

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-${c.id_cliente}`)
        if (btn) {
          btn.onclick = () => visitar(c)
        }
      })

      clientesMarkersRef.current.push(marker)
    })
  }, [clientesFiltrados])

  // 📏 DISTANCIA
  function distancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // 🚀 PUNTEAR (FIX REAL)
  async function visitar(cliente) {
    if (!miUbicacion) {
      alert("Esperando ubicación 📍")
      return
    }

    const dist = distancia(
      miUbicacion[0],
      miUbicacion[1],
      cliente.lat,
      cliente.lon
    )

    if (dist > 50) {
      alert("Muy lejos del cliente ❌")
      return
    }

    const data = {
      cliente_id: cliente.id_cliente,
      lat: miUbicacion[0],
      lon: miUbicacion[1]
    }

    try {
      if (!navigator.onLine) {
        await guardarOffline(data)
        alert("Guardado offline 📦")
        return
      }

      await enviarPunteo(data)
      alert("Punteo OK ✅")
    } catch {
      await guardarOffline(data)
      alert("Error → offline ⚠️")
    }
  }

  // 🔄 SINCRONIZAR
  async function sincronizar() {
    const pendientes = await obtenerOffline()

    for (let p of pendientes) {
      await enviarPunteo(p)
    }

    await limpiarOffline()
    alert("Sincronizado 🚀")
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>

      {/* HEADER */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        zIndex: 1000,
        background: "white",
        padding: 10,
        borderRadius: 10
      }}>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <button onClick={() => setVistaMapa(!vistaMapa)}>
          {vistaMapa ? "Lista" : "Mapa"}
        </button>

        <button onClick={sincronizar}>
          Sync
        </button>
      </div>

      {/* MAPA */}
      {vistaMapa && (
        <div id="map" style={{ height: "100%", width: "100%" }} />
      )}

      {/* LISTA */}
      {!vistaMapa && (
        <div style={{ paddingTop: 80 }}>
          {clientesFiltrados.map(c => (
            <div key={c.id_cliente}>
              {c.cliente}
              <button onClick={() => visitar(c)}>Puntear</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}