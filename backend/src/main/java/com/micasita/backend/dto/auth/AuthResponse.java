package com.micasita.backend.dto.auth;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMinutes,
        AuthUserResponse user
) {
}
