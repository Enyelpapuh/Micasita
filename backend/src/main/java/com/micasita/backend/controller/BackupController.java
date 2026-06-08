package com.micasita.backend.controller;

import com.micasita.backend.service.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/admin/backup")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173", "http://localhost:4000"})
public class BackupController {

    @Autowired
    private BackupService backupService;

    @PostMapping("/generar")
    @PreAuthorize("hasAnyAuthority('DIRECTOR', 'ADMIN', 'DEVELOPER', 'ROLE_DIRECTOR', 'ROLE_ADMIN', 'ROLE_DEVELOPER')")
    public ResponseEntity<?> generarBackup() {
        try {
            String backupPath = backupService.generarBackupManual();
            return ResponseEntity.ok(Map.of("mensaje", "Copia de seguridad generada con éxito.", "ruta", backupPath, "fecha", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error al generar backup. Verifica que SQL Server tiene permisos en C:\\Backups. Detalle: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    @PreAuthorize("hasAnyAuthority('DIRECTOR', 'ADMIN', 'DEVELOPER', 'ROLE_DIRECTOR', 'ROLE_ADMIN', 'ROLE_DEVELOPER')")
    public ResponseEntity<?> listBackups() {
        return ResponseEntity.ok(backupService.listarBackups());
    }

    @GetMapping("/download/{fileName}")
    @PreAuthorize("hasAnyAuthority('DIRECTOR', 'ADMIN', 'DEVELOPER', 'ROLE_DIRECTOR', 'ROLE_ADMIN', 'ROLE_DEVELOPER')")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String fileName) {
        Resource resource = backupService.descargarBackup(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}