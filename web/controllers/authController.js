// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

const JWT_SECRET = process.env.JWT_SECRET; 
console.log("Valor de JWT_SECRET al cargar authController.js:", JWT_SECRET);

// ... (las funciones register, login, y getMe no necesitan cambios)
exports.register = async (req, res) => {
    console.log("CONTROLADOR: Petición a /api/register recibida.");
    console.log("Cuerpo de la petición (req.body):", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'El email y la contraseña son obligatorios.' });
    }
    if (password.length < 6) { 
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    try {
        const [existingUsers] = await pool.query('SELECT id FROM usuario WHERE correo = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'El email ya está registrado.' }); 
        }
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await pool.query('INSERT INTO usuario (correo, contraseña) VALUES (?, ?)', [email, hashedPassword]);
        if (result.affectedRows === 1 && result.insertId) {
            res.status(201).json({ message: 'Usuario registrado con éxito.', userId: result.insertId });
        } else {
            console.error('Error en registro: La inserción en la BD no afectó filas o no devolvió insertId.');
            res.status(500).json({ message: 'Error interno del servidor al guardar el usuario.' });
        }
    } catch (error) {
        console.error('Error en el controlador de registro:', error);
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ message: 'El email ya está registrado (error de duplicado).' });
        }
        res.status(500).json({ message: 'Error interno del servidor al intentar registrar.' });
    }
};

exports.login = async (req, res) => {
    console.log("CONTROLADOR: Petición a /api/login recibida.");
    console.log("Cuerpo de la petición (req.body):", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'El email y la contraseña son obligatorios.' });
    }
    try {
        const [users] = await pool.query('SELECT id, correo, contraseña, tipo_usuario FROM usuario WHERE correo = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.contraseña); 
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const payload = { userId: user.id, email: user.correo };
        if (!JWT_SECRET) {
            console.error("LOGIN CTRL: JWT_SECRET no está definido. Revisa tus variables de entorno.");
            return res.status(500).json({ message: 'Error de configuración del servidor (JWT).' });
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: { id: user.id, email: user.correo, tipo_usuario: user.tipo_usuario }
        });
    } catch (error) {
        console.error('Error en el controlador de login:', error);
        res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' });
    }
};

exports.getMe = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'No se pudo identificar al usuario desde el token.' });
    }
    console.log("CONTROLADOR: Petición a /api/me recibida. Usuario desde token:", req.user);
    try {
        const [users] = await pool.query('SELECT id, correo, tipo_usuario FROM usuario WHERE id = ?', [req.user.userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado en la base de datos.' });
        }
        const userFromDb = users[0];
        res.status(200).json({
            message: "Datos del usuario obtenidos con éxito.",
            user: { id: userFromDb.id, email: userFromDb.correo, tipo_usuario: userFromDb.tipo_usuario }
        });
    } catch (error) {
        console.error('Error en el controlador getMe:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener datos del usuario.' });
    }
};


// --- FUNCIÓN MODIFICADA PARA MANEJAR DIRECTAMENTE PARÁMETROS GET ---
exports.qrLogin = async (req, res) => {
    console.log("CONTROLADOR: Petición GET a /api/qr-login recibida.");

    // CAMBIO: Leemos 'user' y 'password' directamente de los parámetros de la URL
    // Ejemplo de URL esperada: /api/qr-login?user=prueba@gmail.com&password=123456
    const { user, password } = req.query;
    const email = user; // Renombramos 'user' a 'email' para consistencia interna

    if (!email || !password) {
        return res.status(400).json({ message: 'Los parámetros "user" y "password" son obligatorios en la URL.' });
    }

    console.log(`QR Login (GET): Email recibido='${email}'`);
    // ¡ADVERTENCIA! Nunca se debe registrar la contraseña en un log en producción.

    try {
        // --- Lógica de autenticación, idéntica a la función de login normal ---
        const [users] = await pool.query('SELECT id, correo, contraseña, tipo_usuario FROM usuario WHERE correo = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales del QR inválidas (usuario no encontrado).' });
        }

        const userFromDb = users[0];
        // IMPORTANTE: Aquí se compara la contraseña en texto plano de la URL con la hasheada de la BD
        const isMatch = await bcrypt.compare(password, userFromDb.contraseña);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales del QR inválidas (contraseña incorrecta).' });
        }
        
        // Si las credenciales son correctas, generar y enviar el token
        const payload = {
            userId: userFromDb.id,
            email: userFromDb.correo
        };

        if (!JWT_SECRET) {
            console.error("QR LOGIN CTRL: JWT_SECRET no está definido.");
            return res.status(500).json({ message: 'Error de configuración del servidor (JWT).' });
        }
        const sessionToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Enviar respuesta JSON. El frontend que escanea debe procesar esto.
        res.status(200).json({
            message: 'Inicio de sesión con QR exitoso.',
            token: sessionToken,
            user: {
                id: userFromDb.id,
                email: userFromDb.correo,
                tipo_usuario: userFromDb.tipo_usuario 
            }
        });

    } catch (error) {
        console.error('Error en el controlador de qrLogin:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el login con QR.' });
    }
};

// ... (la función logout no necesita cambios)
exports.logout = async (req, res) => {
    if (!req.user || !req.user.userId) { 
        console.log("CONTROLADOR LOGOUT: No hay req.user o req.user.userId. Token podría ser inválido o no presente.");
        return res.status(401).json({ message: 'No autenticado o token inválido.' });
    }
    const userId = req.user.userId;
    console.log(`CONTROLADOR: Petición POST /api/logout recibida del usuario ID: ${userId}`);
    res.status(200).json({ message: 'Logout exitoso. Por favor, elimina el token del lado del cliente.' });
};
