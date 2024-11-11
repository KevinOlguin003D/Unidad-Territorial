document.addEventListener('DOMContentLoaded', () => {
    // Obtener información de la sesión
    fetch('/api/session') 
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la sesión');
            }
            return response.json();
        })
        .then(data => {
            // Mostrar información del usuario
            const fullName = `${data.primer_nombre} ${data.segundo_nombre || ''} ${data.apellido_paterno} ${data.apellido_materno || ''}`;
            document.getElementById('fullName').textContent = fullName;
            document.getElementById('role').textContent = data.descripcion_rol;
            document.getElementById('address').textContent = data.direccion;
            document.getElementById('email').textContent = data.correo;
            document.getElementById('phone').textContent = data.telefono;
            document.getElementById('rut').textContent = data.rut;

            // Formatear la fecha de nacimiento a dd-mm-yyyy
            const fechaNacimientoRaw = data.fecha_nacimiento;
            const fechaNacimiento = new Date(fechaNacimientoRaw);
            const dia = String(fechaNacimiento.getDate()).padStart(2, '0');
            const mes = String(fechaNacimiento.getMonth() + 1).padStart(2, '0');
            const anio = fechaNacimiento.getFullYear();
            const fechaFormateada = `${dia}-${mes}-${anio}`;
            document.getElementById('fecha_nacimiento').textContent = fechaFormateada;

            // Mostrar estado de notificaciones
            document.getElementById('recibirNotificaciones').textContent = data.recibirNotificaciones ? 'Sí' : 'No';

            // Manejar el evento de cambio de notificación
            const toggleButton = document.getElementById('toggle-notifications');
            toggleButton.addEventListener('click', () => {
                const estadoActual = data.recibirNotificaciones;
                let mensajeConfirmacion;
                if (estadoActual === 1) {
                    mensajeConfirmacion = '¿Desea dejar de recibir notificaciones?';
                } else {
                    mensajeConfirmacion = '¿Desea recibir notificaciones por correo?';
                }

                // Mostrar la alerta de confirmación
                const confirmation = confirm(mensajeConfirmacion);
                if (confirmation) {
                    // Cambiar el estado de recibir notificaciones
                    const nuevoEstado = estadoActual === 1 ? 0 : 1;
                    document.getElementById('recibirNotificaciones').textContent = nuevoEstado ? 'Sí' : 'No';

                    // Hacer la solicitud para actualizar el estado en el servidor
                    fetch('/api/actualizarNotificaciones', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            rut: data.rut,
                            recibe_notificacion: nuevoEstado
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error al actualizar el estado de notificaciones');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Estado de notificaciones actualizado:', data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                    data.recibirNotificaciones = nuevoEstado;
                } else {
                    console.log('El usuario canceló el cambio de estado de notificaciones.');
                }
            });

        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/login/login_component.html';
        });

     // Manejar el evento de cierre de sesión
     const logoutButton = document.getElementById('logout-button');
     logoutButton.addEventListener('click', () => {
         const confirmation = confirm('¿Desea cerrar sesión?');
         if (confirmation) {
             fetch('/logout', {
                 method: 'POST',
                 credentials: 'include' 
             })
             .then(response => {
                 if (response.ok) {
                     window.location.href = '/login/login_component.html'; 
                 } else {
                     console.error('Error al cerrar sesión');
                 }
             })
             .catch(error => {
                 console.error('Error:', error);
             });
         } else {
             console.log('El usuario canceló el cierre de sesión.');
         }
     });
});
