document.addEventListener('DOMContentLoaded', () => {
    const noticiasContainer = document.getElementById('noticiasContainer');

    // Función para cargar todas las noticias
    const cargarNoticias = () => {
        fetch('/api/noticias')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar las noticias');
                }
                return response.json();
            })
            .then(data => {
                noticiasContainer.innerHTML = '';

                // Verificar que el dato sea un array
                if (!Array.isArray(data)) {
                    throw new Error('El formato de las noticias no es correcto');
                }

                // Crear elementos de noticia y agregarlos al contenedor
                data.forEach(noticia => {
                    const noticiaDiv = document.createElement('div');
                    noticiaDiv.classList.add('noticia');

                    // Crear contenido HTML para la noticia
                    noticiaDiv.innerHTML = `
                        <img src="${noticia.imagen ? noticia.imagen : 'default-image.jpg'}" alt="Imagen de la noticia">
                        <h3>${noticia.titulo}</h3>
                        <p class="limited-text-noticias">${noticia.contenido}</p>
                    `;

                    // Al hacer clic en la noticia, redirigir a la página de detalle
                    noticiaDiv.addEventListener('click', () => {
                        window.location.href = `noticia_detalle.html?id_noticia=${noticia.id_noticia}`;
                    });

                    noticiasContainer.appendChild(noticiaDiv);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar las noticias: ' + error.message);
            });
    };

    // Cargar todas las noticias al iniciar
    cargarNoticias();
});
