package com.micasita.backend.dto.admision;

import java.time.LocalDate;

public record CreateSolicitudAdmisionRequest(
        String nombrePostulante,
        String apellidoPostulante,
        LocalDate fechaNacimientoPostulante,
        String telefonoPostulante,
        String nombreTutor,
        String parentescoTutor,
        String telefonoTutor,
        String correoTutor,
        String tutoresAdicionalesResumen
) {
}
