const express = require('express');
const connection = require('./db_connection');
const path = require('path');
const app = express();
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Configuración de correo
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Host de Gmail
    port: 587, // Puerto para conexiones TLS
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
        user: 'sistemaunidadterritorial@gmail.com',
        pass: 'fgvz kzrj kdap wylt',
    },
});
// Función para formatear la fecha para los correos
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Detectar si `dateString` contiene la hora
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    let hour = 0, minute = 0;

    // Si `timePart` está definido, desglosamos la hora y el minuto
    if (timePart) {
        [hour, minute] = timePart.split('-').map(Number);
    }
    
    // Crear la fecha directamente sin ajuste de zona horaria
    const date = new Date(year, month - 1, day, hour, minute);
    
    return date.toLocaleDateString('es-ES', options);
}



const corsOptions = {
    credentials: true, // Permite el intercambio de cookies y credenciales
    optionsSuccessStatus: 200 // Soluciona problemas con navegadores antiguos que devuelven 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
const port = 3000;
const PDFDocument = require('pdfkit');

app.use(express.static(path.join(__dirname, 'app')));
app.use(express.json());

// Función para obtener la fecha y hora en Chile
const getChileDateTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
};
// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// Endpoint para obtener los horarios según el día de la semana y el id_recurso
app.get('/api/horarios/:idRecurso/:diaSemana', (req, res) => {
    const diaSemana = req.params.diaSemana.toLowerCase();
    const idRecurso = req.params.idRecurso;

    const query = `
        SELECT * FROM horario_recurso 
        WHERE dia_semana = ? 
          AND id_recurso = ?
    `;

    connection.query(query, [diaSemana, idRecurso], (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        res.json(results);
    });
});

// Endpoint para actualizar la disponibilidad
app.post('/api/actualizar-disponibilidad', (req, res) => {
    const { dia_semana, hora_inicio, hora_fin, id_disponibilidad } = req.body;

    const query = `
        UPDATE horario_recurso 
        SET id_disponibilidad = ? 
        WHERE dia_semana = ? AND hora_inicio = ? AND hora_fin = ?
    `;

    connection.query(query, [id_disponibilidad, dia_semana, hora_inicio, hora_fin], (error, results) => {
        if (error) {
            console.error('Error al actualizar la disponibilidad:', error);
            return res.status(500).json({ error: 'Error al actualizar la disponibilidad' });
        }

        res.json({ message: 'Disponibilidad actualizada correctamente', results });
    });
});


