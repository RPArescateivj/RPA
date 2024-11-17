const express = require('express'); 
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

// Crear la carpeta 'uploads' si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configuración de la conexión a la base de datos
const db =  mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bd'
});

// Conexión a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Configuración de middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views/css')));
app.use(express.static(uploadsDir)); // Servir archivos de 'uploads'

app.use(session({
    secret: 'secreto',
    resave: false,
    saveUninitialized: true
}));

// Configuración del transportador de nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'danaet612@gmail.com', // Cambia esto por tu correo de Gmail
        pass: 'evdq xwlq ooyn yzlv' // Cambia esto por tu contraseña de aplicación
    }
});

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Función para verificar sesión
const verificarSesion = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// Función para verificar si es administrador
const verificarAdmin = (req, res, next) => {
    if (!req.session.isAdmin) return res.redirect('/index');
    next();
};

// Rutas
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
    const mensaje = req.session.mensaje || null;
    req.session.mensaje = null;
    res.render('login', { mensaje });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Consultar la base de datos para verificar el correo
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);

        // Si no se encuentra el usuario
        if (results.length === 0) {
            req.session.mensaje = '¡Por favor regístrate :)';
            return res.redirect('/login');
        }

        const user = results[0];

        // Verificar si el usuario está bloqueado
        if (user.bloqueado) {
            req.session.mensaje = 'Tu cuenta ha sido bloqueada';
            return res.redirect('/login');
        }

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // Iniciar sesión guardando el ID del usuario en la sesión
            req.session.userId = user.id;

            // Redirigir dependiendo del rol del usuario
            if (user.rol === 'usuario') {
                return res.redirect('/index');
            } else if (user.rol === 'admin') {
                return res.redirect('/admin');
            } else {
                req.session.mensaje = 'Rol no válido, contacte al administrador.';
                return res.redirect('/login');
            }
        } else {
            req.session.mensaje = 'Correo o contraseña incorrectos.';
            return res.redirect('/login');
        }
    } catch (err) {
        console.error('Error en el inicio de sesión:', err.message);
        req.session.mensaje = 'Error en el servidor. Inténtalo más tarde.';
        return res.redirect('/login');
    }
});

// Ruta GET para renderizar la vista de login con mensajes
app.get('/login', (req, res) => {
    const mensaje = req.session.mensaje || null;  // Obtener el mensaje de la sesión, si existe
    req.session.mensaje = null;  // Borrar el mensaje después de mostrarlo
    res.render('login', { mensaje });  // Pasar el mensaje a la vista login.ejs
});

// Ruta para la vista del administrador
app.get('/admin', async (req, res) => {
    // Verificar si el usuario es administrador
    if (!req.session.isAdmin) {
        return res.status(403).send('Acceso denegado'); // Denegar acceso si no es admin
    }

    try {
        // Obtener los reportes de la base de datos
        const [reportes] = await db.promise().query('SELECT * FROM reportes'); // Ajusta la consulta según tu esquema
        
        // Renderizar la vista del administrador y pasar los reportes
        return res.render('admin', { reportes, error: null });

    } catch (err) {
        console.error('Error al obtener reportes:', err);
        // Renderizar la vista del admin con un mensaje de error
        return res.render('admin', { reportes: [], error: 'Error al cargar los reportes' });
    }
});


app.get('/register', (req, res) => {
    const mensaje = req.session.mensaje || null;
    req.session.mensaje = null;
    res.render('register', { mensaje });
});

// Ruta de registro
app.post('/register', async (req, res) => {
    const { nombre, apellido, email, password } = req.body;

    // Verificar que todos los campos estén completos
    if (!nombre || !apellido || !email || !password) {
        req.session.mensaje = 'Todos los campos son obligatorios';
        return res.redirect('/register');
    }

    try {
        // Consultar la base de datos para verificar si el correo ya está registrado
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);

        // Si el correo ya está registrado
        if (results.length > 0) {
            req.session.mensaje = 'Este correo ya está registrado';
            return res.redirect('/register');
        }

        // Hashear la contraseña antes de almacenar
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        await db.promise().query('INSERT INTO usuarios (nombre, apellido, email, password) VALUES (?, ?, ?, ?)', 
            [nombre, apellido, email, hashedPassword]);

        req.session.mensaje = 'Registro exitoso, por favor inicia sesión';
        return res.redirect('/login'); // Redirigir a la página de inicio de sesión

    } catch (err) {
        console.error('Error al registrar el usuario:', err.message);
        req.session.mensaje = 'Error al registrar el usuario';
        return res.redirect('/register'); // Redirigir con un mensaje de error
    }
});

