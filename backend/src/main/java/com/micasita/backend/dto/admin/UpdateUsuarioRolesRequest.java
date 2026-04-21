package com.micasita.backend.dto.admin;

import java.util.List;

public record UpdateUsuarioRolesRequest(
        List<String> roles
) {
}
