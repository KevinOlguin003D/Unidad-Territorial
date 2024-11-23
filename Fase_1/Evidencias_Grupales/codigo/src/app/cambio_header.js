document.addEventListener('DOMContentLoaded', async () => {
    await agregarEnlacesAlMenu();
    agregarFooter();
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
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../index.html">INICIO</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../noticia/noticia.html">NOTICIAS</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../actividad/ver_actividades.html">ACTIVIDADES</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../reserva/home_reserva.html">RESERVAS</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../certificado/solicitar_certificado.html">CERTIFICADOS</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../miembros/miembros.html">MIEMBROS</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../proyecto/home_proyecto.html">PROYECTOS</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../registro/registro_component.html">REGISTRARSE</a>
        <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../ayuda/ayuda.html">AYUDA</a>

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
                    <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../index_directiva.html">GESTIÓN DE RECURSOS</a>
                `;
            }
            
        }
    } catch (error) {
        console.error('Error al verificar la autenticación:', error);
    }
    // Agregar botón "perfil" en el header
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        console.log('Respuesta de la API:', data);

        if (data.authenticated) {
            const userRole = data.userRole;
            console.log('rol: ' + userRole);
            if ([1, 2, 3, 4, 5, 6].includes(Number(userRole))) {
                navContainer.innerHTML += `
                    <a class="text-green-500 px-4 py-2 rounded hover:bg-gray-200" href="../profile/perfil_usuario.html">PERFIL</a>
                `;
            }
            
        }
    } catch (error) {
        console.error('Error al verificar la autenticación:', error);
    }
}
// Función para agregar el footer a la página
function agregarFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div class="footer-container">
            <p>&copy; 2024 Sistema Unidad Territorial. Todos los derechos reservados.</p>
            <ul>
                <li><a href="#">Política de Privacidad</a></li>
                <li><a href="#">Términos de Servicio</a></li>
                <li><a href="#">Contacto</a></li>
            </ul>
        </div>
    `;
    
    // Añadir el footer al final del body
    document.body.appendChild(footer);
}
