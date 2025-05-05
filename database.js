const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar la conexión al iniciar
async function testConnection() {
  try {
    const connection = await pool.getConnection(); // Obtener una conexión del pool
    console.log('Conexión exitosa a la base de datos MySQL en el host:', process.env.DB_HOST);
    connection.release(); // Liberar la conexión al pool
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
  }
}

module.exports = { pool, testConnection };