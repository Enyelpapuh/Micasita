package com.micasita.backend.dto.admision;

public record UpdateTipoDocumentoRequest(
        String nombre,
        Boolean obligatorio
) {
}
