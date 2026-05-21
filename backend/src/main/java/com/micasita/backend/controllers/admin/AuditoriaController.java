package com.micasita.backend.controllers.admin;

import com.micasita.backend.dto.audit.RendimientoSistemaDTO;
import com.micasita.backend.service.AuditoriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/auditoria")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping("/rendimiento")
    @PreAuthorize("hasAnyAuthority('DASHBOARD_AUDITORIA','ROLE_ADMIN','ROLE_DIRECTOR')")
    public ResponseEntity<List<RendimientoSistemaDTO>> getRendimiento() {
        List<RendimientoSistemaDTO> data = auditoriaService.obtenerAuditoriaRendimiento();
        return ResponseEntity.ok(data);
    }
}
