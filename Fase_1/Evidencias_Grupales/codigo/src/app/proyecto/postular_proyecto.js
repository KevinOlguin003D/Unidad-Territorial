document.getElementById("postularProyectoForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const presupuesto_estimado = document.getElementById("presupuesto_estimado").value;
    const duracion = document.getElementById("duracion").value;
    const ubicacion = document.getElementById("ubicacion").value;
    const objetivo = document.getElementById("objetivo").value;
    const descripcion = document.getElementById("descripcion").value;
    const imagen = document.getElementById("imagen").files[0];

    // Función para formatear el número como pesos chilenos
    function formatearAPesosChilenos(valor) {
    const numero = parseInt(valor.replace(/\D/g, ''));
    return "$" + numero.toLocaleString("es-CL");
    }
    const presupuestoFormateado = formatearAPesosChilenos(presupuesto_estimado);
    
    const formData = new FormData();
    formData.append("presupuesto_estimado", presupuestoFormateado);
    formData.append("duracion", duracion);
    formData.append("ubicacion", ubicacion);
    formData.append("objetivo", objetivo);
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    if (imagen) {
        formData.append("imagen", imagen);
    }

    fetch("/api/postular_proyecto", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Proyecto postulado con éxito");
            document.getElementById("postularProyectoForm").reset();
        } else {
            alert("Error al postular el proyecto");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Ocurrió un error al enviar el proyecto");
    });
});
