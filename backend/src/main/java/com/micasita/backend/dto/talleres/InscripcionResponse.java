package com.micasita.backend.dto.talleres;

public record InscripcionResponse(
        Long tallerId,
        Long cupoId,
        Long participanteId,
        Long personaId,
        String mensaje
) {
}
