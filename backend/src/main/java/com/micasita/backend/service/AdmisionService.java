package com.micasita.backend.service;

import com.micasita.backend.dto.admision.CreateSolicitudAdmisionRequest;
import com.micasita.backend.dto.admision.CreateSolicitudAdmisionResponse;
import com.micasita.backend.dto.admision.CreateTipoDocumentoRequest;
import com.micasita.backend.dto.admision.DocumentoSolicitudResponse;
import com.micasita.backend.dto.admision.EstadoSolicitudResponse;
import com.micasita.backend.dto.admision.LandingAdmisionConfigResponse;
import com.micasita.backend.dto.admision.SolicitudAdmisionResponse;
import com.micasita.backend.dto.admision.TipoDocumentoResponse;
import com.micasita.backend.dto.admision.ToggleFormularioAdmisionRequest;
import com.micasita.backend.dto.admision.UpdateTipoDocumentoRequest;
import com.micasita.backend.dto.admision.UpdateSolicitudAdmisionRequest;
import com.micasita.backend.entities.admision.DocumentoSolicitud;
import com.micasita.backend.entities.admision.EstadoSolicitud;
import com.micasita.backend.entities.admision.SolicitudAdmision;
import com.micasita.backend.entities.admision.TipoDocumento;
import com.micasita.backend.entities.academico.DocumentoEstudiante;
import com.micasita.backend.entities.academico.Estudiante;
import com.micasita.backend.entities.academico.EstudianteTutor;
import com.micasita.backend.entities.academico.Tutor;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.finanzas.EstadoMatricula;
import com.micasita.backend.entities.finanzas.Matricula;
import com.micasita.backend.repositories.academico.DocumentoEstudianteRepository;
import com.micasita.backend.repositories.academico.EstudianteRepository;
import com.micasita.backend.repositories.academico.EstudianteTutorRepository;
import com.micasita.backend.repositories.academico.TutorRepository;
import com.micasita.backend.repositories.admision.DocumentoSolicitudRepository;
import com.micasita.backend.repositories.admision.EstadoSolicitudRepository;
import com.micasita.backend.repositories.admision.SolicitudAdmisionRepository;
import com.micasita.backend.repositories.admision.TipoDocumentoRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.finanzas.EstadoMatriculaRepository;
import com.micasita.backend.repositories.finanzas.MatriculaRepository;
import com.micasita.backend.service.finanzas.ConfiguracionFinanzasService;
import com.micasita.backend.service.validation.IdentityValidationUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
public class AdmisionService {

    private final SolicitudAdmisionRepository solicitudAdmisionRepository;
    private final EstadoSolicitudRepository estadoSolicitudRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final DocumentoSolicitudRepository documentoSolicitudRepository;
    private final DocumentoEstudianteRepository documentoEstudianteRepository;
    private final EstudianteRepository estudianteRepository;
    private final TutorRepository tutorRepository;
    private final EstudianteTutorRepository estudianteTutorRepository;
    private final MatriculaRepository matriculaRepository;
    private final EstadoMatriculaRepository estadoMatriculaRepository;
    private final ConfiguracionFinanzasService configuracionFinanzasService;
    private final PersonaRepository personaRepository;
    private final Path admisionUploadDirectory;
    private final long maxDocumentBytes;
    private final Set<String> allowedMimeTypes;
    private final AtomicBoolean formularioActivo = new AtomicBoolean(true);

