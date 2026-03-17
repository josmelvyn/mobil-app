import { useState } from "react"
import Login from "./pages/Login"
import Clientes from "./pages/Clientes"

function App() {
  const [user, setUser] = useState(null)

  return user ? <Clientes user={user}/> : <Login setUser={setUser} />
}

export default App