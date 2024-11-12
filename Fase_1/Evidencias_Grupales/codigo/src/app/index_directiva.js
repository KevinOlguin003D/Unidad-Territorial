$(document).ready(async function() {
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
});