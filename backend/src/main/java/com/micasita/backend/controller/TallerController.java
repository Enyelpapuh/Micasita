package com.micasita.backend.controller;

import com.micasita.backend.dto.talleres.CupoTallerResponse;
import com.micasita.backend.dto.talleres.InscripcionRequest;
import com.micasita.backend.dto.talleres.InscripcionResponse;
import com.micasita.backend.dto.talleres.TallerRequest;
import com.micasita.backend.dto.talleres.TallerResponse;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.talleres.CupoTaller;
import com.micasita.backend.entities.talleres.Participante;
import com.micasita.backend.entities.talleres.Taller;
import com.micasita.backend.entities.talleres.TipoPublicoTaller;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.talleres.CupoTallerRepository;
import com.micasita.backend.repositories.talleres.ParticipanteRepository;
import com.micasita.backend.repositories.talleres.TallerRepository;
import com.micasita.backend.repositories.talleres.TipoPublicoTallerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Period;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/talleres")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@SuppressWarnings("null")
public class TallerController {

    private final TallerRepository tallerRepository;
    private final PersonaRepository personaRepository;
    private final ParticipanteRepository participanteRepository;
    private final CupoTallerRepository cupoTallerRepository;
    private final TipoPublicoTallerRepository tipoPublicoTallerRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final Path uploadDirectory;
    private final long maxUploadBytes;

