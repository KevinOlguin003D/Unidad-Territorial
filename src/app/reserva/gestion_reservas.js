$(document).ready(function() {
    // Función para cargar las reservas
    function cargarReservas() {
        $.get('/api/obtenerReservas', function(data) {
            console.log(data); 
            const tbody = $('#reservasTable tbody');
            tbody.empty();

            // Función para formatear la fecha
            function formatearFecha(fecha) {
                const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
                const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                
                const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', opcionesFecha);
                const horaFormateada = new Date(fecha).toLocaleTimeString('es-ES', opcionesHora);
                
                return `${fechaFormateada} a las ${horaFormateada}`;
            }

            // Recorrer los datos y añadir filas a la tabla
            data.forEach(reserva => {
                const fechaReserva = new Date(reserva.fecha_reserva).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const fechaCreacion = formatearFecha(reserva.fecha_creacion);

                tbody.append(`
                    <tr>
                        <td>${reserva.id_reserva || 'N/A'}</td>
                        <td>${fechaReserva}</td>
                        <td>${reserva.descripcion_recurso || 'N/A'}</td>
                        <td>${reserva.id_usuario}</td>
                        <td>${reserva.hora_inicio}</td>
                        <td>${reserva.hora_fin}</td>
                        <td>${reserva.desc_motivo || 'N/A'}</td>
                        <td>${fechaCreacion}</td>
                        <td><button class="cancelarReserva" data-id="${reserva.id_reserva}">Cancelar</button></td> <!-- Botón de cancelar -->
                    </tr>
                `);
            });

            $('.cancelarReserva').click(function() {
                const idReserva = $(this).data('id');
                cancelarReserva(idReserva);
            });
        }).fail(function() {
            alert('Error al cargar las reservas.');
        });
    }

    // Cargar las reservas al iniciar la página
    cargarReservas();
});
