document.addEventListener("DOMContentLoaded", async () => {
    const actividadForm = document.getElementById("actividadForm");
    const responseMessage = document.getElementById("responseMessage");
    const sessionData = await fetch("/api/session").then(res => res.json());
    const id_usuario = sessionData.id_usuario;
    const role = sessionData.role;
    actividadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const id_actividad = document.getElementById("id_actividad").value;
        const nombre_actividad = document.getElementById("nombre_actividad").value;
        const descripcion_actividad = document.getElementById("descripcion_actividad").value;
        const cupo = document.getElementById("cupo").value;
        const fecha_actividad = document.getElementById("fecha_actividad").value;
        const ubicacion = document.getElementById("ubicacion").value;

        // Crear el objeto de datos
        const actividadData = {
            id_actividad: id_actividad || null,
            nombre_actividad,
            descripcion_actividad,
            cupo,
            fecha_actividad,
            ubicacion,
            id_usuario
        };

        // Definir la URL y el método en función de si se está creando o modificando
        const url = id_actividad ? "/api/modificarActividad" : "/api/crearActividad";
        const method = id_actividad ? "PUT" : "POST";

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
                responseMessage.textContent = "Actividad guardada exitosamente.";
                actividadForm.reset();
            } else {
                responseMessage.textContent = "Error al guardar la actividad: " + result.message;
            }
        } catch (error) {
            responseMessage.textContent = "Error en la solicitud: " + error.message;
        }
    });
});
