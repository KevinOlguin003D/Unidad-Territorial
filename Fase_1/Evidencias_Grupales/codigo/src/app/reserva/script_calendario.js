$(document).ready(function() { 
    // Inicializa el calendario
    $('#calendar').fullCalendar({
        header: {
            left: 'prev today next',
            center: 'title',
            right: ''
        },
        
        selectable: true,
        selectAllow: function(selectInfo) {
            return moment(selectInfo.start).isSameOrAfter(moment().startOf('day'), 'day');
        },
        
        select: function(start, end) {
            selectedDate = start;
            const diaSemana = moment(selectedDate).format('dddd').toLowerCase();
            const idRecurso = $('#idRecurso').val();

            console.log("Día de la semana seleccionado:", diaSemana);

            // obtener los horarios basados en el día de la semana
            $.get(`/api/horarios/${idRecurso}/${diaSemana}`, function(data) {
                if (data.length > 0) {
                    const fechaReserva = moment(selectedDate).format('YYYY-MM-DD');
                    $.get(`/api/horariosReservados/${idRecurso}/${fechaReserva}`, function(reservados) {
                        updateScheduleDropdown(data, reservados);
                    });
                } else {
                    $('#scheduleDropdown').html('<option>No hay horarios disponibles para este día de la semana.</option>');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Error en la solicitud:", textStatus, errorThrown);
                $('#scheduleDropdown').html('<option>Error al cargar horarios.</option>');
            });
            
            // obtener los motivos según el idRecurso
            $.get(`/api/motivos/${idRecurso}`, function(motivos) {
                if (motivos.length > 0) {
                    updateMotivoDropdown(motivos);  // Actualiza el dropdown de motivos
                } else {
                    $('#motivoDropdown').html('<option>No hay motivos disponibles para este recurso.</option>');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Error en la solicitud de motivos:", textStatus, errorThrown);
                $('#motivoDropdown').html('<option>Error al cargar motivos.</option>');
            });
        },
        editable: true,
        events: [],
    });

    // Carga los horarios disponibles al cargar la página
    function cargarHorariosIniciales() {
        const idRecurso = $('#idRecurso').val();
        const diaSemana = moment().format('dddd').toLowerCase(); // Día de la semana actual
        $.get(`/api/horarios/${idRecurso}/${diaSemana}`, function(data) {
            if (data.length > 0) {
                const fechaReserva = moment().format('YYYY-MM-DD');
                $.get(`/api/horariosReservados/${idRecurso}/${fechaReserva}`, function(reservados) {
                    updateScheduleDropdown(data, reservados);
                });
            } else {
                $('#scheduleDropdown').html('<option>No hay horarios disponibles para hoy.</option>');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error en la solicitud:", textStatus, errorThrown);
            $('#scheduleDropdown').html('<option>Error al cargar horarios.</option>');
        });
    }

    cargarHorariosIniciales();

    $('#reservarBtn').on('click', function(event) {
        event.preventDefault();
        
        // Verifica si el usuario está autenticado
        $.get('/api/check-auth', function(response) {
            if (response.authenticated) {
                const selectedOption = $('#scheduleDropdown option:selected');
                const idDisponibilidad = selectedOption.val();
                const idRecurso = $('#idRecurso').val();
                const idMotivo = $('#motivoDropdown').val();
                const idUsuario = response.userId;
                const id_estado_reserva = 1;
    
                if (!idDisponibilidad || idDisponibilidad == 2 || idDisponibilidad == 3) {
                    alert('Por favor selecciona un horario libre para reservar.');
                    return;
                }
    
                const horaInicio = selectedOption.data('hora-inicio');
                const horaFin = selectedOption.data('hora-fin');
    
                if (!selectedDate) {
                    alert('Por favor selecciona una fecha en el calendario.');
                    return;
                }
    
                const fechaReserva = moment(selectedDate).format('YYYY-MM-DD');
                const confirmation = confirm(`¿Estás seguro que deseas reservar el recurso para el ${fechaReserva} de ${horaInicio} a ${horaFin}?`);
                if (!confirmation) {
                return;
                }
                $.ajax({
                    url: '/api/reservar',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        fecha_reserva: fechaReserva,
                        id_recurso: idRecurso,
                        id_usuario: idUsuario,
                        hora_inicio: horaInicio,
                        hora_fin: horaFin,
                        id_motivo: idMotivo,
                        id_estado_reserva: id_estado_reserva  
                    }),
                    success: function(response) {
                        console.log('Reserva creada:', response);
                        // Actualiza el dropdown después de crear la reserva
                        $.get(`/api/horariosReservados/${idRecurso}/${fechaReserva}`, function(reservados) {
                            $.get(`/api/horarios/${idRecurso}/${moment(selectedDate).format('dddd').toLowerCase()}`, function(data) {
                                updateScheduleDropdown(data, reservados);
                            });
                        });
                        $('#scheduleDropdown').val('');  
                        $('#motivoDropdown').val('');
                    },
                    error: function(error) {
                        console.error('Error al crear la reserva:', error);
                        alert('Error al crear la reserva: ' + error.responseJSON.error);
                    }
                });
            } else {
                // Si el usuario no está autenticado, redirige a la página de inicio de sesión
                window.location.href = '/login/login_component.html';
            }
        }).fail(function() {
            // Manejo de error si la verificación de autenticación falla
            alert('Error al verificar la autenticación. Intenta nuevamente.');
        });
    });

    // función para actualizar el dropdown de horarios
    function updateScheduleDropdown(data, reservados) {
    const dropdown = $('#scheduleDropdown');
    dropdown.empty();
    dropdown.append('<option value="">Selecciona un horario</option>'); 
    const horariosReservados = {};
    reservados.forEach(reserva => {
        // Marca el horario como reservado si id_estado_reserva es 1
        if (reserva.id_estado_reserva === 1) {
            horariosReservados[`${reserva.hora_inicio}-${reserva.hora_fin}`] = true; 
        }
    });

    // opciones del dropdown
    data.forEach(item => {
        const estaReservado = horariosReservados[`${item.hora_inicio}-${item.hora_fin}`]; // Verifica si el horario está reservado
        const disponibilidadTexto = estaReservado ? 'Reservado' : 'Libre';

        const option = `
            <option value="${item.id_disponibilidad}" 
                    data-hora-inicio="${item.hora_inicio}" 
                    data-hora-fin="${item.hora_fin}" 
                    ${estaReservado ? 'disabled' : ''}>
                ${item.hora_inicio} - ${item.hora_fin} (${disponibilidadTexto})
            </option>
        `;
        dropdown.append(option);
    });
}

    // función para actualizar el dropdown de motivos
    function updateMotivoDropdown(motivos) {
        const dropdown = $('#motivoDropdown');
        dropdown.empty(); 
        dropdown.append('<option value="">Selecciona un motivo</option>');

        // opciones del dropdown
        motivos.forEach(motivo => {
            const option = `
                <option value="${motivo.id_motivo}">${motivo.desc_motivo}</option>
            `;
            dropdown.append(option);
        });
    }
});
