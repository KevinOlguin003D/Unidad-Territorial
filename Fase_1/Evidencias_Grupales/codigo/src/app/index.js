document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
  
    if (!grid) {
      console.error('El elemento con la clase .grid no se encontró en el DOM.');
      return;
    }
  
    // Función para obtener y mostrar noticias
    async function cargarNoticias() {
      try {
        const respuesta = await fetch('/api/noticias');
        if (!respuesta.ok) {
          throw new Error('Error al obtener las noticias');
        }
  
        const noticias = await respuesta.json();
  
        noticias.slice(0, 3).forEach(noticia => {
          const noticiaDiv = document.createElement('div');
  
          // Crear el enlace con la URL relativa
          const enlace = document.createElement('a');
          enlace.href = `noticia/noticia_detalle.html?id_noticia=${noticia.id_noticia}`;
          enlace.style.textDecoration = 'none';
          enlace.style.color = 'inherit';
  
          // Insertar contenido de la noticia dentro del enlace
          noticiaDiv.innerHTML = `
            <img src="${noticia.imagen || 'https://via.placeholder.com/150'}" alt="${noticia.titulo}">
            <h3>${noticia.titulo}</h3>
            <p>${noticia.contenido}</p>
            <p><small>Publicado el: ${new Date(noticia.fecha_publicacion).toLocaleDateString()}</small></p>
            <p><small>Editor: ${noticia.editor}</small></p>
          `;

          enlace.appendChild(noticiaDiv);
          grid.appendChild(enlace);
        });
      } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<p>No se pudieron cargar las noticias. Inténtalo más tarde.</p>';
      }
    }
  
    cargarNoticias();
  });
  