package com.micasita.backend.dto.talleres;

import java.time.LocalDate;

public record InscripcionRequest(
        String nombre,
        String apellido,
        LocalDate fechaNacimiento,
        String telefono,
        String correo,
        String identificador
) {
}