// Endpoint para realizar una reserva 
app.post('/api/reservar', (req, res) => {
    const { fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo, id_estado_reserva } = req.body;
    const fecha_creacion = getChileDateTime(); 
    console.log('Datos recibidos para la reserva:', req.body);

    const query = `
        INSERT INTO reserva (fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo, fecha_creacion, id_estado_reserva) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo, fecha_creacion, id_estado_reserva], (error, results) => {
        if (error) {
            console.error('Error al realizar la reserva:', error);
            return res.status(500).json({ error: 'Error al realizar la reserva: ' + error.message });
        }
        

        // Obtener el correo del usuario y la descripción del recurso
        const sqlGetUserAndResource = `
            SELECT usuario.correo, recurso.descripcion_recurso 
            FROM usuario 
            JOIN recurso ON recurso.id_recurso = ? 
            WHERE usuario.id_usuario = ?;
        `;

        connection.query(sqlGetUserAndResource, [id_recurso, id_usuario], (err, userResult) => {
            if (err || userResult.length === 0) {
                console.error('Error al obtener los detalles del usuario o recurso:', err);
                return res.status(500).json({ message: 'Reserva realizada, pero hubo un problema enviando el correo de confirmación.' });
            }

            const usuarioCorreo = userResult[0].correo;
            const descripcionRecurso = userResult[0].descripcion_recurso;

            // Obtener la descripción del motivo
            const sqlGetMotivo = `SELECT desc_motivo FROM motivo WHERE id_motivo = ?`;
            connection.query(sqlGetMotivo, [id_motivo], (err, motivoResult) => {
                if (err || motivoResult.length === 0) {
                    console.error('Error al obtener la descripción del motivo:', err);
                    return res.status(500).json({ message: 'Reserva realizada, pero hubo un problema enviando el correo de confirmación.' });
                }

                const descripcion_motivo = motivoResult[0].desc_motivo;
                // Formatear la fecha para el correo
                const fechaFormateada = formatDate(fecha_reserva);
                // Configuración del contenido del correo
                const mailOptions = {
                    from: 'sistemaunidadterritorial@gmail.com',
                    to: usuarioCorreo,
                    subject: 'Registro de reserva con éxito',
                    html: `
                        <h1>Registro de reserva con éxito</h1>
                        <p>Estimado usuario,</p>
                        <p>Su reserva ha sido registrada con éxito. A continuación, los detalles:</p>
                        <ul>
                            <li><strong>Recurso reservado:</strong> ${descripcionRecurso}</li>
                            <li><strong>Fecha de la reserva:</strong> ${fechaFormateada}</li>
                            <li><strong>Motivo:</strong> ${descripcion_motivo}</li>
                            <li><strong>Hora de inicio:</strong> ${hora_inicio}</li>
                            <li><strong>Hora de fin:</strong> ${hora_fin}</li>
                            <li><strong>Fecha de creación:</strong> ${fecha_creacion.toLocaleString('es-ES')}</li>
                        </ul>
                        <p>Gracias por utilizar nuestro sistema.</p>
                    `,
                };

                // Enviar el correo
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error('Error al enviar correo:', err);
                        return res.status(500).json({ message: 'Reserva realizada, pero hubo un problema enviando el correo de confirmación.' });
                    } else {
                        console.log('Correo enviado: ' + info.response);
                        res.json({ message: 'Reserva realizada correctamente y correo enviado.', id_reserva: results.insertId });
                    }
                });
            });
        });
    });
});



// Endpoint para obtener horarios reservados
app.get('/api/horariosReservados/:idRecurso/:fecha', (req, res) => {
    const { idRecurso, fecha } = req.params;

    const query = `
        SELECT hora_inicio, hora_fin, id_estado_reserva FROM reserva
        WHERE id_recurso = ? AND fecha_reserva = ?
    `;

    connection.query(query, [idRecurso, fecha], (error, results) => {
        if (error) {
            console.error('Error al obtener horarios reservados:', error);
            return res.status(500).json({ error: 'Error al obtener horarios reservados' });
        }
        res.json(results);
    });
});



app.get('/api/obtenerReservas/:idRecurso', (req, res) => {
    const idRecurso = req.params.idRecurso;
    
    // Consulta a la base de datos para obtener las reservas filtradas por id_recurso
    const query = 'SELECT * FROM reserva WHERE id_recurso = ?';
    
    connection.query(query, [idRecurso], (err, results) => {
        if (err) {
            console.error('Error al obtener las reservas:', err);
            return res.status(500).json({ error: 'Error al obtener las reservas' });
        }
        res.json(results);
    });
});
app.get('/api/obtenerReservasUsuario/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;
    
    // Consulta a la base de datos para obtener las reservas filtradas por id_usuario
    const query = `
        SELECT r.id_reserva, 
               r.fecha_reserva, 
               rc.descripcion_recurso,
               rc.id_recurso, 
               r.id_usuario, 
               r.hora_inicio, 
               r.hora_fin, 
               m.desc_motivo, 
               r.fecha_creacion, 
               r.id_estado_reserva,
               er.desc_estado_reserva
        FROM reserva r
        JOIN motivo m ON r.id_motivo = m.id_motivo
        JOIN recurso rc ON r.id_recurso = rc.id_recurso
        JOIN estado_reserva er ON r.id_estado_reserva = er.id_estado_reserva
        WHERE r.id_usuario = ?;
    `;
    
    connection.query(query, [idUsuario], (err, results) => {
        if (err) {
            console.error('Error al obtener las reservas:', err);
            return res.status(500).json({ error: 'Error al obtener las reservas' });
        }
        res.json(results);
    });
});

app.put('/api/cancelarReserva/:idReserva', (req, res) => {
    const { idReserva } = req.params;
    const { motivoCancelacion } = req.body;
    const fecha_cancelacion = getChileDateTime(); 
    // Actualizar la reserva y registrar la fecha de cancelación
    const queryCancel = `
        UPDATE reserva
        SET id_estado_reserva = 2, fecha_cancelacion = ?
        WHERE id_reserva = ? AND id_estado_reserva = 1
    `;
    const params = [fecha_cancelacion, idReserva];
    // Consultar la información de la reserva, el recurso y el motivo antes de la cancelación
    const queryInfo = `
        SELECT r.fecha_reserva, r.hora_inicio, r.hora_fin, recurso.descripcion_recurso, usuario.correo, r.id_motivo 
        FROM reserva r
        JOIN recurso ON r.id_recurso = recurso.id_recurso
        JOIN usuario ON r.id_usuario = usuario.id_usuario
        WHERE r.id_reserva = ?
    `;

    connection.query(queryInfo, [idReserva], (error, results) => {
        if (error || results.length === 0) {
            console.error('Error al obtener información de la reserva:', error);
            return res.status(500).json({ error: 'Error al obtener información de la reserva' });
        }

        const { fecha_reserva, hora_inicio, hora_fin, descripcion_recurso, correo, id_motivo } = results[0];

        // Obtener la descripción del motivo
        const sqlGetMotivo = `SELECT desc_motivo FROM motivo WHERE id_motivo = ?`;
        connection.query(sqlGetMotivo, [id_motivo], (err, motivoResult) => {
            if (err || motivoResult.length === 0) {
                console.error('Error al obtener la descripción del motivo:', err);
                return res.status(500).json({ message: 'Reserva cancelada, pero hubo un problema enviando el correo de confirmación.' });
            }

            const descripcion_motivo = motivoResult[0].desc_motivo;
            const formattedFechaReserva = new Date(fecha_reserva).toISOString().split('T')[0];
            const fechaFormateada = formatDate(formattedFechaReserva);

            connection.query(queryCancel, params, (error, results) => {
                if (error) {
                    console.error('Error al cancelar la reserva:', error);
                    return res.status(500).json({ error: 'Error al cancelar la reserva' });
                }

                if (results.affectedRows === 0) {
                    return res.status(404).json({ message: 'Reserva no encontrada o ya cancelada' });
                }

                // Configurar y enviar el correo de confirmación de cancelación
                const mailOptions = {
                    from: 'sistemaunidadterritorial@gmail.com',
                    to: correo,
                    subject: 'Reserva cancelada',
                    html: `
                        <h1>Reserva cancelada</h1>
                        <p>Su reserva ha sido cancelada. Aquí están los detalles:</p>
                        <ul>
                            <li><strong>Recurso:</strong> ${descripcion_recurso}</li>
                            <li><strong>Fecha de la reserva:</strong> ${fechaFormateada}</li>
                            <li><strong>Motivo:</strong> ${descripcion_motivo}</li>
                            <li><strong>Motivo de cancelación:</strong> ${motivoCancelacion}</li>
                            <li><strong>Hora de inicio:</strong> ${hora_inicio}</li>
                            <li><strong>Hora de fin:</strong> ${hora_fin}</li>
                            <li><strong>Fecha de cancelación:</strong> ${new Date().toLocaleString('es-ES')}</li>
                        </ul>
                        <p>Gracias por utilizar nuestro sistema.</p>
                    `,
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error('Error al enviar correo de cancelación:', err);
                        return res.status(500).json({ message: 'Reserva cancelada, pero hubo un problema al enviar el correo.' });
                    }

                    res.json({ message: 'Reserva cancelada con éxito y correo de confirmación enviado.' });
                });
            });
        });
    });
});



// Endpoint para obtener motivos según el id_recurso
app.get('/api/motivos/:idRecurso', (req, res) => {
    const idRecurso = req.params.idRecurso;

    // motivos basados en el id_recurso
    const motivosPorRecurso = {
        1: [3],         
        2: [1, 3, 4],    
        3: [5],         
        4: [2, 3]       
    };

    // Obtener los id_motivo para el id_recurso específico
    const idMotivos = motivosPorRecurso[idRecurso];

    if (!idMotivos) {
        return res.status(404).json({ error: 'No se encontraron motivos para este recurso.' });
    }

    // Consultar la base de datos para obtener los motivos
    const query = 'SELECT id_motivo, desc_motivo FROM motivo WHERE id_motivo IN (?)';
    connection.query(query, [idMotivos], (error, results) => {
        if (error) {
            console.error('Error al obtener motivos: ' + error.stack);
            return res.status(500).json({ error: 'Error al obtener motivos' });
        }
        res.json(results);
    });
});

// Endpoint para obtener todas las reservas
app.get('/api/obtenerReservas', (req, res) => {
    const query = `
        SELECT r.id_reserva, r.fecha_reserva, rc.descripcion_recurso, r.id_usuario, r.hora_inicio, r.hora_fin, m.desc_motivo, r.fecha_creacion, r.id_estado_reserva,
        er.desc_estado_reserva
        FROM reserva r
        JOIN motivo m ON r.id_motivo = m.id_motivo
        JOIN recurso rc ON r.id_recurso = rc.id_recurso
        JOIN estado_reserva er ON r.id_estado_reserva = er.id_estado_reserva;


    `;

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener las reservas:', error);
            return res.status(500).json({ error: 'Error al obtener las reservas' });
        }
        res.json(results);
    });
});





// Endpoint de registro
app.post('/register', (req, res) => {
    const { rut, primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, telefono, direccion, password, fechaNacimiento, recibirNotificaciones } = req.body;

    // Validar los campos requeridos
    if (!rut || !primerNombre || !apellidoPaterno || !apellidoMaterno || !correo || !telefono || !direccion || !password || !fechaNacimiento) {
        return res.status(400).json({ message: 'Todos los campos son requeridos, excepto el segundo nombre.' });
    }

    // Formatear el RUT
    const rutFormateado = formatearRUT(rut);
    if (!rutFormateado) {
        return res.status(400).json({ error: 'RUT no válido' });
    }
    // fecha registro
    const fecha_registro = getChileDateTime();
    // Verificar si ya existe un usuario con el mismo rut, correo o telefono
    const query = `
        SELECT * FROM usuario 
        WHERE rut = ? OR correo = ? OR telefono = ?
    `;

    const values = [rutFormateado, correo, telefono];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error ejecutando la consulta SQL:', error);
            return res.status(500).json({ message: "Error en la consulta a la base de datos." });
        }

        if (results.length > 0) {
            const existingAttributes = [];
            if (results.some(user => user.rut === rutFormateado)) existingAttributes.push("RUT");
            if (results.some(user => user.correo === correo)) existingAttributes.push("correo");
            if (results.some(user => user.telefono === telefono)) existingAttributes.push("teléfono");

            return res.status(400).json({
                message: `El ${existingAttributes.join(", ")} ya está asociado a una cuenta.`
            });
        }
         
        const id_estadousuario = 1;
        const id_rol = 5; // rol por defecto
        const insertQuery = `INSERT INTO usuario (rut, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, correo, telefono, direccion, password, fecha_nacimiento, id_rol, id_estadousuario, recibe_notificacion, fecha_registro) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(insertQuery, [rutFormateado, primerNombre, segundoNombre || '', apellidoPaterno, apellidoMaterno, correo, telefono, direccion, password, fechaNacimiento, id_rol, id_estadousuario, recibirNotificaciones, fecha_registro], (err, result) => {
            if (err) {
                console.error('Error ejecutando la consulta SQL:', err);
                return res.status(500).json({ message: 'Error al registrar el usuario' });
            }
             // Enviar el correo de confirmación
             const mailOptions = {
                from: 'sistemaunidadterritorial@gmail.com',
                to: correo,
                subject: 'Confirmación de Registro',
                text: `Hola ${primerNombre},\n\nTu registro ha sido exitoso. Bienvenido a nuestro sistema.\n\nSaludos cordiales,\nEl equipo de Sistema Unidad Territorial.`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error enviando el correo:', error);
                    return res.status(500).json({ message: 'Registro exitoso, pero no se pudo enviar el correo de confirmación.' });
                }
                console.log('Correo enviado: ' + info.response);
            });
            res.status(201).json({ message: 'Registro exitoso' }); 
        });
    });
});



// Endpoint para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
    const sql = `
        SELECT 
        CONCAT(u.primer_nombre, ' ', u.segundo_nombre, ' ', u.apellido_paterno, ' ',u.apellido_materno) AS nombre_completo,
        u.rut, u.primer_nombre, u.segundo_nombre, u.apellido_paterno, u.apellido_materno, 
               u.correo, u.telefono, u.id_rol, u.id_estadousuario, u.direccion, u.recibe_notificacion, u.fecha_nacimiento, u.fecha_registro,
               r.descripcion_rol, e.desc_estadousuario
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado_usuario e ON u.id_estadousuario = e.id_estadousuario`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ message: 'Error al obtener usuarios' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para actualizar el estado del usuario
app.put('/api/usuarios/:rut/estado', (req, res) => {
    const { rut } = req.params;
    const { id_estadousuario } = req.body;

    const sql = `UPDATE usuario SET id_estadousuario = ? WHERE rut = ?`;

    connection.query(sql, [id_estadousuario, rut], (err, result) => {
        if (err) {
            console.error('Error al actualizar el estado del usuario:', err);
            return res.status(500).json({ message: 'Error al actualizar el estado' });
        }
        res.status(200).json({ message: 'Estado actualizado correctamente' });
    });
});

