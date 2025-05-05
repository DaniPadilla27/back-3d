const express = require('express');
const router = express.Router();
const upload = require("../Midlewares/multer.js");
const cloudinary = require('../config/cloudinaryConfig.js');
const registrocontroller = require('../controller/registro');

// Ruta corregida
router.post('/registrar' , upload.fields([{ name: "imagenes", maxCount: 10 }]), async (req, res) => {
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

        // Validación temprana
        if (!idNegocio || !producto) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren idNegocio y producto'
            });
        }

        const imagenesSubidas = [];

        if (imagenes) {
            // Convertir a array si no lo es
            const imagenesArray = Array.isArray(imagenes) ? imagenes : [imagenes];

            for (const img of imagenesArray) {
                try {
                    let resultado;

                    if (img.startsWith('http')) {
                        resultado = await cloudinary.uploader.upload(img, {
                            folder: "ProductosVentaPlayeras"
                        });
                    }
                    else if (img.startsWith('data:image')) {
                        resultado = await cloudinary.uploader.upload(img, {
                            folder: "ProductosVentaPlayeras"
                        });
                    }
                    else if (fs.existsSync(img)) {
                        resultado = await cloudinary.uploader.upload(img, {
                            folder: "ProductosVentaPlayeras"
                        });
                    }
                    else {
                        console.error("Formato de imagen no válido:", img.length > 50 ? img.substring(0, 50) + "..." : img);
                        continue;
                    }

                    imagenesSubidas.push(resultado.secure_url);
                } catch (error) {
                    console.error("Error al procesar imagen:", error.message);
                }
            }
        }

        if (imagenesSubidas.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se pudieron procesar las imágenes proporcionadas'
            });
        }

        const resultado = await registrocontroller.registrarProductoConImagenes(idNegocio, producto, imagenesSubidas);
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