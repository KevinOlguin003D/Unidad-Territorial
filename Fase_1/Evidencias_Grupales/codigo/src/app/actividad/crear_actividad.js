document.addEventListener("DOMContentLoaded", async () => {
    const actividadForm = document.getElementById("actividadForm");
    const responseMessage = document.getElementById("responseMessage");
    const sessionData = await fetch("/api/session").then(res => res.json());
    const id_usuario = sessionData.id_usuario;

    actividadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const nombre_actividad = document.getElementById("nombre_actividad").value;
        const descripcion_actividad = document.getElementById("descripcion_actividad").value;
        const cupo = document.getElementById("cupo").value;
        const fecha_actividad = document.getElementById("fecha_actividad").value;
        const fechaFormateada = new Date(fecha_actividad).toISOString().slice(0, 19).replace("T", " ");

        const ubicacion = document.getElementById("ubicacion").value;

        // Crear el objeto de datos
        const actividadData = {
            nombre_actividad,
            descripcion_actividad,
            cupo,
            fechaFormateada,
            ubicacion,
            id_usuario
        };

        // Definir la URL y método para creación
        const url = "/api/crearActividad";
        const method = "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(actividadData)
            });

            const result = await response.json();

            if (result.success) {
                responseMessage.textContent = "Actividad creada exitosamente.";
                actividadForm.reset();
            } else {
                responseMessage.textContent = "Error al crear la actividad: " + result.message;
            }
        } catch (error) {
            responseMessage.textContent = "Error en la solicitud: " + error.message;
        }
    });
});
