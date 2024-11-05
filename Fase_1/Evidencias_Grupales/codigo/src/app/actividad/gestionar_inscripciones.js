$(document).ready(function() {
    // Función para cargar las inscripciones
    function cargarInscripciones() {
        $.get('/api/obtenerInscripciones', function(data) {
            const tbody = $('#inscripcionesTable tbody');
            tbody.empty();

            // Verificar si se recibieron inscripciones
            if (data.success && data.inscripciones.length > 0) {
                data.inscripciones.forEach(inscripcion => {
                    const row = `
                        <tr>
                            <td>${inscripcion.id_inscripcion}</td>
                            <td>${inscripcion.id_usuario}</td>
                            <td>${inscripcion.id_actividad}</td>
                            <td>${inscripcion.nombre_actividad}</td>
                            <td>${inscripcion.descripcion_actividad}</td>
                            <td>${inscripcion.cupo}</td>
                            <td>${inscripcion.fecha_actividad}</td>
                            <td>${inscripcion.ubicacion}</td>
                            <td>${inscripcion.fecha_creacion}</td>
                            <td>${inscripcion.id_estadoInscripcion}</td>
                            <td>${inscripcion.fecha_inscripcion}</td>
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
});
$.get('/api/historial-inscripciones', function(historialResponse) {
    if (historialResponse.success && historialResponse.inscripciones.length > 0) {
        const historial = historialResponse.inscripciones;
        const $historialTbody = $('#historialInscripcionesTable tbody');

        // Llenar la tabla de historial de inscripciones
        historial.forEach(inscripcion => {
            const row = `<tr>
                <td>${inscripcion.id_inscripcion}</td>
                <td>${inscripcion.id_usuario}</td>
                <td>${inscripcion.id_actividad}</td>
                <td>${inscripcion.nombre_actividad}</td>
                <td>${inscripcion.fecha_actividad}</td>
                <td>${inscripcion.ubicacion}</td>
                <td>${inscripcion.fecha_inscripcion}</td>
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