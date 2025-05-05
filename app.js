const express = require('express');
const cors = require('cors');  
const morgan = require('morgan'); // Importar morgan
const app = express();
require('dotenv').config();

// Importar la conexión a la base de datos
const { testConnection } = require('./database');

// Middleware para registrar las peticiones HTTP
app.use(morgan('dev')); // Usa el formato 'dev' para mostrar las peticiones en la consola

// Middleware para parsear JSON y formularios, con límite aumentado
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors());  
// Probar la conexión a la base de datos
testConnection();

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes')
const registrar = require('./routes/registroRouter')

// Usar rutas
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/', registrar);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});