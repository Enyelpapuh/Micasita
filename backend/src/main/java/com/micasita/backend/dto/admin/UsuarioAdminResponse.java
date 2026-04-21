package com.micasita.backend.dto.admin;

import java.time.LocalDate;
import java.util.List;

public record UsuarioAdminResponse(
        Long usuarioId,
        Long personaId,
        String nombre,
        String apellido,
        LocalDate fechaNacimiento,
        String telefono,
        String identificador,
        String email,
        String pathAvatar,
        Boolean activo,
        List<String> roles
) {
}
