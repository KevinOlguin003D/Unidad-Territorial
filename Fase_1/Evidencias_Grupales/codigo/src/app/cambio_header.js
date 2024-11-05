document.addEventListener('DOMContentLoaded', async () => {
    await agregarEnlacesAlMenu();
});

// Función para agregar enlaces al menú según el rol del usuario
async function agregarEnlacesAlMenu() {
    const navContainer = document.getElementById('nav-menu');

    // Verificar si el elemento existe
    if (!navContainer) {
        console.error('El elemento nav-menu no se encontró.');
        return;
    }

    // Limpiar enlaces existentes
    navContainer.innerHTML = '';

    // Enlaces comunes para todos los usuarios (no logueados)
    navContainer.innerHTML += `
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../index.html">Inicio</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../reserva/home_reserva.html">Reservas</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../noticia/noticia.html">Noticias</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../certificado/solicitar_certificado.html">Certificados</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="">Miembros</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../profile/perfil_usuario.html">Perfil</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../actividad/ver_actividades.html">Actividades</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="">Ayuda</a>
    `;

    // Verificar autenticación del usuario
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        console.log('Respuesta de la API:', data);

        if (data.authenticated) {
            const userRole = data.userRole;
            console.log('rol: ' + userRole);
            if ([1, 2, 3, 4, 6].includes(Number(userRole))) {
                navContainer.innerHTML += `
                    <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../index_directiva.html">Gestión de recursos</a>
                `;
            }
            
        }
    } catch (error) {
        console.error('Error al verificar la autenticación:', error);
    }
}
