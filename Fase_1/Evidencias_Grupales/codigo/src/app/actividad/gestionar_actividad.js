document.addEventListener("DOMContentLoaded", async () => {
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
    const actividadForm = document.getElementById("actividadForm");
    const responseMessage = document.getElementById("responseMessage");
    const sessionData = await fetch("/api/session").then(res => res.json());
    const id_usuario = sessionData.id_usuario;
    const fechaFormateadaInput = document.getElementById("fecha_actividad");
    if (fechaFormateadaInput) {
        const fechaActual = new Date();
        const fechaFormateadaInputValue = fechaActual.toISOString().slice(0, 16);
        fechaFormateadaInput.setAttribute("min", fechaFormateadaInputValue);
    }
    // Cargar los estados de actividad para el dropdown
    const estadosResponse = await fetch("/api/estadosActividad");
    const estadosData = await estadosResponse.json();
    if (!estadosData.success) {
        alert("Error al cargar los estados de actividad");
        return;
    }

    const estados = estadosData.estados;

    // Función para crear una nueva actividad
    actividadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const nombre_actividad = document.getElementById("nombre_actividad").value;
        const descripcion_actividad = document.getElementById("descripcion_actividad").value;
        const cupo = document.getElementById("cupo").value;
        const fecha_actividad = document.getElementById("fecha_actividad").value;
        const ubicacion = document.getElementById("ubicacion").value;

        // Crear el objeto de datos
        const actividadData = {
            nombre_actividad,
            descripcion_actividad,
            cupo,
            fecha_actividad,
            ubicacion,
            id_usuario
        };

        // Definir la URL y método para creación
        const url = "/api/crearActividad";
        const method = "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(actividadData)
            });

            const result = await response.json();

            if (result.success) {
                responseMessage.textContent = "Actividad creada exitosamente.";
                actividadForm.reset();
            } else {
                responseMessage.textContent = "Error al crear la actividad: " + result.message;
            }
        } catch (error) {
            responseMessage.textContent = "Error en la solicitud: " + error.message;
        }
    });

    // Función para cargar y mostrar las actividades en una tabla editable
    const actividadesTable = document.getElementById("actividadesTable").getElementsByTagName('tbody')[0];

    try {
        const response = await fetch("/api/actividades");
        const data = await response.json();

        if (data.success) {
            // Agregar las actividades a la tabla
            data.actividades.forEach(actividad => {
                const row = actividadesTable.insertRow();

                // Formatear la fechas
                const fechaCreacion = new Date(actividad.fecha_creacion).toLocaleString();
                function formatFecha(fecha) {
                    const f = new Date(fecha);
                    const year = f.getFullYear();
                    const month = String(f.getMonth() + 1).padStart(2, '0');
                    const day = String(f.getDate()).padStart(2, '0');
                    const hour = String(f.getHours()).padStart(2, '0');
                    const minute = String(f.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hour}:${minute}`;
                }
                // Crear el dropdown con los estados disponibles
                const dropdownOptions = estados.map(estado => {
                    const selected = actividad.id_estadoActividad === estado.id_estadoActividad ? 'selected' : '';
                    return `<option value="${estado.id_estadoActividad}" ${selected}>${estado.estado_actividad}</option>`;
                }).join('');

                // Crear las celdas para cada actividad
                row.innerHTML = `
                    <td contenteditable="true">${actividad.nombre_actividad}</td>
                    <td contenteditable="true">${actividad.descripcion_actividad}</td>
                    <td contenteditable="true">${actividad.cupo}</td>
                    <td contenteditable="true"><input type="datetime-local" id="fecha_actividad" name="fecha_actividad" min="" value="${formatFecha(actividad.fecha_actividad)}"/></td>
                    <td contenteditable="true">${actividad.ubicacion}</td>
                    <td>${actividad.nombreUsuario}</td>
                    <td>${fechaCreacion}</td>
                    <td><select class="dropdown">${dropdownOptions}</select></td>
                    <td id="motivoCell"></td>
                    <td><button class="updateButton">Actualizar</button></td>
                `;

                // Mostrar el campo motivo si el estado seleccionado es 2 o 5 (rechazada o cancelada)
                const dropdown = row.querySelector(".dropdown");
                const motivoCell = row.querySelector("#motivoCell");

                dropdown.addEventListener("change", () => {
                    const selectedEstado = dropdown.value;
                    if (selectedEstado == 2 || selectedEstado == 5) {
                        motivoCell.innerHTML = `<input type="text" id="motivoInput" placeholder="Ingrese el motivo" />`;
                    } else {
                        motivoCell.innerHTML = '';
                    }
                });

                // Agregar evento para el botón de actualización
                row.querySelector(".updateButton").addEventListener("click", async () => {
                    const newEstado = row.querySelector(".dropdown").value;
                    const motivo = (newEstado == 2 || newEstado == 5) ? row.querySelector("#motivoInput")?.value : null;

                    const updatedActividad = {
                        id_actividad: actividad.id_actividad,
                        nombre_actividad: row.cells[0].innerText,
                        descripcion_actividad: row.cells[1].innerText,
                        cupo: row.cells[2].innerText,
                        fecha_actividad: row.querySelector("#fecha_actividad").value,
                        ubicacion: row.cells[4].innerText,
                        id_usuario: actividad.id_usuario,  // No es editable
                        id_estadoActividad: newEstado,
                        motivo: motivo
                    };

                    try {
                        const updateResponse = await fetch("/api/modificarActividad", {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(updatedActividad)
                        });

                        const result = await updateResponse.json();

                        if (result.success) {
                            alert("Actividad actualizada exitosamente.");
                        } else {
                            alert("Error al actualizar la actividad: " + result.message);
                        }
                    } catch (error) {
                        alert("Error en la solicitud: " + error.message);
                    }
                });
            });
        } else {
            alert("Error al obtener las actividades: " + data.message);
        }
    } catch (error) {
        alert("Error al cargar las actividades: " + error.message);
    }
});
