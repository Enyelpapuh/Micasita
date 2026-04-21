package com.micasita.backend.dto.admision;

public record TipoDocumentoResponse(
        Long id,
        String nombre,
        Boolean obligatorio
) {
}
