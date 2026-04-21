package com.micasita.backend.dto.admision;

import java.time.LocalDateTime;
import java.util.List;

public record SolicitudAdmisionResponse(
        Long id,
        Long personaId,
        String nombrePostulante,
        String apellidoPostulante,
        String telefonoPostulante,
        String correoPostulante,
        String identificadorPostulante,
        String nombreTutor,
        String parentescoTutor,
        String telefonoTutor,
        String correoTutor,
        Long estadoSolicitudId,
        String estadoSolicitud,
        LocalDateTime fechaCreacion,
        String comentariosDirector,
        Boolean activo,
        List<DocumentoSolicitudResponse> documentos
) {
}
