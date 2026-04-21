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
            EstudianteTutorRepository estudianteTutorRepository
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
                .cantidadAlumnos(null)
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

    @Transactional(readOnly = true)
    public List<EstudianteSimpleItem> listEstudiantes() {
        return estudianteRepository.findAll().stream()
                .sorted(Comparator.comparing(Estudiante::getId))
                .map(estudiante -> new EstudianteSimpleItem(
                        estudiante.getId(),
                        estudiante.getPersona() != null ? estudiante.getPersona().getId() : null,
                        estudiante.getPersona() != null ? estudiante.getPersona().getNombre() : null,
                        estudiante.getPersona() != null ? estudiante.getPersona().getApellido() : null))
                .toList();
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

    @Transactional(readOnly = true)
    public List<EstadoAsistenciaItem> listEstadosAsistencia() {
        return estadoAsistenciaRepository.findAll().stream()
                .sorted(Comparator.comparing(EstadoAsistencia::getId))
                .map(item -> new EstadoAsistenciaItem(item.getId(), item.getNombre()))
                .toList();
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
                    observaciones));
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
    public void registrarAsistenciaLote(Long grupoId, Long asignaturaId, LocalDate fecha, List<AsistenciaRegistroInput> registros) {
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
                            .fecha(fecha)
                            .build());

            asistencia.setEstadoAsistencia(estado);
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

    public record EstudianteSimpleItem(Long id, Long personaId, String nombre, String apellido) {}

    public record ProfesorSimpleItem(Long id, String nombre, String apellido) {}

    public record TutorSimpleItem(Long id, String nombre, String apellido, String correo, String telefono) {}

    public record EstadoAsistenciaItem(Long id, String nombre) {}

    public record AsistenciaRowItem(
            Long estudianteId,
            String estudianteNombre,
            String estudianteApellido,
            Long estudianteAsignaturaId,
            Long estadoAsistenciaId,
            String observaciones
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
}
