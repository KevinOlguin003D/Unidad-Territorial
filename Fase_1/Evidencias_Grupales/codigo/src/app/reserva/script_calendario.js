$(document).ready(function() { 
    // Inicializa el calendario
    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
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
            
            //  obtener los motivos según el idRecurso
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

    $('#reservarBtn').on('click', function(event) {
        event.preventDefault();
        const selectedOption = $('#scheduleDropdown option:selected');
        
        const idDisponibilidad = selectedOption.val();
        const idUsuario = $('#idUsuario').val();  
        const idRecurso = $('#idRecurso').val();
        const idMotivo = $('#motivoDropdown').val();
    
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
                id_motivo: idMotivo  
            }),
            success: function(response) {
                console.log('Reserva creada:', response);
                $.get(`/api/horariosReservados/${idRecurso}/${fechaReserva}`, function(reservados) {
                    $.get(`/api/horarios/${idRecurso}/${moment(selectedDate).format('dddd').toLowerCase()}`, function(data) {
                        updateScheduleDropdown(data, reservados);
                    });
                });
                $('#scheduleDropdown').val('');  
                $('#idUsuario').val('');  
                $('#motivoDropdown').val('');
            },
            error: function(error) {
                console.error('Error al crear la reserva:', error);
                alert('Error al crear la reserva: ' + error.responseJSON.error);
            }
        });
    });
    

    // función para actualizar el dropdown de horarios
    function updateScheduleDropdown(data, reservados) {
        const dropdown = $('#scheduleDropdown');
        dropdown.empty();
        dropdown.append('<option value="">Selecciona un horario</option>'); 
        const horariosReservados = reservados.map(reserva => {
            return { inicio: reserva.hora_inicio, fin: reserva.hora_fin };
        });

        // opciones del dropdown
        data.forEach(item => {
            const estaReservado = horariosReservados.some(h => h.inicio === item.hora_inicio && h.fin === item.hora_fin);
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
