// controllers/incidentController.js
const pool = require('../config/db');

exports.createIncident = async (req, res) => {
    // req.user es añadido por el middleware verifyToken y contiene { userId, email }
    const userId = req.user.userId; 
    const incidentDataFromFrontend = req.body;

    console.log(`CONTROLADOR: Petición a POST /api/incidents recibida del usuario ID: ${userId}`);
    console.log("Datos de la incidencia recibidos:", incidentDataFromFrontend);

    // Validación básica de datos (puedes expandirla mucho más)
    if (!incidentDataFromFrontend || Object.keys(incidentDataFromFrontend).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para la incidencia.' });
    }
    if (!incidentDataFromFrontend.tipoDeIncidenciaSeleccionada) {
        return res.status(400).json({ message: 'El tipo de incidencia es obligatorio.' });
    }

    try {
        // Mapear los datos del frontend a las columnas de la base de datos
        // Asegúrate de que los nombres de las propiedades en incidentDataFromFrontend
        // coincidan con lo que esperas y cómo los vas a insertar.
        const {
            horarioVerificado, // Este podría ser un objeto { apertura, cierre }
            stepSeleccionaMaquina,
            tipoDeIncidenciaSeleccionada,
            stepPantallaSuperiorInferior,
            stepSaleMensaje,
            stepApagarEncender,
            stepAceptaBilletes,
            stepQuitarConLlave,
            cantidad_faltante, // El frontend lo envía como cantidad_faltante
            stepComprobarFunciona,
            sin_llave
            // Añade cualquier otro campo que venga del frontend y quieras guardar
        } = incidentDataFromFrontend;

        // Adaptar los nombres si es necesario para las columnas de la BD:
        const apertura = horarioVerificado?.apertura || null;
        const cierre = horarioVerificado?.cierre || null;

        const query = `
            INSERT INTO incidents (
                user_id, 
                horario_verificado_apertura, horario_verificado_cierre,
                step_selecciona_maquina, tipo_de_incidencia_seleccionada,
                step_pantalla_superior_inferior, step_sale_mensaje,
                step_apagar_encender, step_acepta_billetes,
                step_quitar_con_llave, cantidad_faltante,
                step_comprobar_funciona, sin_llave,
                status 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            userId,
            apertura, cierre,
            stepSeleccionaMaquina || null, tipoDeIncidenciaSeleccionada || null,
            stepPantallaSuperiorInferior || null, stepSaleMensaje || null,
            stepApagarEncender || null, stepAceptaBilletes || null,
            stepQuitarConLlave || null, cantidad_faltante || null,
            stepComprobarFunciona || null, sin_llave || false,
            'abierta' // Estado inicial
        ];

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 1 && result.insertId) {
            res.status(201).json({
                message: 'Incidencia reportada con éxito.',
                incidentId: result.insertId
            });
        } else {
            console.error('Error al crear incidencia: La inserción en la BD falló.');
            res.status(500).json({ message: 'Error interno del servidor al guardar la incidencia.' });
        }

    } catch (error) {
        console.error('Error en el controlador createIncident:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la incidencia.' });
    }
};

// Aquí podrías añadir más funciones, como getIncidents, getIncidentById, updateIncidentStatus, etc.