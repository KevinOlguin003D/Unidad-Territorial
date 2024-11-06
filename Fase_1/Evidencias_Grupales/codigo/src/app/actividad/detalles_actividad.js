// Obtener el id_actividad de la URL
const urlParams = new URLSearchParams(window.location.search);
const idActividad = urlParams.get("id_actividad");

// Cargar detalles de la actividad
function cargarDetallesActividad() {
    fetch(`/api/actividades/${idActividad}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("nombreActividad").textContent = data.actividad.nombre_actividad;
                document.getElementById("descripcionActividad").textContent = data.actividad.descripcion_actividad;
                document.getElementById("cupoActividad").textContent = data.actividad.cupo;
                document.getElementById("fechaActividad").textContent = new Date(data.actividad.fecha_actividad).toLocaleString();
                document.getElementById("ubicacionActividad").textContent = data.actividad.ubicacion;
                document.getElementById("usuario").textContent = data.actividad.nombreUsuario;
                const fechaCreacion = new Date(data.actividad.fecha_creacion);
                const opciones = { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
                };
                const fechaFormateada = fechaCreacion.toLocaleString('es-ES', opciones).replace(',', '');
                document.getElementById("fechaPublicacion").textContent = fechaFormateada;
                
            } else {
                console.error("Error al obtener los detalles de la actividad:", data.message);
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
        });
}

// Manejar la inscripción
$(document).ready(function() {
    $('#inscribirseBtn').on('click', function(event) {
        event.preventDefault();
        
        // Verifica si el usuario está autenticado
        $.get('/api/check-auth', function(response) {
            if (response.authenticated) {
                const idUsuario = response.userId;
                const correo = response.userCorreo;
                // Verifica el cupo disponible
                $.get(`/api/actividades/${idActividad}`, function(response) {
                    if (!response.success) {
                        alert(response.message);
                        return;
                    }
                    
                    const actividad = response.actividad;
                    const cupoDisponible = actividad.cupo;
                    const inscripcionesCountPromise = $.get(`/api/inscripciones/count/actividad/${idActividad}`);
                    const userInscripcionesCountPromise = $.get(`/api/inscripciones/count/${idUsuario}/${idActividad}`);

                    Promise.all([inscripcionesCountPromise, userInscripcionesCountPromise])
                        .then(([inscripcionesCountResponse, countResponse]) => {
                            const totalInscripciones = inscripcionesCountResponse.count;

                            // Verifica si el usuario ya está inscrito
                            if (countResponse.count > 0) {
                                alert('Ya estás inscrito en esta actividad.');
                                return;
                            }

                            // Luego verifica si hay suficiente cupo
                            if (totalInscripciones >= cupoDisponible) {
                                alert('No hay cupo disponible para esta actividad.');
                                return;
                            }

                            // Si el usuario no está inscrito y hay cupo disponible se puede inscribir
                            $.ajax({
                                url: '/api/inscribir',
                                method: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify({
                                    id_usuario: idUsuario,
                                    id_actividad: idActividad,
                                    correo: correo
                                }),
                                success: function(inscripcionResponse) {
                                    alert('Inscripción realizada con éxito.');
                                },
                                error: function(error) {
                                    console.error('Error al inscribirse:', error);
                                    alert('Error al inscribirse: ' + error.responseJSON.message);
                                }
                            });
                        })
                        .catch(function(error) {
                            console.error('Error al obtener inscripciones:', error);
                            alert('Error al verificar inscripciones. Intenta nuevamente.');
                        });
                }).fail(function() {
                    alert('Error al obtener información de la actividad. Intenta nuevamente.');
                });
            } else {
                window.location.href = '/login/login_component.html';
            }
        }).fail(function() {
            alert('Error al verificar la autenticación. Intenta nuevamente.');
        });
    });
});

document.addEventListener("DOMContentLoaded", cargarDetallesActividad);
