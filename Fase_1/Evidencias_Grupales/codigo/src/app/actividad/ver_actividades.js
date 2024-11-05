// Función para cargar todas las actividades
function cargarActividades() {
    fetch("/api/actividades")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const listaActividades = document.getElementById("listaActividades");
                listaActividades.innerHTML = "";

                data.actividades.forEach(actividad => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <h3>${actividad.nombre_actividad}</h3>
                        <p>${actividad.descripcion_actividad}</p>
                        <p><strong>Cupo:</strong> ${actividad.cupo}</p>
                        <p><strong>Fecha:</strong> ${new Date(actividad.fecha_actividad).toLocaleString()}</p>
                        <p><strong>Ubicación:</strong> ${actividad.ubicacion}</p>
                        <button onclick="verDetalles(${actividad.id_actividad})">Ver Detalles</button>
                    `;
                    listaActividades.appendChild(li);
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

// Llamada inicial para cargar las actividades al cargar la página
document.addEventListener("DOMContentLoaded", cargarActividades);
