package com.micasita.backend.service;

import com.micasita.backend.dto.auth.AuthResponse;
import com.micasita.backend.dto.auth.AuthUserResponse;
import com.micasita.backend.dto.auth.LoginRequest;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PersonaRolesRepository personaRolesRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y password son obligatorios");
        }

        Usuario usuario = usuarioRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inactivo");
        }

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        AuthUserResponse user = buildUserResponse(usuario);
        String token = jwtService.generateToken(
                user.id(),
                user.personaId(),
                user.email(),
                user.nombre(),
                user.apellido(),
                user.roles(),
                user.permisos()
        );

        return new AuthResponse(token, "Bearer", jwtService.getExpirationMinutes(), user);
    }

    public AuthUserResponse me(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));

        return buildUserResponse(usuario);
    }

    private AuthUserResponse buildUserResponse(Usuario usuario) {
        List<PersonaRoles> personaRoles = personaRolesRepository.findAllByPersonaId(usuario.getPersona().getId());

        Set<String> roles = new LinkedHashSet<>();
        for (PersonaRoles personaRol : personaRoles) {
            if (personaRol.getRol() != null && personaRol.getRol().getNombreRol() != null) {
                roles.add(personaRol.getRol().getNombreRol().trim().toUpperCase(Locale.ROOT));
            }
        }

        List<String> permissions = resolvePermissions(new ArrayList<>(roles));

        return new AuthUserResponse(
                usuario.getId(),
                usuario.getPersona().getId(),
                usuario.getEmail(),
                usuario.getPersona().getNombre(),
                usuario.getPersona().getApellido(),
                new ArrayList<>(roles),
                permissions
        );
    }

    private List<String> resolvePermissions(List<String> roles) {
        Set<String> permissions = new LinkedHashSet<>();

        if (roles.contains("ADMIN")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ADMISION");
            permissions.add("DASHBOARD_ACADEMICO");
            permissions.add("DASHBOARD_FINANZAS");
            permissions.add("DASHBOARD_USUARIOS");
            permissions.add("DASHBOARD_CONFIGURACION");
        }

        if (roles.contains("USER")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ADMISION");
        }

        return new ArrayList<>(permissions);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
