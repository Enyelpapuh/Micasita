package com.micasita.backend.service;

import com.micasita.backend.dto.auth.AuthResponse;
import com.micasita.backend.dto.auth.AuthUserResponse;
import com.micasita.backend.dto.auth.ChangePasswordRequest;
import com.micasita.backend.dto.auth.LoginRequest;
import com.micasita.backend.dto.auth.UpdateMyProfileRequest;
import com.micasita.backend.service.validation.IdentityValidationUtils;
import com.micasita.backend.entities.core.AuditoriaAccesoSistema;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.AuditoriaAccesoRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final AuditoriaAccesoRepository auditoriaAccesoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Path avatarDirectory;
    private final long maxAvatarBytes;

    private record RecoveryData(String code, LocalDateTime expiry) {
    }

    private final Map<String, RecoveryData> recoveryStore = new ConcurrentHashMap<>();

    public AuthService(
            UsuarioRepository usuarioRepository,
            PersonaRepository personaRepository,
            PersonaRolesRepository personaRolesRepository,
            AuditoriaAccesoRepository auditoriaAccesoRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.upload.usuarios-avatar-dir:uploads/usuarios}") String avatarDirectory,
            @Value("${app.upload.usuarios-avatar-max-bytes:5242880}") long maxAvatarBytes) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.auditoriaAccesoRepository = auditoriaAccesoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.avatarDirectory = Paths.get(avatarDirectory).toAbsolutePath().normalize();
        this.maxAvatarBytes = maxAvatarBytes;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_VALIDATION_REQUIRED_CREDENTIALS");
        }

        Usuario usuario = usuarioRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_USER_NOT_FOUND"));

        if (usuario.getIntentosFallidos() != null && usuario.getIntentosFallidos() >= 3) {
            usuario.setActivo(false);
            usuarioRepository.save(usuario);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_USER_BLOCKED_TOO_MANY_ATTEMPTS");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_USER_INACTIVE");
        }

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            usuario.setIntentosFallidos(
                    (usuario.getIntentosFallidos() == null ? 0 : usuario.getIntentosFallidos()) + 1);
            usuarioRepository.save(usuario);
            registerFailedLoginAudit(usuario);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS");
        }

        usuario.setIntentosFallidos(0);
        usuario.setTokenVersion((usuario.getTokenVersion() == null ? 0 : usuario.getTokenVersion()) + 1);
        usuario = usuarioRepository.save(usuario);

        AuthUserResponse user = buildUserResponse(usuario);
        String token = jwtService.generateToken(
                user.id(),
                user.personaId(),
                user.email(),
                user.nombre(),
                user.apellido(),
                user.roles(),
                user.permisos(),
                usuario.getTokenVersion());

        registerSuccessfulLoginAudit(usuario);

        return new AuthResponse(token, "Bearer", jwtService.getExpirationMinutes(), user);
    }

    @Transactional
    public void logout(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            usuario.setTokenVersion((usuario.getTokenVersion() == null ? 0 : usuario.getTokenVersion()) + 1);
            usuarioRepository.save(usuario);
        });
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
        String fileName = "usuario-" + usuario.getId() + "-" + UUID.randomUUID().toString().replace("-", "")
                + extension;

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
                usuario.getPersona().getIdentificador());
        if (passwordPolicyError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, passwordPolicyError);
        }

        if (!passwordEncoder.matches(currentPassword, usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_CURRENT_PASSWORD_INVALID");
        }

        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        if (isBlank(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo es obligatorio");
        }

        Usuario usuario = usuarioRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un usuario con este correo"));

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_USER_INACTIVE");
        }

        // Generar código de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(999999));
        recoveryStore.put(usuario.getEmail(), new RecoveryData(codigo, LocalDateTime.now().plusMinutes(5)));

        sendRecoveryEmailToNodeService(usuario.getEmail(), usuario.getPersona().getNombre(), codigo);
    }

    @Transactional
    public void resetPasswordWithCode(String email, String codigo, String newPassword) {
        if (isBlank(email) || isBlank(codigo) || isBlank(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los campos son obligatorios");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        RecoveryData data = recoveryStore.get(normalizedEmail);

        if (data == null || !data.code().equals(codigo.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de recuperación inválido");
        }

        // Validar que el código no tenga más de 5 minutos
        if (data.expiry().isBefore(LocalDateTime.now())) {
            recoveryStore.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código ha expirado. Solicita uno nuevo.");
        }

        Usuario usuario = usuarioRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // Validar seguridad de la nueva contraseña
        String passwordPolicyError = IdentityValidationUtils.validateStrongPassword(
                newPassword,
                usuario.getEmail(),
                usuario.getPersona().getNombre(),
                usuario.getPersona().getApellido(),
                usuario.getPersona().getIdentificador());
        if (passwordPolicyError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, passwordPolicyError);
        }

        // Actualizar la contraseña y limpiar el código
        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
        recoveryStore.remove(normalizedEmail);
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
                permissions);
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

        if (roles.contains("ADMIN") || roles.contains("DIRECCION")) {
            permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ADMISION");
            permissions.add("DASHBOARD_ACADEMICO");
            permissions.add("TALLERES_VIEW");
            permissions.add("DASHBOARD_FINANZAS");
            permissions.add("DASHBOARD_USUARIOS");
            permissions.add("DASHBOARD_CONFIGURACION");
            permissions.add("USUARIOS_MANAGE");
            // Permiso para acceder al panel de auditoría
            permissions.add("DASHBOARD_AUDITORIA");

            // Nuevos permisos explícitos para garantizar que el superusuario no tenga
            // bloqueos
            permissions.add("DOCUMENTOS_MANAGE");
            permissions.add("ESTUDIANTES_MANAGE");
            permissions.add("EXPEDIENTES_MANAGE");
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

        if (roles.contains("PROFESOR") || roles.contains("DOCENTE")) {
            // permissions.add("DASHBOARD_OVERVIEW");
            permissions.add("DASHBOARD_ACADEMICO");
            permissions.add("DASHBOARD_CONFIGURACION");
        }

        return new ArrayList<>(permissions);
    }

    private void registerFailedLoginAudit(Usuario usuario) {
        try {
            HttpServletRequest request = resolveRequest();
            String ip = extractClientIp(request);
            String userAgent = request != null ? defaultIfNull(request.getHeader("User-Agent"), "<unknown>")
                    : "<unknown>";

            AuditoriaAccesoSistema record = AuditoriaAccesoSistema.builder()
                    .usuario(usuario)
                    .emailUsuario(usuario.getEmail())
                    .fechaIngreso(java.time.LocalDateTime.now())
                    .ipTerminal(ip)
                    .navegadorCliente(userAgent)
                    .estadoIntento("FALLIDO")
                    .build();

            auditoriaAccesoRepository.save(record);
        } catch (Exception ex) {
            log.error("Error saving failed login audit", ex);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void registerSuccessfulLoginAudit(Usuario usuario) {
        try {
            HttpServletRequest request = resolveRequest();
            String ip = extractClientIp(request);
            String userAgent = request != null ? defaultIfNull(request.getHeader("User-Agent"), "<unknown>")
                    : "<unknown>";

            AuditoriaAccesoSistema record = AuditoriaAccesoSistema.builder()
                    .usuario(usuario)
                    .emailUsuario(usuario.getEmail())
                    .fechaIngreso(java.time.LocalDateTime.now())
                    .ipTerminal(ip)
                    .navegadorCliente(userAgent)
                    .estadoIntento("EXITOSO")
                    .build();

            auditoriaAccesoRepository.save(record);
        } catch (Exception ex) {
            // No debe bloquear el login si falla la escritura de auditoría.
            log.error("Error saving successful login audit", ex);
        }
    }

    private HttpServletRequest resolveRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null)
            return "<unknown>";

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            if (parts.length > 0) {
                return parts[0].trim();
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private String defaultIfNull(String value, String defaultVal) {
        return value == null ? defaultVal : value;
    }

    private void sendRecoveryEmailToNodeService(String email, String nombre, String codigo) {
        try {
            String payload = String.format("{\"email\":\"%s\", \"nombre\":\"%s\", \"codigo\":\"%s\"}",
                    email, nombre != null ? nombre : "Usuario", codigo);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:4000/api/auth/recover-password"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient.newHttpClient().sendAsync(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            log.error("Error al invocar el servicio de correos para recuperación de contraseña", ex);
        }
    }
}
