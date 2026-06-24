package com.micasita.backend.controller;

import com.micasita.backend.service.AcademicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/academico/asistencia")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyAuthority('DASHBOARD_ACADEMICO','ADMIN','DIRECCION','ADMINISTRACION','PROFESOR','ROLE_ADMIN','ROLE_DIRECCION','ROLE_ADMINISTRACION','ROLE_PROFESOR')")
public class AcademicoAsistenciaController {

    private final AcademicoService academicoService;

    public AcademicoAsistenciaController(AcademicoService academicoService) {
        this.academicoService = academicoService;
    }

    @GetMapping("/sheet")
    public ResponseEntity<AcademicoService.AsistenciaSheetResponse> getAsistenciaSheet(
            @RequestParam Long grupoId,
            @RequestParam Long asignaturaId,
            @RequestParam String fecha
    ) {
        return ResponseEntity.ok(academicoService.getAsistenciaSheet(grupoId, asignaturaId, LocalDate.parse(fecha)));
    }

    @GetMapping("/historial")
    public ResponseEntity<List<AcademicoService.AsistenciaHistorialItem>> getAsistenciaHistorial(
            @RequestParam Long grupoId,
            @RequestParam Long asignaturaId,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(academicoService.listAsistenciaHistorial(grupoId, asignaturaId, limit));
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<AcademicoService.AsistenciaEstudianteMetricaItem>> getAsistenciaMetrics(
            @RequestParam Long grupoId,
            @RequestParam Long asignaturaId,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin
    ) {
        return ResponseEntity.ok(academicoService.getAsistenciaMetrics(
                grupoId,
                asignaturaId,
                LocalDate.parse(fechaInicio),
                LocalDate.parse(fechaFin)
        ));
    }

    @PostMapping("/sheet")
    public ResponseEntity<Void> registrarAsistenciaLote(Authentication authentication, @RequestBody AcademicoController.AsistenciaSheetRegistroRequest request) {
        List<AcademicoService.AsistenciaRegistroInput> registros = request.registros() == null
                ? List.of()
                : request.registros().stream()
                    .map(r -> new AcademicoService.AsistenciaRegistroInput(r.estudianteId(), r.estadoAsistenciaId(), r.observaciones()))
                    .toList();

        academicoService.registrarAsistenciaLote(authentication.getName(), request.grupoId(), request.asignaturaId(), request.fecha(), registros);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}