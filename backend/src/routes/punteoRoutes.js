const express = require("express");
const router = express.Router();
// 1. Importamos todas las funciones del controlador
const punteoController = require("../controllers/punteoController");

// 2. Ruta para el registro normal (la que ya tenías)
router.post("/", punteoController.registrar);

// 3. NUEVA RUTA para actualizar coordenadas de cliente existente
router.post("/actualizar-coords", punteoController.actualizarCoordenadas);

// 4. NUEVA RUTA para crear un cliente desde cero (La que te daba 404)
router.post("/crear-cliente", punteoController.crearClienteNuevo);

module.exports = router;