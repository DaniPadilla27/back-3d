const express = require('express');
const router = express.Router();
const upload = require("../Midlewares/multer.js");

const registrocontroller = require('../controller/registro.js');

// Ruta corregida
router.post('/registrar', async (req, res) => {
    try {
      const resultado = await registrocontroller.registrarDueño(req.body);
      res.status(201).json({ // 201 Created para registros exitosos
        success: true,
        data: resultado
      });
    } catch (error) {
      const statusCode = error.message.includes('ya existen') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  });


  // filepath: c:\proyectossss\back\routes\registroRouter.js
router.post('/iniciar-sesion', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const resultado = await registrocontroller.iniciarSesion(correo, contrasena);
        res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        res.status(401).json({ // 401 Unauthorized para credenciales inválidas
            success: false,
            error: error.message
        });
    }
});

  router.get('/obtener', async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = parseInt(req.query.porPagina) || 10;
        
        const resultado = await registrocontroller.obtenerUsuarios(pagina, porPagina);
        
        res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/productos-alta', async (req, res) => {
    try {
        const { idNegocio, producto, imagenes } = req.body;

        if (!idNegocio || !producto || !imagenes || !Array.isArray(imagenes)) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren idNegocio, producto e imágenes (en un arreglo)'
            });
        }

        const resultado = await registrocontroller.registrarProductoConImagenes(idNegocio, producto, imagenes);
        res.status(201).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/productos', async (req, res) => {
    try {
        const { idNegocio } = req.query; // El cliente debe enviar el idNegocio como parámetro de consulta

        if (!idNegocio) {
            return res.status(400).json({
                success: false,
                error: 'El idNegocio es obligatorio para obtener los productos'
            });
        }

        const productos = await registrocontroller.obtenerProductosPorNegocio(idNegocio);
        res.status(200).json({
            success: true,
            data: productos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;