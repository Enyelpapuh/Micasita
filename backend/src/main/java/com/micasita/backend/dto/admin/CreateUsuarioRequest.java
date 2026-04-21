package com.micasita.backend.dto.admin;

import java.time.LocalDate;
import java.util.List;

public record CreateUsuarioRequest(
        String nombre,
        String apellido,
        LocalDate fechaNacimiento,
        String telefono,
        String identificador,
        String email,
        String password,
        Boolean activo,
        List<String> roles
) {
}
