$(document).ready(function() {
    function formatearFecha(fechaString) {
        const fecha = new Date(fechaString);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
    }

    // Función para cargar las inscripciones
    function cargarInscripciones() {
        $.get('/api/obtenerInscripciones', function(data) {
            const tbody = $('#inscripcionesTable tbody');
            tbody.empty();

            // Verificar si se recibieron inscripciones
            if (data.success && data.inscripciones.length > 0) {
                data.inscripciones.forEach(inscripcion => {
                    const fechaActividadFormateada = formatearFecha(inscripcion.fecha_actividad);
                    const fechaInscripcionFormateada = formatearFecha(inscripcion.fecha_inscripcion);
                    
                    const row = `
                        <tr>
                            <td>${inscripcion.id_inscripcion}</td>
                            <td>${inscripcion.id_usuario}</td>
                            <td>${inscripcion.id_actividad}</td>
                            <td>${inscripcion.nombre_actividad}</td>
                            <td>${inscripcion.descripcion_actividad}</td>
                            <td>${inscripcion.cupo}</td>
                            <td>${fechaActividadFormateada}</td>
                            <td>${inscripcion.ubicacion}</td>
                            <td>${fechaInscripcionFormateada}</td>
                            <td>${inscripcion.id_estadoInscripcion}</td>
                            <td>
                                <button class="cancelarInscripcion" data-id="${inscripcion.id_inscripcion}" ${inscripcion.id_estadoInscripcion === 2 ? 'disabled' : ''}>Cancelar</button>
                            </td>
                        </tr>`;
                    tbody.append(row);
                });

                $('.cancelarInscripcion').click(function() {
                    const idInscripcion = $(this).data('id');
                    $('#modal').show();
                    $('#confirmarCancelacion').off('click').on('click', function() {
                        const motivoCancelacion = $('#motivoCancelacion').val();
                        if (motivoCancelacion.trim() === "") {
                            alert("Por favor, ingresa un motivo para la cancelación.");
                            return;
                        }
                        cancelarInscripcion(idInscripcion, motivoCancelacion);
                    });

                    $('#cancelar').off('click').on('click', function() {
                        $('#modal').hide();
                    });
                });

            } else {
                tbody.append('<tr><td colspan="11">No hay inscripciones para mostrar.</td></tr>');
            }
        }).fail(function() {
            alert('Error al cargar las inscripciones.');
        });
    }

    // Función para cancelar la inscripción
    function cancelarInscripcion(idInscripcion, motivoCancelacion) {
        $.ajax({
            url: `/api/cancelarInscripcion/${idInscripcion}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                id_estadoInscripcion: 2,
                motivoCancelacion: motivoCancelacion
            }),
            success: function(response) {
                alert(response.message);
                $('#modal').hide();
                location.reload();
            },
            error: function(xhr) {
                alert('Error al cancelar la inscripción: ' + (xhr.responseJSON.message || 'Intenta nuevamente.'));
            }
        });
    }

    cargarInscripciones();

    // Cargar historial de inscripciones
    $.get('/api/historial-inscripciones', function(historialResponse) {
        if (historialResponse.success && historialResponse.inscripciones.length > 0) {
            const historial = historialResponse.inscripciones;
            const $historialTbody = $('#historialInscripcionesTable tbody');
            $historialTbody.empty();

            // Llenar la tabla de historial de inscripciones
            historial.forEach(inscripcion => {
                const fechaActividadFormateada = formatearFecha(inscripcion.fecha_actividad);
                const fechaInscripcionFormateada = formatearFecha(inscripcion.fecha_inscripcion);

                const row = `<tr>
                    <td>${inscripcion.id_inscripcion}</td>
                    <td>${inscripcion.id_usuario}</td>
                    <td>${inscripcion.id_actividad}</td>
                    <td>${inscripcion.nombre_actividad}</td>
                    <td>${fechaActividadFormateada}</td>
                    <td>${inscripcion.ubicacion}</td>
                    <td>${fechaInscripcionFormateada}</td>
                    <td>${inscripcion.id_estadoInscripcion}</td>
                    <td>${inscripcion.motivoCancelacion || 'N/A'}</td>
                </tr>`;
                $historialTbody.append(row);
            });
        } else {
            $('#historialInscripcionesTable tbody').append('<tr><td colspan="9">No hay historial de inscripciones.</td></tr>');
        }
    }).fail(function() {
        alert('Error al obtener el historial de inscripciones. Intenta nuevamente.');
    });
});
