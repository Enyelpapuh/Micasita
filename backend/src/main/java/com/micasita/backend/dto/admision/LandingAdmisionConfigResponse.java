package com.micasita.backend.dto.admision;

import java.util.List;

public record LandingAdmisionConfigResponse(
        Boolean formularioActivo,
        List<TipoDocumentoResponse> tiposDocumento,
        long maxFileBytes,
        List<String> allowedMimeTypes
) {
}
