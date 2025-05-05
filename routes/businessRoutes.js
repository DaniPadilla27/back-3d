// filepath: c:\proyectossss\back\routes\businessRoutes.js
const express = require('express');
const router = express.Router();

// Ruta de ejemplo
router.get('/', (req, res) => {
    res.send('Rutas de negocios funcionando');
});

module.exports = router;