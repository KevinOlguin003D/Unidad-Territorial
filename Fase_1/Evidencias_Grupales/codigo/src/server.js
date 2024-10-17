const express = require('express');
const connection = require('./db_connection');
const path = require('path');
const app = express();
const port = 3000;
const PDFDocument = require('pdfkit');

app.use(express.static(path.join(__dirname, 'app')));
app.use(express.json());

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
    const { fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo } = req.body;
    console.log('Datos recibidos para la reserva:', req.body);

    const query = `
        INSERT INTO reserva (fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo, fecha_creacion) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    connection.query(query, [fecha_reserva, id_recurso, id_usuario, hora_inicio, hora_fin, id_motivo], (error, results) => {
        if (error) {
            console.error('Error al realizar la reserva:', error);
            return res.status(500).json({ error: 'Error al realizar la reserva: ' + error.message });
        }
        res.json({ message: 'Reserva realizada correctamente', id_reserva: results.insertId });
    });
});




// Endpoint para obtener horarios reservados
app.get('/api/horariosReservados/:idRecurso/:fecha', (req, res) => {
    const { idRecurso, fecha } = req.params;

    const query = `
        SELECT hora_inicio, hora_fin FROM reserva
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
    const query = 'SELECT * FROM reservas WHERE id_recurso = ?';
    
    db.query(query, [idRecurso], (err, results) => {
        if (err) {
            console.error('Error al obtener las reservas:', err);
            return res.status(500).json({ error: 'Error al obtener las reservas' });
        }
        res.json(results);
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
        SELECT r.id_reserva, r.fecha_reserva, rc.descripcion_recurso, r.id_usuario, r.hora_inicio, r.hora_fin, m.desc_motivo, r.fecha_creacion
        FROM reserva r
        JOIN motivo m ON r.id_motivo = m.id_motivo
        JOIN recurso rc ON r.id_recurso = rc.id_recurso;


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
    const { rut, primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno, correo, telefono, direccion, password } = req.body;

    // Validar los campos requeridos 
    if (!rut || !primerNombre || !apellidoPaterno || !apellidoMaterno || !correo || !telefono || !direccion || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos, excepto el segundo nombre.' });
    }

    // Verificar si ya existe un usuario con el mismo rut, correo o telefono
    const query = `
        SELECT * FROM usuario 
        WHERE rut = ? OR correo = ? OR telefono = ?
    `;

    const values = [rut, correo, telefono];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error ejecutando la consulta SQL:', error);
            return res.status(500).json({ message: "Error en la consulta a la base de datos." });
        }

        if (results.length > 0) {
            const existingAttributes = [];
            if (results.some(user => user.rut === rut)) existingAttributes.push("RUT");
            if (results.some(user => user.correo === correo)) existingAttributes.push("correo");
            if (results.some(user => user.telefono === telefono)) existingAttributes.push("teléfono");

            return res.status(400).json({
                message: `El ${existingAttributes.join(", ")} ya está asociado a una cuenta.`
            });
        }

        const id_estadousuario = 1;
        const id_rol = 5; // rol por defecto
        const insertQuery = `INSERT INTO usuario (rut, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, correo, telefono, direccion, password, id_rol, id_estadousuario) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(insertQuery, [rut, primerNombre, segundoNombre || '', apellidoPaterno, apellidoMaterno, correo, telefono, direccion, password, id_rol, id_estadousuario], (err, result) => {
            if (err) {
                console.error('Error ejecutando la consulta SQL:', err);
                return res.status(500).json({ message: 'Error al registrar el usuario' });
            }

            res.status(201).json({ message: 'Registro exitoso' }); 
        });
    });
});



// Endpoint para iniciar sesión
app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    const query = 'SELECT * FROM usuario WHERE correo = ? AND password = ?';
    
    connection.query(query, [correo, password], (err, results) => {
      if (err) {
        console.error('Error al ejecutar la consulta', err);
        return res.status(500).send('Error del servidor');
      }
      
      if (results.length > 0) {
        res.status(200).json({ message: 'Inicio de sesión exitoso' });
      } else {
        res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }
    });
  });

// Endpoint para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
    const sql = `
        SELECT u.rut, u.primer_nombre, u.segundo_nombre, u.apellido_paterno, u.apellido_materno, 
               u.correo, u.telefono, u.id_rol, u.id_estadousuario,
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

app.get('/gestion_usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'gestion_usuarios', 'gestion_usuarios.html'));
});

// Endpoint para generar el certificado
app.post('/api/generarCertificado', (req, res) => {
    const { rut, nombre, domicilio, motivo } = req.body;

    // Crear un nuevo documento PDF
    const doc = new PDFDocument();
    
    // Establecer los headers para descargar el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificado_residencia.pdf');

    // Rellenar el documento con la información del usuario
    doc.fontSize(12).text(`Certificado de Residencia`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Yo, ${nombre}, con RUT ${rut}, declaro que resido en el domicilio ubicado en ${domicilio}.`);
    doc.moveDown();
    doc.text(`Motivo de la solicitud: ${motivo}.`);
    doc.moveDown(2);
    doc.text(`Emitido el día ${new Date().toLocaleDateString()}.`);
    
    // Finaliza el documento y lo envía
    doc.end();
    doc.pipe(res); // Enviar el PDF generado como respuesta
});


app.get('/solicitar_certificado', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'solicitar_certificado.html'));
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
