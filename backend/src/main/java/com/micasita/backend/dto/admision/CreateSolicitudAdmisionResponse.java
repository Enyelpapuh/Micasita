package com.micasita.backend.dto.admision;

public record CreateSolicitudAdmisionResponse(
        Long solicitudId,
        String estado,
        String mensaje
) {
}
