document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id_noticia = params.get('id_noticia');

    if (!id_noticia) {
        alert('No se ha proporcionado un ID de noticia.');
        window.location.href = 'noticia.html';
        return;
    }

    const tituloElement = document.getElementById('titulo');
    const contenidoElement = document.getElementById('contenido');
    const editorElement = document.getElementById('editor');
    const fechaElement = document.getElementById('fecha');
    const imagenElement = document.getElementById('imagen');

    // Función para cargar los detalles de la noticia
    const cargarDetalleNoticia = (id_noticia) => {
        fetch(`/api/noticias/${id_noticia}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar la noticia');
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.titulo) {
                    alert('No se encontró la noticia con ese ID.');
                    return;
                }

                // Actualizar el contenido del HTML con la noticia
                tituloElement.textContent = data.titulo;
                contenidoElement.textContent = data.contenido;
                editorElement.textContent = `Editor: ${data.editor || 'No especificado'}`;
                fechaElement.textContent = `Fecha de Publicación: ${new Date(data.fecha_publicacion).toLocaleString()}`;

                // Asignar la imagen al elemento img
                if (data.imagen) {
                    imagenElement.src = data.imagen;
                    imagenElement.alt = 'Imagen de la noticia';
                } else {
                    imagenElement.alt = 'No hay imagen disponible';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar la noticia. Verifique el ID ingresado.');
            });
    };

    // Cargar los detalles de la noticia
    cargarDetalleNoticia(id_noticia);

});