// Endpoint para obtener todos los roles
app.get('/api/roles', (req, res) => {
    const sql = 'SELECT * FROM rol'; 

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).json({ message: 'Error al obtener roles' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para obtener todos los estados de usuario
app.get('/api/estados', (req, res) => {
    const sql = 'SELECT * FROM estado_usuario'; 

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener estados:', err);
            return res.status(500).json({ message: 'Error al obtener estados' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para actualizar el rol del usuario
app.put('/api/usuarios/:rut/rol', (req, res) => {
    const { rut } = req.params;
    const { id_rol } = req.body;

    const sql = `UPDATE usuario SET id_rol = ? WHERE rut = ?`;

    connection.query(sql, [id_rol, rut], (err, result) => {
        if (err) {
            console.error('Error al actualizar el rol del usuario:', err);
            return res.status(500).json({ message: 'Error al actualizar el rol' });
        }
        res.status(200).json({ message: 'Rol actualizado correctamente' });
    });
});
// Endpoint para actualizar el recibir notificaciones
app.post('/api/actualizarNotificaciones', (req, res) => {
    const { rut, recibe_notificacion } = req.body;

    // Validar que se haya proporcionado el rut y el estado
    if (!rut || typeof recibe_notificacion === 'undefined') {
        return res.status(400).json({ message: 'El RUT y el estado de notificación son requeridos.' });
    }

    // Consulta para actualizar el estado de recibir notificaciones
    const updateQuery = `
        UPDATE usuario 
        SET recibe_notificacion = ? 
        WHERE rut = ?
    `;

    const values = [recibe_notificacion, rut];

    connection.query(updateQuery, values, (error, results) => {
        if (error) {
            console.error('Error ejecutando la consulta SQL:', error);
            return res.status(500).json({ message: 'Error al actualizar el estado de notificaciones.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Estado de notificaciones actualizado exitosamente.' });
    });
});


app.get('/gestion_usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'gestion_usuarios', 'gestion_usuarios.html'));
});



app.get('/solicitar_certificado', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'solicitar_certificado.html'));
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});


const sessionDuration = 30 * 60 * 1000;
const session = require('express-session');
// Configura el middleware de sesión
app.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: sessionDuration
    }
}));

app.use(express.urlencoded({ extended: true })); 


app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    const query = 'SELECT * FROM usuario WHERE correo = ?';

    connection.query(query, [correo], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta', err);
            return res.status(500).send('Error del servidor');
        }
        
        if (results.length > 0) {
            const usuario = results[0];
            const obtenerDescripcionRol = (id_rol) => {
                const query = 'SELECT descripcion_rol FROM rol WHERE id_rol = ?';
                return new Promise((resolve, reject) => {
                    connection.query(query, [id_rol], (err, rows) => {
                        if (err) {
                            console.error('Error al obtener la descripción del rol:', err);
                            return reject(err);
                        }
                        resolve(rows.length > 0 ? rows[0].descripcion_rol : null);
                    });
                });
            };
            if (usuario.password === password) {
                obtenerDescripcionRol(usuario.id_rol)
                    .then((descripcionRol) => {
                        req.session.user = {
                            id_usuario: usuario.id_usuario,
                            primer_nombre: usuario.primer_nombre,
                            segundo_nombre: usuario.segundo_nombre,
                            apellido_paterno: usuario.apellido_paterno,
                            apellido_materno: usuario.apellido_materno,
                            correo: usuario.correo,
                            telefono: usuario.telefono,
                            direccion: usuario.direccion,
                            rut: usuario.rut,
                            fecha_nacimiento: usuario.fecha_nacimiento,
                            role: usuario.id_rol,
                            descripcion_rol: descripcionRol,
                            recibirNotificaciones: usuario.recibe_notificacion,
                            visits: (req.session.user?.visits || 0) + 1,
                            lastLogin: new Date().toISOString()
                        };

                        console.log('Usuario guardado en la sesión:', req.session.user);

                        // Redirigir según el id_rol
                        if ([1, 2, 3, 4, 6].includes(usuario.id_rol)) {
                            return res.status(200).json({ message: 'Inicio de sesión exitoso', redirect: '/index_directiva.html' });
                        } else if (usuario.id_rol === 5) {
                            return res.status(200).json({ message: 'Inicio de sesión exitoso', redirect: '/index.html' });
                        }
                    })
                    .catch((error) => {
                        console.error('Error durante el proceso de inicio de sesión:', error);
                        return res.status(500).json({ message: 'Error interno en el servidor' });
                    });
            } else {
                return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
            }
        } else {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }
    });
});

// Datos de la sesion
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({
            id_usuario: req.session.user.id_usuario,
            primer_nombre: req.session.user.primer_nombre,
            segundo_nombre: req.session.user.segundo_nombre,
            apellido_paterno: req.session.user.apellido_paterno,
            apellido_materno: req.session.user.apellido_materno,
            correo: req.session.user.correo,
            role: req.session.user.role,
            descripcion_rol: req.session.user.descripcion_rol,
            direccion: req.session.user.direccion,
            telefono: req.session.user.telefono,
            rut: req.session.user.rut,
            fecha_nacimiento: req.session.user.fecha_nacimiento,
            recibirNotificaciones: req.session.user.recibirNotificaciones,
            visits: req.session.user.visits,
            lastLogin: req.session.user.lastLogin
        });
    } else {
        res.status(401).json({ message: 'No estás autenticado' });
    }
});


app.use((req, res, next) => {
    if (req.session.user) {
        const now = Date.now();
        const lastActivity = req.session.lastActivity || now;
        
        // Verificar si ha pasado el tiempo de sesión
        if (now - lastActivity > sessionDuration) {
            req.session.destroy(err => {
                if (err) {
                    return next(err);
                }
                return res.status(401).json({ message: 'Sesión expirada. Por favor, inicia sesión de nuevo.' });
            });
        } else {
            req.session.lastActivity = now;
        }
    }
    next();
});

// Endpoint para cerrar sesión
app.post('/logout', (req, res) => {
    // Destruir la sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión', err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        // Limpiar la cookie de sesión
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
});

// Middleware para verificar autenticación
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'No estás autenticado' });
    }
}
app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            userId: req.session.user.id_usuario,
            userRole: req.session.user.role,
            userCorreo: req.session.user.correo
        });
    } else {
        res.json({ authenticated: false });
    }
});

// check role
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (req.session.user && allowedRoles.includes(req.session.user.role)) {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado' });
        }
    };
}

// Middleware para verificar el rol del usuario
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (req.session.user && allowedRoles.includes(req.session.user.role)) {
            next();
        } else {
            // Si no tiene acceso, destruir la sesión
            req.session.destroy(err => {
                if (err) {
                    console.error('Error al cerrar sesión:', err);
                    return res.status(500).send('Error del servidor');
                }
                res.status(403).json({ message: 'Acceso denegado. Sesión cerrada.' });
            });
        }
    };
}

// Función para formatear el RUT 
function formatearRUT(rut) {
    const soloNumerosYK = rut.replace(/[^0-9Kk]/g, '');
    const largo = soloNumerosYK.length;
    if (largo < 2) return null;
    const cuerpo = soloNumerosYK.slice(0, largo - 1);
    const dv = soloNumerosYK.charAt(largo - 1).toUpperCase();

    // Formatear RUT
    const rutFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    return rutFormateado;
}

