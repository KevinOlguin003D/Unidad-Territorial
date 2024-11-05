document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id_proyecto = urlParams.get("id");

    // Consultar la sesión para obtener el usuario actual
    const sessionData = await fetch("/api/session").then(res => res.json());
    const id_usuario = sessionData.id_usuario;
    const role = sessionData.role;
    console.log("Datos de sesión:", sessionData);
    console.log("ID de usuario:", id_usuario);

    if (id_proyecto) {
        try {
            const projectData = await fetch(`/api/verProyecto?id=${id_proyecto}`).then(res => res.json());
            console.log("datos del proyecto:", projectData)
            mostrarResolucion(projectData);
            if (projectData.error) {
                document.getElementById("detalles-proyecto").innerText = "Proyecto no encontrado.";
                return;
            }

            displayProjectDetails(projectData);

            // Mostrar opciones adicionales para usuarios con rol 1 o 6 (Presidente/Developer)
            if (role === 1 || role === 6) {
                await displayRoleSpecificOptions();
                updateVoteCounts(id_proyecto);
            }
            
            // Verificar si el usuario ya ha votado
            const voteData = await fetch(`/api/verificarVoto?id_proyecto=${id_proyecto}&id_usuario=${id_usuario}`).then(res => res.json());

            const btnVotarFavor = document.getElementById("btnVotarFavor");
            const btnVotarContra = document.getElementById("btnVotarContra");
            const mensajeVotacion = document.getElementById("mensaje-votacion");

            // Verificar el estado del proyecto y habilitar/deshabilitar botones
            if (projectData.id_estado_proyecto === 1) {
                if (voteData.yaVotado) {
                    btnVotarFavor.disabled = true;
                    btnVotarContra.disabled = true;
                    mensajeVotacion.innerText = "Ya has votado";
                } else {
                    btnVotarFavor.disabled = false;
                    btnVotarContra.disabled = false;
                    mensajeVotacion.innerText = "";

                    btnVotarFavor.addEventListener("click", () => votar(id_proyecto, id_usuario, 1));
                    btnVotarContra.addEventListener("click", () => votar(id_proyecto, id_usuario, 2));
                }
            } else if (projectData.id_estado_proyecto >= 2 && projectData.id_estado_proyecto <= 5) {
                const motivoMensaje = 
                projectData.id_estado_proyecto === 2 ? "En curso" :
                projectData.id_estado_proyecto === 3 ? "Completado" :
                projectData.id_estado_proyecto === 4 ? "Aprobado" :
                projectData.id_estado_proyecto === 5 ? "Rechazado" : "";

                btnVotarFavor.disabled = true;
                btnVotarContra.disabled = true;
                mensajeVotacion.innerText = "Los votos están deshabilitados para este proyecto. Motivo: Proyecto " +motivoMensaje;
            }

        } catch (error) {
            console.error("Error al cargar los detalles o la sesión:", error);
            document.getElementById("detalles-proyecto").innerText = "Error al cargar los detalles del proyecto.";
        }
    } else {
        document.getElementById("detalles-proyecto").innerText = "ID del proyecto no especificado en la URL.";
    }

});

// Función para mostrar opciones adicionales
async function displayRoleSpecificOptions() {
    try {
        const estados = await fetch("/api/obtenerEstadosProyecto").then(res => res.json());
        const bottomRightPanel = document.getElementById("bottomRightPanel");
        const dropdown = document.createElement("select");
        dropdown.id = "cambiarEstadoProyecto";
        dropdown.innerHTML = `<option value="">Cambiar estado del proyecto</option>`;
        
        estados.forEach(estado => {
            dropdown.innerHTML += `<option value="${estado.id_estado_proyecto}">${estado.estado_proyecto}</option>`;
        });

        bottomRightPanel.appendChild(dropdown);
        
        setupDropdownChange();

        const voteCounters = document.createElement("div");
        voteCounters.innerHTML = `
            <p><strong>Votos a favor:</strong> <span id="votosFavor">0</span></p>
            <p><strong>Votos en contra:</strong> <span id="votosContra">0</span></p>
            <p><strong>Votos nulos/blancos:</strong> <span id="votosNulos">0</span></p>
        `;
        bottomRightPanel.appendChild(voteCounters);
    } catch (error) {
        console.error("Error al obtener los estados del proyecto:", error);
    }
}

// Función para actualizar el conteo de votos
async function updateVoteCounts(id_proyecto) {
    try {
        const voteCounts = await fetch(`/api/contarVotos?id_proyecto=${id_proyecto}`).then(res => res.json());
        document.getElementById("votosFavor").innerText = voteCounts.votosFavor;
        document.getElementById("votosContra").innerText = voteCounts.votosContra;
        document.getElementById("votosNulos").innerText = voteCounts.votosNulos;
    } catch (error) {
        console.error("Error al obtener los contadores de votos:", error);
    }
}

