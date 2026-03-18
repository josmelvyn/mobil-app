import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import "leaflet/dist/leaflet.css"

// 🚀 IMPORTANTE: Registro del Service Worker para Modo Offline
import { registerSW } from 'virtual:pwa-register'

// Esto le dice al navegador que guarde los archivos en el celular
registerSW({ 
  immediate: true,
  onRegistered(r) {
    console.log('App lista para trabajar Offline 📦');
  },
  onRegisterError(error) {
    console.log('Error al registrar modo offline:', error);
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