app.post("/api/generarCertificado", (req, res) => {
    const { rut, nombre, domicilio, motivo, correo } = req.body;
    const rutFormateado = formatearRUT(rut);
    // Validación simple de los campos
    if (!rutFormateado || !nombre || !domicilio || !motivo) {
        return res.status(400).json({ error: "Por favor, completa todos los campos." });
    }

    // Obtener la fecha y hora actual de Chile
    const fechaCreacion = getChileDateTime();
    const dd = String(fechaCreacion.getDate()).padStart(2, '0');
    const mm = String(fechaCreacion.getMonth() + 1).padStart(2, '0');
    const yyyy = fechaCreacion.getFullYear();
    const fechaString = `${yyyy}-${mm}-${dd}`;

    // Verificar si ya existe un documento con el mismo RUT, fecha y motivo
    const queryExistencia = "SELECT documento FROM certificados WHERE rut = ? AND DATE(fecha) = ? AND motivo = ?";
    connection.query(queryExistencia, [rutFormateado, fechaString, motivo], (err, results) => {
        if (err) {
            console.error("Error al verificar la existencia del documento:", err);
            return res.status(500).json({ error: "Error al verificar el documento." });
        }

        if (results.length > 0) {
            // Si el documento ya existe, se envía o se descarga
            const existingDocument = results[0].documento;
            const pdfName = `certificado_residencia_${rut.replace(/[.-]/g, '')}${dd}${mm}${yyyy}.pdf`;

            // Enviar por correo si se proporciona, de lo contrario lo descarga
            if (correo) {
                // Enviar el archivo PDF por correo
                const mailOptions = {
                    from: "sistemaunidadterritorial@gmail.com",
                    to: correo,
                    subject: "Certificado de Residencia Generado",
                    text: `Estimado(a) ${nombre}, se adjunta su certificado de residencia.`,
                    attachments: [
                        {
                            filename: pdfName,
                            content: existingDocument,
                        },
                    ],
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Error al enviar el correo:", error);
                        return res.status(500).json({ message: "Error al enviar el correo con el certificado." });
                    }

                    console.log("Correo enviado correctamente.");
                    console.log('Correo enviado: ' + info.response);
                    return res.json({ message: "Certificado existente enviado por correo exitosamente." });
                });
            } else {
                // Descargar el documento existente
                const buffer = Buffer.from(existingDocument);
                const tempPath = path.join(__dirname, pdfName);
                fs.writeFile(tempPath, buffer, (err) => {
                    if (err) {
                        console.error("Error al escribir el archivo temporal:", err);
                        return res.status(500).json({ error: "Error al descargar el archivo." });
                    }

                    // Iniciar la descarga del documento existente
                    res.download(tempPath, pdfName, (err) => {
                        if (err) {
                            console.error("Error al enviar el archivo:", err);
                            return res.status(500).send("Error al descargar el archivo.");
                        }

                        // Eliminar el archivo temporal
                        fs.unlink(tempPath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error al eliminar el archivo temporal:", unlinkErr);
                            } else {
                                console.log("Archivo PDF temporal eliminado.");
                            }
                        });
                    });
                });
            }
        } else {
            // Documento no existe, se procede a generarlo
            const doc = new PDFDocument();
            const pdfName = `certificado_residencia_${rut.replace(/[.-]/g, '')}${dd}${mm}${yyyy}.pdf`;
            const pdfPath = path.join(__dirname, pdfName);

            // Escribir el PDF en un archivo
            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            doc.fontSize(12).text("Certificado de Residencia", { align: "center" });
            doc.moveDown();
            doc.fontSize(10).text(`Yo, ${nombre}, con RUT ${rutFormateado}, declaro que resido en el domicilio ubicado en ${domicilio}.`);
            doc.moveDown();
            doc.text(`Motivo de la solicitud: ${motivo}.`);
            doc.moveDown(2);
            doc.text(`Fecha de emisión del documento: ${fechaCreacion.toLocaleDateString("es-ES")}.`);

            doc.end();

            writeStream.on("finish", () => {
                // Leer el archivo PDF como un Buffer
                fs.readFile(pdfPath, (err, pdfData) => {
                    if (err) {
                        console.error("Error al leer el archivo PDF:", err);
                        return res.status(500).json({ error: "Error al generar el certificado PDF." });
                    }

                    // Insertar datos en la base de datos
                    const query = "INSERT INTO certificados (rut, nombre, domicilio, motivo, documento, fecha) VALUES (?, ?, ?, ?, ?, ?)";
                    connection.query(query, [rutFormateado, nombre, domicilio, motivo, pdfData, fechaCreacion], (err) => {
                        if (err) {
                            console.error("Error al insertar en la base de datos:", err);
                            fs.unlink(pdfPath, () => {});
                            return res.status(500).json({ error: "Error al generar el certificado." });
                        }

                        // Validar correo
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com)$/;
                        if (correo && emailRegex.test(correo)) {
                            // Enviar el archivo PDF por correo
                            const mailOptions = {
                                from: "sistemaunidadterritorial@gmail.com",
                                to: correo,
                                subject: "Certificado de Residencia Generado",
                                text: `Estimado(a) ${nombre}, se adjunta su certificado de residencia.`,
                                attachments: [
                                    {
                                        filename: pdfName,
                                        content: pdfData,
                                    },
                                ],
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error("Error al enviar el correo:", error);
                                    fs.unlink(pdfPath, () => {});
                                    return res.status(500).json({ message: "Error al enviar el correo con el certificado." });
                                }

                                console.log("Correo enviado correctamente.");
                                console.log('Correo enviado: ' + info.response);

                                // Eliminar el archivo PDF temporal después de enviarlo
                                fs.unlink(pdfPath, (unlinkErr) => {
                                    if (unlinkErr) {
                                        console.error("Error al eliminar el archivo temporal:", unlinkErr);
                                    } else {
                                        console.log("Archivo PDF temporal eliminado.");
                                    }
                                });

                                // Confirmar el envío del certificado
                                res.json({ message: "Certificado generado y enviado por correo exitosamente." });
                            });
                        } else {
                            // Si el correo está vacío o no es válido, iniciar la descarga del documento
                            res.download(pdfPath, pdfName, (err) => {
                                if (err) {
                                    console.error("Error al enviar el archivo:", err);
                                    return res.status(500).send("Error al descargar el archivo.");
                                }
                                console.log("Certificado enviado para descarga.");

                                // Después de enviar el archivo, eliminar el archivo PDF temporal
                                fs.unlink(pdfPath, (unlinkErr) => {
                                    if (unlinkErr) {
                                        console.error("Error al eliminar el archivo temporal:", unlinkErr);
                                    } else {
                                        console.log("Archivo PDF temporal eliminado.");
                                    }
                                });
                            });
                        }
                    });
                });
            });

            writeStream.on("error", (error) => {
                console.error("Error al escribir el PDF:", error);
                return res.status(500).json({ message: "Error al generar el certificado PDF." });
            });
        }
    });
});

// Endpoint para obtener los certificados
app.get('/api/obtenerCertificados', (req, res) => {
    const query = 'SELECT id_certificado, rut, nombre, domicilio, motivo, fecha, documento FROM certificados';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los certificados:', err);
            return res.status(500).json({ error: 'Error al obtener los certificados' });
        }
        
        res.json(results);
    });
});
// Endpoint para obtener un certificado por ID
app.get('/api/obtenerCertificado/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT documento FROM certificados WHERE id_certificado = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el certificado:', err);
            return res.status(500).json({ error: 'Error al obtener el certificado' });
        }

        if (results.length > 0) {
            const documento = results[0].documento;
            res.contentType('application/pdf');
            res.send(documento);
        } else {
            res.status(404).json({ error: 'Certificado no encontrado' });
        }
    });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Endpoint para subir la noticia con la imagen como BLOB
app.post('/api/noticias/subir', upload.single('imagen'), (req, res) => {
    const { titulo, contenido } = req.body; 
    const id_usuario = req.session && req.session.user ? req.session.user.id_usuario : null;

    // Verificar que se ha subido una imagen
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Es obligatorio subir una imagen para la noticia' });
    }

    // Convertir la imagen a formato BLOB (buffer)
    const imagen = req.file.buffer; 

    // Insertar la imagen en la tabla `imagen`
    const sqlInsertImagen = `INSERT INTO imagen (imagen) VALUES (?)`;
    connection.query(sqlInsertImagen, [imagen], (err, result) => {
        if (err) {
            console.error('Error al insertar la imagen:', err);
            return res.status(500).json({ success: false, message: 'Error al insertar la imagen' });
        }

        const id_imagen = result.insertId; 
        const fecha_publicacion = new Date();
        const sqlInsertNoticia = `INSERT INTO noticia (titulo, contenido, fecha_publicacion, id_usuario, id_imagen)
                                  VALUES (?, ?, ?, ?, ?)`;

        connection.query(sqlInsertNoticia, [titulo, contenido, fecha_publicacion, id_usuario, id_imagen], (err, result) => {
            if (err) {
                console.error('Error al insertar la noticia:', err);
                return res.status(500).json({ success: false, message: 'Error al insertar la noticia' });
            }

            // Enviar correo a los usuarios que reciben notificaciones
            const sqlSelectUsuarios = `SELECT correo FROM usuario WHERE recibe_notificacion = 1`;
            connection.query(sqlSelectUsuarios, (err, usuarios) => {
                if (err) {
                    console.error('Error al obtener los usuarios:', err);
                    return res.status(500).json({ success: false, message: 'Error al obtener los usuarios' });
                }

                // Crear un array de promesas para enviar correos
                const emailPromises = usuarios.map(usuario => {
                    const mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: usuario.correo,
                        subject: titulo,
                        html: `
                            <h1>${titulo}</h1>
                            <p>${contenido}</p>
                            <p><img src="cid:uniqueImageID" alt="Imagen de la noticia"></p>
                        `,
                        attachments: [
                            {
                                filename: req.file.originalname,
                                content: req.file.buffer,
                                cid: 'uniqueImageID'
                            }
                        ],
                    };
                
                    // Enviar el correo
                    return transporter.sendMail(mailOptions);
                });

                Promise.all(emailPromises)
                    .then(() => {
                        res.json({ success: true, message: 'Noticia publicada con éxito y correos enviados', noticia_id: result.insertId });
                    })
                    .catch(err => {
                        console.error('Error al enviar correos:', err);
                        res.json({ success: true, message: 'Noticia publicada con éxito, pero hubo un problema enviando los correos' });
                    });
            });
        });
    });
});

// Obtener una noticia por ID
app.get('/api/noticias/:id_noticia', (req, res) => {
    const id_noticia = req.params.id_noticia;

    // Consulta SQL para obtener la noticia y el nombre del editor
    const query = `
        SELECT n.*, 
               CONCAT(u.primer_nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS editor_name 
        FROM noticia n
        LEFT JOIN usuario u ON n.id_usuario = u.id_usuario 
        WHERE n.id_noticia = ?`;

    connection.query(query, [id_noticia], (error, results) => {
        if (error) {
            console.error('Error en la consulta de noticia:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Noticia no encontrada' });
        }

        const noticia = results[0];

        // Consulta para obtener la imagen relacionada (si existe)
        const imagenQuery = 'SELECT imagen FROM imagen WHERE id_imagen = ?';

        connection.query(imagenQuery, [noticia.id_imagen], (error, imagenResults) => {
            if (error) {
                console.error('Error al recuperar la imagen:', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            // Establecer la imagen si existe
            noticia.imagen = imagenResults.length > 0 ? imagenResults[0].imagen : null;

            // Devuelve la noticia como respuesta
            res.json({
                id_noticia: noticia.id_noticia,
                titulo: noticia.titulo,
                contenido: noticia.contenido,
                fecha_publicacion: noticia.fecha_publicacion,
                editor: noticia.editor_name || 'No especificado', 
                imagen: noticia.imagen ? `data:image/jpeg;base64,${Buffer.from(noticia.imagen).toString('base64')}` : null,
            });
        });
    });
});

// Obtener todas las noticias
app.get('/api/noticias', (req, res) => {
    const query = `
        SELECT n.*, 
               CONCAT(u.primer_nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS editor_name,
               i.imagen AS imagen_blob
        FROM noticia n
        LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
        LEFT JOIN imagen i ON n.id_imagen = i.id_imagen
    `;

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error en la consulta de noticias:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        // Mapear los resultados para incluir la imagen en base64
        const noticiasConImagen = results.map(noticia => {
            return {
                id_noticia: noticia.id_noticia,
                titulo: noticia.titulo,
                contenido: noticia.contenido,
                fecha_publicacion: noticia.fecha_publicacion,
                editor: noticia.editor_name || 'No especificado',
                // Convertir la imagen blob a base64
                imagen: noticia.imagen_blob ? `data:image/jpeg;base64,${Buffer.from(noticia.imagen_blob).toString('base64')}` : null
            };
        });

        res.json(noticiasConImagen);
    });
});