// Rutas para sesiones de usuario y administración
app.get('/index', verificarSesion, (req, res) => {
    const mensaje = req.session.mensaje || null;
    req.session.mensaje = null;
    res.render('index', { mensaje });
});

app.get('/admin', verificarSesion, verificarAdmin, async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM usuarios');
        res.render('admin', { usuarios: results });
    } catch (err) {
        console.error('Error al obtener usuarios:', err.message);
        return res.status(500).send('Error al obtener usuarios');
    }
});
// Ruta para mostrar la cuenta
app.get('/cuenta', verificarSesion, async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE id = ?', [req.session.userId]);
        res.render('cuenta', { usuario: results[0] });
    } catch (err) {
        console.error('Error al obtener los datos del usuario:', err.message);
        return res.status(500).send('Error al obtener los datos del usuario');
    }
});

// Ruta para modificar los datos del usuario
app.post('/cuenta/modificar', verificarSesion, async (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    const userId = req.session.userId;

    try {
        let hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const [result] = await db.promise().query('SELECT password FROM usuarios WHERE id = ?', [userId]);
        const userPassword = hashedPassword || result[0].password;

        await db.promise().query('UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, password = ? WHERE id = ?', 
        [nombre, apellido, email, userPassword, userId]);

        req.session.mensaje = 'Datos modificados correctamente';
        res.redirect('/cuenta');
    } catch (err) {
        console.error('Error al modificar los datos:', err.message);
        return res.status(500).send('Error al modificar los datos');
    }
});

// Ruta para eliminar la cuenta
app.post('/cuenta/eliminar', verificarSesion, async (req, res) => {
    const userId = req.session.userId;

    try {
        await db.promise().query('DELETE FROM usuarios WHERE id = ?', [userId]);
        req.session.destroy(err => {
            if (err) {
                console.error('Error al destruir la sesión:', err.message);
                return res.redirect('/index');
            }
            res.redirect('/login?mensaje=' + encodeURIComponent('Cuenta eliminada exitosamente'));
        });
    } catch (err) {
        console.error('Error al eliminar la cuenta:', err.message);
        return res.status(500).send('Error al eliminar la cuenta');
    }
});

// Ruta para mostrar el formulario
app.get('/formulario', verificarSesion, (req, res) => {
    const mensaje = req.session.mensaje || null;
    req.session.mensaje = null;
    res.render('formulario', { mensaje });
});

