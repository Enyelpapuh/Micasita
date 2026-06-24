package com.micasita.backend.service;

import com.micasita.backend.dto.admin.CreateUsuarioRequest;
import com.micasita.backend.dto.admin.RolResponse;
import com.micasita.backend.dto.admin.UpdateUsuarioEstadoRequest;
import com.micasita.backend.dto.admin.UpdateUsuarioRolesRequest;
import com.micasita.backend.dto.admin.UsuarioAdminResponse;
import com.micasita.backend.service.validation.IdentityValidationUtils;
import com.micasita.backend.entities.academico.Profesor;
import com.micasita.backend.entities.academico.Puesto;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Roles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.academico.ProfesorRepository;
import com.micasita.backend.repositories.academico.PuestoRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.RolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@SuppressWarnings("null")
public class AdminUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final ProfesorRepository profesorRepository;
    private final PuestoRepository puestoRepository;
    private final RolesRepository rolesRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path avatarDirectory;
    private final long maxAvatarBytes;

    public AdminUsuarioService(
            UsuarioRepository usuarioRepository,
            PersonaRepository personaRepository,
            ProfesorRepository profesorRepository,
            PuestoRepository puestoRepository,
            RolesRepository rolesRepository,
            PersonaRolesRepository personaRolesRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.upload.usuarios-avatar-dir:uploads/usuarios}") String avatarDirectory,
            @Value("${app.upload.usuarios-avatar-max-bytes:5242880}") long maxAvatarBytes
    ) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
        this.profesorRepository = profesorRepository;
        this.puestoRepository = puestoRepository;
        this.rolesRepository = rolesRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.passwordEncoder = passwordEncoder;
        this.avatarDirectory = Paths.get(avatarDirectory).toAbsolutePath().normalize();
        this.maxAvatarBytes = maxAvatarBytes;
    }

    @Transactional(readOnly = true)
    public List<RolResponse> listRoles() {
        return rolesRepository.findAll().stream()
                .map(rol -> new RolResponse(rol.getId(), rol.getNombreRol()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::toUsuarioAdminResponse)
                .toList();
    }

    @Transactional
    public UsuarioAdminResponse createUsuario(CreateUsuarioRequest request) {
        validateCreateRequest(request);

        String email = normalizeEmail(request.email());
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }

        Persona persona = personaRepository.save(Persona.builder()
                .nombre(request.nombre().trim())
                .apellido(request.apellido().trim())
                .fechaNacimiento(request.fechaNacimiento())
                .telefono(trimToNull(request.telefono()))
                .identificador(trimToNull(request.identificador()))
                .correo(email)
                .activo(request.activo() == null ? Boolean.TRUE : request.activo())
                .build());

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .persona(persona)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .activo(request.activo() == null ? Boolean.TRUE : request.activo())
                .intentosFallidos(0)
                .tokenVersion(0L)
                .build());

        replaceRoles(usuario.getPersona().getId(), request.roles());
        syncAcademicProfiles(usuario.getPersona().getId(), request.roles());

        return toUsuarioAdminResponse(usuario);
    }

    @Transactional
    public UsuarioAdminResponse updateRoles(Long usuarioId, UpdateUsuarioRolesRequest request) {
        if (request == null || request.roles() == null || request.roles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar al menos un rol");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        replaceRoles(usuario.getPersona().getId(), request.roles());
        syncAcademicProfiles(usuario.getPersona().getId(), request.roles());

        return toUsuarioAdminResponse(usuario);
    }

    @Transactional
    public UsuarioAdminResponse updateEstado(Long usuarioId, UpdateUsuarioEstadoRequest request) {
        if (request == null || request.activo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "activo es requerido");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        usuario.setActivo(request.activo());
        usuario.getPersona().setActivo(request.activo());

        Usuario updated = usuarioRepository.save(usuario);
        return toUsuarioAdminResponse(updated);
    }

    @Transactional
    public UsuarioAdminResponse uploadAvatar(Long usuarioId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file es requerido");
        }

        if (file.getSize() > maxAvatarBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El avatar supera el limite permitido");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imagenes");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "usuario-" + usuarioId + "-" + UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Files.createDirectories(avatarDirectory);
            Path target = avatarDirectory.resolve(fileName).normalize();

            if (!target.startsWith(avatarDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo invalido");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el avatar", ex);
        }

        usuario.setPathAvatar("/api/admin/usuarios/avatar/" + fileName);
        Usuario updated = usuarioRepository.save(usuario);
        return toUsuarioAdminResponse(updated);
    }

    @Transactional(readOnly = true)
    public Resource getAvatarResource(String fileName) {
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo invalido");
        }

        try {
            Path target = avatarDirectory.resolve(fileName).normalize();

            if (!target.startsWith(avatarDirectory) || !Files.exists(target)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Avatar no encontrado");
            }

            return new UrlResource(target.toUri());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer el avatar", ex);
        }
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

    private void replaceRoles(Long personaId, List<String> roleNames) {
        List<Roles> roles = roleNames.stream()
                .map(this::normalizeRole)
                .distinct()
                .map(this::resolveRol)
                .toList();

        personaRolesRepository.deleteByPersonaId(personaId);

        for (Roles rol : roles) {
            personaRolesRepository.save(PersonaRoles.builder()
                    .persona(Persona.builder().id(personaId).build())
                    .rol(rol)
                    .build());
        }
    }

    private Roles resolveRol(String roleName) {
        return rolesRepository.findByNombreRol(roleName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol no existe: " + roleName));
    }

    private void syncAcademicProfiles(Long personaId, List<String> roles) {
        if (personaId == null || roles == null || roles.isEmpty()) {
            return;
        }

        boolean shouldBeProfesor = roles.stream()
                .map(this::normalizeRole)
                .anyMatch(role -> "PROFESOR".equals(role) || "DOCENTE".equals(role));

        if (!shouldBeProfesor) {
            return;
        }

        if (profesorRepository.findByPersonaId(personaId).isPresent()) {
            return;
        }

        Persona persona = personaRepository.findById(personaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada para crear perfil profesor"));

        Puesto puestoDocente = puestoRepository.findByNombre("DOCENTE")
                .orElseGet(() -> puestoRepository.save(Puesto.builder()
                        .nombre("DOCENTE")
                        .descripcion("Docente")
                        .rango("DOCENTE")
                        .build()));

        profesorRepository.save(Profesor.builder()
                .persona(persona)
                .puesto(puestoDocente)
                .carrera(null)
                .build());
    }

    private String normalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del rol no puede estar vacio");
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private void validateCreateRequest(CreateUsuarioRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body requerido");
        }
        if (request.nombre() == null || request.nombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nombre es requerido");
        }
        if (request.apellido() == null || request.apellido().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "apellido es requerido");
        }
        if (request.email() == null || request.email().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email es requerido");
        }
        if (request.password() == null || request.password().trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PASSWORD_REQUIRED");
        }

        String passwordPolicyError = IdentityValidationUtils.validateStrongPassword(
                request.password(),
                request.email(),
                request.nombre(),
                request.apellido(),
                request.identificador()
        );
        if (passwordPolicyError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, passwordPolicyError);
        }

        String telefono = trimToNull(request.telefono());
        if (telefono != null && !IdentityValidationUtils.isValidPhone(telefono)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PHONE_INVALID");
        }

        String identificador = trimToNull(request.identificador());
        if (identificador != null && !IdentityValidationUtils.isValidCedula(identificador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_CEDULA_INVALID");
        }

        if (request.roles() == null || request.roles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar al menos un rol");
        }
    }

    private UsuarioAdminResponse toUsuarioAdminResponse(Usuario usuario) {
        List<String> roles = new ArrayList<>();
        personaRolesRepository.findAllByPersonaId(usuario.getPersona().getId())
                .forEach(pr -> {
                    if (pr.getRol() != null && pr.getRol().getNombreRol() != null) {
                        roles.add(pr.getRol().getNombreRol());
                    }
                });

        Persona persona = usuario.getPersona();
        return new UsuarioAdminResponse(
                usuario.getId(),
                persona.getId(),
                persona.getNombre(),
                persona.getApellido(),
                persona.getFechaNacimiento(),
                persona.getTelefono(),
                persona.getIdentificador(),
                usuario.getEmail(),
                usuario.getPathAvatar(),
                usuario.getActivo(),
                roles
        );
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

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