    public TallerController(
            TallerRepository tallerRepository,
            PersonaRepository personaRepository,
            ParticipanteRepository participanteRepository,
            CupoTallerRepository cupoTallerRepository,
            TipoPublicoTallerRepository tipoPublicoTallerRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
            @Value("${app.upload.talleres-dir:uploads/talleres}") String uploadDirectory,
            @Value("${app.upload.talleres-max-bytes:5242880}") long maxUploadBytes
    ) {
        this.tallerRepository = tallerRepository;
        this.personaRepository = personaRepository;
        this.participanteRepository = participanteRepository;
        this.cupoTallerRepository = cupoTallerRepository;
        this.tipoPublicoTallerRepository = tipoPublicoTallerRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        this.maxUploadBytes = maxUploadBytes;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<TallerResponse>> findAll() {
        List<TallerResponse> response = tallerRepository.findAllWithCupos()
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<TallerResponse> findById(@PathVariable Long id) {
        Taller taller = tallerRepository.findByIdWithCupos(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Taller no encontrado"));

        if (Boolean.FALSE.equals(taller.getActivo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este taller esta inactivo y no admite inscripciones");
        }

        return ResponseEntity.ok(toResponse(taller));
    }

    @PostMapping
    public ResponseEntity<TallerResponse> create(@RequestBody TallerRequest request) {
        System.out.println("[TallerController] POST /api/talleres - create request received: " + request);

        validateRequest(request);

        Taller entity = new Taller();
        applyRequest(entity, request);

        Taller created = tallerRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TallerResponse> update(@PathVariable Long id, @RequestBody TallerRequest request) {
        System.out.println("[TallerController] PUT /api/talleres/" + id + " - update request received: " + request);

        validateRequest(request);

        Taller entity = tallerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Taller no encontrado"));

        applyRequest(entity, request);
        Taller updated = tallerRepository.save(entity);
        return ResponseEntity.ok(toResponse(updated));
    }

    @PostMapping("/{id}/inscripciones")
    @Transactional
    public ResponseEntity<InscripcionResponse> inscribirParticipante(
            @PathVariable Long id,
            @RequestBody InscripcionRequest request
    ) {
        Taller taller = tallerRepository.findByIdWithCupos(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Taller no encontrado"));

        validateInscripcionRequest(request);

        int edad = calculateAge(request.fechaNacimiento());

        if (taller.getEdadMinima() != null && edad < taller.getEdadMinima()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La edad del participante es menor al rango permitido para este taller"
            );
        }

        if (taller.getEdadMaxima() != null && edad > taller.getEdadMaxima()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La edad del participante es mayor al rango permitido para este taller"
            );
        }

        long ocupados = cupoTallerRepository.countByTallerId(id);
        if (taller.getCuposMaximos() != null && ocupados >= taller.getCuposMaximos()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay cupos disponibles para este taller");
        }

        String normalizedCorreo = trimToNull(request.correo());
        if (normalizedCorreo != null) {
            normalizedCorreo = normalizedCorreo.toLowerCase(Locale.ROOT);
        }
        String normalizedIdentificador = trimToNull(request.identificador());

        final String correo = normalizedCorreo;
        final String identificador = normalizedIdentificador;

        Participante participante = participanteRepository
                .findFirstByCorreoOrIdentificador(correo, identificador)
                .orElseGet(() -> createParticipante(request, correo, identificador));

        if (cupoTallerRepository.existsByTallerAndParticipante(id, participante.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este participante ya esta inscrito en el taller");
        }

        CupoTaller cupo = new CupoTaller();
        cupo.setTaller(taller);
        cupo.setParticipante(participante);
        cupo.setFecha(taller.getFechaInicial());
        cupo.setDescripcion("Inscripcion desde landing");
        cupo.setCosto(taller.getCosto());

        CupoTaller saved = cupoTallerRepository.save(cupo);

        String mensaje = "Inscripcion completada";
        if (correo != null || identificador != null) {
            mensaje += ". Si te inscribes en otro taller con el mismo correo o identificador, reutilizaremos tu registro.";
        } else {
            mensaje += ". Registro temporal creado sin vinculacion de identidad.";
        }

        InscripcionResponse response = new InscripcionResponse(
                taller.getId(),
                saved.getId(),
                participante.getId(),
            participante.getPersona() != null ? participante.getPersona().getId() : null,
                mensaje
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/inscripciones/{cupoId}")
    @Transactional
    public ResponseEntity<Void> desinscribirParticipante(
            @PathVariable Long id,
            @PathVariable Long cupoId
    ) {
        CupoTaller cupo = cupoTallerRepository.findById(cupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripcion no encontrada"));

        if (!cupo.getTaller().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La inscripcion no pertenece a este taller");
        }

        Integer totalPagos = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM Pago_cupo WHERE ID_cupo = ?", 
            Integer.class, cupoId);

        if (totalPagos != null && totalPagos > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este cupo tiene un registro de pago en Caja. No se puede eliminar por integridad financiera.");
        }

        Participante participante = cupo.getParticipante();

        cupoTallerRepository.delete(cupo);

        if (participante != null) {
            Integer otrosCupos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM Cupo_taller WHERE ID_participante = ? AND ID_cupo != ?",
                Integer.class, participante.getId(), cupoId
            );
            if (otrosCupos != null && otrosCupos == 0) {
                participanteRepository.delete(participante);
            }
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/inscripciones/pagados")
    public ResponseEntity<List<Long>> obtenerCuposPagados(@PathVariable Long id) {
        List<Long> cuposPagados = jdbcTemplate.queryForList(
            "SELECT p.ID_cupo FROM Pago_cupo p " +
            "JOIN Cupo_taller c ON p.ID_cupo = c.ID_cupo " +
            "WHERE c.ID_taller = ? AND p.Es_Anulado = 0",
            Long.class, id
        );
        return ResponseEntity.ok(cuposPagados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        System.out.println("[TallerController] DELETE /api/talleres/" + id + " - delete request received");

        if (!tallerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Taller no encontrado");
        }

        tallerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TallerResponse> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        System.out.println("[TallerController] POST /api/talleres/" + id + "/imagen - upload received: "
                + file.getOriginalFilename() + " size=" + file.getSize() + " type=" + file.getContentType());

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file es requerido");
        }

        if (file.getSize() > maxUploadBytes) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La imagen supera el limite permitido de " + (maxUploadBytes / (1024 * 1024)) + "MB"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imagenes");
        }

        Taller taller = tallerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Taller no encontrado"));

        String fileName = buildEncodedFileName(id, file.getOriginalFilename());

        try {
            Files.createDirectories(uploadDirectory);
            Path target = uploadDirectory.resolve(fileName).normalize();

            if (!target.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo invalido");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen", ex);
        }

        taller.setRutaImagen("/api/talleres/imagen/" + fileName);
        Taller updated = tallerRepository.save(taller);
        return ResponseEntity.ok(toResponse(updated));
    }

    @GetMapping("/imagen/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo invalido");
        }

        try {
            Path target = uploadDirectory.resolve(fileName).normalize();

            if (!target.startsWith(uploadDirectory) || !Files.exists(target)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagen no encontrada");
            }

            Resource resource = new UrlResource(target.toUri());
            String contentType = Files.probeContentType(target);

            MediaType mediaType = contentType != null
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;

            return ResponseEntity.ok().contentType(mediaType).body(resource);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer la imagen", ex);
        }
    }

    private void validateRequest(TallerRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body requerido");
        }

        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nombre es requerido");
        }

        if (request.nombre().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nombre debe tener al menos 3 caracteres");
        }

        if (request.descripcion() == null || request.descripcion().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "descripcion es requerida");
        }

        if (request.descripcion().trim().length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "descripcion debe tener al menos 10 caracteres");
        }

        if (request.fechaInicial() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaInicial es requerida");
        }

        if (request.fechaFinal() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaFinal es requerida");
        }

        if (request.fechaFinal().isBefore(request.fechaInicial())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaFinal no puede ser menor que fechaInicial");
        }

        if (request.costo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "costo es requerido");
        }

