// routes/businessHoursRoutes.js
const express = require('express');
const router = express.Router();
const businessHoursController = require('../controllers/businessHoursController');
const { verifyToken } = require('../middleware/authMiddleware'); // Middleware de autenticación

console.log("businessHoursRoutes.js: Configurando rutas para / (GET y POST - protegidas)");

// Ambas rutas requieren que el usuario esté autenticado
router.get('/', verifyToken, businessHoursController.getBusinessHours);
router.post('/', verifyToken, businessHoursController.setBusinessHours);

module.exports = router;