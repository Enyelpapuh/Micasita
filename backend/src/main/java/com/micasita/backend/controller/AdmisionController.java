package com.micasita.backend.controller;

import com.micasita.backend.dto.admision.CreateSolicitudAdmisionRequest;
import com.micasita.backend.dto.admision.CreateSolicitudAdmisionResponse;
import com.micasita.backend.dto.admision.CreateTipoDocumentoRequest;
import com.micasita.backend.dto.admision.EstadoSolicitudResponse;
import com.micasita.backend.dto.admision.LandingAdmisionConfigResponse;
import com.micasita.backend.dto.admision.SolicitudAdmisionResponse;
import com.micasita.backend.dto.admision.TipoDocumentoResponse;
import com.micasita.backend.dto.admision.ToggleFormularioAdmisionRequest;
import com.micasita.backend.dto.admision.UpdateTipoDocumentoRequest;
import com.micasita.backend.dto.admision.UpdateSolicitudAdmisionRequest;
import com.micasita.backend.service.AdmisionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admision")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
public class AdmisionController {

    private final AdmisionService admisionService;

    public AdmisionController(AdmisionService admisionService) {
        this.admisionService = admisionService;
    }

    @GetMapping("/config")
    public ResponseEntity<LandingAdmisionConfigResponse> getLandingConfig() {
        return ResponseEntity.ok(admisionService.getLandingConfig());
    }

    @PostMapping(value = "/solicitudes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CreateSolicitudAdmisionResponse> createSolicitud(
            @RequestPart("payload") CreateSolicitudAdmisionRequest request,
            @RequestParam Map<String, MultipartFile> files
    ) {
        try {
            Map<Long, MultipartFile> filesByTipo = admisionService.parseFilesByTipo(files);
            return ResponseEntity.status(HttpStatus.CREATED).body(admisionService.createSolicitud(request, filesByTipo));
        } catch (RuntimeException ex) {
            if (ex instanceof ResponseStatusException) {
                throw ex;
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_PAYLOAD_INVALIDO", ex);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @GetMapping("/admin/solicitudes")
    public ResponseEntity<List<SolicitudAdmisionResponse>> listSolicitudesAdmin() {
        return ResponseEntity.ok(admisionService.listSolicitudes());
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @PutMapping("/admin/solicitudes/{solicitudId}")
    public ResponseEntity<SolicitudAdmisionResponse> updateSolicitud(
            @PathVariable Long solicitudId,
            @RequestBody UpdateSolicitudAdmisionRequest request
    ) {
        return ResponseEntity.ok(admisionService.updateSolicitud(solicitudId, request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @GetMapping("/admin/tipos-documento")
    public ResponseEntity<List<TipoDocumentoResponse>> listTiposDocumentoAdmin() {
        return ResponseEntity.ok(admisionService.listTiposDocumento());
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @PostMapping("/admin/tipos-documento")
    public ResponseEntity<TipoDocumentoResponse> createTipoDocumentoAdmin(@RequestBody CreateTipoDocumentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(admisionService.createTipoDocumento(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @PutMapping("/admin/tipos-documento/{tipoDocumentoId}")
    public ResponseEntity<TipoDocumentoResponse> updateTipoDocumentoAdmin(
            @PathVariable Long tipoDocumentoId,
            @RequestBody UpdateTipoDocumentoRequest request
    ) {
        return ResponseEntity.ok(admisionService.updateTipoDocumento(tipoDocumentoId, request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @DeleteMapping("/admin/tipos-documento/{tipoDocumentoId}")
    public ResponseEntity<Void> deleteTipoDocumentoAdmin(@PathVariable Long tipoDocumentoId) {
        admisionService.deleteTipoDocumento(tipoDocumentoId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @GetMapping("/admin/estados")
    public ResponseEntity<List<EstadoSolicitudResponse>> listEstadosAdmin() {
        return ResponseEntity.ok(admisionService.listEstadosSolicitud());
    }

    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_DIRECCION','DEVELOPER','ADMINISTRACION')")
    @PutMapping("/admin/formulario")
    public ResponseEntity<Boolean> toggleFormulario(@RequestBody ToggleFormularioAdmisionRequest request) {
        return ResponseEntity.ok(admisionService.updateFormularioActivo(request));
    }

    @GetMapping("/documentos/**")
    public ResponseEntity<Resource> getDocumento(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String marker = "/admision/documentos/";
        int markerIndex = requestUri.indexOf(marker);
        if (markerIndex < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMISION_DOCUMENTO_NOMBRE_INVALIDO");
        }

        String encodedPath = requestUri.substring(markerIndex + marker.length());
        String fileName = URLDecoder.decode(encodedPath, StandardCharsets.UTF_8);

        Resource resource = admisionService.getDocumentoResource(fileName);
        MediaType mediaType = admisionService.getDocumentoMediaType(fileName);
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
