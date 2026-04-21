package com.micasita.backend.dto.admision;

public record UpdateSolicitudAdmisionRequest(
        Long estadoSolicitudId,
        String comentariosDirector,
        Boolean activo,
        Boolean crearEstudiante
) {
}
