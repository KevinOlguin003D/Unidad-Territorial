$(document).ready(async function() {
    // Verifica el rol del usuario al cargar la página
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }

        const sessionData = await response.json();
        const allowedRoles = [1, 4, 6]; // Roles permitidos
        if (!allowedRoles.includes(sessionData.role)) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        alert('Acceso denegado');
        window.location.href = '/login/login_component.html';
        return;
    }

    // Función para cargar las reservas
    function cargarReservas() {
        $.get('/api/obtenerReservas', function(data) {
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

            // Obtener la fecha y hora actual en Chile
            const options = { timeZone: 'America/Santiago' };
            const currentDateTime = new Date(new Date().toLocaleString('en-US', options));

            data.forEach(reserva => {
                const fechaReserva = new Date(reserva.fecha_reserva);
                const horaInicio = new Date(`${fechaReserva.toISOString().split('T')[0]}T${reserva.hora_inicio}`);
                const fechaCreacion = formatearFecha(reserva.fecha_creacion);

                // Calcular la hora límite para cancelar
                const limiteCancelacion = new Date(horaInicio.getTime() - (60 * 60 * 1000)); // 1 hora antes de hora_inicio

                // Verificar si se puede cancelar
                const sePuedeCancelar = currentDateTime < limiteCancelacion && reserva.id_estado_reserva !== 2;

                tbody.append(`
                    <tr>
                        <td>${reserva.id_reserva || 'N/A'}</td>
                        <td>${fechaReserva.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>${reserva.descripcion_recurso || 'N/A'}</td>
                        <td>${reserva.id_usuario}</td>
                        <td>${reserva.hora_inicio}</td>
                        <td>${reserva.hora_fin}</td>
                        <td>${reserva.desc_motivo || 'N/A'}</td>
                        <td>${fechaCreacion}</td>
                        <td>${reserva.desc_estado_reserva}</td>
                        <td>
                            <button class="cancelarReserva" data-id="${reserva.id_reserva}" ${sePuedeCancelar ? '' : 'disabled'}>Cancelar</button>
                        </td>
                    </tr>
                `);
            });

            $('.cancelarReserva').click(function() {
                const idReserva = $(this).data('id');
                $('#modal').show();
                $('#confirmarCancelacion').off('click').on('click', function() {
                    const motivoCancelacion = $('#motivoCancelacion').val();
                    cancelarReserva(idReserva, motivoCancelacion);
                });
                $('#cancelar').off('click').on('click', function() {
                    $('#modal').hide();
                });
            });
        }).fail(function() {
            alert('Error al cargar las reservas.');
        });
    }

    // Función para cancelar la reserva
    function cancelarReserva(idReserva, motivoCancelacion) {
        const confirmacion = confirm('¿Estás seguro que deseas cancelar esta reserva?');
        if (confirmacion) {
            $.ajax({
                url: `/api/cancelarReserva/${idReserva}`, 
                type: 'PUT', 
                data: JSON.stringify({ id_estado_reserva: 2, motivoCancelacion }), 
                contentType: 'application/json', 
                success: function(response) {
                    alert('Reserva cancelada exitosamente.');
                    $('#modal').hide();
                    cargarReservas();
                },
                error: function() {
                    alert('Error al cancelar la reserva.');
                }
            });
        } else {
            console.log('Cancelación de reserva cancelada por el usuario.');
        }
    }

    // Cargar las reservas al iniciar la página
    cargarReservas();
});
