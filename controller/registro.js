// filepath: c:\proyectossss\back\controller\registro.js
// // Controlador: registro.js (cambiar esta línea)
const { pool } = require('../database'); // ¡Agrega las llaves { }!
const bcrypt = require('bcrypt'); // Asegúrate de que bcrypt esté instalado y disponible

const registrarDueño = async (datos) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
  
      // Verificar existencia del usuario
      const [existing] = await connection.query(
        'SELECT id_usuario FROM usuarios WHERE correo = ? OR usuario = ?',
        [datos.correo, datos.usuario]
      );
      
      if (existing.length > 0) {
        throw new Error('El usuario o correo ya existen');
      }
  
      // Insertar usuario
      const hashedPassword = await bcrypt.hash(datos.contrasena, 10);
      const [usuario] = await connection.query(
        `INSERT INTO usuarios 
        (correo, usuario, contrasena, id_tipo_usuario) 
        VALUES (?, ?, ?, 1)`, 
        [datos.correo, datos.usuario, hashedPassword]
      );
  
      // Verificar que el giro 1 existe
      const [giro] = await connection.query(
        'SELECT id_giro FROM giros WHERE id_giro = 1'
      );
      
      if (giro.length === 0) {
        throw new Error('El giro especificado no existe');
      }
  
      // Insertar negocio
      await connection.query(
        `INSERT INTO negocios 
        (nombre_negocio, descripcion, id_giro, id_usuario_propietario) 
        VALUES (?, ?, ?, ?)`,
        [datos.nombre_negocio, datos.descripcion || '', 1, usuario.insertId]
      );
  
      await connection.commit();
      return { 
        mensaje: 'Registro exitoso',
        exito: true,
        idUsuario: usuario.insertId      };
      
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error en transacción:', error.message);
      throw error; // Propaga el error para manejo en el router
    } finally {
      if (connection) connection.release();
    }
  };

  const iniciarSesion = async (correo, contrasena) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Verificar si el correo existe y obtener los datos del usuario junto con el negocio
        const [usuarios] = await connection.query(
            `SELECT 
                u.id_usuario, 
                u.correo, 
                u.usuario, 
                u.contrasena, 
                u.id_tipo_usuario, 
                u.fecha_registro,
                n.id_negocio
             FROM usuarios u
             LEFT JOIN negocios n ON u.id_usuario = n.id_usuario_propietario
             WHERE u.correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            throw new Error('Correo o contraseña incorrectos');
        }

        const usuario = usuarios[0];

        // Comparar la contraseña
        const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esValida) {
            throw new Error('Correo o contraseña incorrectos');
        }

        // Retornar los datos del usuario (sin la contraseña) y el id del negocio
        return {
            idUsuario: usuario.id_usuario,
            correo: usuario.correo,
            usuario: usuario.usuario,
            idTipoUsuario: usuario.id_tipo_usuario,
            fechaRegistro: usuario.fecha_registro,
            idNegocio: usuario.id_negocio // Puede ser null si no tiene negocio asociado
        };

    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

  const obtenerUsuarios = async (pagina = 1, porPagina = 10) => {
    const offset = (pagina - 1) * porPagina;
    const connection = await pool.getConnection();
    
    try {
        const [usuarios] = await connection.query(
            `SELECT 
                id_usuario, 
                correo, 
                usuario, 
                id_tipo_usuario, 
                fecha_registro 
             FROM usuarios 
             LIMIT ? OFFSET ?`,
            [porPagina, offset]
        );

        const [[total]] = await connection.query(
            'SELECT COUNT(*) AS total FROM usuarios'
        );

        return {
            datos: usuarios,
            paginacion: {
                paginaActual: pagina,
                porPagina,
                totalRegistros: total.total,
                totalPaginas: Math.ceil(total.total / porPagina)
            }
        };
        
    } catch (error) {
        throw new Error(`Error al obtener usuarios: ${error.message}`);
    } finally {
        connection.release();
    }
};


const registrarProductoConImagenes = async (idNegocio, producto, imagenes) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Verificar que el negocio existe y está activo
        const [negocios] = await connection.query(
            `SELECT id_negocio FROM negocios WHERE id_negocio = ? AND activo = 1`,
            [idNegocio]
        );

        if (negocios.length === 0) {
            throw new Error('El negocio no existe o no está activo');
        }

        // Insertar el producto
        const [resultadoProducto] = await connection.query(
            `INSERT INTO productos 
            (nombre_producto, descripcion, precio, id_negocio) 
            VALUES (?, ?, ?, ?)`,
            [producto.nombre, producto.descripcion || '', producto.precio, idNegocio]
        );

        const idProducto = resultadoProducto.insertId;

        // Insertar las imágenes asociadas al producto
        for (const imagen of imagenes) {
            await connection.query(
                `INSERT INTO imagenes_productos 
                (id_producto, imagen) 
                VALUES (?, ?)`,
                [idProducto, imagen]
            );
        }

        return {
            mensaje: 'Producto y sus imágenes registrados exitosamente',
            idProducto
        };

    } catch (error) {
        console.error('Error al registrar producto con imágenes:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

const obtenerProductosPorNegocio = async (idNegocio) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Verificar que el negocio existe y está activo
        const [negocios] = await connection.query(
            `SELECT id_negocio FROM negocios WHERE id_negocio = ? AND activo = 1`,
            [idNegocio]
        );

        if (negocios.length === 0) {
            throw new Error('El negocio no existe o no está activo');
        }

        // Obtener los productos asociados al negocio
        const [productos] = await connection.query(
            `SELECT 
                p.id_producto, 
                p.nombre_producto, 
                p.descripcion, 
                p.precio, 
                p.fecha_registro,
                i.imagen AS imagenes
             FROM productos p
             LEFT JOIN imagenes_productos i ON p.id_producto = i.id_producto
             WHERE p.id_negocio = ? AND p.activo = 1`,
            [idNegocio]
        );

        return productos;

    } catch (error) {
        console.error('Error al obtener productos:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { registrarDueño , obtenerUsuarios , iniciarSesion , registrarProductoConImagenes , obtenerProductosPorNegocio}; // Asegúrate de exportar ambas funciones