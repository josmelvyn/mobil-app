const express = require("express")
const router = express.Router()
const { listar } = require("../controllers/clientesController")

router.get("/", listar)

module.exports = router
