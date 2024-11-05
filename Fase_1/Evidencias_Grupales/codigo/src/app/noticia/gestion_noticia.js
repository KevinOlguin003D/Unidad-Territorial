// Verificación de roles al cargar la página
document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }

        const sessionData = await response.json();
        console.log('Rol del usuario:', sessionData.role);
        const allowedRoles = [1, 2, 4, 6];
        if (!allowedRoles.includes(sessionData.role)) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }
        loadNoticias();

        // Manejar el envío del formulario
        document.getElementById("form-noticia").addEventListener("submit", function(event) {
            event.preventDefault();
            
            // Recoger los datos del formulario
            const formData = new FormData();
            const titulo = document.getElementById("titulo").value;
            const descripcion = document.getElementById("descripcion").value;
            const imagen = document.getElementById("imagen").files[0];
            const id_usuario = getCookie('id_usuario') || sessionStorage.getItem('id_usuario');
            const editor = getCookie('editor') || sessionStorage.getItem('editor');

            formData.append("titulo", titulo);
            formData.append("contenido", descripcion);
            formData.append("imagen", imagen);
            formData.append("id_usuario", id_usuario);
            formData.append("editor", editor);

            // Llamada al endpoint de subida de noticia
            fetch("/api/noticias/subir", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Noticia publicada con éxito");
                    loadNoticias();
                } else {
                    alert("Error al publicar la noticia");
                }
            })
            .catch(error => {
                console.error("Error en la solicitud:", error);
                alert("Ocurrió un error al intentar publicar la noticia");
            });
        });

    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        alert('Acceso denegado');
        window.location.href = '/login/login_component.html';
    }
});

// Función para obtener el valor de una cookie por su nombre
function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

// Función para cargar el historial de noticias
function loadNoticias() {
    fetch('/api/historialNoticias')
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector("#tabla-noticias tbody");
        tbody.innerHTML = "";
        data.forEach(noticia => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${noticia.titulo}</td>
                <td>${noticia.contenido}</td>
                <td>${new Date(noticia.fecha_publicacion).toLocaleDateString()}</td>
                <td>${noticia.editor}</td>
                <td><button onclick="openImage('${noticia.id_imagen}')">Ver Imagen</button></td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => {
        console.error("Error al cargar las noticias:", error);
    });
}

// Función para abrir la imagen en una nueva pestaña
function openImage(id_imagen) {
    window.open(`/api/imagenes/${id_imagen}`, '_blank');
}
