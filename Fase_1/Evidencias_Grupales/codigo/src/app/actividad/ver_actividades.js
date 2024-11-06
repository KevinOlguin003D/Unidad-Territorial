// Función para cargar todas las actividades
function cargarActividades() {
    fetch("/api/actividades")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const contenedorActividades = document.getElementById("actividadContainer");
                contenedorActividades.innerHTML = "";
            
                data.actividades.forEach(actividad => {
                    if (actividad.id_estadoActividad === 1) {
                        const divActividad = document.createElement("div");
                        divActividad.classList.add("actividad");
                        const fechaCreacion = new Date(actividad.fecha_creacion);
                        const opciones = { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                        };
                        const fechaFormateada = fechaCreacion.toLocaleString('es-ES', opciones).replace(',', '');
            
                        divActividad.innerHTML = `
                            <h3 class="titleActividad">${actividad.nombre_actividad}</h3>
                            <p class="limited-text-actividad">${actividad.descripcion_actividad}</p>
                            <p><strong>Cupo:</strong> ${actividad.cupo}</p>
                            <p><strong>Fecha:</strong> ${new Date(actividad.fecha_actividad).toLocaleString()}</p>
                            <p><strong>Ubicación:</strong> ${actividad.ubicacion}</p>
                            <p><strong>Vecino:</strong> ${actividad.nombreUsuario}</p>
                            <p><strong>Fecha de publicación:</strong> ${fechaFormateada}</p>                    
                            <button class="button-actividad" onclick="verDetalles(${actividad.id_actividad})">Ver Detalles</button>
                        `;

                        contenedorActividades.appendChild(divActividad);
                    }
                });
            } else {
                console.error("Error al obtener las actividades:", data.message);
            }
            
            
            
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
        });
}

// Redirige a la página de detalles con el id de la actividad en la URL
function verDetalles(idActividad) {
    window.location.href = `detalles_actividad.html?id_actividad=${idActividad}`;
}

document.addEventListener("DOMContentLoaded", cargarActividades);