// Endpoint para obtener el historial de noticias
app.get('/api/historialNoticias', (req, res) => {
    const sqlSelectNoticias = `
        SELECT n.titulo, n.contenido, n.fecha_publicacion,
               CONCAT(u.primer_nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS editor,
               n.id_imagen 
        FROM noticia n
        JOIN usuario u ON n.id_usuario = u.id_usuario`; 

    connection.query(sqlSelectNoticias, (err, results) => {
        if (err) {
            console.error('Error al obtener las noticias:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener las noticias' });
        }

        res.json(results);
    });
});
// Endpoint para obtener la imagen por id_imagen
app.get('/api/imagenes/:id_imagen', (req, res) => {
    const id_imagen = req.params.id_imagen;

    const sqlSelectImagen = `SELECT imagen FROM imagen WHERE id_imagen = ?`;

    connection.query(sqlSelectImagen, [id_imagen], (err, results) => {
        if (err) {
            console.error('Error al obtener la imagen:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener la imagen' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
        }

        res.set('Content-Type', 'image/jpeg'); 
        res.send(results[0].imagen);
    });
});


// Endpoint para postular un proyecto
app.post('/api/postular_proyecto', upload.single('imagen'), (req, res) => {
    const { nombre, presupuesto_estimado, duracion, ubicacion, objetivo, descripcion } = req.body;
    const id_usuario = req.session.user.id_usuario;
    let id_imagen = null;
    const fecha_postulacion = new Date();

    // Verificar si hay una imagen en la solicitud
    if (req.file) {
        const imagen = req.file.buffer;

        // Insertar la imagen en la tabla 'imagen'
        connection.query('INSERT INTO imagen (imagen) VALUES (?)', [imagen], (error, imagenResult) => {
            if (error) {
                console.error("Error al insertar imagen:", error);
                return res.status(500).json({ success: false, message: "Error al insertar la imagen" });
            }
            id_imagen = imagenResult.insertId;

            // Insertar el nuevo proyecto en la tabla 'proyecto' junto con la fecha de postulación
            connection.query(
                `INSERT INTO proyecto (nombre_proyecto, descripcion_proyecto, id_usuario, id_imagen, fecha_postulacion, ubicacion, presupuesto_estimado, duracion, objetivo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombre, descripcion, id_usuario, id_imagen, fecha_postulacion, ubicacion, presupuesto_estimado, duracion, objetivo],
                (error, proyectoResult) => {
                    if (error) {
                        console.error("Error al postular proyecto:", error);
                        return res.status(500).json({ success: false, message: "Error al postular el proyecto" });
                    }
                    // Enviar correo de confirmación
                    const mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: req.session.user.correo,
                        subject: 'Confirmación de Postulación de Proyecto',
                        text: `Su proyecto ha sido postulado exitosamente.\n\nDetalles de la postulación:\n- Nombre del Proyecto: ${nombre}\n- Ubicación: ${ubicacion}\n- Presupuesto estimado: ${presupuesto_estimado}\n- Duración (en semanas): ${duracion}\n- Objetivo del proyecto: ${objetivo}\n- Descripción: ${descripcion}\n- Fecha y hora de postulación: ${fecha_postulacion.toLocaleString()}\n\n¡Gracias por su participación!`,
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error("Error al enviar el correo:", error);
                        } else {
                            console.log('Correo enviado: ' + info.response);
                        }
                    });

                    res.status(201).json({ success: true, message: "Proyecto postulado exitosamente" });
                }
            );
        });
    } else {
        // Si no hay imagen, solo inserta el proyecto con la fecha de postulación
        connection.query(
            `INSERT INTO proyecto nombre_proyecto, descripcion_proyecto, id_usuario, fecha_postulacion, ubicacion, presupuesto_estimado, duracion, objetivon) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, id_usuario, null, fecha_postulacion, ubicacion, presupuesto_estimado, duracion, objetivo],
            (error, proyectoResult) => {
                if (error) {
                    console.error("Error al postular proyecto:", error);
                    return res.status(500).json({ success: false, message: "Error al postular el proyecto" });
                }
                // Enviar correo de confirmación
                const mailOptions = {
                    from: 'sistemaunidadterritorial@gmail.com',
                    to: req.session.user.correo,
                    subject: 'Confirmación de Postulación de Proyecto',
                    text: `Su proyecto ha sido postulada exitosamente.\n\nDetalles de la postulación:\n- Nombre del Proyecto: ${nombre}\n- Ubicación: ${ubicacion}\n- Presupuesto estimado: ${presupuesto_estimado}\n- Duración (en semanas): ${duracion}\n- Objetivo del proyecto: ${objetivo}\n- Descripción: ${descripcion}\n- Fecha y hora de postulación: ${fecha_postulacion.toLocaleString()}\n\n¡Gracias por su participación!`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Error al enviar el correo:", error);
                    } else {
                        console.log('Correo enviado: ' + info.response);
                    }
                });

                res.status(201).json({ success: true, message: "Proyecto postulado exitosamente" });
            }
        );
    }
});


app.get('/api/listarProyectos', (req, res) => {
    const query = 'SELECT id_proyecto, nombre_proyecto, descripcion_proyecto, fecha_postulacion FROM proyecto';

    connection.query(query, (error, proyectos) => {
        if (error) {
            console.error('Error al listar proyectos:', error);
            return res.status(500).json({ message: 'Error al listar proyectos' });
        }
        res.json(proyectos);
    });
});



app.get('/api/verProyecto', (req, res) => {
    const id_proyecto = req.query.id;

    const query = `
        SELECT p.id_proyecto, p.nombre_proyecto, p.descripcion_proyecto, p.fecha_postulacion, p.presupuesto_estimado, p.ubicacion, p.duracion, p.objetivo, p.resolucion,
               e.estado_proyecto AS estado_proyecto, p.id_estado_proyecto, i.imagen
        FROM proyecto p
        JOIN estado_proyecto e ON p.id_estado_proyecto = e.id_estado_proyecto
        LEFT JOIN imagen i ON p.id_imagen = i.id_imagen
        WHERE p.id_proyecto = ?`;

    connection.query(query, [id_proyecto], (err, results) => {
        if (err) {
            console.error('Error al obtener los detalles del proyecto:', err);
            return res.status(500).json({ error: 'Error al obtener los detalles del proyecto' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        const proyecto = results[0];
        
        // Convertir la imagen BLOB a base64 solo si existe
        if (proyecto.imagen) {
            proyecto.imagen = proyecto.imagen.toString('base64');
        }

        res.json(proyecto);
    });
});
// Endpoint para registrar un voto
app.post("/api/registrarVoto", (req, res) => {
    const { id_proyecto, id_usuario, id_tipovoto } = req.body;
    const fecha_voto = new Date();

    // Insertar el voto en la tabla 'votos_proyecto'
    const query = `
        INSERT INTO votos_proyecto (id_proyecto, id_usuario, id_tipovoto, fecha_voto)
        VALUES (?, ?, ?, ?)
    `;
    connection.query(query, [id_proyecto, id_usuario, id_tipovoto, fecha_voto], (error, results) => {
        if (error) {
            console.error("Error al registrar el voto:", error);
            return res.status(500).json({ error: "Error al registrar el voto." });
        }
        // Enviar el correo de confirmación
        const mailOptions = {
            from: 'sistemaunidadterritorial@gmail.com',
            to: req.session.user.correo,
            subject: 'Confirmación de Voto',
            text: `Su voto ha sido registrado exitosamente.\n\nDetalles del voto:\n- Proyecto ID: ${id_proyecto}\n- Fecha y hora de votación: ${fecha_voto.toLocaleString()}\n\n¡Gracias por participar!`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error al enviar el correo:", error);
            } else {
                console.log('Correo enviado: ' + info.response);
            }
        });
        res.json({ success: true, message: "Voto registrado exitosamente." });
    });
});


// Endpoint para verificar si el usuario ya ha votado en el proyecto
app.get("/api/verificarVoto", (req, res) => {

    const id_proyecto = req.query.id_proyecto;
    const id_usuario = req.session.user.id_usuario;

    // Confirmar que el id_proyecto está presente
    if (!id_proyecto) {
        return res.status(400).json({ error: "Falta el id_proyecto para verificar el voto." });
    }

    // Consultar si existe un voto para el usuario y el proyecto especificados
    const query = `
        SELECT COUNT(*) AS yaVotado
        FROM votos_proyecto
        WHERE id_proyecto = ? AND id_usuario = ?
    `;
    connection.query(query, [id_proyecto, id_usuario], (error, results) => {
        if (error) {
            console.error("Error al verificar el voto:", error);
            return res.status(500).json({ error: "Error al verificar el voto." });
        }

        const yaVotado = results[0].yaVotado > 0;
        res.json({ yaVotado });
    });
});

// Endpoint para contar votos
app.get("/api/contarVotos", (req, res) => {
    const { id_proyecto } = req.query;
    const query = `
        SELECT 
            SUM(CASE WHEN id_tipovoto = 1 THEN 1 ELSE 0 END) AS votosFavor,
            SUM(CASE WHEN id_tipovoto = 2 THEN 1 ELSE 0 END) AS votosContra,
            SUM(CASE WHEN id_tipovoto = 3 THEN 1 ELSE 0 END) AS votosNulos
        FROM votos_proyecto
        WHERE id_proyecto = ?
    `;

    connection.query(query, [id_proyecto], (error, results) => {
        if (error) {
            console.error("Error al contar votos:", error);
            return res.status(500).json({ error: "Error al contar votos." });
        }
        const { votosFavor, votosContra, votosNulos } = results[0];
        res.json({ votosFavor, votosContra, votosNulos });
    });
});
// Endpoint para obtener estados de la tabla estado_proyecto
app.get("/api/obtenerEstadosProyecto", (req, res) => {
    const query = "SELECT id_estado_proyecto, estado_proyecto FROM estado_proyecto";

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error al obtener los estados del proyecto:", error);
            return res.status(500).json({ error: "Error al obtener estados." });
        }
        res.json(results);
    });
});

