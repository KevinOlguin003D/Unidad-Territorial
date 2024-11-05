$(document).ready(function() {
    // Obtiene el ID del usuario de la sesión
    $.get('/api/session', function(sessionData) {
        const idUsuario = sessionData.id_usuario;
        const correo = sessionData.correo;
        // Obtiene las inscripciones del usuario
        $.get(`/api/inscripciones/${idUsuario}`, function(inscripcionesResponse) {
            console.log(inscripcionesResponse);
            if (inscripcionesResponse.success && inscripcionesResponse.inscripciones.length > 0) {
                const inscripciones = inscripcionesResponse.inscripciones;
                const $tbody = $('#inscripcionesTable tbody');

                // Llenar la tabla con los detalles de las actividades
                inscripciones.forEach(inscripcion => {
                    // Verifica el estado de la inscripción para habilitar o deshabilitar el botón
                    const botonCancelar = inscripcion.id_estadoInscripcion === 1 
                        ? `<button class="cancelarBtn" data-id-inscripcion="${inscripcion.id_inscripcion}">Cancelar</button>` 
                        : `<button class="cancelarBtn" data-id-inscripcion="${inscripcion.id_inscripcion}" disabled>Cancelado</button>`;

                    const row = `<tr>
                        <td>${inscripcion.id_actividad}</td>
                        <td>${inscripcion.nombre_actividad}</td>
                        <td>${inscripcion.descripcion_actividad}</td>
                        <td>${inscripcion.cupo}</td>
                        <td>${inscripcion.fecha_actividad}</td>
                        <td>${inscripcion.ubicacion}</td>
                        <td>${inscripcion.fecha_inscripcion}</td>
                        <td>${botonCancelar}</td> <!-- Botón de cancelar -->
                    </tr>`;
                    $tbody.append(row);
                });

                // Agregar evento a los botones de cancelar solo si están habilitados
                $('.cancelarBtn:not([disabled])').on('click', function() {
                    const idInscripcion = $(this).data('id-inscripcion');
                    const correo = sessionData.correo;
                    if (confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
                        // Realizar la solicitud para cancelar la inscripción
                        $.ajax({
                            url: `/api/cancelar-inscripcion/${idInscripcion}`,
                            method: 'PUT',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                correo: correo
                            }),
                            success: function(response) {
                                if (response.success) {
                                    alert('Inscripción cancelada con éxito.');
                                    location.reload();
                                } else {
                                    alert('Error al cancelar la inscripción: ' + response.message);
                                }
                            },
                            error: function() {
                                alert('Error al cancelar la inscripción. Intenta nuevamente.');
                            }
                        });
                    }
                });
            } else {
                $('#inscripcionesTable tbody').append('<tr><td colspan="8">No tienes inscripciones.</td></tr>');
            }
        }).fail(function() {
            alert('Error al obtener las inscripciones. Intenta nuevamente.');
        });
    }).fail(function() {
        alert('Error al obtener los datos de la sesión. Intenta nuevamente.');
    });
});
