// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

console.log("authRoutes.js: Configurando ruta POST para /register");
router.post('/register', authController.register);

console.log("authRoutes.js: Configurando ruta POST para /login");
router.post('/login', authController.login);

console.log("authRoutes.js: Configurando ruta GET para /me (protegida)");
router.get('/me', verifyToken, authController.getMe);

console.log("authRoutes.js: Configurando ruta POST para /qr-login");
router.post('/qr-login', authController.qrLogin);

// --- NUEVA RUTA: Logout (protegida) ---
console.log("authRoutes.js: Configurando ruta POST para /logout (protegida)");
router.post('/logout', verifyToken, authController.logout);
// --- FIN NUEVA RUTA ---

module.exports = router;