        if (request.costo().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "costo debe ser mayor que 0");
        }

        if (request.cuposMaximos() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cuposMaximos es requerido");
        }

        if (request.cuposMaximos() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cuposMaximos debe ser mayor que 0");
        }

        if (request.edadMinima() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "edadMinima es requerida");
        }

        if (request.edadMaxima() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "edadMaxima es requerida");
        }

        if (request.edadMinima() < 0 || request.edadMaxima() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango de edad no puede ser negativo");
        }

        if (request.edadMaxima() < request.edadMinima()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "edadMaxima no puede ser menor que edadMinima");
        }
    }

    private void applyRequest(Taller entity, TallerRequest request) {
        entity.setNombre(trimToNull(request.nombre()));
        entity.setDescripcion(trimToNull(request.descripcion()));
        entity.setFechaInicial(request.fechaInicial());
        entity.setFechaFinal(request.fechaFinal());
        entity.setCosto(request.costo());
        entity.setCuposMaximos(request.cuposMaximos());
        entity.setEdadMinima(request.edadMinima());
        entity.setEdadMaxima(request.edadMaxima());
        entity.setActivo(request.activo() == null ? Boolean.TRUE : request.activo());
        entity.setTipoPublico(resolveTipoPublico(request.idTipoPublico()));
    }

    private TallerResponse toResponse(Taller taller) {
        List<CupoTallerResponse> cupos = taller.getCupos()
                .stream()
                .sorted(Comparator.comparing(CupoTaller::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toCupoResponse)
                .toList();

        return new TallerResponse(
                taller.getId(),
                taller.getNombre(),
                taller.getDescripcion(),
                taller.getRutaImagen(),
                taller.getFechaInicial(),
                taller.getFechaFinal(),
                taller.getCosto(),
                taller.getCuposMaximos(),
                taller.getEdadMinima(),
                taller.getEdadMaxima(),
                taller.getActivo() == null ? Boolean.TRUE : taller.getActivo(),
                taller.getTipoPublico() != null ? taller.getTipoPublico().getId() : null,
                taller.getTipoPublico() != null ? taller.getTipoPublico().getNombre() : null,
                cupos
        );
    }

    private TipoPublicoTaller resolveTipoPublico(Long idTipoPublico) {
        if (idTipoPublico != null) {
            return tipoPublicoTallerRepository.findById(idTipoPublico)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "idTipoPublico no existe"));
        }

        return tipoPublicoTallerRepository.findByNombre("GENERAL")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "No existe el tipo de publico GENERAL. Ejecuta DataInitializer"
                ));
    }

    private Participante createParticipante(InscripcionRequest request, String correo, String identificador) {
        if (correo == null && identificador == null) {
            Participante temporal = new Participante();
            temporal.setPersona(null);
            temporal.setNombreTmp(trimToNull(request.nombre()));
            temporal.setNombreResponsable(trimToNull(request.apellido()));
            temporal.setTelefonoDeContacto(trimToNull(request.telefono()));
            temporal.setFechaNacimientoTmp(request.fechaNacimiento());
            temporal.setActivo(true);
            return participanteRepository.save(temporal);
        }

        Persona persona = personaRepository
                .findFirstByCorreoOrIdentificador(correo, identificador)
                .orElseGet(() -> {
                    Persona nueva = new Persona();
                    nueva.setNombre(trimToNull(request.nombre()));
                    nueva.setApellido(trimToNull(request.apellido()));
                    nueva.setFechaNacimiento(request.fechaNacimiento());
                    nueva.setTelefono(trimToNull(request.telefono()));
                    nueva.setCorreo(correo);
                    nueva.setIdentificador(identificador);
                    nueva.setActivo(true);
                    return personaRepository.save(nueva);
                });

        if (persona.getCorreo() == null && correo != null) {
            persona.setCorreo(correo);
        }
        if (persona.getIdentificador() == null && identificador != null) {
            persona.setIdentificador(identificador);
        }
        if (persona.getTelefono() == null && trimToNull(request.telefono()) != null) {
            persona.setTelefono(trimToNull(request.telefono()));
        }
        personaRepository.save(persona);

        Participante participante = new Participante();
        participante.setPersona(persona);
        participante.setNombreTmp(trimToNull(request.nombre()));
        participante.setNombreResponsable(trimToNull(request.apellido()));
        participante.setTelefonoDeContacto(trimToNull(request.telefono()));
        participante.setFechaNacimientoTmp(request.fechaNacimiento());
        participante.setActivo(true);

        return participanteRepository.save(participante);
    }

    private int calculateAge(LocalDate fechaNacimiento) {
        return Period.between(fechaNacimiento, LocalDate.now()).getYears();
    }

    private void validateInscripcionRequest(InscripcionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Body requerido");
        }

        if (trimToNull(request.nombre()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nombre es requerido");
        }

        if (trimToNull(request.apellido()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "apellido es requerido");
        }

        if (request.fechaNacimiento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaNacimiento es requerida y debe ser valida");
        }

        if (request.fechaNacimiento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaNacimiento no puede ser futura");
        }

        String correo = trimToNull(request.correo());
        String identificador = trimToNull(request.identificador());
    }

    private CupoTallerResponse toCupoResponse(CupoTaller cupo) {
        String participanteNombre = null;
        String participanteApellido = null;

        if (cupo.getParticipante() != null) {
            if (cupo.getParticipante().getPersona() != null) {
                participanteNombre = trimToNull(cupo.getParticipante().getPersona().getNombre());
                participanteApellido = trimToNull(cupo.getParticipante().getPersona().getApellido());
            }

            if (participanteNombre == null) {
                participanteNombre = trimToNull(cupo.getParticipante().getNombreTmp());
            }

            if (participanteApellido == null) {
                participanteApellido = trimToNull(cupo.getParticipante().getNombreResponsable());
            }
        }

        return new CupoTallerResponse(
                cupo.getId(),
                cupo.getFecha(),
                cupo.getCosto(),
                cupo.getParticipante() != null ? cupo.getParticipante().getId() : null,
                participanteNombre,
                participanteApellido
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) {
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

    private String buildEncodedFileName(Long tallerId, String originalFileName) {
        String extension = getFileExtension(originalFileName);

        String baseName = originalFileName;
        if (baseName == null || baseName.isBlank()) {
            baseName = "archivo";
        }

        int dotIndex = baseName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = baseName.substring(0, dotIndex);
        }

        String encodedName = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(baseName.getBytes(StandardCharsets.UTF_8));

        // Keep filename manageable for filesystems.
        if (encodedName.length() > 48) {
            encodedName = encodedName.substring(0, 48);
        }

        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        return "taller-" + tallerId + "-" + encodedName + "-" + randomSuffix + extension;
    }
}
