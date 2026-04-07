package com.micasita.backend.dto.auth;

import java.time.Instant;
import java.util.List;

public record JwtPayload(
        Long userId,
        Long personaId,
        String email,
        String nombre,
        String apellido,
        List<String> roles,
        List<String> permisos,
        Instant issuedAt,
        Instant expiresAt
) {
}