    public AdmisionService(
            SolicitudAdmisionRepository solicitudAdmisionRepository,
            EstadoSolicitudRepository estadoSolicitudRepository,
            TipoDocumentoRepository tipoDocumentoRepository,
            DocumentoSolicitudRepository documentoSolicitudRepository,
            DocumentoEstudianteRepository documentoEstudianteRepository,
            EstudianteRepository estudianteRepository,
            TutorRepository tutorRepository,
            EstudianteTutorRepository estudianteTutorRepository,
            MatriculaRepository matriculaRepository,
            EstadoMatriculaRepository estadoMatriculaRepository,
            ConfiguracionFinanzasService configuracionFinanzasService,
            PersonaRepository personaRepository,
            @Value("${app.upload.admision-dir:uploads/admision}") String admisionUploadDirectory,
            @Value("${app.upload.admision-max-bytes:5242880}") long maxDocumentBytes,
            @Value("${app.upload.admision-allowed-mime:application/pdf,image/jpeg,image/png,image/webp}") String allowedMimeTypes
    ) {
        this.solicitudAdmisionRepository = solicitudAdmisionRepository;
        this.estadoSolicitudRepository = estadoSolicitudRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.documentoSolicitudRepository = documentoSolicitudRepository;
        this.documentoEstudianteRepository = documentoEstudianteRepository;
        this.estudianteRepository = estudianteRepository;
        this.tutorRepository = tutorRepository;
        this.estudianteTutorRepository = estudianteTutorRepository;
        this.matriculaRepository = matriculaRepository;
        this.estadoMatriculaRepository = estadoMatriculaRepository;
        this.configuracionFinanzasService = configuracionFinanzasService;
        this.personaRepository = personaRepository;
        this.admisionUploadDirectory = Paths.get(admisionUploadDirectory).toAbsolutePath().normalize();
        this.maxDocumentBytes = maxDocumentBytes;
        this.allowedMimeTypes = Arrays.stream(allowedMimeTypes.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public LandingAdmisionConfigResponse getLandingConfig() {
        List<TipoDocumentoResponse> tipos = tipoDocumentoRepository.findAll().stream()
                .map(tipo -> new TipoDocumentoResponse(tipo.getId(), tipo.getNombre(), tipo.getEsObligatorio()))
                .toList();

        return new LandingAdmisionConfigResponse(
                formularioActivo.get(),
                tipos,
                maxDocumentBytes,
                new ArrayList<>(allowedMimeTypes)
        );
    }

    @Transactional
    public CreateSolicitudAdmisionResponse createSolicitud(CreateSolicitudAdmisionRequest request, Map<Long, MultipartFile> filesByTipo) {
        if (!formularioActivo.get()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_FORMULARIO_INACTIVO");
        }
        validateRequest(request);

        List<TipoDocumento> tiposDocumento = tipoDocumentoRepository.findAll();
        if (tiposDocumento.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TIPOS_DOCUMENTO_NO_CONFIGURADOS");
        }

        for (TipoDocumento tipo : tiposDocumento) {
            if (Boolean.TRUE.equals(tipo.getEsObligatorio()) && !filesByTipo.containsKey(tipo.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_OBLIGATORIO_FALTANTE: " + tipo.getNombre());
            }
        }

        EstadoSolicitud estadoPendiente = estadoSolicitudRepository.findByNombre("PENDIENTE")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_ESTADO_PENDIENTE_NO_CONFIGURADO"));

        SolicitudAdmision solicitud = solicitudAdmisionRepository.save(SolicitudAdmision.builder()
                .estadoSolicitud(estadoPendiente)
            .nombrePostulante(request.nombrePostulante().trim())
            .apellidoPostulante(request.apellidoPostulante().trim())
            .fechaNacimientoPostulante(request.fechaNacimientoPostulante())
            .telefonoPostulante(trimToNull(request.telefonoPostulante()))
            .correoPostulante(null)
            .identificadorPostulante(null)
            .comentariosDirector(null)
            .tutoresAdicionalesResumen(trimToNull(request.tutoresAdicionalesResumen()))
                .nombreTutor(trimToNull(request.nombreTutor()))
                .parentescoTutor(trimToNull(request.parentescoTutor()))
                .telefonoTutor(trimToNull(request.telefonoTutor()))
                .correoTutor(normalizeEmailNullable(request.correoTutor()))
                .activo(Boolean.TRUE)
                .build());

        for (Map.Entry<Long, MultipartFile> entry : filesByTipo.entrySet()) {
            Long tipoDocumentoId = entry.getKey();
            MultipartFile file = entry.getValue();

            TipoDocumento tipoDocumento = tiposDocumento.stream()
                    .filter(td -> td.getId().equals(tipoDocumentoId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TIPO_DOCUMENTO_INVALIDO: " + tipoDocumentoId));

            String rutaArchivo = saveDocumentFile(solicitud.getId(), tipoDocumentoId, file);
            documentoSolicitudRepository.save(DocumentoSolicitud.builder()
                    .solicitud(solicitud)
                    .tipoDocumento(tipoDocumento)
                    .rutaArchivo(rutaArchivo)
                    .fechaSubida(LocalDateTime.now())
                    .build());
        }

        return new CreateSolicitudAdmisionResponse(
                solicitud.getId(),
                estadoPendiente.getNombre(),
                "Solicitud creada correctamente"
        );
    }

    @Transactional(readOnly = true)
    public List<SolicitudAdmisionResponse> listSolicitudes() {
        return solicitudAdmisionRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SolicitudAdmisionResponse updateSolicitud(Long solicitudId, UpdateSolicitudAdmisionRequest request) {
        SolicitudAdmision solicitud = solicitudAdmisionRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ADMISION_SOLICITUD_NO_ENCONTRADA"));

        if (request.estadoSolicitudId() != null) {
            EstadoSolicitud estado = estadoSolicitudRepository.findById(request.estadoSolicitudId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_ESTADO_INVALIDO"));
            solicitud.setEstadoSolicitud(estado);
        }

        if (request.comentariosDirector() != null) {
            solicitud.setComentariosDirector(trimToNull(request.comentariosDirector()));
        }

        if (request.activo() != null) {
            solicitud.setActivo(request.activo());
        }

        boolean aprobada = solicitud.getEstadoSolicitud() != null
                && "APROBADA".equalsIgnoreCase(solicitud.getEstadoSolicitud().getNombre());

        if (aprobada || Boolean.TRUE.equals(request.crearEstudiante())) {
            onboardApprovedSolicitud(solicitud);
        }

        return toResponse(solicitudAdmisionRepository.save(solicitud));
    }

    @Transactional(readOnly = true)
    public List<TipoDocumentoResponse> listTiposDocumento() {
        return tipoDocumentoRepository.findAll().stream()
                .map(td -> new TipoDocumentoResponse(td.getId(), td.getNombre(), td.getEsObligatorio()))
                .toList();
    }

    @Transactional
    public TipoDocumentoResponse createTipoDocumento(CreateTipoDocumentoRequest request) {
        if (request == null || isBlank(request.nombre())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TIPO_DOCUMENTO_NOMBRE_REQUERIDO");
        }

        String nombre = request.nombre().trim().toUpperCase(Locale.ROOT);
        tipoDocumentoRepository.findByNombre(nombre).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ADMISION_TIPO_DOCUMENTO_YA_EXISTE");
        });

        TipoDocumento created = tipoDocumentoRepository.save(TipoDocumento.builder()
                .nombre(nombre)
                .esObligatorio(Boolean.TRUE.equals(request.obligatorio()))
                .build());

        return new TipoDocumentoResponse(created.getId(), created.getNombre(), created.getEsObligatorio());
    }

    @Transactional
    public TipoDocumentoResponse updateTipoDocumento(Long tipoDocumentoId, UpdateTipoDocumentoRequest request) {
        TipoDocumento tipoDocumento = tipoDocumentoRepository.findById(tipoDocumentoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ADMISION_TIPO_DOCUMENTO_NO_ENCONTRADO"));

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TIPO_DOCUMENTO_REQUEST_INVALIDO");
        }

        if (request.nombre() != null) {
            String nombre = request.nombre().trim();
            if (nombre.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TIPO_DOCUMENTO_NOMBRE_REQUERIDO");
            }

            String nombreUpper = nombre.toUpperCase(Locale.ROOT);
            tipoDocumentoRepository.findByNombre(nombreUpper).ifPresent(existing -> {
                if (!existing.getId().equals(tipoDocumentoId)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "ADMISION_TIPO_DOCUMENTO_YA_EXISTE");
                }
            });

            tipoDocumento.setNombre(nombreUpper);
        }

        if (request.obligatorio() != null) {
            tipoDocumento.setEsObligatorio(request.obligatorio());
        }

        TipoDocumento updated = tipoDocumentoRepository.save(tipoDocumento);
        return new TipoDocumentoResponse(updated.getId(), updated.getNombre(), updated.getEsObligatorio());
    }

    @Transactional
    public void deleteTipoDocumento(Long tipoDocumentoId) {
        TipoDocumento tipoDocumento = tipoDocumentoRepository.findById(tipoDocumentoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ADMISION_TIPO_DOCUMENTO_NO_ENCONTRADO"));

        if (documentoSolicitudRepository.existsByTipoDocumentoId(tipoDocumentoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ADMISION_TIPO_DOCUMENTO_EN_USO");
        }

        tipoDocumentoRepository.delete(tipoDocumento);
    }

    @Transactional(readOnly = true)
    public List<EstadoSolicitudResponse> listEstadosSolicitud() {
        return estadoSolicitudRepository.findAll().stream()
                .map(es -> new EstadoSolicitudResponse(es.getId(), es.getNombre()))
                .toList();
    }

    public Boolean updateFormularioActivo(ToggleFormularioAdmisionRequest request) {
        if (request == null || request.formularioActivo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_FORMULARIO_ACTIVO_REQUERIDO");
        }
        formularioActivo.set(request.formularioActivo());
        return formularioActivo.get();
    }

    @Transactional(readOnly = true)
    public Resource getDocumentoResource(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_NOMBRE_INVALIDO");
        }

        try {
            Path target = admisionUploadDirectory.resolve(fileName).normalize();
            if (!target.startsWith(admisionUploadDirectory) || !Files.exists(target)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ADMISION_DOCUMENTO_NO_ENCONTRADO");
            }
            return new UrlResource(target.toUri());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ADMISION_DOCUMENTO_LECTURA_ERROR", ex);
        }
    }

    @Transactional(readOnly = true)
    public MediaType getDocumentoMediaType(String fileName) {
        try {
            if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("\\")) {
                return MediaType.APPLICATION_OCTET_STREAM;
            }
            Path target = admisionUploadDirectory.resolve(fileName).normalize();
            String contentType = Files.probeContentType(target);
            return contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (IOException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private SolicitudAdmisionResponse toResponse(SolicitudAdmision solicitud) {
        List<DocumentoSolicitudResponse> documentos = solicitud.getDocumentos() == null
                ? List.of()
                : solicitud.getDocumentos().stream().map(doc -> new DocumentoSolicitudResponse(
                        doc.getId(),
                        doc.getTipoDocumento() != null ? doc.getTipoDocumento().getId() : null,
                        doc.getTipoDocumento() != null ? doc.getTipoDocumento().getNombre() : null,
                        doc.getRutaArchivo(),
                        doc.getFechaSubida()
                )).toList();

        Persona persona = solicitud.getPersona();
        String nombrePostulante = solicitud.getNombrePostulante() != null
            ? solicitud.getNombrePostulante()
            : (persona != null ? persona.getNombre() : null);
        String apellidoPostulante = solicitud.getApellidoPostulante() != null
            ? solicitud.getApellidoPostulante()
            : (persona != null ? persona.getApellido() : null);
        String telefonoPostulante = solicitud.getTelefonoPostulante() != null
            ? solicitud.getTelefonoPostulante()
            : (persona != null ? persona.getTelefono() : null);
        String correoPostulante = solicitud.getCorreoPostulante() != null
            ? solicitud.getCorreoPostulante()
            : (persona != null ? persona.getCorreo() : null);
        String identificadorPostulante = solicitud.getIdentificadorPostulante() != null
            ? solicitud.getIdentificadorPostulante()
            : (persona != null ? persona.getIdentificador() : null);

        String comentariosDirector = solicitud.getComentariosDirector();
        if (!isBlank(solicitud.getTutoresAdicionalesResumen())) {
            comentariosDirector = isBlank(comentariosDirector)
                ? "Tutores adicionales:\n" + solicitud.getTutoresAdicionalesResumen()
                : comentariosDirector + "\n\nTutores adicionales:\n" + solicitud.getTutoresAdicionalesResumen();
        }

        return new SolicitudAdmisionResponse(
                solicitud.getId(),
                persona != null ? persona.getId() : null,
            nombrePostulante,
            apellidoPostulante,
            solicitud.getFechaNacimientoPostulante(),
            telefonoPostulante,
            correoPostulante,
            identificadorPostulante,
                solicitud.getNombreTutor(),
                solicitud.getParentescoTutor(),
                solicitud.getTelefonoTutor(),
                solicitud.getCorreoTutor(),
                solicitud.getEstadoSolicitud() != null ? solicitud.getEstadoSolicitud().getId() : null,
                solicitud.getEstadoSolicitud() != null ? solicitud.getEstadoSolicitud().getNombre() : null,
                solicitud.getFechaCreacion(),
            comentariosDirector,
                solicitud.getActivo(),
                documentos
        );
    }

        private void onboardApprovedSolicitud(SolicitudAdmision solicitud) {
        if (solicitud.getEstadoSolicitud() == null || !"APROBADA".equalsIgnoreCase(solicitud.getEstadoSolicitud().getNombre())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_CREAR_ESTUDIANTE_REQUIERE_APROBADA");
        }

        Persona persona = solicitud.getPersona();
        if (persona == null) {
            persona = personaRepository.save(Persona.builder()
                .nombre(trimToNull(solicitud.getNombrePostulante()))
                .apellido(trimToNull(solicitud.getApellidoPostulante()))
                .fechaNacimiento(solicitud.getFechaNacimientoPostulante())
                .telefono(trimToNull(solicitud.getTelefonoPostulante()))
                .correo(normalizeEmailNullable(solicitud.getCorreoPostulante()))
                .identificador(trimToNull(solicitud.getIdentificadorPostulante()))
                .activo(Boolean.TRUE)
                .build());
            solicitud.setPersona(persona);
        }

        if (!estudianteRepository.existsByPersonaId(persona.getId())) {
            estudianteRepository.save(Estudiante.builder()
                .persona(persona)
                .build());
        }

        Estudiante estudiante = estudianteRepository.findByPersonaId(persona.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ADMISION_ESTUDIANTE_NO_GENERADO"));

        ensureTutorRelations(solicitud, estudiante);
        copySolicitudDocumentosToEstudiante(solicitud, estudiante);
        ensurePendingMatricula(estudiante);
    }

    private void ensureTutorRelations(SolicitudAdmision solicitud, Estudiante estudiante) {
        List<TutorCandidate> candidates = new ArrayList<>();
        candidates.add(new TutorCandidate(
                trimToNull(solicitud.getNombreTutor()),
                trimToNull(solicitud.getTelefonoTutor()),
                normalizeEmailNullable(solicitud.getCorreoTutor())
        ));
        candidates.addAll(parseAdditionalTutorCandidates(solicitud.getTutoresAdicionalesResumen()));

        for (TutorCandidate candidate : candidates) {
            if (isBlank(candidate.nombre())) {
                continue;
            }

            Persona tutorPersona = resolveOrCreateTutorPersona(candidate);
            Tutor tutor = tutorRepository.findByPersonaId(tutorPersona.getId())
                    .orElseGet(() -> tutorRepository.save(Tutor.builder()
                            .persona(tutorPersona)
                            .direccion(null)
                            .cedula(null)
                            .build()));

            if (!estudianteTutorRepository.existsByEstudianteIdAndTutorId(estudiante.getId(), tutor.getId())) {
                estudianteTutorRepository.save(EstudianteTutor.builder()
                        .estudiante(estudiante)
                        .tutor(tutor)
                        .build());
            }
        }
    }

    private Persona resolveOrCreateTutorPersona(TutorCandidate candidate) {
        if (!isBlank(candidate.correo())) {
            return personaRepository.findByCorreo(candidate.correo())
                    .orElseGet(() -> createTutorPersona(candidate));
        }
        return createTutorPersona(candidate);
    }

    private Persona createTutorPersona(TutorCandidate candidate) {
        String[] splitName = splitTutorName(candidate.nombre());
        return personaRepository.save(Persona.builder()
                .nombre(splitName[0])
                .apellido(splitName[1])
                .fechaNacimiento(null)
                .telefono(trimToNull(candidate.telefono()))
                .correo(normalizeEmailNullable(candidate.correo()))
                .identificador(null)
                .activo(Boolean.TRUE)
                .build());
    }

    private List<TutorCandidate> parseAdditionalTutorCandidates(String summary) {
        if (isBlank(summary)) {
            return List.of();
        }

        List<TutorCandidate> candidates = new ArrayList<>();
        String[] lines = summary.split("\\n");
        for (String rawLine : lines) {
            String line = trimToNull(rawLine);
            if (line == null) {
                continue;
            }

            line = line.replaceFirst("^\\d+\\)\\s*", "");
            String[] parts = line.split("\\|");
            String nombre = trimToNull(parts.length > 0 ? parts[0] : null);
            String telefono = trimTutorField(parts.length > 2 ? parts[2] : null, "Tel:");
            String correo = trimTutorField(parts.length > 3 ? parts[3] : null, "Correo:");

            candidates.add(new TutorCandidate(nombre, telefono, normalizeEmailNullable(correo)));
        }
        return candidates;
    }

    private String trimTutorField(String value, String prefix) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        String withoutPrefix = normalized.replace(prefix, "").trim();
        if ("N/D".equalsIgnoreCase(withoutPrefix)) {
            return null;
        }
        return trimToNull(withoutPrefix);
    }

    private String[] splitTutorName(String fullName) {
        String safeName = trimToNull(fullName);
        if (safeName == null) {
            return new String[]{"Tutor", "SinApellido"};
        }

        String[] parts = safeName.split("\\s+");
        if (parts.length == 1) {
            return new String[]{parts[0], "SinApellido"};
        }

        String nombre = parts[0];
        String apellido = String.join(" ", Arrays.copyOfRange(parts, 1, parts.length));
        return new String[]{nombre, apellido};
    }

    private record TutorCandidate(String nombre, String telefono, String correo) {}

    private void copySolicitudDocumentosToEstudiante(SolicitudAdmision solicitud, Estudiante estudiante) {
        List<DocumentoSolicitud> documentos = solicitud.getDocumentos();
        if (documentos == null || documentos.isEmpty()) {
            return;
        }

        for (DocumentoSolicitud documentoSolicitud : documentos) {
            if (documentoSolicitud.getTipoDocumento() == null) {
                continue;
            }
            Long tipoDocumentoId = documentoSolicitud.getTipoDocumento().getId();
            if (tipoDocumentoId == null) {
                continue;
            }

            boolean exists = documentoEstudianteRepository.existsByEstudianteIdAndTipoDocumentoId(estudiante.getId(), tipoDocumentoId);
            if (exists) {
                continue;
            }

            documentoEstudianteRepository.save(DocumentoEstudiante.builder()
                    .estudiante(estudiante)
                    .tipoDocumento(documentoSolicitud.getTipoDocumento())
                    .rutaArchivo(documentoSolicitud.getRutaArchivo())
                    .fechaRegistro(LocalDateTime.now())
                    .build());
        }
    }

    private void ensurePendingMatricula(Estudiante estudiante) {
        String anioLectivo = String.valueOf(LocalDate.now().getYear());
        if (matriculaRepository.existsByEstudianteIdAndAnioLectivo(estudiante.getId(), anioLectivo)) {
            return;
        }

        EstadoMatricula estadoPendiente = estadoMatriculaRepository.findByNombreEstado("PENDIENTE")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "FINANZAS_ESTADO_MATRICULA_PENDIENTE_NO_CONFIGURADO"));

        matriculaRepository.save(Matricula.builder()
                .estudiante(estudiante)
                .fechaMatricula(LocalDate.now())
                .anioLectivo(anioLectivo)
            .montoBase(configuracionFinanzasService.resolveMontoMatricula(estudiante.getId(), null))
                .estadoMatricula(estadoPendiente)
                .build());
    }

    private String saveDocumentFile(Long solicitudId, Long tipoDocumentoId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_FILE_REQUERIDO");
        }

        if (file.getSize() > maxDocumentBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_SUPERA_TAMANO_MAXIMO");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedMimeTypes.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_TIPO_INVALIDO");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        String folderName = "solicitud-" + solicitudId;
        String fileName = "doc-" + tipoDocumentoId + "-" + UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Path folderPath = admisionUploadDirectory.resolve(folderName).normalize();
            Files.createDirectories(folderPath);
            Path target = folderPath.resolve(fileName).normalize();

            if (!target.startsWith(admisionUploadDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_NOMBRE_INVALIDO");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ADMISION_DOCUMENTO_ERROR_GUARDADO", ex);
        }

        return "/api/admision/documentos/" + folderName + "/" + fileName;
    }

    private void validateRequest(CreateSolicitudAdmisionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_REQUEST_REQUERIDO");
        }
        if (isBlank(request.nombrePostulante()) || isBlank(request.apellidoPostulante())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_POSTULANTE_NOMBRE_APELLIDO_REQUERIDOS");
        }
        if (request.fechaNacimientoPostulante() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_POSTULANTE_FECHA_NACIMIENTO_REQUERIDA");
        }
        if (isBlank(request.nombreTutor()) || isBlank(request.parentescoTutor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_TUTOR_REQUERIDO");
        }
        String telefonoTutor = trimToNull(request.telefonoTutor());
        if (telefonoTutor != null && !IdentityValidationUtils.isValidPhone(telefonoTutor)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PHONE_INVALID");
        }
        String telefonoPostulante = trimToNull(request.telefonoPostulante());
        if (telefonoPostulante != null && !IdentityValidationUtils.isValidPhone(telefonoPostulante)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUTH_PHONE_INVALID");
        }
    }

    public Map<Long, MultipartFile> parseFilesByTipo(Map<String, MultipartFile> filesByPartName) {
        Map<Long, MultipartFile> result = new HashMap<>();
        for (Map.Entry<String, MultipartFile> entry : filesByPartName.entrySet()) {
            String part = entry.getKey();
            if (!part.startsWith("doc_")) {
                continue;
            }
            try {
                Long tipoId = Long.parseLong(part.substring(4));
                result.put(tipoId, entry.getValue());
            } catch (NumberFormatException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_TIPO_INVALIDO: " + part);
            }
        }
        return result;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return ".bin";
        }
        int index = fileName.lastIndexOf('.');
        if (index < 0) {
            return ".bin";
        }
        String extension = fileName.substring(index).toLowerCase(Locale.ROOT);
        if (extension.length() > 12) {
            return ".bin";
        }
        return extension;
    }

    private String normalizeEmailNullable(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
