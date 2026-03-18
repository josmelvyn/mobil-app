import { useState } from "react"
import Login from "./pages/Login"
import Clientes from "./pages/Clientes"
import "leaflet/dist/leaflet.css"

import MapaTest from "./pages/MapaTest"

// function App() {
//   return <MapaTest />
// }

// export default App


function App() {
  const [user, setUser] = useState(null)

  return user ? <Clientes user={user}/> : <Login setUser={setUser} />
 }

export default App