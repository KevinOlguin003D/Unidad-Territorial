document.addEventListener('DOMContentLoaded', () => {
    // Obtener información de la sesión
    fetch('/api/session') // Asegúrate de tener un endpoint que devuelva los datos de la sesión
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la sesión');
            }
            return response.json();
        })
        .then(data => {
            // Mostrar información del usuario
            const userInfoDiv = document.getElementById('user-info');
            userInfoDiv.innerHTML = `
                <p>Correo: ${data.correo}</p>
                <p>Rol: ${data.role}</p>
            `;

            // Mostrar información de la sesión
            const sessionInfoDiv = document.getElementById('session-info');
            sessionInfoDiv.innerHTML = `
                <p>Visitas a la página: ${data.visits}</p>
                <p>Último inicio de sesión: ${new Date(data.lastLogin).toLocaleString()}</p>
                <p>Token/Cookie de sesión: ${document.cookie}</p> <!-- Muestra las cookies -->
            `;
        })
        .catch(error => {
            console.error('Error:', error);
            // Manejo de error, como redirigir a la página de login
            window.location.href = '/login';
        });

    // Manejar el evento de cierre de sesión
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        fetch('/logout', {
            method: 'POST',
            credentials: 'include' // Asegúrate de incluir las cookies de sesión
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '../login/login_component.html'; // Redirige al login después de cerrar sesión
            } else {
                console.error('Error al cerrar sesión');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
