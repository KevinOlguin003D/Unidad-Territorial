document.addEventListener("DOMContentLoaded", async function() {
    cargarCertificados();
    // Verifica el rol del usuario al cargar la página
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }

        const sessionData = await response.json();
        const allowedRoles = [1, 4, 6];
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
                        <td>${certificado.id_certificado}</td>
                        <td>${certificado.rut}</td>
                        <td>${certificado.nombre}</td>
                        <td>${certificado.domicilio}</td>
                        <td>${certificado.motivo}</td>
                        <td>${new Date(certificado.fecha).toLocaleDateString('es-ES')}</td>
                        <td>${new Date(certificado.fecha).toLocaleTimeString('es-ES')}</td>
                        <td><button onclick="descargarCertificado(${certificado.id_certificado}, '${certificado.rut}', '${certificado.fecha}')">Descargar</button></td>
                    `;
                    tbody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
});

// Función para manejar la descarga del certificado
function descargarCertificado(id, rut, fecha) {
    fetch(`/api/obtenerCertificado/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener el certificado');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES').replace(/\//g, '');
            const rutFormateado = rut.replace(/\./g, '').replace(/-/g, '');
            const filename = `certificado_residencia_${rutFormateado}${fechaFormateada}.pdf`;
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error en la descarga:', error);
        });
}
