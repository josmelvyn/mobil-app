import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import { obtenerClientes as getClientes, enviarPunteo } from "../api/api";
import { guardarOffline, obtenerOffline, limpiarOffline } from "../db/indexedDB"

const crearIcono = (color) => L.divIcon({
  className: "custom-marker",
  html: `<div style="
    background-color: ${color};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 5px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const iconoAzul = crearIcono("#2563eb");
const iconoVerde = crearIcono("#10b981");
const obtenerDiaNumero = () => {
  const fecha = new Date();
  const diaJS = fecha.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  // Ajuste para que Lunes sea 1 y Domingo sea 7:
  return diaJS === 0 ? 7 : diaJS;
};
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
  const idPopupAbiertoRef = useRef(null); // Para saber qué cliente estamos viendo

  const [visitados, setVisitados] = useState(() => {
    const llaveUsuario = `visitados_user_${user?.id || 'anonimo'}`;
    const saved = localStorage.getItem(llaveUsuario);
    return saved ? JSON.parse(saved) : [];
  });

 useEffect(() => {
    if (!user) return;
    
    const hoy = new Date().toDateString(); // Ejemplo: "Fri Mar 20 2026"
    const llaveFecha = `ultima_fecha_user_${user.id}`;
    const ultimaFecha = localStorage.getItem(llaveFecha);

    // Si la fecha guardada es distinta a la de hoy, limpiamos
    if (ultimaFecha !== hoy) {
      const llaveUsuario = `visitados_user_${user.id}`;
      setVisitados([]); // Vacía la lista en pantalla
      localStorage.removeItem(llaveUsuario); // Borra del celular
      localStorage.setItem(llaveFecha, hoy); // Guarda la nueva fecha de hoy
      console.log("🌞 Día nuevo detectado: Lista de visitas reiniciada");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const hoy = new Date().toDateString(); // Ejemplo: "Fri Mar 20 2026"
    const llaveFecha = `ultima_fecha_user_${user.id}`;
    const ultimaFecha = localStorage.getItem(llaveFecha);

    // Si la fecha guardada es distinta a la de hoy, limpiamos
    if (ultimaFecha !== hoy) {
      const llaveUsuario = `visitados_user_${user.id}`;
      setVisitados([]); // Vacía la lista en pantalla
      localStorage.removeItem(llaveUsuario); // Borra del celular
      localStorage.setItem(llaveFecha, hoy); // Guarda la nueva fecha de hoy
      console.log("🌞 Día nuevo detectado: Lista de visitas reiniciada");
    }
  }, [user]);

  // 🚀 FUNCIÓN GPS CORREGIDA
const abrirNavegacion = (lat, lon) => {
  
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
  window.open(url, '_blank');
};

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map("map", { zoomControl: false }).setView([19.4517, -70.6970], 14)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)
    mapRef.current = map
  }, [])

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
  }).addTo(mapRef.current).bindPopup("Estás aquí");
} else {
  // Solo actualiza la posición, no recrees el marcador
  userMarkerRef.current.setLatLng(coords);
}
        }
      },
      null, { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [haCentrado])

  useEffect(() => {
    async function cargarDatos() {
      if (!user) return;
      try {
        const datos = await getClientes(user.ruta_id);
        if (datos && datos.length > 0) {
          setClientes(datos);
          localStorage.setItem("respaldo_clientes", JSON.stringify(datos));
        }
      } catch (error) {
        const respaldo = localStorage.getItem("respaldo_clientes");
        if (respaldo) setClientes(JSON.parse(respaldo));
      }
    }
    cargarDatos();
  }, [user]);

 

const diaHoy = obtenerDiaNumero().toString(); // El número de hoy en texto (ej: "4")

const clientesFiltrados = clientes.filter(c => {
  const coincideNombre = c.cliente.toLowerCase().includes(filtro.toLowerCase());
  const visitado = visitados.includes(c.id_cliente);
  
  // 🔍 Lógica de frecuencia:
  // Si el campo está vacío, lo muestra siempre. 
  // Si tiene números (ej: "1,4"), verifica si el de hoy está ahí.
  const frecuenciaTexto = c.frecuencia ? c.frecuencia.toString() : "";
  const esDeHoy = frecuenciaTexto === "" || frecuenciaTexto.includes(diaHoy);

  if (verCompletados) {
    return coincideNombre && visitado && esDeHoy;
  } else {
    return coincideNombre && !visitado && esDeHoy;
  }
});

  useEffect(() => {
  if (!mapRef.current || !vistaMapa) return;

  // 1. En lugar de borrar todo, solo borramos lo que NO está abierto
  clientesMarkersRef.current.forEach(m => {
    // Si el marcador NO es el que tiene el popup abierto, lo quitamos
    if (m.options.id_cliente !== idPopupAbiertoRef.current) {
      m.remove();
    }
  });

  // Filtramos los que realmente hay que dibujar (los que no están ya en el mapa)
  const nuevosMarcadores = clientesFiltrados.map(c => {
    // Si ya está abierto, no lo vuelvas a crear
    if (c.id_cliente === idPopupAbiertoRef.current) return null;

    const marker = L.marker([c.lat, c.lon], { 
      icon: verCompletados ? iconoVerde : iconoAzul,
      id_cliente: c.id_cliente // Guardamos el ID en el marcador
    }).addTo(mapRef.current);
    
    marker.bindPopup(`
      <div style="width:190px; font-family:sans-serif;">
        <b style="font-size:14px; color:#1e293b;">${c.cliente}</b>
        <button id="nav-${c.id_cliente}" style="margin-top:10px; width:100%; background:#1e293b; color:white; border:none; padding:10px; border-radius:10px; font-weight:bold; cursor:pointer;">🚗 Cómo llegar</button>
        <hr style="margin:12px 0; border:0; border-top:1px solid #eee;">
        ${!verCompletados ? `
          <textarea id="pop-note-${c.id_cliente}" placeholder="Escribe un comentario..." style="width:100%; border-radius:8px; border:1px solid #ddd; padding:10px; font-size:16px; box-sizing:border-box; height:60px;"></textarea>
          <button id="btn-${c.id_cliente}" style="margin-top:10px; width:100%; background:#2563eb; color:white; border:none; padding:12px; border-radius:10px; font-weight:bold;">Guardar Visita 📦</button>
        ` : `<p style="color:green; font-weight:bold; margin-top:10px;">✅ Visita completada</p>`}
      </div>
    `, { autoClose: false, closeOnClick: false }); // 🚩 IMPORTANTE

    marker.on("popupopen", () => {
      idPopupAbiertoRef.current = c.id_cliente; // Guardamos quién se abrió
      
      const btnNav = document.getElementById(`nav-${c.id_cliente}`);
      if (btnNav) btnNav.onclick = () => abrirNavegacion(c.lat, c.lon);

      if (!verCompletados) {
        const btnSave = document.getElementById(`btn-${c.id_cliente}`);
        if (btnSave) {
          btnSave.onclick = () => {
            const nota = document.getElementById(`pop-note-${c.id_cliente}`).value;
            visitar(c, nota);
          };
        }
      }
    });

    marker.on("popupclose", () => {
      idPopupAbiertoRef.current = null; // Limpiamos al cerrar
    });

    return marker;
  }).filter(m => m !== null);

  // Actualizamos la lista de referencias
  clientesMarkersRef.current = [...clientesMarkersRef.current.filter(m => m._map), ...nuevosMarcadores];

}, [clientesFiltrados, vistaMapa, verCompletados]);

  async function visitar(cliente, comentario = "") {
  if (!miUbicacion) return alert("Esperando señal GPS... 📍")
  
  const llaveUser = `visitados_user_${user?.id_usuario || user?.id || 'anonimo'}`;
  const nuevosVisitados = [...visitados, cliente.id_cliente];
  
  setVisitados(nuevosVisitados);
  localStorage.setItem(llaveUser, JSON.stringify(nuevosVisitados));

  if(mapRef.current){
    mapRef.current.closePopup();
  }
  
  const distanciaMetros = L.latLng(miUbicacion).distanceTo([cliente.lat, cliente.lon])
  
  // ⚠️ Nota: He mantenido tu validación de distancia, 
  // pero recuerda que 10,000,000,000 metros es casi la distancia a otro planeta.
  if (distanciaMetros > 10000000000) {
    alert(`⚠️ Estás muy lejos del cliente (${Math.round(distanciaMetros)} metros).`)
    return
  }

  const data = { 
    cliente_id: Number(cliente.id_cliente), 
    lat: miUbicacion[0], 
    lon: miUbicacion[1], 
    comentario,
    // 📅 AGREGAMOS LA FECHA AQUÍ:
    fecha: new Date().toISOString() 
  }
  alert("fecha a guardar:"+ data.fecha);

  await guardarOffline(data)
  alert("Guardado en memoria del celular 📦")
}

  async function sincronizar() {
    const pendientes = await obtenerOffline()
    if (pendientes.length === 0) return alert("No hay datos nuevos para subir 🏁")
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const check = await fetch("https://miyoko-unreleased-overfavorably.ngrok-free.dev", { 
        method: 'GET', 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      if (!check.ok) throw new Error();
      for (let p of pendientes) { await enviarPunteo(p) }
      await limpiarOffline()
      alert("¡Sincronización Exitosa! 🚀")
    } catch (err) {
      alert("❌ Error: No se puede conectar al servidor.")
    }
  }
// 🗑️ FUNCIÓN PARA BORRAR TODO DE RAÍZ
const borrarHistorialCompleto = async () => {
  const confirmar = window.confirm("¿Estás seguro de borrar todos los datos locales?");
  if (!confirmar) return;

  try {
    // 1. Borra la lista de visitados del usuario actual
    const llaveUsuario = `visitados_user_${user?.id || 'anonimo'}`;
    localStorage.removeItem(llaveUsuario);
    
    // 2. Borra el respaldo de la lista de clientes
    localStorage.removeItem("respaldo_clientes");

    // 3. Borra lo que está pendiente de sincronizar (IndexedDB)
    await limpiarOffline();

    // 4. Limpia la pantalla de tu App al instante
    setVisitados([]);
    setClientes([]);

    alert("¡Datos borrados con éxito! 🧹");
    
    // 5. Opcional: Recarga la página para asegurar que todo esté limpio
    window.location.reload();
  } catch (error) {
    alert("Error al borrar: " + error.message);
  }
};

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
          <button 
  onClick={() => { 
    if(confirm("¿Restablecer ruta?")) { 
      // 1. Identificamos la llave exacta que usa tu app
      const llaveUsuario = `visitados_user_${user?.id || 'anonimo'}`;
      
      // 2. Borramos esa llave específica y el respaldo de clientes
      localStorage.removeItem(llaveUsuario);
      localStorage.removeItem("respaldo_clientes"); // Importante borrar este también
      
      // 3. Limpiamos el estado visual
      setVisitados([]); 
      
      alert("Ruta restablecida correctamente 🧹");
    } 
  }} 
  style={{ 
    width: "100%", 
    padding: "12px", 
    background: "none", 
    color: "#ef4444", 
    border: "1px solid #ef4444", 
    borderRadius: "12px", 
    marginTop: "20px", 
    fontSize: "11px", 
    fontWeight: "bold" 
  }}
>
  BORRAR HISTORIAL LOCAL 🗑️
</button>
        </div>
      )}

      {/* BOTÓN FLOTANTE GPS */}
      {vistaMapa && miUbicacion && (
        <button onClick={() => mapRef.current.flyTo(miUbicacion, 17)} style={{ position: "absolute", bottom: 25, right: 20, zIndex: 1000, background: "white", border: "none", width: "54px", height: "54px", borderRadius: "27px", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</button>
      )}
    </div>
  )
}