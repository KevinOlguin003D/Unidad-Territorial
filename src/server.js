const express = require('express');
const connection = require('./db_connection');
const path = require('path');
const app = express();
const port = 3000;


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


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
