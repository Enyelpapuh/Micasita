package com.micasita.backend.dto.admision;

import java.time.LocalDateTime;

public record DocumentoSolicitudResponse(
        Long id,
        Long tipoDocumentoId,
        String tipoDocumento,
        String rutaArchivo,
        LocalDateTime fechaSubida
) {
}