// Ruta para el envío del formulario de reportes
app.post('/reportar', verificarSesion, upload.array('evidencias', 5), async (req, res) => {
    const { nombre, apellido, telefono, correo, sexo, edad, tipo_animal, posible_responsable, descripcion, fecha, numero_exterior, colonia, municipio, estado, codigo_postal } = req.body;
    const usuario_id = req.session.userId;  // Asegúrate de usar el ID del usuario en la sesión

    // Validar si se han subido evidencias
    if (req.files.length === 0) {
        req.session.mensaje = 'Por favor, sube al menos una evidencia';
        return res.redirect('/formulario');
    }

    try {
        // Insertar reporte en la base de datos
        await db.promise().query(
            `INSERT INTO reportes (
                nombre, apellido, telefono, correo, sexo, edad, tipo_animal, posible_responsable, descripcion, 
                fecha, numero_exterior, colonia, municipio, estado, codigo_postal, usuario_id, evidencias
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre, apellido, telefono, correo, sexo, edad, tipo_animal, posible_responsable, descripcion, 
                fecha, numero_exterior, colonia, municipio, estado, codigo_postal, 
                usuario_id,  // Añadir el ID del usuario
                JSON.stringify(req.files.map(file => file.filename))  // Convertir los nombres de los archivos a JSON
            ]
        );

        req.session.mensaje = 'Reporte enviado exitosamente';
        res.redirect('/formulario');
    } catch (err) {
        console.error('Error al enviar el reporte:', err.message);
        req.session.mensaje = 'Error al enviar el reporte';
        res.redirect('/formulario');
    }
});

app.get('/contactos', (req, res) => {
    const mensaje = req.session.mensaje || null; 
    const error = req.session.error || null; 
    req.session.mensaje = null;
    req.session.error = null;
    res.render('contactos', { mensaje, error });
});

// Ruta para el formulario de contacto
app.post('/contacto', (req, res) => {
    const userId = req.session.userId; // Obtener el ID del usuario de la sesión
    const { nombre, email, mensaje } = req.body;

    // Guardar en la base de datos, incluyendo el usuario_id
    const query = 'INSERT INTO comentarios (usuario_id, nombre, email, mensaje) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, nombre, email, mensaje], (error, results) => {
        if (error) {
            console.error('Error al guardar comentario:', error.message);
            req.session.error = 'Error al enviar el mensaje'; // Guardar el error en la sesión
            return res.redirect('/contactos');
        }

        // Enviar correo
        const mailOptions = {
            from: 'danaet612@gmail.com',
            to: 'danaet612@gmail.com',
            subject: 'Nuevo mensaje de contacto',
            text: `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`
        };
        
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar correo:', error.message);
                req.session.error = 'Error al enviar el correo'; // Guardar el error en la sesión
                return res.redirect('/contactos');
            }

            req.session.mensaje = 'Mensaje enviado exitosamente';
            res.redirect('/contactos');
        });
    });
});


// Ruta para ver los reportes de un usuario
app.get('/mis-reportes', verificarSesion, async (req, res) => {
    try {
        const [reportes] = await db.promise().query('SELECT * FROM reportes WHERE usuario_id = ?', [req.session.userId]);
        res.render('reportes', { reportes });
    } catch (err) {
        console.error('Error al obtener reportes:', err.message);
        return res.status(500).send('Error al obtener reportes');
    }
});

app.post('/reportes/:id/modificar', async (req, res) => {
    const reporteId = req.params.id;
    const { nombre, apellido, telefono, correo, sexo, edad, tipo_animal, posible_responsable, descripcion, fecha, numero_exterior, colonia, municipio, estado, codigo_postal } = req.body;
    
    try {
        // Asegúrate de que la consulta SQL esté bien definida
        await db.promise().query('UPDATE reportes SET nombre = ?, apellido = ?, telefono = ?, correo = ?, sexo = ?, edad = ?, tipo_animal = ?, posible_responsable = ?, descripcion = ?, fecha = ?, numero_exterior = ?, colonia = ?, municipio = ?, estado = ?, codigo_postal = ? WHERE id = ?', [nombre, apellido, telefono, correo, sexo, edad, tipo_animal, posible_responsable, descripcion, fecha, numero_exterior, colonia, municipio, estado, codigo_postal, reporteId]);
        
        // Redirigir o renderizar la página con un mensaje de éxito
        const mensaje = 'Cambios guardados con éxito';
        res.render('modificarReporte', { mensaje, reporte: req.body }); // Asegúrate de pasar los nuevos datos del reporte
    } catch (err) {
        console.error('Error al modificar reporte:', err.message);
        return res.status(500).send('Error del servidor');
    }
});


app.get('/modificarReporte/:id', async (req, res) => {
    const reporteId = req.params.id;
    try {
        const [reporte] = await db.promise().query('SELECT * FROM reportes WHERE id = ?', [reporteId]);

        if (reporte.length === 0) {
            return res.status(404).send('Reporte no encontrado');
        }

        // Renderiza la vista con el reporte y un mensaje por defecto (null)
        res.render('modificarReporte', { reporte: reporte[0], mensaje: null });
    } catch (err) {
        console.error('Error al obtener reporte:', err.message);
        return res.status(500).send('Error del servidor');
    }
});

app.post('/modificarReporte/:id', async (req, res) => {
    const reporteId = req.params.id;
    const { campo1, campo2 } = req.body; // Actualiza estos nombres según los campos de tu formulario
    try {
        await db.promise().query('UPDATE reportes SET campo1 = ?, campo2 = ? WHERE id = ?', [campo1, campo2, reporteId]);

        // Después de actualizar, enviar un mensaje de éxito
        res.render('modificarReporte', { mensaje: 'Cambios guardados con éxito', reporte: { campo1, campo2 } });
    } catch (err) {
        console.error('Error al modificar reporte:', err.message);
        return res.status(500).send('Error del servidor');
    }
});

app.get('/informacion', (req, res) => {
    res.render('informacion'); // Asegúrate de que el archivo 'informacion.ejs' existe en la carpeta 'views'
});


// Ruta para actualizar un reporte
app.post('/reportes/:id/actualizar', verificarSesion, async (req, res) => {
    const reporteId = req.params.id;
    const { descripcion, fecha, tipo_animal, responsable } = req.body;

    try {
        await db.promise().query('UPDATE reportes SET descripcion = ?, fecha = ?, tipo_animal = ?, responsable = ? WHERE id = ?', 
            [descripcion, fecha, tipo_animal, responsable, reporteId]);
        req.session.mensaje = 'Reporte actualizado correctamente';
        res.redirect('/mis-reportes'); // Redirige a la lista de reportes del usuario
    } catch (err) {
        console.error('Error al actualizar el reporte:', err.message);
        return res.status(500).send('Error al actualizar el reporte');
    }
});

// Ruta para mostrar el formulario de modificación de un reporte
app.get('/modificarReporte/:id', verificarSesion, async (req, res) => {
    const reporteId = req.params.id;
    try {
        const [reportes] = await db.promise().query('SELECT * FROM reportes WHERE id = ?', [reporteId]);
        if (reportes.length === 0) {
            return res.status(404).send('Reporte no encontrado');
        }
        res.render('modificarReporte', { reporte: reportes[0] }); // Asegúrate de que 'modificarReporte' es el nombre de tu vista
    } catch (err) {
        console.error('Error al obtener el reporte para modificar:', err.message);
        return res.status(500).send('Error al obtener el reporte');
    }
});

// Ruta para actualizar un reporte después de la modificación
app.post('/modificarReporte/:id', verificarSesion, async (req, res) => {
    const reporteId = req.params.id;
    const { descripcion, fecha, tipo_animal, responsable } = req.body;

    try {
        await db.promise().query('UPDATE reportes SET descripcion = ?, fecha = ?, tipo_animal = ?, responsable = ? WHERE id = ?', 
            [descripcion, fecha, tipo_animal, responsable, reporteId]);
        req.session.mensaje = 'Reporte actualizado correctamente';
        res.redirect('/mis-reportes'); // Redirige a la lista de reportes del usuario
    } catch (err) {
        console.error('Error al actualizar el reporte:', err.message);
        return res.status(500).send('Error al actualizar el reporte');
    }
});
///////////////////////////////////////////////////////////////////////7

app.get('/comentarios', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/login');
    }

    const queryUsuario = 'SELECT nombre, email FROM usuarios WHERE id = ?';
    db.query(queryUsuario, [userId], (errorUsuario, resultadosUsuario) => {
        if (errorUsuario || resultadosUsuario.length === 0) {
            console.error('Error al obtener el usuario:', errorUsuario);
            return res.status(500).send('Error al obtener el usuario');
        }

       
        const queryComentarios = 'SELECT * FROM comentarios WHERE usuario_id = ?'; 
        db.query(queryComentarios, [userId], (errorComentarios, resultadosComentarios) => {
            if (errorComentarios) {
                console.error('Error al obtener los comentarios:', errorComentarios);
                return res.status(500).send('Error al obtener los comentarios');
            }

            res.render('comentarios', { comentarios: resultadosComentarios, nombre: resultadosUsuario[0].nombre });
        });
    });
});

app.get('/comentarios/editar/:id', (req, res) => {
    const comentarioId = req.params.id;
    const userId = req.session.userId;

    const queryComentario = 'SELECT * FROM comentarios WHERE id = ? AND usuario_id = ?';
    db.query(queryComentario, [comentarioId, userId], (errorComentario, resultadosComentario) => {
        if (errorComentario || resultadosComentario.length === 0) {
            console.error('Error al obtener el comentario:', errorComentario);
            return res.status(500).send('Error al obtener el comentario');
        }

        res.render('editar_comentario', { comentario: resultadosComentario[0] });
    });
});

app.post('/comentarios/editar/:id', (req, res) => {
    const comentarioId = req.params.id;
    const { mensaje } = req.body;
    const userId = req.session.userId;

    const queryUpdate = 'UPDATE comentarios SET mensaje = ? WHERE id = ? AND usuario_id = ?';
    db.query(queryUpdate, [mensaje, comentarioId, userId], (error) => {
        if (error) {
            console.error('Error al actualizar el comentario:', error);
            return res.status(500).send('Error al actualizar el comentario');
        }

        res.redirect('/comentarios');
    });
});

app.get('/comentarios/eliminar/:id', (req, res) => {
    const comentarioId = req.params.id;
    const userId = req.session.userId;

    const queryDelete = 'DELETE FROM comentarios WHERE id = ? AND usuario_id = ?'; 
    db.query(queryDelete, [comentarioId, userId], (error) => {
        if (error) {
            console.error('Error al eliminar el comentario:', error);
            return res.status(500).send('Error al eliminar el comentario');
        }

        res.redirect('/comentarios');
    });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Salir de la sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login');
    });
});

// Iniciar el servidor
app.listen(3001, () => {
    console.log('Servidor corriendo en: http://localhost:3001');
});

