// routes/incidentRoutes.js
const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { verifyToken } = require('../middleware/authMiddleware'); // Importamos el middleware de autenticación

console.log("incidentRoutes.js: Configurando ruta POST para / (crear incidencia - protegida)");
// Esta ruta estará protegida, solo usuarios autenticados pueden crear incidencias.
router.post('/', verifyToken, incidentController.createIncident);

// Aquí podrías añadir más rutas, como:
// router.get('/', verifyToken, incidentController.getIncidents); // Para obtener todas las incidencias del usuario
// router.get('/:id', verifyToken, incidentController.getIncidentById); // Para obtener una incidencia específica

module.exports = router;