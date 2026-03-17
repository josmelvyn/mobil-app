import { useEffect, useState } from "react"
import { getClientes, enviarPunteo } from "../api/api"
import { guardarOffline, obtenerOffline, limpiarOffline } from "../db/indexedDB"

export default function Clientes({ user }) {
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    if (!user) return

    cargarClientes()
  }, [user])


  async function cargarClientes() {
    const data = await getClientes(user.ruta_id) // 👈 CLAVE
    setClientes(data)
    
  }
 


  // 📍 Obtener GPS
  function getUbicacion() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        reject
      )
    })
  }

  // 📏 Distancia en metros
  function distancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2) * Math.sin(Δλ/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  async function visitar(cliente) {
    try {
      const coords = await getUbicacion()

      const dist = distancia(
        coords.latitude,
        coords.longitude,
        cliente.lat,
        cliente.lon
      )

      // 📍 VALIDACIÓN GPS (30m)
      if (dist > 30) {
        alert("Estás muy lejos del cliente")
        return
      }

      const data = {
        cliente_id: cliente.id,
        lat: coords.latitude,
        lon: coords.longitude,
        comentario: ""
      }

      // 🔄 OFFLINE
      if (!navigator.onLine) {
        await guardarOffline(data)
        alert("Guardado offline")
        return
      }

      await enviarPunteo(data)
      alert("Enviado")

    } catch (err) {
      console.log(err)
    }
  }

  // 🔄 SINCRONIZAR
  async function sincronizar() {
    if (!navigator.onLine) return

    const pendientes = await obtenerOffline()

    for (let p of pendientes) {
      await enviarPunteo(p)
    }

    await limpiarOffline()
  }

  return (
    <div>
      <h2>Clientes - Ruta {user.ruta_id}</h2>
      {clientes.map(c => (
        <div key={c.id_cliente}>
          <h4>{c.cliente}</h4>
          <button onClick={() => visitar(c)}>
            Puntear
          </button>
        </div>
      ))}
    </div>
  )
  
}