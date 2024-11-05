document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = {
        rut: document.getElementById('rut').value
        .replace(/[.\-]/g, '')    // Eliminar puntos y guiones
        .replace(/[^0-9kK]/g, '') // Mantener solo números y la letra k/K
        .toLowerCase(),           // Convertir la letra K a minúscula
        primerNombre: document.getElementById('primer_nombre').value,
        segundoNombre: document.getElementById('segundo_nombre').value,
        apellidoPaterno: document.getElementById('apellido_paterno').value,
        apellidoMaterno: document.getElementById('apellido_materno').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        fechaNacimiento: document.getElementById('fecha_nacimiento').value,
        password: document.getElementById('password').value,
        recibirNotificaciones: document.getElementById('recibir_notificaciones').checked

    };

    console.log('Datos a enviar:', formData);
    // Verificar si el usuario es mayor de 14 años
    const fechaNacimiento = new Date(formData.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    const dia = hoy.getDate() - fechaNacimiento.getDate();

    // Ajustar si el mes/día de hoy es antes que el de nacimiento
    if (mes < 0 || (mes === 0 && dia < 0)) {
        edad--;
    }

    if (edad < 14) {
        alert("Debes tener al menos 14 años para registrarte.");
        return;
    }
    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const result = await response.json();
            alert(result.message);
            return;
        }

        const result = await response.json();
        alert(result.message);
        window.location.href = 'http://localhost:3000/login/login_component.html';
    } catch (error) {
        console.error('Error al registrar:', error);
        alert('Hubo un error al registrarse. Intenta nuevamente.');
    }
});
