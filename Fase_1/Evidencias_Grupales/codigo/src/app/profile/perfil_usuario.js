document.addEventListener('DOMContentLoaded', () => {
    // Obtener información de la sesión
    fetch('/api/session') 
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la sesión');
            }
            return response.json();
        })
        .then(data => {
            // Mostrar información del usuario
            const fullName = `${data.primer_nombre} ${data.segundo_nombre || ''} ${data.apellido_paterno} ${data.apellido_materno || ''}`;
            document.getElementById('fullName').textContent = fullName;
            document.getElementById('role').textContent = data.role;
            document.getElementById('address').textContent = data.direccion;
            document.getElementById('email').textContent = data.correo;
            document.getElementById('phone').textContent = data.telefono;
            document.getElementById('rut').textContent = data.rut;
            // Formatear la fecha de nacimiento a dd-mm-yyyy
            const fechaNacimientoRaw = data.fecha_nacimiento;
            const fechaNacimiento = new Date(fechaNacimientoRaw);
            const dia = String(fechaNacimiento.getDate()).padStart(2, '0');
            const mes = String(fechaNacimiento.getMonth() + 1).padStart(2, '0');
            const anio = fechaNacimiento.getFullYear();
            const fechaFormateada = `${dia}-${mes}-${anio}`;
            document.getElementById('fecha_nacimiento').textContent = fechaFormateada;
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/login/login_component.html';
        });

    // Manejar el evento de cierre de sesión
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        fetch('/logout', {
            method: 'POST',
            credentials: 'include' 
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/login/login_component.html'; 
            } else {
                console.error('Error al cerrar sesión');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
