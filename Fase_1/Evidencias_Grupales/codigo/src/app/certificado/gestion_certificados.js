document.addEventListener("DOMContentLoaded", async function() {
    cargarCertificados();
    // Verifica el rol del usuario al cargar la página
    function cargarCertificados() {
        fetch('/api/obtenerCertificados') 
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener certificados');
                }
                return response.json();
            })
            .then(data => {
                const tbody = document.querySelector('#certificadosTable tbody');
                tbody.innerHTML = ''; 

                data.forEach(certificado => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${certificado.rut}</td>
                        <td>${certificado.nombre}</td>
                        <td>${certificado.domicilio}</td>
                        <td>${certificado.motivo}</td>
                        <td>${new Date(certificado.fecha).toLocaleDateString('es-ES')}</td>
                        <td>${new Date(certificado.fecha).toLocaleTimeString('es-ES')}</td>
                    `;
                    tbody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
});
