package com.micasita.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.micasita.backend.entities.core.LogAuditoria;
import com.micasita.backend.repositories.core.LogAuditoriaRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import com.micasita.backend.service.finanzas.ConfiguracionFinanzasService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/finanzas/configuracion")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
public class FinanzasConfiguracionController {

    private final ConfiguracionFinanzasService configuracionFinanzasService;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    public FinanzasConfiguracionController(
            ConfiguracionFinanzasService configuracionFinanzasService,
            LogAuditoriaRepository logAuditoriaRepository,
            UsuarioRepository usuarioRepository,
            ObjectMapper objectMapper
    ) {
        this.configuracionFinanzasService = configuracionFinanzasService;
        this.logAuditoriaRepository = logAuditoriaRepository;
        this.usuarioRepository = usuarioRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('DASHBOARD_FINANZAS', 'ADMIN', 'DIRECCION', 'ADMINISTRACION', 'CAJA', 'ROLE_ADMIN', 'ROLE_DIRECCION', 'ROLE_ADMINISTRACION', 'ROLE_CAJA')")
    public ResponseEntity<ConfiguracionFinanzasService.ConfiguracionFinanzasResponse> getConfiguration() {
        return ResponseEntity.ok(configuracionFinanzasService.getConfiguration());
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('DASHBOARD_FINANZAS', 'ADMIN', 'DIRECCION', 'ADMINISTRACION', 'ROLE_ADMIN', 'ROLE_DIRECCION', 'ROLE_ADMINISTRACION')")
    public ResponseEntity<ConfiguracionFinanzasService.ConfiguracionFinanzasResponse> updateConfiguration(
            Authentication authentication,
            HttpServletRequest httpRequest,
            @RequestBody ConfiguracionFinanzasService.UpdateConfiguracionFinanzasRequest request
    ) {
        // 1. Obtener valores antes de guardar para el historial
        var valorAnterior = configuracionFinanzasService.getConfiguration();

        // 2. Guardar la configuración en BD
        var response = configuracionFinanzasService.updateConfiguration(request);

        // 3. Auditoría Manual Controlada
        try {
            LogAuditoria log = new LogAuditoria();
            log.setTablaAfectada("Configuracion_Finanzas");
            log.setAccion("UPDATE");
            log.setIdRegistro(1L); // ID genérico por ser configuración global
            
            usuarioRepository.findByEmail(authentication.getName()).ifPresent(u -> log.setIdUsuario(u.getId()));
            
            log.setIpTerminal(httpRequest.getRemoteAddr());
            String userAgent = httpRequest.getHeader("User-Agent");
            log.setNavegadorCliente(userAgent != null && userAgent.length() > 255 ? userAgent.substring(0, 255) : userAgent);
            
            log.setValorAnterior(objectMapper.writeValueAsString(valorAnterior));
            log.setValorNuevo(objectMapper.writeValueAsString(response));
            log.setFechaHora(LocalDateTime.now());
            
            logAuditoriaRepository.save(log);
        } catch (Exception e) {
            System.err.println("Error guardando log de auditoría manual: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}