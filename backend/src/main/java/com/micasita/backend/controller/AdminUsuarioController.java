package com.micasita.backend.controller;

import com.micasita.backend.dto.admin.CreateUsuarioRequest;
import com.micasita.backend.dto.admin.RolResponse;
import com.micasita.backend.dto.admin.UpdateUsuarioEstadoRequest;
import com.micasita.backend.dto.admin.UpdateUsuarioRolesRequest;
import com.micasita.backend.dto.admin.UsuarioAdminResponse;
import com.micasita.backend.service.AdminUsuarioService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/admin/usuarios")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
public class AdminUsuarioController {

    private final AdminUsuarioService adminUsuarioService;

    public AdminUsuarioController(AdminUsuarioService adminUsuarioService) {
        this.adminUsuarioService = adminUsuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioAdminResponse>> listUsuarios() {
        return ResponseEntity.ok(adminUsuarioService.listUsuarios());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RolResponse>> listRoles() {
        return ResponseEntity.ok(adminUsuarioService.listRoles());
    }

    @PostMapping
    public ResponseEntity<UsuarioAdminResponse> createUsuario(@RequestBody CreateUsuarioRequest request) {
        UsuarioAdminResponse created = adminUsuarioService.createUsuario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{usuarioId}/roles")
    public ResponseEntity<UsuarioAdminResponse> updateRoles(
            @PathVariable Long usuarioId,
            @RequestBody UpdateUsuarioRolesRequest request
    ) {
        return ResponseEntity.ok(adminUsuarioService.updateRoles(usuarioId, request));
    }

    @PutMapping("/{usuarioId}/estado")
    public ResponseEntity<UsuarioAdminResponse> updateEstado(
            @PathVariable Long usuarioId,
            @RequestBody UpdateUsuarioEstadoRequest request
    ) {
        return ResponseEntity.ok(adminUsuarioService.updateEstado(usuarioId, request));
    }

    @PostMapping(value = "/{usuarioId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioAdminResponse> uploadAvatar(
            @PathVariable Long usuarioId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(adminUsuarioService.uploadAvatar(usuarioId, file));
    }

    @GetMapping("/avatar/{fileName:.+}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Resource> getAvatar(@PathVariable String fileName) {
        Resource resource = adminUsuarioService.getAvatarResource(fileName);
        MediaType mediaType = adminUsuarioService.getAvatarMediaType(fileName);
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
