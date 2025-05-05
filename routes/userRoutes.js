// filepath: c:\proyectossss\back\routes\userRoutes.js
const express = require('express');
const router = express.Router();

// Ruta de ejemplo
router.get('/', (req, res) => {
    res.send('Rutas de usuarios funcionando');
});

module.exports = router;