// Endpoint para cambiar el estado del proyecto
app.post("/api/cambiarEstadoProyecto", (req, res) => {
    const { id_proyecto, id_estado_proyecto, resolucion } = req.body;
    const estadoProyectoInt = parseInt(id_estado_proyecto, 10);
    const proyectoInt = parseInt(id_proyecto, 10);
    const fechaResolucion = new Date();

    // Cambiar el estado del proyecto en la base de datos
    connection.query(
        "UPDATE proyecto SET id_estado_proyecto = ?, fecha_resolucion = ? WHERE id_proyecto = ?",
        [estadoProyectoInt, fechaResolucion, proyectoInt],
        (error, result) => {
            if (error) {
                console.error("Error al actualizar el estado del proyecto:", error);
                return res.status(500).json({ success: false, message: "Error al actualizar el estado del proyecto" });
            }

            // Si el estado es 5 (rechazado), guardar la resolución en la base de datos
            if (estadoProyectoInt === 5) {
                connection.query(
                    "UPDATE proyecto SET resolucion = ? WHERE id_proyecto = ?",
                    [resolucion, proyectoInt],
                    (error) => {
                        if (error) {
                            console.error("Error al guardar la resolución del proyecto:", error);
                            return res.status(500).json({ success: false, message: "Error al guardar la resolución del proyecto" });
                        }
                    }
                );
            }

            // Obtener el correo y el nombre del proyecto
            connection.query(
                "SELECT u.correo, p.nombre_proyecto FROM usuario u JOIN proyecto p ON u.id_usuario = p.id_usuario WHERE p.id_proyecto = ?",
                [proyectoInt],
                (error, results) => {
                    if (error || results.length === 0) {
                        console.error("Error al obtener el correo o nombre del proyecto:", error);
                        return res.status(500).json({ success: false, message: "Error al obtener el correo o nombre del proyecto" });
                    }

                const correoPostulante = results[0].correo;
                const nombreProyecto = results[0].nombre_proyecto;
                let mailOptions = {};
                let correoUsuarios = [];

                if (estadoProyectoInt === 4) {
                // Configuración del correo para aprobación
                    mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: correoPostulante,
                        subject: 'Confirmación de Aprobación de Proyecto',
                        text: `Su proyecto "${nombreProyecto}" ha sido aprobado.\n\n- Fecha y hora de la aprobación: ${new Date().toLocaleString()}\n\n¡Gracias por su participación!`,
                    };

                    // Obtener correos de usuarios con roles 1, 2, 3, 4, 6 (directiva y developer)
                    connection.query(
                        "SELECT correo FROM usuario WHERE id_rol IN (1, 2, 3, 4, 6)",
                        (error, roleResults) => {
                        if (error) {
                            console.error("Error al obtener correos de usuarios:", error);
                            return res.status(500).json({ success: false, message: "Error al obtener correos de usuarios" });
                        }
                        correoUsuarios = roleResults.map(user => user.correo).join(",");

                        // Enviar correo a todos los usuarios con los roles especificados
                        const mailOptionsRoles = {
                            from: 'sistemaunidadterritorial@gmail.com',
                            to: correoUsuarios,
                            subject: 'Aprobación de Proyecto',
                            text: `El proyecto "${nombreProyecto}" ha sido aprobado.\n\nFecha y hora de la resolución: ${new Date().toLocaleString()}\n\n¡Gracias!`,
                        };

                        // Enviar correos
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.error("Error al enviar el correo al postulante:", error);
                            }
                        });

                        transporter.sendMail(mailOptionsRoles, (error) => {
                            if (error) {
                                console.error("Error al enviar correos a los usuarios:", error);
                            }
                        });
                    }
                );
            } else if (estadoProyectoInt === 5) {
                // Configuración del correo para rechazo
                mailOptions = {
                    from: 'sistemaunidadterritorial@gmail.com',
                    to: correoPostulante,
                    subject: 'Notificación de Rechazo de Proyecto',
                    text: `Su proyecto "${nombreProyecto}" ha sido rechazado.\n\nResolución: ${resolucion}\n\nFecha y hora de la resolución: ${new Date().toLocaleString()}\n\n¡Gracias!`,
                };

                // Obtener correos de usuarios con roles 1, 2, 3, 4, 6 (directiva y developer)
                connection.query(
                    "SELECT correo FROM usuario WHERE id_rol IN (1, 2, 3, 4, 6)",
                    (error, roleResults) => {
                        if (error) {
                            console.error("Error al obtener correos de usuarios:", error);
                            return res.status(500).json({ success: false, message: "Error al obtener correos de usuarios" });
                        }
                        correoUsuarios = roleResults.map(user => user.correo).join(",");

                        // Enviar correo a todos los usuarios con los roles especificados
                        const mailOptionsRoles = {
                            from: 'sistemaunidadterritorial@gmail.com',
                            to: correoUsuarios,
                            subject: 'Rechazo de Proyecto',
                            text: `El proyecto "${nombreProyecto}" ha sido rechazado.\n\nResolución: ${resolucion}\n\nFecha y hora de la resolución: ${new Date().toLocaleString()}\n\n¡Gracias!`,
                        };

                        // Enviar correos
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.error("Error al enviar el correo al postulante:", error);
                            }
                        });

                        transporter.sendMail(mailOptionsRoles, (error) => {
                            if (error) {
                                console.error("Error al enviar correos a los usuarios:", error);
                            }
                        });
                    }
                );
            }
            res.json({ success: true, message: "Estado del proyecto cambiado exitosamente" });
        }
    );
        }
    );
});

