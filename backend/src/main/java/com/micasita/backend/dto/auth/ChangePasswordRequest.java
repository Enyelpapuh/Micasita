package com.micasita.backend.dto.auth;

public record ChangePasswordRequest(
        String currentPassword,
        String newPassword
) {
}