// Función para manejar el cambio de estado
function setupDropdownChange() {
    const dropdown = document.getElementById("cambiarEstadoProyecto");
    const resolucionInput = document.getElementById("resolucion");

    dropdown.addEventListener("change", async (event) => {
        const nuevoEstado = event.target.value;

        // Mostrar/ocultar el input de resolución
        if (nuevoEstado == 5) { // Rechazado
            resolucionInput.style.display = "block"; // Habilitar el input para "resolución"
            resolucionInput.focus();
        } else {
            resolucionInput.style.display = "none";
            resolucionInput.value = "";
        }

    });

    // Agregamos un evento para confirmar el cambio al hacer clic en un botón
    const btnConfirmarCambio = document.createElement("button");
    btnConfirmarCambio.innerText = "Confirmar Cambio de Estado";
    btnConfirmarCambio.addEventListener("click", async () => {
        const nuevoEstado = dropdown.value;
        if (!nuevoEstado) {
            alert("Por favor, selecciona un estado.");
            return;
        }

        const confirmacion = confirm(`¿Estás seguro de cambiar el estado del proyecto a ${nuevoEstado}?`);
        if (!confirmacion) return;

        const id_proyecto = new URLSearchParams(window.location.search).get("id");
        const resolucion = resolucionInput.value;

        try {
            const response = await fetch("/api/cambiarEstadoProyecto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_proyecto, id_estado_proyecto: nuevoEstado, resolucion })
            });
            const result = await response.json();

            if (result.success) {
                alert("Estado del proyecto cambiado exitosamente.");
            } else {
                alert("Error al cambiar el estado del proyecto.");
            }
        } catch (error) {
            console.error("Error al cambiar el estado del proyecto:", error);
            alert("Ocurrió un error al cambiar el estado.");
        }
    });
    document.getElementById("bottomRightPanel").appendChild(btnConfirmarCambio);
}



// Función para mostrar detalles del proyecto
function displayProjectDetails(proyecto) {
    const projectContainer = document.getElementById("detalles-proyecto");

    const projectDetails = `
        <p><strong>ID Proyecto:</strong> ${proyecto.id_proyecto}</p>
        <p><strong>Nombre:</strong> ${proyecto.nombre_proyecto}</p>
        <p><strong>Estado:</strong> ${proyecto.estado_proyecto}</p>
        <p><strong>Presupuesto estimado:</strong> ${proyecto.presupuesto_estimado}</p>
        <p><strong>Duración:</strong> ${proyecto.duracion} semanas</p>
        <p><strong>Ubicación:</strong> ${proyecto.ubicacion}</p>
        <p><strong>Objetivo general:</strong> ${proyecto.objetivo}</p>
        <p><strong>Descripción</strong></p>
        <p class="description">${proyecto.descripcion_proyecto}</p>
    `;

    projectContainer.innerHTML = projectDetails;

    if (proyecto.imagen) {
        const img = document.createElement("img");
        img.src = `data:image/jpeg;base64,${proyecto.imagen}`;
        img.alt = "Imagen del Proyecto";
        img.style.maxWidth = "300px";
        projectContainer.appendChild(img);
    }
}

// Función para manejar la votación
async function votar(id_proyecto, id_usuario, id_tipovoto) {
    const confirmacion = confirm(`¿Está seguro de votar ${id_tipovoto === 1 ? "a favor" : "en contra"}?`);
    if (confirmacion) {
        try {
            const response = await fetch("/api/registrarVoto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_proyecto, id_usuario, id_tipovoto })
            });

            const result = await response.json();

            if (result.success) {
                alert("Voto registrado exitosamente.");
                document.getElementById("btnVotarFavor").disabled = true;
                document.getElementById("btnVotarContra").disabled = true;
            } else {
                alert("Error al registrar el voto.");
            }
        } catch (error) {
            console.error("Error al registrar el voto:", error);
            alert("Error al registrar el voto.");
        }
    }
}

function mostrarResolucion(proyecto) {
    const labelResolucion = document.querySelector("label[for='resolucion']");
    
    // Verificar si la resolución es null o está vacía
    if (proyecto.resolucion) {
        // Si hay valor, actualizar el texto del label
        labelResolucion.textContent = `Resolución: ${proyecto.resolucion}`;
    } else {
        // Si es null o está vacío, limpiar el texto del label
        labelResolucion.textContent = '';
    }
}
