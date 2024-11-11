document.addEventListener('DOMContentLoaded', async () => {
    const usuariosTable = document.getElementById('usuariosTable').getElementsByTagName('tbody')[0];
    const rolesMap = {};
    const estadosMap = {};
    function notificacionTexto(valor) {
        return valor === 1 ? 'Sí' : (valor === 0 ? 'No' : 'Valor desconocido');
    }
    function formatearFechaNacimiento(fecha) {
        const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(fecha).toLocaleDateString('es-ES', opciones);
    }
    function formatearFechaRegistro(fecha) {
        const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const opcionesHora = { hour: '2-digit', minute: '2-digit', hour12: false };
        
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', opcionesFecha);
        const horaFormateada = new Date(fecha).toLocaleTimeString('es-ES', opcionesHora);
        
        return `${fechaFormateada} ${horaFormateada}`;
    }
    
    
    // Verifica el rol del usuario al cargar la página
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            alert('Acceso denegado');
            window.location.href = '/login/login_component.html';
            return;
        }

        const sessionData = await response.json();
        const allowedRoles = [1, 4, 6]; // Roles permitidos
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
    const refreshTable = async () => {
        try {
            const response = await fetch('/api/usuarios');
            const usuarios = await response.json();
            usuariosTable.innerHTML = '';
            usuarios.forEach(usuario => {
                const row = usuariosTable.insertRow();
                const recibeNotificacion = notificacionTexto(usuario.recibe_notificacion)
                const fechaNacimiento = formatearFechaNacimiento(usuario.fecha_nacimiento);
                const fechaRegistro = formatearFechaRegistro(usuario.fecha_registro);
                row.insertCell(0).textContent = usuario.rut;
                row.insertCell(1).textContent = usuario.nombre_completo;
                row.insertCell(2).textContent = usuario.correo;
                row.insertCell(3).textContent = recibeNotificacion;
                row.insertCell(4).textContent = usuario.telefono;
                row.insertCell(5).textContent = usuario.direccion;
                row.insertCell(6).textContent = fechaNacimiento;
                row.insertCell(7).textContent = fechaRegistro;
                


                const rolCell = row.insertCell(8);
                const rolSelect = document.createElement('select');
                rolSelect.id = `rolSelect_${usuario.rut}`;

                for (const [id, desc] of Object.entries(rolesMap)) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = desc;
                    rolSelect.appendChild(option);
                }

                rolSelect.value = usuario.id_rol; 
                rolCell.appendChild(rolSelect);

                const estadoCell = row.insertCell(9);
                const estadoSelect = document.createElement('select');
                estadoSelect.id = `estadoSelect_${usuario.rut}`;

                for (const [id, desc] of Object.entries(estadosMap)) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = desc;
                    estadoSelect.appendChild(option);
                }

                estadoSelect.value = usuario.id_estadousuario;
                estadoCell.appendChild(estadoSelect);

                const actionsCell = row.insertCell(10);
                const submitButton = document.createElement('button');
                submitButton.textContent = 'Actualizar';
                submitButton.onclick = () => submitChanges(usuario.rut);
                actionsCell.appendChild(submitButton);
            });
        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await fetch('/api/roles');
            const roles = await response.json();
            roles.forEach(role => {
                rolesMap[role.id_rol] = role.descripcion_rol;
            });
            refreshTable();
        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    };

    const loadEstados = async () => {
        try {
            const response = await fetch('/api/estados');
            const estados = await response.json();
            estados.forEach(estado => {
                estadosMap[estado.id_estadousuario] = estado.desc_estadousuario;
            });
            refreshTable();
        } catch (error) {
            console.error('Error al cargar estados:', error);
        }
    };

    const submitChanges = async (rut) => {
        const rol = document.getElementById(`rolSelect_${rut}`).value;
        const estado = document.getElementById(`estadoSelect_${rut}`).value;

        try {
            await Promise.all([
                fetch(`/api/usuarios/${rut}/rol`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id_rol: rol })
                }),
                fetch(`/api/usuarios/${rut}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id_estadousuario: estado })
                })
            ]);
            alert('Cambios actualizados con éxito.');
            refreshTable();
        } catch (error) {
            console.error('Error al actualizar:', error);
            alert('Error al actualizar los datos.');
        }
    };

    document.getElementById('refreshButton').addEventListener('click', refreshTable);

    loadRoles();
    loadEstados();
});
