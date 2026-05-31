package com.micasita.backend.controller;

import com.micasita.backend.service.AcademicoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/academico/docente")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyAuthority('DASHBOARD_ACADEMICO','ROLE_ADMIN','ROLE_DEVELOPER','ROLE_ADMINISTRACION','ROLE_ADMIN_DIRECCION','ROLE_PROFESOR','ROLE_DOCENTE')")
public class AcademicoDocenteController {

    private final AcademicoService academicoService;

    public AcademicoDocenteController(AcademicoService academicoService) {
        this.academicoService = academicoService;
    }

    @GetMapping("/mis-clases")
    public ResponseEntity<List<AcademicoService.ClaseProfesorItem>> listMisClasesDocente(Authentication authentication) {
        return ResponseEntity.ok(academicoService.listMisClasesProfesor(authentication.getName()));
    }
}