// Crear actividad
app.post("/api/crearActividad", (req, res) => {
    const { nombre_actividad, descripcion_actividad, cupo, ubicacion, id_usuario, fecha_actividad } = req.body;
    const fecha_creacion = new Date();

    // Query para insertar la actividad
    const query = `
        INSERT INTO actividad (nombre_actividad, descripcion_actividad, cupo, fecha_actividad, ubicacion, id_usuario, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [nombre_actividad, descripcion_actividad, cupo, fecha_actividad, ubicacion, id_usuario, fecha_creacion], (error, result) => {
        if (error) {
            console.error("Error al crear la actividad:", error);
            return res.status(500).json({ success: false, message: "Error al crear la actividad" });
        }

        // Obtener el correo del usuario (organizador)
        const queryCorreo = `SELECT correo FROM usuario WHERE id_usuario = ?`;
        
        connection.query(queryCorreo, [id_usuario], (error, rows) => {
            if (error) {
                console.error("Error al obtener el correo del usuario:", error);
                return res.status(500).json({ success: false, message: "Error al obtener el correo del organizador" });
            }

            if (rows.length === 0) {
                console.error("Usuario no encontrado");
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }

            const correoOrganizador = rows[0].correo;

            // Crear el correo de confirmación de solicitud en proceso
            const mailOptions = {
                from: 'sistemaunidadterritorial@gmail.com',
                to: correoOrganizador,  // Correo del organizador
                subject: 'Solicitud de Actividad Recibida',
                text: `Su solicitud de actividad ha sido recibida y está en proceso.\n\nDetalles de la actividad:\n- Nombre de la actividad: ${nombre_actividad}\n- Fecha de creación: ${fecha_creacion.toLocaleString()}\n- Estado: Solicitud en proceso.\n\nNos pondremos en contacto con usted pronto para darle más información.`,
            };

            // Enviar correo
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error al enviar el correo:", error);
                    return res.status(500).json({ success: false, message: "Error al enviar el correo" });
                }
                console.log("Correo enviado: " + info.response);
            });

            // Responder al cliente con éxito
            res.json({ success: true, message: "Actividad creada exitosamente", actividadId: result.insertId });
        });
    });
});
// Endpoint para obtener los estados de actividad
app.get("/api/estadosActividad", (req, res) => {
    connection.query(`
        SELECT id_estadoActividad, estado_actividad
        FROM estado_actividad
    `, (error, results) => {
        if (error) {
            console.error("Error al obtener los estados de actividad:", error);
            return res.status(500).json({ success: false, message: "Error al obtener los estados de actividad" });
        }
        res.json({ success: true, estados: results });
    });
});

app.put("/api/modificarActividad", (req, res) => {
    let { 
        id_actividad, 
        nombre_actividad, 
        descripcion_actividad, 
        cupo, 
        fecha_actividad, 
        ubicacion, 
        id_usuario, 
        id_estadoActividad, 
        motivo 
    } = req.body;
    let fechaModificacion = new Date();
    id_estadoActividad = parseInt(id_estadoActividad);
    // Query para actualizar la actividad
    const query = `
        UPDATE actividad
        SET 
            nombre_actividad = ?, 
            descripcion_actividad = ?, 
            cupo = ?, 
            fecha_actividad = ?, 
            ubicacion = ?, 
            id_usuario = ?, 
            id_estadoActividad = ?,
            motivo = ?,
            fechaModificacion = ?
        WHERE id_actividad = ?
    `;
    connection.query(query, [nombre_actividad, descripcion_actividad, cupo, fecha_actividad, ubicacion, id_usuario, id_estadoActividad, motivo, fechaModificacion, id_actividad], (error, result) => {
        if (error) {
            console.error("Error al actualizar la actividad:", error);
            return res.status(500).json({ success: false, message: "Error al actualizar la actividad" });
        }

        // Obtener el correo del organizador
        connection.query(
            "SELECT correo FROM usuario WHERE id_usuario = (SELECT id_usuario FROM actividad WHERE id_actividad = ?)",
            [id_actividad],
            (error, results) => {
                if (error || results.length === 0) {
                    console.error("Error al obtener el correo del organizador:", error);
                    return res.status(500).json({ success: false, message: "Error al obtener el correo del organizador" });
                }
                const correoOrganizador = results[0].correo;
                let mailOptions = {};

                // Comprobación de los estados 1=aprobada 2=rechazada 5=cancelada 
                if (id_estadoActividad === 1) {
                    mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: correoOrganizador,
                        subject: 'Confirmación de Aprobación de Actividad',
                        text: `Su actividad ha sido aprobada.\n\n- Fecha de aprobación: ${new Date().toLocaleString()}\n\n¡Gracias por su participación!`,
                    };
                } else if (id_estadoActividad === 2) {
                    mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: correoOrganizador,
                        subject: 'Notificación de Rechazo de Actividad',
                        text: `Lamentablemente, su actividad ha sido rechazada.\n\nDetalles:\n- Fecha de rechazo: ${new Date().toLocaleString()}
                        \n\nMotivo:${motivo}\n\nGracias por su comprensión.`,
                    };
                } else if (id_estadoActividad === 5) {
                    mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: correoOrganizador,
                        subject: 'Notificación de Cancelación de Actividad',
                        text: `Lamentablemente, su actividad ha sido cancelada.\n\nDetalles:\n- Fecha de cancelación: ${new Date().toLocaleString()}
                        \n\Motivo:${motivo}\n\nGracias por su comprensión.`,
                    };
                } else {
                    return res.status(200).json({ success: true, message: "Cambio de estado de la solicitud de actividad exitoso" });
                }

                if (mailOptions.to) {
                    // Enviar el correo al organizador
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error("Error al enviar el correo al organizador:", error);
                            return res.status(500).json({ success: false, message: "Error al enviar el correo" });
                        }

                    });
                } else {
                    console.error("No se configuró el destinatario del correo.");
                    return res.status(500).json({ success: false, message: "No se configuró el destinatario del correo" });
                }
                res.json({ success: true, message: "Estado de la actividad cambiado exitosamente" });
            }
        );
    });
});



// Ver actividad según id
app.get("/api/actividades/:idActividad", (req, res) => {
    const idActividad = req.params.idActividad;

    connection.query(
        `SELECT a.*, 
                CONCAT(u.primer_nombre, ' ', u.apellido_paterno) AS nombreUsuario 
         FROM actividad a
         JOIN usuario u ON a.id_usuario = u.id_usuario
         WHERE a.id_actividad = ?`,
        [idActividad],
        (error, results) => {
            if (error || results.length === 0) {
                console.error("Error al obtener la actividad:", error);
                return res.status(404).json({ success: false, message: "Actividad no encontrada" });
            }
            res.json({ success: true, actividad: results[0] });
        }
    );
});



// Endpoint para inscribirse en una actividad
app.post("/api/inscribir", (req, res) => {
    const { id_usuario, id_actividad, correo } = req.body;
    const fecha_inscripcion = new Date();

    // Primero, contar inscripciones para la actividad
    connection.query(
        "SELECT COUNT(*) AS count FROM inscripcion WHERE id_actividad = ? AND id_estadoInscripcion = 1",
        [id_actividad],
        (error, results) => {
            if (error) {
                console.error("Error al contar inscripciones:", error);
                return res.status(500).json({ success: false, message: "Error al contar inscripciones" });
            }

            const totalInscripciones = results[0].count;

            // Obtener el cupo disponible para la actividad
            connection.query(
                "SELECT cupo, nombre_actividad FROM actividad WHERE id_actividad = ?",
                [id_actividad],
                (error, results) => {
                    if (error || results.length === 0) {
                        console.error("Error al obtener el cupo de la actividad:", error);
                        return res.json({ success: false, message: "Actividad no encontrada" });
                    }

                    const cupoDisponible = results[0].cupo;
                    const nombreActividad = results[0].nombre_actividad;

                    // Verificar si hay suficiente cupo
                    if (totalInscripciones >= cupoDisponible) {
                        return res.status(400).json({ success: false, message: "No hay cupo disponible para inscribirse en esta actividad." });
                    }

                    // Si hay cupo, proceder a inscribir al usuario
                    connection.query(
                        "INSERT INTO inscripcion (id_usuario, id_actividad, fecha_inscripcion) VALUES (?, ?, ?)",
                        [id_usuario, id_actividad, fecha_inscripcion],
                        (error, result) => {
                            if (error) {
                                console.error("Error al inscribir al usuario:", error);
                                return res.status(500).json({ success: false, message: "Error al inscribirse en la actividad" });
                            }

                            // Si la inscripción fue exitosa, enviar correo de confirmación
                            const mailOptions = {
                                from: 'sistemaunidadterritorial@gmail.com',
                                to: correo,
                                subject: 'Confirmación de Inscripción en Actividad',
                                text: `¡Hola! Te has inscrito exitosamente en la actividad "${nombreActividad}". Fecha de inscripción: ${fecha_inscripcion.toLocaleString()}`,
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error("Error al enviar el correo:", error);
                                    return res.status(500).json({ success: false, message: "Inscripción realizada, pero no se pudo enviar el correo de confirmación." });
                                }
                                console.log("Correo de confirmación enviado:", info.response);
                                res.json({ success: true, message: "Inscripción realizada con éxito y correo de confirmación enviado." });
                            });
                        }
                    );
                }
            );
        }
    );
});


//ver todas las actividades
app.get("/api/actividades", (req, res) => {
    connection.query(`
        SELECT a.*, 
               CONCAT(u.primer_nombre, ' ', u.apellido_paterno) AS nombreUsuario,
               e.estado_actividad AS estado_actividad
        FROM actividad a
        JOIN usuario u ON a.id_usuario = u.id_usuario
        JOIN estado_actividad e ON a.id_estadoActividad = e.id_estadoActividad
    `, (error, results) => {
        if (error) {
            console.error("Error al obtener las actividades:", error);
            return res.status(500).json({ success: false, message: "Error al obtener las actividades" });
        }
        res.json({ success: true, actividades: results });
    });
});


// Contar inscripciones para una actividad específica
app.get("/api/inscripciones/count/actividad/:idActividad", (req, res) => {
    const idActividad = req.params.idActividad;

    connection.query(
        "SELECT COUNT(*) AS count FROM inscripcion WHERE id_actividad = ? AND id_estadoInscripcion = 1",
        [idActividad],
        (error, results) => {
            if (error) {
                console.error("Error al contar inscripciones:", error);
                return res.status(500).json({ success: false, message: "Error interno del servidor" });
            }

            const count = results[0].count;
            res.json(results[0]);
        }
    );
});

// Contar inscripciones de un usuario para una actividad
app.get("/api/inscripciones/count/:idUsuario/:idActividad", (req, res) => {
    const idUsuario = req.params.idUsuario;
    const idActividad = req.params.idActividad;

    connection.query(
        "SELECT COUNT(*) AS count FROM inscripcion WHERE id_usuario = ? AND id_actividad = ? AND id_estadoInscripcion = 1",
        [idUsuario, idActividad],
        (error, results) => {
            if (error) {
                console.error("Error al contar inscripciones:", error);
                return res.status(500).json({ success: false, message: "Error al contar inscripciones" });
            }
            res.json({ count: results[0].count });
        }
    );
});

// Obtener inscripciones de un usuario específico
app.get('/api/inscripciones/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;

    connection.query(
        `SELECT 
    inscripcion.id_inscripcion,
    inscripcion.fecha_inscripcion,
    inscripcion.id_estadoInscripcion,
    actividad.id_actividad,
    actividad.nombre_actividad AS nombre_actividad,
    actividad.descripcion_actividad AS descripcion_actividad,
    actividad.cupo,
    actividad.fecha_actividad AS fecha_actividad,
    actividad.ubicacion
FROM 
    inscripcion 
JOIN 
    actividad ON inscripcion.id_actividad = actividad.id_actividad 
WHERE 
    inscripcion.id_usuario = ?;
`,
        [idUsuario],
        (error, results) => {
            if (error) {
                console.error("Error al obtener inscripciones:", error);
                return res.status(500).json({ success: false, message: "Error al obtener inscripciones." });
            }

            res.json({ success: true, inscripciones: results });
        }
    );
});

// Cancelar inscripción por el usuario
app.put('/api/cancelar-inscripcion/:idInscripcion', (req, res) => {
    const idInscripcion = req.params.idInscripcion;
    const fecha_cancelacion = new Date();
    const motivoCancelacion = "Cancelada por el usuario";
    const { correo } = req.body;

    // Obtener el nombre de la actividad asociada a la inscripción
    connection.query(
        `SELECT a.nombre_actividad 
         FROM inscripcion i 
         JOIN actividad a ON i.id_actividad = a.id_actividad 
         WHERE i.id_inscripcion = ?`,
        [idInscripcion],
        (error, results) => {
            if (error || results.length === 0) {
                console.error("Error al obtener el nombre de la actividad:", error);
                return res.status(500).json({ success: false, message: "Error al obtener el nombre de la actividad." });
            }

            const nombreActividad = results[0].nombre_actividad;

            // Actualizar la inscripción con el estado de cancelación
            connection.query(
                `UPDATE inscripcion 
                 SET id_estadoInscripcion = 2, motivoCancelacion = ?, fecha_cancelacion = ? 
                 WHERE id_inscripcion = ?`,
                [motivoCancelacion, fecha_cancelacion, idInscripcion],
                (error, results) => {
                    if (error) {
                        console.error("Error al cancelar inscripción:", error);
                        return res.status(500).json({ success: false, message: "Error al cancelar la inscripción." });
                    }

                    if (results.affectedRows === 0) {
                        return res.status(404).json({ success: false, message: "Inscripción no encontrada." });
                    }

                    // Enviar correo de confirmación al usuario
                    const mailOptions = {
                        from: 'sistemaunidadterritorial@gmail.com',
                        to: correo,
                        subject: 'Confirmación de Cancelación de Inscripción',
                        text: `Tu inscripción en la actividad "${nombreActividad}" ha sido cancelada exitosamente. Motivo: ${motivoCancelacion}. Fecha de cancelación: ${fecha_cancelacion.toLocaleString()}`,
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error("Error al enviar el correo:", error);
                            return res.status(500).json({ success: false, message: "Inscripción cancelada, pero no se pudo enviar el correo de confirmación." });
                        }
                        console.log("Correo de confirmación enviado:", info.response);
                        res.json({ success: true, message: "Inscripción cancelada con éxito y correo de confirmación enviado." });
                    });
                }
            );
        }
    );
});

// Endpoint para obtener las inscripciones
app.get('/api/obtenerInscripciones', (req, res) => {
    const query = `
        SELECT 
            i.id_inscripcion, 
            i.id_usuario, 
            i.id_actividad, 
            a.nombre_actividad, 
            a.descripcion_actividad, 
            a.cupo, 
            a.fecha_actividad, 
            a.ubicacion, 
            a.fecha_creacion, 
            i.id_estadoInscripcion, 
            i.fecha_inscripcion,
            ei.estado_inscripcion 
        FROM inscripcion i
        JOIN actividad a ON i.id_actividad = a.id_actividad
        JOIN estado_inscripcion ei ON i.id_estadoInscripcion = ei.id_estadoInscripcion
        WHERE i.id_estadoInscripcion != 2`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener inscripciones:', err);
            return res.status(500).json({ message: 'Error al obtener inscripciones.' });
        }
        res.json({ success: true, inscripciones: results });
    });
});

// Endpoint para cancelar una inscripción
app.put('/api/cancelarInscripcion/:id', (req, res) => {
    const { id } = req.params;
    const { id_estadoInscripcion, motivoCancelacion } = req.body;
    const fecha_cancelacion = new Date();

    // Primero, obtener el id_usuario, correo del usuario y el nombre de la actividad según la inscripción
    const getUserAndActivityQuery = `
        SELECT u.correo, a.nombre_actividad 
        FROM usuario u 
        JOIN inscripcion i ON u.id_usuario = i.id_usuario 
        JOIN actividad a ON i.id_actividad = a.id_actividad
        WHERE i.id_inscripcion = ?`;

    connection.query(getUserAndActivityQuery, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener los datos del usuario y actividad:', err);
            return res.status(500).json({ message: 'Error al obtener los datos del usuario y actividad.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Inscripción no encontrada.' });
        }

        const correoUsuario = results[0].correo;
        const nombreActividad = results[0].nombre_actividad;

        // Proceder con la cancelación de la inscripción
        const cancelQuery = `
            UPDATE inscripcion 
            SET id_estadoInscripcion = ?, motivoCancelacion = ?, fecha_cancelacion = ? 
            WHERE id_inscripcion = ?`;

        connection.query(cancelQuery, [id_estadoInscripcion, motivoCancelacion, fecha_cancelacion, id], (err, results) => {
            if (err) {
                console.error('Error al cancelar inscripción:', err);
                return res.status(500).json({ message: 'Error al cancelar inscripción.' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Inscripción no encontrada.' });
            }

            // Enviar correo de confirmación al usuario con el nombre de la actividad
            const mailOptions = {
                from: 'sistemaunidadterritorial@gmail.com',
                to: correoUsuario,
                subject: 'Confirmación de Cancelación de Inscripción',
                text: `Tu inscripción en la actividad "${nombreActividad}" ha sido cancelada. Motivo de cancelación: ${motivoCancelacion}. Fecha de cancelación: ${fecha_cancelacion.toLocaleString()}`
            };

            // Enviar correo de confirmación
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo:', error);
                    return res.status(500).json({ message: 'Inscripción cancelada, pero hubo un error al enviar el correo.' });
                }
                res.json({ message: 'Inscripción cancelada exitosamente y correo enviado.' });
            });
        });
    });
});


app.get('/api/historial-inscripciones', (req, res) => {
    const query = `
        SELECT 
            i.id_inscripcion,
            i.id_usuario,
            i.id_actividad,
            a.nombre_actividad,
            a.fecha_actividad,
            a.ubicacion,
            i.fecha_inscripcion,
            i.id_estadoInscripcion,
            i.motivoCancelacion,
            ei.estado_inscripcion
        FROM inscripcion i
        JOIN actividad a ON i.id_actividad = a.id_actividad
        JOIN estado_inscripcion ei ON i.id_estadoInscripcion = ei.id_estadoInscripcion`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener historial de inscripciones:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener historial de inscripciones.' });
        }
        res.json({ success: true, inscripciones: results });
    });
});



// Proteger la pagina segun roles 
// 1	presidente
// 2	directiva
// 3	tesorero
// 4	secretario
// 5	vecino
// 6	Developer

// Gestión usuarios
app.get('/gestion_usuarios.html', checkRole([1, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'gestion_usuarios/gestion_usuarios.html'));
});
// Gestión certificados
app.get('/gestion_certificados.html', checkRole([1, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'certificado/gestion_certificados.html'));
});
// Gestión reservas
app.get('/gestion_reservas.html', checkRole([1, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'reserva/gestion_reservas.html'));
});
// Gestión MIS reservas
app.get('/mis_reservas.html', checkRole([1, 2, 3, 4, 5, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'reserva/mis_reservas.html'));
});
// Gestión MIS inscripciones
app.get('/mis_inscripciones.html', checkRole([1, 2, 3, 4, 5, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'actividad/mis_inscripciones.html'));
});
// Gestión noticias
app.get('/gestion_noticia.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'noticia/gestion_noticia.html'));
});
// Gestión actividades
app.get('/gestion_actividad.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'actividad/gestion_actividad.html'));
});
// Gestión proyectos
app.get('/gestion_proyectos.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'proyecto/gestion_proyectos.html'));
});
// Ver proyectos
app.get('/ver_proyecto.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    const proyectoId = req.query.id;
    res.json({ id: proyectoId, htmlPath: 'proyecto/ver_proyecto.html' });
});
// Gestión inscripciones
app.get('/gestion_inscripciones.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'actividad/gestion_inscripciones.html'));
});
// index directiva
app.get('/index_directiva.html', checkRole([1, 2, 3, 4, 6]), (req, res) => {
    res.sendFile(path.join(__dirname, 'app/index_directiva.html'));
});

