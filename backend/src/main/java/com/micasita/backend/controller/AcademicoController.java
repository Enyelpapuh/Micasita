package com.micasita.backend.controller;

import com.micasita.backend.service.AcademicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/academico")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyRole('ADMIN','DEVELOPER','ADMINISTRACION','ADMIN_DIRECCION','DOCENTE','PROFESOR')")
public class AcademicoController {

    private final AcademicoService academicoService;

    public AcademicoController(AcademicoService academicoService) {
        this.academicoService = academicoService;
    }

    @GetMapping("/grupos")
    public ResponseEntity<List<AcademicoService.GrupoItem>> listGrupos() {
        return ResponseEntity.ok(academicoService.listGrupos());
    }

    @PostMapping("/grupos")
    public ResponseEntity<AcademicoService.GrupoItem> createGrupo(@RequestBody CreateGrupoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicoService.createGrupo(request.nombre(), request.codigoFuncion()));
    }

    @GetMapping("/asignaturas")
    public ResponseEntity<List<AcademicoService.AsignaturaItem>> listAsignaturas() {
        return ResponseEntity.ok(academicoService.listAsignaturas());
    }

    @PostMapping("/asignaturas")
    public ResponseEntity<AcademicoService.AsignaturaItem> createAsignatura(@RequestBody CreateAsignaturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicoService.createAsignatura(request.nombre(), request.descripcion()));
    }

    @GetMapping("/hojas-asignatura")
    public ResponseEntity<List<AcademicoService.HojaAsignaturaItem>> listHojasAsignatura(@RequestParam(required = false) Long asignaturaId) {
        return ResponseEntity.ok(academicoService.listHojasAsignatura(asignaturaId));
    }

    @PostMapping("/hojas-asignatura")
    public ResponseEntity<AcademicoService.HojaAsignaturaItem> createHojaAsignatura(@RequestBody CreateHojaAsignaturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicoService.createHojaAsignatura(request.asignaturaId(), request.nombre()));
    }

    @PostMapping("/profesores-grupo")
    public ResponseEntity<Void> asignarProfesorGrupo(@RequestBody AsignarProfesorGrupoRequest request) {
        academicoService.asignarProfesorGrupo(request.profesorId(), request.grupoId(), request.fechaInicio());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/grupos-asignatura")
    public ResponseEntity<Void> asignarGrupoAsignatura(@RequestBody AsignarGrupoAsignaturaRequest request) {
        academicoService.asignarGrupoAsignatura(request.grupoId(), request.asignaturaId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/inscripciones/grupo")
    public ResponseEntity<Void> inscribirEstudianteGrupo(@RequestBody InscribirGrupoRequest request) {
        academicoService.inscribirEstudianteGrupo(request.estudianteId(), request.grupoId(), request.fechaInscripcion());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/inscripciones/asignatura")
    public ResponseEntity<AcademicoService.EstudianteAsignaturaItem> inscribirEstudianteAsignatura(@RequestBody InscribirAsignaturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicoService.inscribirEstudianteAsignatura(request.estudianteId(), request.asignaturaId(), request.periodo()));
    }

    @PostMapping("/estudiante-tutor")
    public ResponseEntity<Void> vincularEstudianteTutor(@RequestBody VincularEstudianteTutorRequest request) {
        academicoService.vincularEstudianteTutor(request.estudianteId(), request.tutorId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/catalogos/estudiantes")
    public ResponseEntity<List<AcademicoService.EstudianteSimpleItem>> listEstudiantes() {
        return ResponseEntity.ok(academicoService.listEstudiantes());
    }

    @GetMapping("/catalogos/estudiantes/activos")
    public ResponseEntity<List<AcademicoService.EstudianteSimpleItem>> listEstudiantesActivos(@RequestParam(required = false) String anioLectivo) {
        return ResponseEntity.ok(academicoService.listEstudiantesActivos(anioLectivo));
    }

    @GetMapping("/catalogos/estudiantes/{estudianteId}/detalle")
    public ResponseEntity<AcademicoService.EstudianteDetailItem> getEstudianteDetalle(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(academicoService.getEstudianteDetail(estudianteId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','DEVELOPER','ADMINISTRACION','ADMIN_DIRECCION')")
    @PutMapping("/catalogos/estudiantes/{estudianteId}/informacion-docente")
    public ResponseEntity<AcademicoService.EstudianteDetailItem> updateEstudianteInformacionDocente(
            @PathVariable Long estudianteId,
            @RequestBody UpdateEstudianteInformacionDocenteRequest request
    ) {
        return ResponseEntity.ok(academicoService.updateEstudianteInformacionDocente(
                estudianteId,
                request.alergiasGraves(),
                request.observacionMedicaCorta()
        ));
    }

    @GetMapping("/catalogos/profesores")
    public ResponseEntity<List<AcademicoService.ProfesorSimpleItem>> listProfesores() {
        return ResponseEntity.ok(academicoService.listProfesores());
    }

    @GetMapping("/catalogos/tutores")
    public ResponseEntity<List<AcademicoService.TutorSimpleItem>> listTutores() {
        return ResponseEntity.ok(academicoService.listTutores());
    }

    @GetMapping("/catalogos/estados-asistencia")
    public ResponseEntity<List<AcademicoService.EstadoAsistenciaItem>> listEstadosAsistencia() {
        return ResponseEntity.ok(academicoService.listEstadosAsistencia());
    }

    @PostMapping("/trabajos")
    public ResponseEntity<AcademicoService.TrabajoItem> registrarTrabajo(@RequestBody RegistrarTrabajoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicoService.registrarTrabajo(request.estudianteAsignaturaId(), request.nota(), request.fecha()));
    }

    @GetMapping("/trabajos/{estudianteAsignaturaId}")
    public ResponseEntity<List<AcademicoService.TrabajoItem>> listTrabajos(@PathVariable Long estudianteAsignaturaId) {
        return ResponseEntity.ok(academicoService.listTrabajosByEstudianteAsignatura(estudianteAsignaturaId));
    }

    @PutMapping("/estudiante-asignatura/{estudianteAsignaturaId}/nota-final")
    public ResponseEntity<AcademicoService.EstudianteAsignaturaItem> actualizarNotaFinal(
            @PathVariable Long estudianteAsignaturaId,
            @RequestBody ActualizarNotaFinalRequest request
    ) {
        return ResponseEntity.ok(academicoService.actualizarNotaFinal(estudianteAsignaturaId, request.notaFinal()));
    }

    public record CreateGrupoRequest(String nombre, Integer codigoFuncion) {}

    public record CreateAsignaturaRequest(String nombre, String descripcion) {}

    public record CreateHojaAsignaturaRequest(Long asignaturaId, String nombre) {}

    public record AsignarProfesorGrupoRequest(Long profesorId, Long grupoId, LocalDate fechaInicio) {}

    public record AsignarGrupoAsignaturaRequest(Long grupoId, Long asignaturaId) {}

    public record InscribirGrupoRequest(Long estudianteId, Long grupoId, LocalDate fechaInscripcion) {}

    public record InscribirAsignaturaRequest(Long estudianteId, Long asignaturaId, LocalDate periodo) {}

    public record VincularEstudianteTutorRequest(Long estudianteId, Long tutorId) {}

    public record UpdateEstudianteInformacionDocenteRequest(String alergiasGraves, String observacionMedicaCorta) {}

    public record AsistenciaRegistroRequest(Long estudianteId, Long estadoAsistenciaId, String observaciones) {}

    public record AsistenciaSheetRegistroRequest(Long grupoId, Long asignaturaId, LocalDate fecha, List<AsistenciaRegistroRequest> registros) {}

    public record RegistrarTrabajoRequest(Long estudianteAsignaturaId, Integer nota, LocalDate fecha) {}

    public record ActualizarNotaFinalRequest(Integer notaFinal) {}
}
