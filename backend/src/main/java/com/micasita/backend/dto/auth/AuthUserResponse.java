package com.micasita.backend.dto.auth;

import java.util.List;

public record AuthUserResponse(
        Long id,
        Long personaId,
        String email,
        String nombre,
        String apellido,
        List<String> roles,
        List<String> permisos
) {
}
