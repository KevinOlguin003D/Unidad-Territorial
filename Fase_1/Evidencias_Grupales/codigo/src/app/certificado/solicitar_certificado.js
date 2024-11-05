document.addEventListener("DOMContentLoaded", function () {
    const certificadoForm = document.getElementById("certificadoForm");
    const successLabel = document.getElementById("successLabel");

    certificadoForm.addEventListener("submit", function (event) {
        event.preventDefault(); 

        // Obtén los valores de los campos del formulario
        const rut = document.getElementById("rut").value.trim();
        const nombre = document.getElementById("nombre").value.trim();
        const domicilio = document.getElementById("domicilio").value.trim();
        const motivo = document.getElementById("motivo").value.trim();
        const correo = document.getElementById("correo").value.trim();

        // Validación simple de los campos (correo es opcional)
        if (!rut || !nombre || !domicilio || !motivo) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }
        const data = {
            rut,
            nombre,
            domicilio,
            motivo,
            ...(correo && { correo })
        };

        // Realiza la solicitud al servidor
        fetch('/api/generarCertificado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            // Si se proporciona un correo, no se descarga el archivo
            if (!correo) {
                return response.blob(); 
            } else {
                return response.json(); 
            }
        })
        .then(blobOrData => {
            if (blobOrData instanceof Blob) {
                // Solo crear enlace y descargar
                const url = window.URL.createObjectURL(blobOrData);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'certificado.pdf'; 
                document.body.appendChild(a);
                a.click(); 
                a.remove(); 
                window.URL.revokeObjectURL(url); 
            } else {
                // Si se envió el correo, muestra el mensaje
                successLabel.style.display = "block";
                successLabel.textContent = "Certificado enviado por correo con éxito.";
            }
            certificadoForm.reset(); 
        })
        .catch(error => {
            successLabel.style.display = "none";
            alert("Ocurrió un error al solicitar el certificado. Intenta nuevamente.");
        });
    });
});
