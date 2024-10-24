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
        const allowedRoles = [1, 2, 3, 4, 5, 6]; // Roles permitidos
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
        // Obtener la información de la sesión activa
        $.get('/api/session', function(sessionData) {
            const idUsuario = sessionData.id_usuario; 
            console.log(sessionData); 

            if (!idUsuario) {
                alert('Error: No se pudo obtener el id de usuario.');
                return;
            }

            // Llamada al endpoint para obtener las reservas del usuario
            $.get(`/api/obtenerReservasUsuario/${idUsuario}`, function(reservas) {
                const tbody = $('#reservasTable tbody');
                tbody.empty();

                if (reservas.length === 0) {
                    tbody.append(`<tr><td colspan="10">No se encontraron reservas.</td></tr>`);
                }

                // Recorrer las reservas y añadir filas a la tabla
                reservas.forEach(reserva => {
                    const fechaReserva = new Date(reserva.fecha_reserva).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const fechaCreacion = new Date(reserva.fecha_creacion).toLocaleString();

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
                            <td>${reserva.id_estado_reserva}</td>
                            <td>
                                <button class="cancelarReserva" 
                                    data-id="${reserva.id_reserva}" 
                                    data-id-recurso="${reserva.id_recurso}" 
                                    data-fecha="${reserva.fecha_reserva}">
                                    Cancelar
                                </button>
                            </td>
                        </tr>
                    `);
                });

                $('.cancelarReserva').click(function() {
                    const idReserva = $(this).data('id');
                    const idRecurso = $(this).data('id-recurso'); 
                    const fecha = $(this).data('fecha'); 

                    // Formatear la fecha en el formato YYYY-MM-DD
                    const formattedDate = new Date(fecha).toISOString().split('T')[0];

                    console.log('idReserva:', idReserva);
                    console.log('idRecurso:', idRecurso);
                    console.log('fecha:', formattedDate); 

                    cancelarReserva(idReserva, idRecurso, formattedDate); 
                });

            }).fail(function() {
                alert('Error al cargar las reservas.');
            });
        }).fail(function() {
            alert('Error al obtener la información de sesión.');
        });
    }

    

    function cancelarReserva(idReserva) {
        $.ajax({
            url: `/api/cancelarReserva/${idReserva}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                id_estado_reserva: 2 // Cambiar el estado a "cancelado"
            }),
            success: function(response) {
                console.log('Reserva cancelada:', response);

                
            },
            error: function(error) {
                console.error('Error al cancelar la reserva:', error);
                alert('Error al cancelar la reserva: ' + (error.responseJSON ? error.responseJSON.error : 'Error desconocido'));
            }
        });
    }

    // Cargar las reservas al iniciar la página
    cargarReservas();
});
