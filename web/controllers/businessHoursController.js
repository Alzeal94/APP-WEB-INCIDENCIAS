// controllers/businessHoursController.js
const pool = require('../config/db');

exports.getBusinessHours = async (req, res) => {
    // req.user es añadido por el middleware verifyToken
    const userId = req.user.userId;
    console.log(`CONTROLADOR: Petición GET /api/business-hours recibida del usuario ID: ${userId}`);

    try {
        const [rows] = await pool.query(
            'SELECT apertura, cierre FROM business_hours WHERE user_id = ?',
            [userId]
        );

        if (rows.length > 0) {
            res.status(200).json(rows[0]); // Devuelve { apertura: 'HH:MM:SS', cierre: 'HH:MM:SS' }
        } else {
            // Si no hay horario configurado, puedes devolver un objeto vacío, null, o un 404
            res.status(200).json({ apertura: null, cierre: null, message: 'Horario no configurado.' });
            // Alternativamente, un 404:
            // res.status(404).json({ message: 'Horario no configurado para este usuario.' });
        }
    } catch (error) {
        console.error('Error en el controlador getBusinessHours:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el horario de negocio.' });
    }
};

exports.setBusinessHours = async (req, res) => {
    const userId = req.user.userId;
    const { apertura, cierre } = req.body; // Esperamos 'HH:MM' o 'HH:MM:SS'

    console.log(`CONTROLADOR: Petición POST /api/business-hours recibida del usuario ID: ${userId}`);
    console.log("Datos de horario recibidos:", { apertura, cierre });

    // Validación básica (puedes mejorarla con expresiones regulares para el formato TIME)
    if (apertura === undefined || cierre === undefined) { // Permitir null para borrar, pero no undefined
        return res.status(400).json({ message: 'Los campos apertura y cierre son requeridos (pueden ser null para "no definido").' });
    }
    
    // Validar formato TIME si no son null (ejemplo simple, mejora esto)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
    if ((apertura !== null && !timeRegex.test(apertura)) || (cierre !== null && !timeRegex.test(cierre))) {
        return res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM o HH:MM:SS.' });
    }


    try {
        // Usamos INSERT ... ON DUPLICATE KEY UPDATE para crear o actualizar el horario.
        // Esto requiere que user_id sea una clave UNIQUE en la tabla business_hours.
        const query = `
            INSERT INTO business_hours (user_id, apertura, cierre)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE apertura = VALUES(apertura), cierre = VALUES(cierre);
        `;
        const values = [userId, apertura, cierre];

        const [result] = await pool.query(query, values);

        if (result.affectedRows > 0) {
             // Si affectedRows es 1, se insertó. Si es 2, se actualizó (en MySQL).
            res.status(200).json({ 
                message: 'Horario de negocio guardado con éxito.',
                data: { apertura, cierre }
            });
        } else if (result.affectedRows === 0 && result.warningStatus === 0) {
            // Esto puede ocurrir si los valores enviados son idénticos a los existentes,
            // por lo que no hay un "update" real, pero se considera éxito.
            res.status(200).json({
                message: 'El horario de negocio es el mismo, no se realizaron cambios.',
                data: { apertura, cierre }
            });
        }
         else {
            console.error('Error al guardar horario: La operación en la BD no afectó filas de la forma esperada.', result);
            res.status(500).json({ message: 'Error interno del servidor al guardar el horario.' });
        }
    } catch (error) {
        console.error('Error en el controlador setBusinessHours:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el horario de negocio.' });
    }
};