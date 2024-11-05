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
                    const fechaReserva = reserva.fecha_reserva;
                    const horaInicio = reserva.hora_inicio;



                    // Verificar si la fecha de reserva es válida
                    const fechaReservaDate = new Date(fechaReserva);
                    if (isNaN(fechaReservaDate)) {
                        console.error('Error: fechaReserva no es válida:', fechaReserva);
                        return; // Termina la iteración si la fecha no es válida
                    }

                    // Crear un objeto Date combinando fecha y hora
                    const combinedDateTimeString = `${fechaReserva.split('T')[0]}T${horaInicio}`; // Formato YYYY-MM-DDTHH:mm:ss
                    

                    const horaInicioDate = new Date(combinedDateTimeString);
                    if (isNaN(horaInicioDate)) {
                        console.error('Error al crear horaInicioDate con el string:', combinedDateTimeString);
                        return; // Termina la iteración si la fecha no es válida
                    }

                    // Ajustar a la zona horaria de Chile
                    const options = { timeZone: 'America/Santiago' };
                    const localHoraInicioDate = new Date(horaInicioDate.toLocaleString('en-US', options));
                    

                    // Calcular la hora límite para cancelar
                    const limiteCancelacion = new Date(localHoraInicioDate.getTime() - (60 * 60 * 1000)); // 1 hora antes de hora_inicio
                    

                    // Obtener la fecha y hora actual en Chile
                    const currentDate = new Date();
                    const currentDateTime = new Date(currentDate.toLocaleString('en-US', options));
                    

                    // Comparar las fechas
                    const sePuedeCancelar = currentDateTime < limiteCancelacion && reserva.id_estado_reserva !== 2;
                    
                    tbody.append(`
                        <tr>
                            <td>${reserva.id_reserva || 'N/A'}</td>
                            <td>${fechaReservaDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td>${reserva.descripcion_recurso || 'N/A'}</td>
                            <td>${reserva.id_usuario}</td>
                            <td>${horaInicio}</td>
                            <td>${reserva.hora_fin}</td>
                            <td>${reserva.desc_motivo || 'N/A'}</td>
                            <td>${new Date(reserva.fecha_creacion).toLocaleString()}</td>
                            <td>${reserva.id_estado_reserva}</td>
                            <td>
                                <button class="cancelarReserva" 
                                    data-id="${reserva.id_reserva}" 
                                    data-id-recurso="${reserva.id_recurso}" 
                                    data-fecha="${fechaReserva}" 
                                    ${sePuedeCancelar ? '' : 'disabled'}>
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
        const motivoCancelacion = 'Cancelada por el usuario'
        // Mostrar una ventana de confirmación
        if (confirm("¿Estás seguro de que deseas cancelar la reserva?")) {
            $.ajax({
                url: `/api/cancelarReserva/${idReserva}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    id_estado_reserva: 2, motivoCancelacion // Cambiar el estado a "cancelado"
                }),
                success: function(response) {
                    console.log('Reserva cancelada:', response);
                    alert('Reserva cancelada exitosamente.');
                    cargarReservas();
                },
                error: function(error) {
                    console.error('Error al cancelar la reserva:', error);
                    alert('Error al cancelar la reserva: ' + (error.responseJSON ? error.responseJSON.error : 'Error desconocido'));
                }
            });
        } else {
            console.log('Cancelación de reserva cancelada por el usuario.');
        }
    }
    
    // Cargar las reservas al iniciar la página
    cargarReservas();
});
