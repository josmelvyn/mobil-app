const express = require("express")
const router = express.Router()
const { registrar } = require("../controllers/punteoController")

router.post("/", registrar)

module.exports = router