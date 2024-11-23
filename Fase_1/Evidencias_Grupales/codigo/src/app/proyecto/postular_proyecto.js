document.addEventListener("DOMContentLoaded", function() {
document.getElementById("postularProyectoForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    // Verifica el rol del usuario al cargar la página
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }

        const sessionData = await response.json();
        const allowedRoles = [1, 2, 3, 4, 6]; // Roles permitidos
        if (!allowedRoles.includes(sessionData.role)) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        alert('Acceso denegado');
        window.location.href = '/login/login_component.html';
        return;
    }


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
});