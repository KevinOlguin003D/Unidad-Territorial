document.getElementById('certificadoForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = {
        rut: document.getElementById('rut').value,
        nombre: document.getElementById('nombre').value,
        domicilio: document.getElementById('domicilio').value,
        motivo: document.getElementById('motivo').value
    };

    // Enviar datos al servidor
    fetch('/api/generarCertificado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        // Verifica si la respuesta es correcta
        if (!response.ok) {
            throw new Error('Error al generar el certificado: ' + response.statusText);
        }
        return response.blob();
    })
    .then(blob => {
        // Crear un enlace para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificado_residencia.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => {
        document.getElementById('mensaje').innerText = 'Error al generar el certificado: ' + error.message;
        console.error('Error:', error);
    });
});
