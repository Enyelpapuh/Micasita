package com.micasita.backend.service;

import com.micasita.backend.entities.academico.Asignatura;
import com.micasita.backend.entities.academico.AsistenciaEstudiante;
import com.micasita.backend.entities.academico.AsistenciaGeneral;
import com.micasita.backend.entities.academico.Estudiante;
import com.micasita.backend.entities.academico.EstudianteAsignatura;
import com.micasita.backend.entities.academico.EstudianteGrupo;
import com.micasita.backend.entities.academico.EstudianteTutor;
import com.micasita.backend.entities.academico.EstadoAsistencia;
import com.micasita.backend.entities.academico.Grupo;
import com.micasita.backend.entities.academico.GrupoAsignatura;
import com.micasita.backend.entities.academico.HojaAsignatura;
import com.micasita.backend.entities.academico.Profesor;
import com.micasita.backend.entities.academico.ProfesorGrupo;
import com.micasita.backend.entities.academico.Trabajo;
import com.micasita.backend.entities.academico.Tutor;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.academico.AsignaturaRepository;
import com.micasita.backend.repositories.academico.AsistenciaEstudianteRepository;
import com.micasita.backend.repositories.academico.AsistenciaGeneralRepository;
import com.micasita.backend.repositories.academico.EstudianteAsignaturaRepository;
import com.micasita.backend.repositories.academico.EstudianteGrupoRepository;
import com.micasita.backend.repositories.academico.EstudianteRepository;
import com.micasita.backend.repositories.academico.EstudianteTutorRepository;
import com.micasita.backend.repositories.academico.EstadoAsistenciaRepository;
import com.micasita.backend.repositories.academico.GrupoAsignaturaRepository;
import com.micasita.backend.repositories.academico.GrupoRepository;
import com.micasita.backend.repositories.academico.HojaAsignaturaRepository;
import com.micasita.backend.repositories.academico.ProfesorGrupoRepository;
import com.micasita.backend.repositories.academico.ProfesorRepository;
import com.micasita.backend.repositories.academico.TrabajoRepository;
import com.micasita.backend.repositories.academico.TutorRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.finanzas.MatriculaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AcademicoService {

    private final GrupoRepository grupoRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final HojaAsignaturaRepository hojaAsignaturaRepository;
    private final ProfesorRepository profesorRepository;
    private final ProfesorGrupoRepository profesorGrupoRepository;
    private final EstudianteRepository estudianteRepository;
    private final EstudianteGrupoRepository estudianteGrupoRepository;
    private final EstudianteAsignaturaRepository estudianteAsignaturaRepository;
    private final GrupoAsignaturaRepository grupoAsignaturaRepository;
    private final EstadoAsistenciaRepository estadoAsistenciaRepository;
    private final AsistenciaGeneralRepository asistenciaGeneralRepository;
    private final AsistenciaEstudianteRepository asistenciaEstudianteRepository;
    private final TrabajoRepository trabajoRepository;
    private final TutorRepository tutorRepository;
    private final EstudianteTutorRepository estudianteTutorRepository;
        private final MatriculaRepository matriculaRepository;
        private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;

    public AcademicoService(
            GrupoRepository grupoRepository,
            AsignaturaRepository asignaturaRepository,
            HojaAsignaturaRepository hojaAsignaturaRepository,
            ProfesorRepository profesorRepository,
            ProfesorGrupoRepository profesorGrupoRepository,
            EstudianteRepository estudianteRepository,
            EstudianteGrupoRepository estudianteGrupoRepository,
            EstudianteAsignaturaRepository estudianteAsignaturaRepository,
            GrupoAsignaturaRepository grupoAsignaturaRepository,
            EstadoAsistenciaRepository estadoAsistenciaRepository,
            AsistenciaGeneralRepository asistenciaGeneralRepository,
            AsistenciaEstudianteRepository asistenciaEstudianteRepository,
            TrabajoRepository trabajoRepository,
            TutorRepository tutorRepository,
            EstudianteTutorRepository estudianteTutorRepository,
            MatriculaRepository matriculaRepository,
            UsuarioRepository usuarioRepository,
            PersonaRepository personaRepository
    ) {
        this.grupoRepository = grupoRepository;
        this.asignaturaRepository = asignaturaRepository;
        this.hojaAsignaturaRepository = hojaAsignaturaRepository;
        this.profesorRepository = profesorRepository;
        this.profesorGrupoRepository = profesorGrupoRepository;
        this.estudianteRepository = estudianteRepository;
        this.estudianteGrupoRepository = estudianteGrupoRepository;
        this.estudianteAsignaturaRepository = estudianteAsignaturaRepository;
        this.grupoAsignaturaRepository = grupoAsignaturaRepository;
        this.estadoAsistenciaRepository = estadoAsistenciaRepository;
        this.asistenciaGeneralRepository = asistenciaGeneralRepository;
        this.asistenciaEstudianteRepository = asistenciaEstudianteRepository;
        this.trabajoRepository = trabajoRepository;
        this.tutorRepository = tutorRepository;
        this.estudianteTutorRepository = estudianteTutorRepository;
        this.matriculaRepository = matriculaRepository;
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
    }

    @Transactional(readOnly = true)
    public List<GrupoItem> listGrupos() {
        return grupoRepository.findAll().stream()
                .sorted(Comparator.comparing(Grupo::getId))
                .map(grupo -> new GrupoItem(grupo.getId(), grupo.getNombre(), grupo.getCodigoFuncion()))
                .toList();
    }

    @Transactional
    public GrupoItem createGrupo(String nombre, Integer codigoFuncion) {
        if (isBlank(nombre)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_NOMBRE_REQUERIDO");
        }

        Grupo grupo = grupoRepository.save(Grupo.builder()
                .nombre(nombre.trim())
                .codigoFuncion(codigoFuncion)
                .build());

        return new GrupoItem(grupo.getId(), grupo.getNombre(), grupo.getCodigoFuncion());
    }

    @Transactional(readOnly = true)
    public List<AsignaturaItem> listAsignaturas() {
        return asignaturaRepository.findAll().stream()
                .sorted(Comparator.comparing(Asignatura::getId))
                .map(a -> new AsignaturaItem(a.getId(), a.getNombre(), a.getDescripcion()))
                .toList();
    }

    @Transactional
    public AsignaturaItem createAsignatura(String nombre, String descripcion) {
        if (isBlank(nombre)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_NOMBRE_REQUERIDO");
        }

        Asignatura asignatura = asignaturaRepository.save(Asignatura.builder()
                .nombre(nombre.trim())
                .descripcion(trimToNull(descripcion))
                .build());

        return new AsignaturaItem(asignatura.getId(), asignatura.getNombre(), asignatura.getDescripcion());
    }

    @Transactional(readOnly = true)
    public List<HojaAsignaturaItem> listHojasAsignatura(Long asignaturaId) {
        List<HojaAsignatura> hojas = asignaturaId == null
                ? hojaAsignaturaRepository.findAll()
                : hojaAsignaturaRepository.findByAsignaturaIdOrderByIdAsc(asignaturaId);

        return hojas.stream()
                .sorted(Comparator.comparing(HojaAsignatura::getId))
                .map(h -> new HojaAsignaturaItem(
                        h.getId(),
                        h.getAsignatura() != null ? h.getAsignatura().getId() : null,
                        h.getAsignatura() != null ? h.getAsignatura().getNombre() : null,
                        h.getNombre()))
                .toList();
    }

    @Transactional
    public HojaAsignaturaItem createHojaAsignatura(Long asignaturaId, String nombre) {
                if (asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_REQUERIDA");
                }
        Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

        HojaAsignatura hoja = hojaAsignaturaRepository.save(HojaAsignatura.builder()
                .asignatura(asignatura)
                .nombre(trimToNull(nombre))
                .build());

        return new HojaAsignaturaItem(hoja.getId(), asignatura.getId(), asignatura.getNombre(), hoja.getNombre());
    }

    @Transactional
    public void asignarProfesorGrupo(Long profesorId, Long grupoId, LocalDate fechaInicio) {
                if (profesorId == null || grupoId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_PROFESOR_GRUPO_REQUERIDOS");
                }
        Profesor profesor = profesorRepository.findById(profesorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_PROFESOR_INVALIDO"));
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));

        if (profesorGrupoRepository.existsByProfesorIdAndGrupoId(profesorId, grupoId)) {
            return;
        }

        profesorGrupoRepository.save(ProfesorGrupo.builder()
                .profesor(profesor)
                .grupo(grupo)
                .fechaInicio(fechaInicio != null ? fechaInicio : LocalDate.now())
                .build());
    }

    @Transactional
    public void asignarGrupoAsignatura(Long grupoId, Long asignaturaId) {
                if (grupoId == null || asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_ASIGNATURA_REQUERIDOS");
                }
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));
        Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

        if (grupoAsignaturaRepository.existsByGrupoIdAndAsignaturaId(grupoId, asignaturaId)) {
            return;
        }

        grupoAsignaturaRepository.save(GrupoAsignatura.builder()
                .grupo(grupo)
                .asignatura(asignatura)
                .build());
    }

    @Transactional
    public void inscribirEstudianteGrupo(Long estudianteId, Long grupoId, LocalDate fechaInscripcion) {
                if (estudianteId == null || grupoId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_GRUPO_REQUERIDOS");
                }
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));

        if (estudianteGrupoRepository.existsByEstudianteIdAndGrupoId(estudianteId, grupoId)) {
            return;
        }

        estudianteGrupoRepository.save(EstudianteGrupo.builder()
                .estudiante(estudiante)
                .grupo(grupo)
                .fechaInscripcion(fechaInscripcion != null ? fechaInscripcion : LocalDate.now())
                .build());
    }

    @Transactional
    public EstudianteAsignaturaItem inscribirEstudianteAsignatura(Long estudianteId, Long asignaturaId, LocalDate periodo) {
                if (estudianteId == null || asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_ASIGNATURA_REQUERIDOS");
                }
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));
        Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

        EstudianteAsignatura estudianteAsignatura = estudianteAsignaturaRepository.findByEstudianteIdAndAsignaturaId(estudianteId, asignaturaId)
                .orElseGet(() -> estudianteAsignaturaRepository.save(EstudianteAsignatura.builder()
                        .estudiante(estudiante)
                        .asignatura(asignatura)
                        .periodo(periodo != null ? periodo : LocalDate.now())
                        .notaFinal(null)
                        .build()));

        return toEstudianteAsignaturaItem(estudianteAsignatura);
    }

    @Transactional
    public void vincularEstudianteTutor(Long estudianteId, Long tutorId) {
                if (estudianteId == null || tutorId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_TUTOR_REQUERIDOS");
                }
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_TUTOR_INVALIDO"));

        if (estudianteTutorRepository.existsByEstudianteIdAndTutorId(estudianteId, tutorId)) {
            return;
        }

        estudianteTutorRepository.save(EstudianteTutor.builder()
                .estudiante(estudiante)
                .tutor(tutor)
                .build());
    }

    @Transactional
    public void desvincularEstudianteTutor(Long estudianteId, Long tutorId) {
        if (estudianteId == null || tutorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_TUTOR_REQUERIDOS");
        }
        
        List<EstudianteTutor> vinculaciones = estudianteTutorRepository.findByEstudianteIdOrderByIdAsc(estudianteId);
        vinculaciones.stream()
                .filter(v -> v.getTutor() != null && v.getTutor().getId().equals(tutorId))
                .forEach(estudianteTutorRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<EstudianteSimpleItem> listEstudiantes() {
        List<EstudianteGrupo> allEG = estudianteGrupoRepository.findAll();
        Map<Long, List<String>> gruposMap = allEG.stream()
                .filter(eg -> eg.getEstudiante() != null && eg.getGrupo() != null)
                .collect(Collectors.groupingBy(
                        eg -> eg.getEstudiante().getId(),
                        Collectors.mapping(eg -> eg.getGrupo().getNombre(), Collectors.toList())
                ));

        return estudianteRepository.findAll().stream()
                .sorted(Comparator.comparing(Estudiante::getId))
                .map(estudiante -> new EstudianteSimpleItem(
                        estudiante.getId(),
                        estudiante.getPersona() != null ? estudiante.getPersona().getId() : null,
                        estudiante.getPersona() != null ? estudiante.getPersona().getNombre() : null,
                        estudiante.getPersona() != null ? estudiante.getPersona().getApellido() : null,
                        gruposMap.getOrDefault(estudiante.getId(), List.of())))
                .toList();
    }

        @Transactional
        public EstudianteDetailItem updateEstudianteInformacionDocente(Long estudianteId, String alergiasGraves, String observacionMedicaCorta) {
                if (estudianteId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO");
                }

                Estudiante estudiante = estudianteRepository.findById(estudianteId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));

                estudiante.setAlergiasGraves(trimToNull(alergiasGraves));
                estudiante.setObservacionMedicaCorta(trimToNull(observacionMedicaCorta));
                estudianteRepository.save(estudiante);
                return getEstudianteDetail(estudianteId);
        }

    @Transactional(readOnly = true)
    public List<EstudianteSimpleItem> listEstudiantesActivos(String anioLectivo) {
        String year = (anioLectivo == null || anioLectivo.isBlank())
                ? String.valueOf(LocalDate.now().getYear())
                : anioLectivo.trim();

        List<EstudianteGrupo> allEG = estudianteGrupoRepository.findAll();
        Map<Long, List<String>> gruposMap = allEG.stream()
                .filter(eg -> eg.getEstudiante() != null && eg.getGrupo() != null)
                .collect(Collectors.groupingBy(
                        eg -> eg.getEstudiante().getId(),
                        Collectors.mapping(eg -> eg.getGrupo().getNombre(), Collectors.toList())
                ));

        return matriculaRepository.findActivosByAnioLectivo(year).stream()
                .map(item -> new EstudianteSimpleItem(
                        item.getId(),
                        item.getPersonaId(),
                        item.getNombre(),
                        item.getApellido(),
                        gruposMap.getOrDefault(item.getId(), List.of())))
                .sorted(Comparator.comparing(EstudianteSimpleItem::nombre, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(EstudianteSimpleItem::apellido, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(EstudianteSimpleItem::id))
                .toList();
    }

    @Transactional(readOnly = true)
    public EstudianteDetailItem getEstudianteDetail(Long estudianteId) {
        if (estudianteId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO");
        }

        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));

        List<TutorResumenItem> tutores = estudianteTutorRepository.findByEstudianteIdOrderByIdAsc(estudianteId).stream()
                .map(relacion -> {
                    Tutor tutor = relacion.getTutor();
                    if (tutor == null || tutor.getPersona() == null) {
                        return null;
                    }

                    return new TutorResumenItem(
                            tutor.getId(),
                            tutor.getPersona().getNombre(),
                            tutor.getPersona().getApellido(),
                            tutor.getPersona().getCorreo(),
                            tutor.getPersona().getTelefono());
                })
                .filter(Objects::nonNull)
                .toList();

        List<GrupoResumenItem> grupos = estudianteGrupoRepository.findByEstudianteIdOrderByIdAsc(estudianteId).stream()
                .map(relacion -> {
                    Grupo grupo = relacion.getGrupo();
                    if (grupo == null) {
                        return null;
                    }

                    ProfesorGrupo profesorGrupo = profesorGrupoRepository.findByGrupoIdOrderByIdAsc(grupo.getId()).stream()
                            .findFirst()
                            .orElse(null);
                    Profesor profesor = profesorGrupo != null ? profesorGrupo.getProfesor() : null;

                    return new GrupoResumenItem(
                            grupo.getId(),
                            grupo.getNombre(),
                            grupo.getCodigoFuncion(),
                            relacion.getFechaInscripcion(),
                            profesor != null ? profesor.getId() : null,
                            profesor != null && profesor.getPersona() != null ? profesor.getPersona().getNombre() : null,
                            profesor != null && profesor.getPersona() != null ? profesor.getPersona().getApellido() : null);
                })
                .filter(Objects::nonNull)
                .toList();

        return new EstudianteDetailItem(
                estudiante.getId(),
                estudiante.getPersona() != null ? estudiante.getPersona().getId() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getNombre() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getApellido() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getFechaNacimiento() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getTelefono() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getCorreo() : null,
                estudiante.getPersona() != null ? estudiante.getPersona().getIdentificador() : null,
                estudiante.getAlergiasGraves(),
                estudiante.getObservacionMedicaCorta(),
                tutores,
                grupos);
    }

    @Transactional(readOnly = true)
    public List<ProfesorSimpleItem> listProfesores() {
        return profesorRepository.findAll().stream()
                .sorted(Comparator.comparing(Profesor::getId))
                .map(profesor -> new ProfesorSimpleItem(
                        profesor.getId(),
                        profesor.getPersona() != null ? profesor.getPersona().getNombre() : null,
                        profesor.getPersona() != null ? profesor.getPersona().getApellido() : null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorSimpleItem> listTutores() {
        return tutorRepository.findAll().stream()
                .sorted(Comparator.comparing(Tutor::getId))
                .map(tutor -> new TutorSimpleItem(
                        tutor.getId(),
                        tutor.getPersona() != null ? tutor.getPersona().getNombre() : null,
                        tutor.getPersona() != null ? tutor.getPersona().getApellido() : null,
                        tutor.getPersona() != null ? tutor.getPersona().getCorreo() : null,
                        tutor.getPersona() != null ? tutor.getPersona().getTelefono() : null))
                .toList();
    }

    @Transactional
    public TutorSimpleItem createTutor(CreateTutorRequest request) {
        if (request == null || isBlank(request.nombre()) || isBlank(request.apellido())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TUTOR_NOMBRE_APELLIDO_REQUERIDOS");
        }

        Persona persona = new Persona();
        persona.setNombre(request.nombre().trim());
        persona.setApellido(request.apellido().trim());
        persona.setCorreo(trimToNull(request.correo()));
        persona.setTelefono(trimToNull(request.telefono()));
        persona.setActivo(true);
        persona = personaRepository.save(persona);

        Tutor tutor = new Tutor();
        tutor.setPersona(persona);
        tutor.setCedula(trimToNull(request.cedula()));
        tutor.setDireccion(trimToNull(request.direccion()));
        tutor = tutorRepository.save(tutor);

        return new TutorSimpleItem(tutor.getId(), persona.getNombre(), persona.getApellido(), persona.getCorreo(), persona.getTelefono());
    }

    @Transactional(readOnly = true)
    public List<EstadoAsistenciaItem> listEstadosAsistencia() {
        return estadoAsistenciaRepository.findAll().stream()
                .sorted(Comparator.comparing(EstadoAsistencia::getId))
                .map(item -> new EstadoAsistenciaItem(item.getId(), item.getNombre()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClaseProfesorItem> listMisClasesProfesor(String email) {
        if (isBlank(email)) {
            return List.of();
        }

        Usuario usuario = usuarioRepository.findByEmail(email.trim())
                .orElse(null);

        Long personaId = usuario != null && usuario.getPersona() != null
                ? usuario.getPersona().getId()
                : null;
        if (personaId == null) {
            return List.of();
        }

        Profesor profesor = profesorRepository.findByPersonaId(personaId)
                .orElse(null);
        if (profesor == null || profesor.getId() == null) {
            return List.of();
        }

        List<ProfesorGrupo> gruposAsignados = profesorGrupoRepository.findByProfesorIdOrderByIdAsc(profesor.getId());

        List<ClaseProfesorItem> clases = new ArrayList<>();
        for (ProfesorGrupo profesorGrupo : gruposAsignados) {
            Grupo grupo = profesorGrupo.getGrupo();
            if (grupo == null || grupo.getId() == null) {
                continue;
            }

            List<GrupoAsignaturaResumenItem> asignaturas = grupoAsignaturaRepository.findByGrupoIdOrderByIdAsc(grupo.getId()).stream()
                    .map(item -> new GrupoAsignaturaResumenItem(
                            item.getAsignatura() != null ? item.getAsignatura().getId() : null,
                            item.getAsignatura() != null ? item.getAsignatura().getNombre() : null
                    ))
                    .filter(item -> item.asignaturaId() != null)
                    .toList();

            List<EstudianteBasicoItem> estudiantes = estudianteGrupoRepository.findByGrupoIdOrderByIdAsc(grupo.getId()).stream()
                    .map(eg -> eg.getEstudiante())
                    .filter(Objects::nonNull)
                    .map(est -> new EstudianteBasicoItem(
                            est.getId(),
                            est.getPersona() != null ? est.getPersona().getNombre() : null,
                            est.getPersona() != null ? est.getPersona().getApellido() : null,
                            est.getAlergiasGraves(),
                            est.getObservacionMedicaCorta()
                    ))
                    .toList();

            clases.add(new ClaseProfesorItem(
                    grupo.getId(),
                    grupo.getNombre(),
                    grupo.getCodigoFuncion(),
                    profesorGrupo.getFechaInicio(),
                    asignaturas,
                    estudiantes
            ));
        }

        return clases;
    }

    @Transactional(readOnly = true)
    public AsistenciaSheetResponse getAsistenciaSheet(Long grupoId, Long asignaturaId, LocalDate fecha) {
                if (grupoId == null || asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_ASIGNATURA_REQUERIDOS");
                }
        if (fecha == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_FECHA_REQUERIDA");
        }

        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));
        Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

        List<EstudianteGrupo> miembrosGrupo = estudianteGrupoRepository.findByGrupoIdOrderByIdAsc(grupoId);
        List<Long> estudianteIds = miembrosGrupo.stream()
                .map(item -> item.getEstudiante() != null ? item.getEstudiante().getId() : null)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, EstudianteAsignatura> materiaPorEstudiante = new HashMap<>();
        if (!estudianteIds.isEmpty()) {
            estudianteAsignaturaRepository.findByAsignaturaIdAndEstudianteIdIn(asignaturaId, estudianteIds)
                    .forEach(item -> materiaPorEstudiante.put(item.getEstudiante().getId(), item));
        }

        List<Long> estudianteAsignaturaIds = materiaPorEstudiante.values().stream().map(EstudianteAsignatura::getId).toList();
        Map<Long, AsistenciaEstudiante> asistenciaPorEstudianteAsignatura = new HashMap<>();
        if (!estudianteAsignaturaIds.isEmpty()) {
            asistenciaEstudianteRepository.findByEstudianteAsignaturaIdInAndFecha(estudianteAsignaturaIds, fecha)
                    .forEach(a -> asistenciaPorEstudianteAsignatura.put(a.getEstudianteAsignatura().getId(), a));
        }

        List<AsistenciaRowItem> rows = new ArrayList<>();
        for (EstudianteGrupo miembro : miembrosGrupo) {
            Estudiante estudiante = miembro.getEstudiante();
            if (estudiante == null || estudiante.getId() == null) {
                continue;
            }

            EstudianteAsignatura estudianteAsignatura = materiaPorEstudiante.get(estudiante.getId());
            AsistenciaEstudiante asistencia = estudianteAsignatura == null
                    ? null
                    : asistenciaPorEstudianteAsignatura.get(estudianteAsignatura.getId());

            Long estadoAsistenciaId = asistencia != null && asistencia.getEstadoAsistencia() != null
                    ? asistencia.getEstadoAsistencia().getId()
                    : null;
            String observaciones = asistencia != null ? asistencia.getObservaciones() : null;

            rows.add(new AsistenciaRowItem(
                    estudiante.getId(),
                    estudiante.getPersona() != null ? estudiante.getPersona().getNombre() : null,
                    estudiante.getPersona() != null ? estudiante.getPersona().getApellido() : null,
                    estudianteAsignatura != null ? estudianteAsignatura.getId() : null,
                    estadoAsistenciaId,
                    observaciones,
                    estudiante.getAlergiasGraves(),
                    estudiante.getObservacionMedicaCorta()));
        }

        return new AsistenciaSheetResponse(
                grupo.getId(),
                grupo.getNombre(),
                asignatura.getId(),
                asignatura.getNombre(),
                fecha,
                listEstadosAsistencia(),
                rows
        );
    }

    @Transactional
    public void registrarAsistenciaLote(String userEmail, Long grupoId, Long asignaturaId, LocalDate fecha, List<AsistenciaRegistroInput> registros) {
                if (grupoId == null || asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_ASIGNATURA_REQUERIDOS");
                }
        if (fecha == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_FECHA_REQUERIDA");
        }
        if (registros == null || registros.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_REGISTROS_ASISTENCIA_REQUERIDOS");
        }

        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));
        Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

        AsistenciaGeneral asistenciaGeneral = asistenciaGeneralRepository.findByGrupoIdAndFecha(grupoId, fecha)
                .orElseGet(() -> asistenciaGeneralRepository.save(AsistenciaGeneral.builder()
                        .grupo(grupo)
                        .fecha(fecha)
                        .build()));
        if (asistenciaGeneral == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ACADEMICO_ASISTENCIA_GENERAL_ERROR");
        }

        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));

        for (AsistenciaRegistroInput registro : registros) {
                        if (registro.estudianteId() == null || registro.estadoAsistenciaId() == null) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASISTENCIA_REGISTRO_INVALIDO");
            }

            if (!estudianteGrupoRepository.existsByEstudianteIdAndGrupoId(registro.estudianteId(), grupoId)) {
                continue;
            }

            EstudianteAsignatura estudianteAsignatura = estudianteAsignaturaRepository
                    .findByEstudianteIdAndAsignaturaId(registro.estudianteId(), asignaturaId)
                    .orElseGet(() -> {
                        Estudiante estudiante = estudianteRepository.findById(registro.estudianteId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_INVALIDO"));
                        return estudianteAsignaturaRepository.save(EstudianteAsignatura.builder()
                                .estudiante(estudiante)
                                .asignatura(asignatura)
                                .periodo(fecha)
                                .notaFinal(null)
                                .build());
                    });

            EstadoAsistencia estado = estadoAsistenciaRepository.findById(registro.estadoAsistenciaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTADO_ASISTENCIA_INVALIDO"));

            AsistenciaEstudiante asistencia = asistenciaEstudianteRepository
                    .findByEstudianteAsignaturaIdAndFecha(estudianteAsignatura.getId(), fecha)
                    .orElseGet(() -> AsistenciaEstudiante.builder()
                            .estudianteAsignatura(estudianteAsignatura)
                                                        .usuario(usuario)
                            .fecha(fecha)
                            .build());

            asistencia.setEstadoAsistencia(estado);
                        asistencia.setUsuario(usuario);
            asistencia.setObservaciones(trimToNull(registro.observaciones()));
            asistenciaEstudianteRepository.save(asistencia);
        }
    }

    @Transactional
    public TrabajoItem registrarTrabajo(Long estudianteAsignaturaId, Integer nota, LocalDate fecha) {
                if (estudianteAsignaturaId == null || nota == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_TRABAJO_REQUERIDO");
                }
                if (nota < 0 || nota > 100) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_NOTA_RANGO_INVALIDO");
                }
        EstudianteAsignatura estudianteAsignatura = estudianteAsignaturaRepository.findById(estudianteAsignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_ASIGNATURA_INVALIDO"));

        Trabajo trabajo = trabajoRepository.save(Trabajo.builder()
                .estudianteAsignatura(estudianteAsignatura)
                .nota(nota)
                .fecha(fecha != null ? fecha : LocalDate.now())
                .build());

        return new TrabajoItem(trabajo.getId(), estudianteAsignaturaId, trabajo.getNota(), trabajo.getFecha());
    }

    @Transactional
    public EstudianteAsignaturaItem actualizarNotaFinal(Long estudianteAsignaturaId, Integer notaFinal) {
                if (estudianteAsignaturaId == null || notaFinal == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_NOTA_FINAL_REQUERIDA");
                }
                if (notaFinal < 0 || notaFinal > 100) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_NOTA_RANGO_INVALIDO");
                }
        EstudianteAsignatura estudianteAsignatura = estudianteAsignaturaRepository.findById(estudianteAsignaturaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ESTUDIANTE_ASIGNATURA_INVALIDO"));

        estudianteAsignatura.setNotaFinal(notaFinal);
        EstudianteAsignatura updated = estudianteAsignaturaRepository.save(estudianteAsignatura);
        return toEstudianteAsignaturaItem(updated);
    }

    @Transactional(readOnly = true)
    public List<TrabajoItem> listTrabajosByEstudianteAsignatura(Long estudianteAsignaturaId) {
        return trabajoRepository.findByEstudianteAsignaturaIdOrderByFechaDesc(estudianteAsignaturaId).stream()
                .map(t -> new TrabajoItem(t.getId(), estudianteAsignaturaId, t.getNota(), t.getFecha()))
                .toList();
    }

        @Transactional(readOnly = true)
        public List<AsistenciaHistorialItem> listAsistenciaHistorial(Long grupoId, Long asignaturaId, Integer limit) {
                if (grupoId == null || asignaturaId == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_ASIGNATURA_REQUERIDOS");
                }

                int maxItems = limit == null || limit <= 0 ? 8 : Math.min(limit, 30);

                Grupo grupo = grupoRepository.findById(grupoId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_GRUPO_INVALIDO"));
                Asignatura asignatura = asignaturaRepository.findById(asignaturaId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMICO_ASIGNATURA_INVALIDA"));

                List<LocalDate> fechas = asistenciaGeneralRepository.findByGrupoIdOrderByFechaDesc(grupoId).stream()
                                .map(AsistenciaGeneral::getFecha)
                                .filter(Objects::nonNull)
                                .distinct()
                                .limit(maxItems)
                                .toList();

                List<EstadoAsistenciaItem> estados = listEstadosAsistencia();

                List<AsistenciaHistorialItem> historial = new ArrayList<>();
                for (LocalDate fecha : fechas) {
                        AsistenciaSheetResponse sheet = getAsistenciaSheet(grupoId, asignaturaId, fecha);

                        long presentes = 0;
                        long ausentes = 0;
                        long justificados = 0;
                        String ultimaObservacion = null;

                        for (AsistenciaRowItem row : sheet.rows()) {
                                String estadoNombre = estados.stream()
                                                .filter(item -> Objects.equals(item.id(), row.estadoAsistenciaId()))
                                                .map(EstadoAsistenciaItem::nombre)
                                                .findFirst()
                                                .orElse(null);

                                if (estadoNombre != null) {
                                        String normalized = estadoNombre.trim().toUpperCase();
                                        if ("PRESENTE".equals(normalized)) {
                                                presentes++;
                                        } else if ("AUSENTE".equals(normalized) || "INASISTENCIA".equals(normalized)) {
                                                ausentes++;
                                        } else if ("JUSTIFICADO".equals(normalized)) {
                                                justificados++;
                                        }
                                }

                                if (ultimaObservacion == null && row.observaciones() != null && !row.observaciones().isBlank()) {
                                        ultimaObservacion = row.observaciones().trim();
                                }
                        }

                        historial.add(new AsistenciaHistorialItem(
                                        fecha,
                                        grupo.getId(),
                                        grupo.getNombre(),
                                        asignatura.getId(),
                                        asignatura.getNombre(),
                                        presentes,
                                        ausentes,
                                        justificados,
                                        (long) sheet.rows().size(),
                                        ultimaObservacion
                        ));
                }

                return historial;
        }

    private EstudianteAsignaturaItem toEstudianteAsignaturaItem(EstudianteAsignatura item) {
        return new EstudianteAsignaturaItem(
                item.getId(),
                item.getEstudiante() != null ? item.getEstudiante().getId() : null,
                item.getEstudiante() != null && item.getEstudiante().getPersona() != null ? item.getEstudiante().getPersona().getNombre() : null,
                item.getEstudiante() != null && item.getEstudiante().getPersona() != null ? item.getEstudiante().getPersona().getApellido() : null,
                item.getAsignatura() != null ? item.getAsignatura().getId() : null,
                item.getAsignatura() != null ? item.getAsignatura().getNombre() : null,
                item.getPeriodo(),
                item.getNotaFinal()
        );
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

    public record GrupoItem(Long id, String nombre, Integer codigoFuncion) {}

    public record AsignaturaItem(Long id, String nombre, String descripcion) {}

    public record HojaAsignaturaItem(Long id, Long asignaturaId, String asignaturaNombre, String nombre) {}

    public record EstudianteSimpleItem(Long id, Long personaId, String nombre, String apellido, List<String> grupos) {}

    public record EstudianteDetailItem(
            Long id,
            Long personaId,
            String nombre,
            String apellido,
            LocalDate fechaNacimiento,
            String telefono,
            String correo,
            String identificador,
            String alergiasGraves,
            String observacionMedicaCorta,
            List<TutorResumenItem> tutores,
            List<GrupoResumenItem> grupos
    ) {}

    public record TutorResumenItem(Long id, String nombre, String apellido, String correo, String telefono) {}

    public record GrupoResumenItem(
            Long id,
            String nombre,
            Integer codigoFuncion,
            LocalDate fechaInscripcion,
            Long profesorId,
            String profesorNombre,
            String profesorApellido
    ) {}

    public record ProfesorSimpleItem(Long id, String nombre, String apellido) {}

    public record TutorSimpleItem(Long id, String nombre, String apellido, String correo, String telefono) {}

    public record EstadoAsistenciaItem(Long id, String nombre) {}

    public record AsistenciaRowItem(
            Long estudianteId,
            String estudianteNombre,
            String estudianteApellido,
            Long estudianteAsignaturaId,
            Long estadoAsistenciaId,
            String observaciones,
            String estudianteAlergiasGraves,
            String estudianteObservacionMedicaCorta
    ) {}

    public record AsistenciaSheetResponse(
            Long grupoId,
            String grupoNombre,
            Long asignaturaId,
            String asignaturaNombre,
            LocalDate fecha,
            List<EstadoAsistenciaItem> estados,
            List<AsistenciaRowItem> rows
    ) {}

    public record AsistenciaHistorialItem(
            LocalDate fecha,
            Long grupoId,
            String grupoNombre,
            Long asignaturaId,
            String asignaturaNombre,
            Long presentes,
            Long ausentes,
            Long justificados,
            Long total,
            String ultimaObservacion
    ) {}

    public record ClaseProfesorItem(
            Long grupoId,
            String grupoNombre,
            Integer grupoCodigoFuncion,
            LocalDate fechaInicio,
            List<GrupoAsignaturaResumenItem> asignaturas,
            List<EstudianteBasicoItem> estudiantes
    ) {}

    public record GrupoAsignaturaResumenItem(Long asignaturaId, String asignaturaNombre) {}

    public record EstudianteBasicoItem(
            Long estudianteId,
            String nombre,
            String apellido,
            String alergiasGraves,
            String observacionMedicaCorta
    ) {}

    public record AsistenciaRegistroInput(Long estudianteId, Long estadoAsistenciaId, String observaciones) {}

    public record TrabajoItem(Long id, Long estudianteAsignaturaId, Integer nota, LocalDate fecha) {}

    public record EstudianteAsignaturaItem(
            Long id,
            Long estudianteId,
            String estudianteNombre,
            String estudianteApellido,
            Long asignaturaId,
            String asignaturaNombre,
            LocalDate periodo,
            Integer notaFinal
    ) {}

    public record CreateTutorRequest(
            String nombre,
            String apellido,
            String correo,
            String telefono,
            String cedula,
            String direccion
    ) {}
}
