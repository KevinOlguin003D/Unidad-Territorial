document.addEventListener("DOMContentLoaded", async () => {
    const actividadForm = document.getElementById("actividadForm");
    const responseMessage = document.getElementById("responseMessage");
    const sessionData = await fetch("/api/session").then(res => res.json());
    const id_usuario = sessionData.id_usuario;
    const fechaFormateadaInput = document.getElementById("fecha_actividad");
    if (fechaFormateadaInput) {
        const fechaActual = new Date();
        const fechaFormateadaInputValue = fechaActual.toISOString().slice(0, 16);
        fechaFormateadaInput.setAttribute("min", fechaFormateadaInputValue);
    }
    actividadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const nombre_actividad = document.getElementById("nombre_actividad").value;
        const descripcion_actividad = document.getElementById("descripcion_actividad").value;
        const cupo = document.getElementById("cupo").value;
        const fecha_actividad = document.getElementById("fecha_actividad").value;
        const ubicacion = document.getElementById("ubicacion").value;

        // Convertir fecha a formato MySQL
        const fechaFormateada = new Date(fecha_actividad).toLocaleString('en-CA', {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '').replace(/\/|\s/g, '-');


        // Crear el objeto de datos
        const actividadData = {
            nombre_actividad,
            descripcion_actividad,
            cupo,
            fecha_actividad: fechaFormateada,
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
