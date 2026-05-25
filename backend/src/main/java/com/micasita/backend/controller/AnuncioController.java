package com.micasita.backend.controller;

import com.micasita.backend.dto.core.AnuncioResponse;
import com.micasita.backend.dto.core.CreateAnuncioRequest;
import com.micasita.backend.dto.core.UpdateAnuncioRequest;
import com.micasita.backend.service.AnuncioService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/noticias")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
public class AnuncioController {

    private final AnuncioService anuncioService;

    public AnuncioController(AnuncioService anuncioService) {
        this.anuncioService = anuncioService;
    }

    @GetMapping
    public ResponseEntity<List<AnuncioResponse>> listPublic() {
        return ResponseEntity.ok(anuncioService.listPublic());
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
    @GetMapping("/admin")
    public ResponseEntity<List<AnuncioResponse>> listAdmin() {
        return ResponseEntity.ok(anuncioService.listAdmin());
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
        @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AnuncioResponse> create(
            Authentication authentication,
            @RequestBody CreateAnuncioRequest request
    ) {
        System.out.println("[AnuncioController] POST /noticias - user: " + authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(anuncioService.create(authentication.getName(), request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AnuncioResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody UpdateAnuncioRequest request
    ) {
        System.out.println("[AnuncioController] PUT /noticias/" + id + " - user: " + authentication.getName());
        return ResponseEntity.ok(anuncioService.update(authentication.getName(), id, request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
    @PostMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnuncioResponse> uploadImage(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        System.out.println("[AnuncioController] POST /noticias/" + id + "/imagen - user: " + authentication.getName());
        return ResponseEntity.ok(anuncioService.uploadImage(id, file));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        anuncioService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER')")
    @PatchMapping("/{id}/activo")
    public ResponseEntity<AnuncioResponse> setActive(@PathVariable Long id, @RequestParam("activo") boolean activo) {
        return ResponseEntity.ok(anuncioService.setActive(id, activo));
    }

    @GetMapping("/imagen/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        Resource resource = anuncioService.getImageResource(fileName);
        MediaType mediaType = anuncioService.getImageMediaType(fileName);
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}