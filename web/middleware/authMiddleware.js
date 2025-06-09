// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
    // Obtener el token de la cabecera Authorization
    // Usualmente viene en el formato "Bearer TOKEN_AQUI"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token o el formato es incorrecto.' });
    }

    const token = authHeader.split(' ')[1]; // Extraemos el token

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        // Verificar el token
        const decodedPayload = jwt.verify(token, JWT_SECRET);

        // Si el token es válido, el payload decodificado se añade al objeto de la petición (req)
        // para que las siguientes funciones (controladores) puedan acceder a él.
        req.user = decodedPayload; // Contendrá { userId: ..., email: ... } que pusimos al firmar
        console.log("MIDDLEWARE: Token verificado correctamente. Usuario:", req.user);
        next(); // Pasa el control a la siguiente función en la cadena (el controlador)
    } catch (error) {
        console.error('Error de autenticación de token:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión de nuevo.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        // Otro tipo de error
        return res.status(401).json({ message: 'Autenticación fallida.' });
    }
};