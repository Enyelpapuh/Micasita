package com.micasita.backend.dto.auth;

public record UpdateMyProfileRequest(
        String telefono,
        String identificador
) {
}
