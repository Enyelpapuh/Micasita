package com.micasita.backend.dto.talleres;

public record InscripcionRequest(
        String nombre,
        String apellido,
        Integer edad,
        String telefono,
        String correo,
        String identificador
) {
}
