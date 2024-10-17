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
        password: document.getElementById('password').value
    };

    console.log('Datos a enviar:', formData);

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
    } catch (error) {
        console.error('Error al registrar:', error);
        alert('Hubo un error al registrarse. Intenta nuevamente.');
    }
});
