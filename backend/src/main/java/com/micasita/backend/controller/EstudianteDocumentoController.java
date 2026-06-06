package com.micasita.backend.controller;

import com.micasita.backend.service.AcademicoService;
import com.micasita.backend.service.AcademicoService.DocumentoEstudianteItem;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/admin/estudiantes")
@PreAuthorize("hasAnyAuthority('DASHBOARD_ACADEMICO', 'ESTUDIANTES_MANAGE', 'ADMIN', 'DEVELOPER', 'ADMIN_DIRECCION', 'DIRECTOR')")
public class EstudianteDocumentoController {

    private final AcademicoService academicoService;

    public EstudianteDocumentoController(AcademicoService academicoService) {
        this.academicoService = academicoService;
    }

    @GetMapping("/{estudianteId}/documentos")
    public ResponseEntity<List<DocumentoEstudianteItem>> listDocumentos(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(academicoService.listDocumentosEstudiante(estudianteId));
    }

    @PostMapping("/{estudianteId}/documentos")
    public ResponseEntity<DocumentoEstudianteItem> uploadDocumento(
            @PathVariable Long estudianteId,
            @RequestParam("tipoDocumentoId") Long tipoDocumentoId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(academicoService.uploadDocumentoEstudiante(estudianteId, tipoDocumentoId, file));
    }

    @DeleteMapping("/documentos/{docId}")
    public ResponseEntity<Void> deleteDocumento(@PathVariable Long docId) {
        academicoService.deleteDocumentoEstudiante(docId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documentos/archivo/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Resource resource = academicoService.serveDocumentoEstudiante(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}