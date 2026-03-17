import { openDB } from "idb"

export const dbPromise = openDB("punteo-db", 1, {
  upgrade(db) {
    db.createObjectStore("punteos", { keyPath: "id", autoIncrement: true })
  }
})

export async function guardarOffline(data) {
  const db = await dbPromise
  await db.add("punteos", data)
}

export async function obtenerOffline() {
  const db = await dbPromise
  return await db.getAll("punteos")
}

export async function limpiarOffline() {
  const db = await dbPromise
  await db.clear("punteos")
}