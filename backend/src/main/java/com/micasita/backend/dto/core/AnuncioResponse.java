package com.micasita.backend.dto.core;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AnuncioResponse(
        Long id,
        String titulo,
        String descripcion,
        String rutaImagen,
        LocalDateTime fechaPublicacion,
        LocalDate fechaExpiracion,
        Boolean activo,
        Long usuarioId
) {
}