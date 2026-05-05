package com.micasita.backend.service;

import com.micasita.backend.dto.auth.AuthResponse;
import com.micasita.backend.dto.auth.AuthUserResponse;
import com.micasita.backend.dto.auth.ChangePasswordRequest;
import com.micasita.backend.dto.auth.LoginRequest;
import com.micasita.backend.dto.auth.UpdateMyProfileRequest;
import com.micasita.backend.service.validation.IdentityValidationUtils;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Path avatarDirectory;
    private final long maxAvatarBytes;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PersonaRepository personaRepository,
            PersonaRolesRepository personaRolesRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.upload.usuarios-avatar-dir:uploads/usuarios}") String avatarDirectory,
            @Value("${app.upload.usuarios-avatar-max-bytes:5242880}") long maxAvatarBytes
    ) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.avatarDirectory = Paths.get(avatarDirectory).toAbsolutePath().normalize();
        this.maxAvatarBytes = maxAvatarBytes;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_VALIDATION_REQUIRED_CREDENTIALS");
        }

        Usuario usuario = usuarioRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS"));

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_USER_INACTIVE");
        }

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS");
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));

        return buildUserResponse(usuario);
    }

    @Transactional
    public AuthUserResponse updateMyProfile(String email, UpdateMyProfileRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PROFILE_BODY_REQUIRED");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));

        String telefono = trimToNull(request.telefono());
        if (telefono != null && !IdentityValidationUtils.isValidPhone(telefono)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PHONE_INVALID");
        }

        String identificador = trimToNull(request.identificador());
        if (identificador != null && !IdentityValidationUtils.isValidCedula(identificador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_CEDULA_INVALID");
        }

        if (identificador != null) {
            personaRepository.findByIdentificador(identificador)
                    .filter(existing -> !existing.getId().equals(usuario.getPersona().getId()))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "AUTH_CEDULA_ALREADY_USED");
                    });
        }

        usuario.getPersona().setTelefono(telefono);
        usuario.getPersona().setIdentificador(identificador);
        Usuario updated = usuarioRepository.save(usuario);
        return buildUserResponse(updated);
    }

    @Transactional
    public AuthUserResponse uploadMyAvatar(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_AVATAR_FILE_REQUIRED");
        }

        if (file.getSize() > maxAvatarBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_AVATAR_TOO_LARGE");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_AVATAR_INVALID_TYPE");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));

        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "usuario-" + usuario.getId() + "-" + UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Files.createDirectories(avatarDirectory);
            Path target = avatarDirectory.resolve(fileName).normalize();
            if (!target.startsWith(avatarDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_AVATAR_INVALID_FILENAME");
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH_AVATAR_SAVE_FAILED", ex);
        }

        usuario.setPathAvatar("/api/admin/usuarios/avatar/" + fileName);
        Usuario updated = usuarioRepository.save(usuario);
        return buildUserResponse(updated);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (request == null || isBlank(request.currentPassword()) || isBlank(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PASSWORD_FIELDS_REQUIRED");
        }

        String currentPassword = request.currentPassword().trim();
        String newPassword = request.newPassword().trim();

        if (currentPassword.equals(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PASSWORD_SAME_AS_CURRENT");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));

        String passwordPolicyError = IdentityValidationUtils.validateStrongPassword(
                newPassword,
                usuario.getEmail(),
                usuario.getPersona().getNombre(),
                usuario.getPersona().getApellido(),
                usuario.getPersona().getIdentificador()
        );
        if (passwordPolicyError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, passwordPolicyError);
        }

        if (!passwordEncoder.matches(currentPassword, usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_CURRENT_PASSWORD_INVALID");
        }

        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
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
                usuario.getPersona().getTelefono(),
                usuario.getPersona().getIdentificador(),
                usuario.getPathAvatar(),
                usuario.getActivo(),
                new ArrayList<>(roles),
                permissions
        );
    }

    @Transactional(readOnly = true)
    public MediaType getAvatarMediaType(String fileName) {
        try {
            Path target = avatarDirectory.resolve(fileName).normalize();
            String contentType = Files.probeContentType(target);
            return contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (IOException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return ".jpg";
        }

        int index = fileName.lastIndexOf('.');
        if (index < 0) {
            return ".jpg";
        }

        String extension = fileName.substring(index).toLowerCase(Locale.ROOT);
        if (extension.length() > 10) {
            return ".jpg";
        }
        return extension;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> resolvePermissions(List<String> roles) {
        Set<String> permissions = new LinkedHashSet<>();

        if (roles.contains("DEVELOPER") || roles.contains("ADMIN") || roles.contains("ADMIN_DIRECCION") || roles.contains("ADMINISTRACION")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ADMISION");
            permissions.add("DASHBOARD_ACADEMICO");
            permissions.add("TALLERES_VIEW");
            permissions.add("DASHBOARD_FINANZAS");
            permissions.add("DASHBOARD_USUARIOS");
            permissions.add("DASHBOARD_CONFIGURACION");
            permissions.add("USUARIOS_MANAGE");
        }

        if (roles.contains("ADMINISTRACION")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ADMISION");
            permissions.add("DASHBOARD_ACADEMICO");
            permissions.add("TALLERES_VIEW");
            permissions.add("DASHBOARD_FINANZAS");
        }

        if (roles.contains("CAJA")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_FINANZAS");
        }

        if (roles.contains("PROFESOR")) {
           // permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ACADEMICO");
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
