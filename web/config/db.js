// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexiones en el pool
    queueLimit: 0 // Sin límite para la cola de espera de conexiones
});

// Probar la conexión (opcional, pero útil)
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL con éxito (ID de conexión: ' + connection.threadId + ')');
        connection.release(); // Liberar la conexión de vuelta al pool
    } catch (error) {
        console.error('Error al conectar con la base de datos MySQL:', error.message);
        // Si la base de datos no existe, el error podría ser ER_BAD_DB_ERROR
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`La base de datos '${process.env.DB_NAME}' no existe. Por favor, créala.`);
        }
        // Podrías querer terminar el proceso si la conexión a la BD es crítica al inicio
        // process.exit(1); 
    }
}

testDbConnection(); // Llamar a la función de prueba al iniciar

module.exports = pool; // Exportar el pool para usarlo en los controladores
