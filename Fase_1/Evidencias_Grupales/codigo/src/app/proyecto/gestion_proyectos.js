document.addEventListener('DOMContentLoaded', () => {
    listarProyectos();

    function listarProyectos() {
        fetch('/api/listarProyectos')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar los proyectos');
                }
                return response.json();
            })
            .then(proyectos => {
                const tablaProyectos = document.getElementById('tabla-proyectos').querySelector('tbody');
                tablaProyectos.innerHTML = '';

                proyectos.forEach(proyecto => {
                    const fila = document.createElement('tr');

                    fila.innerHTML = `
                        <td class="cell">${proyecto.id_proyecto}</td>
                        <td class="cell1">${proyecto.nombre_proyecto}</td>
                        <td class="cell1 limited-text">${proyecto.descripcion_proyecto}</td>
                        <td>
                            <button class="buttonDetalles" data-id-proyecto="${proyecto.id_proyecto}">
                                Ver detalles
                            </button>
                        </td>
                    `;
                    tablaProyectos.appendChild(fila);
                });

                // Añadir eventos a los botones para ver detalles del proyecto
                document.querySelectorAll('.buttonDetalles').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const id_proyecto = event.target.dataset.idProyecto;
                        window.location.href = `../proyecto/ver_proyecto.html?id=${id_proyecto}`;
                    });
                });
            })
            .catch(error => {
                alert(error.message);
            });
    }
});
