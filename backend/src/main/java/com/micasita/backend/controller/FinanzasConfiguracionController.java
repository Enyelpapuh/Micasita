package com.micasita.backend.controller;

import com.micasita.backend.service.finanzas.ConfiguracionFinanzasService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/finanzas/configuracion")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyRole('ADMIN','DEVELOPER','ADMINISTRACION')")
public class FinanzasConfiguracionController {

    private final ConfiguracionFinanzasService configuracionFinanzasService;

    public FinanzasConfiguracionController(ConfiguracionFinanzasService configuracionFinanzasService) {
        this.configuracionFinanzasService = configuracionFinanzasService;
    }

    @GetMapping
    public ResponseEntity<ConfiguracionFinanzasService.ConfiguracionFinanzasResponse> getConfiguration() {
        return ResponseEntity.ok(configuracionFinanzasService.getConfiguration());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionFinanzasService.ConfiguracionFinanzasResponse> updateConfiguration(
            @RequestBody ConfiguracionFinanzasService.UpdateConfiguracionFinanzasRequest request
    ) {
        return ResponseEntity.ok(configuracionFinanzasService.updateConfiguration(request));
    }
}