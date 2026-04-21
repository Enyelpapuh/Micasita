package com.micasita.backend.dto.admision;

public record CreateTipoDocumentoRequest(
        String nombre,
        Boolean obligatorio
) {
}
