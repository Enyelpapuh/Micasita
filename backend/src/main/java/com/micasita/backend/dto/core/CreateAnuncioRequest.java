package com.micasita.backend.dto.core;

import java.time.LocalDate;

public record CreateAnuncioRequest(
        String titulo,
        String descripcion,
        LocalDate fechaExpiracion
) {
}