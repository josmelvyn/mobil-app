import { MapContainer, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export default function MapaTest() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[19.4517, -70.6970]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  )
}