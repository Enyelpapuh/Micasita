package com.micasita.backend.dto.core;

import java.time.LocalDate;

public record UpdateAnuncioRequest(
        String titulo,
        String descripcion,
        LocalDate fechaExpiracion
) {
}
