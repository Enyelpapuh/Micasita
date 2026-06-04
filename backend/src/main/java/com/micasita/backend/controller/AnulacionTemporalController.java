package com.micasita.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/admin/caja/anulaciones-temporales")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173", "http://localhost:4000"})
public class AnulacionTemporalController {

    public record AnulacionRequest(String idUnico, String type, Integer idElemento, String label, Double monto, String timestamp, String status) {}

    // Memoria volátil compartida entre navegadores (se borra si se reinicia el servidor)
    private static final Map<String, AnulacionRequest> pendingStore = new ConcurrentHashMap<>();

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AnulacionRequest>> getPending() {
        return ResponseEntity.ok(new ArrayList<>(pendingStore.values()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> requestAnnulment(@RequestBody AnulacionRequest request) {
        pendingStore.put(request.idUnico(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{idUnico}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateStatus(@PathVariable String idUnico, @RequestBody Map<String, String> body) {
        AnulacionRequest existing = pendingStore.get(idUnico);
        if (existing != null) {
            String newStatus = body.get("status");
            AnulacionRequest updated = new AnulacionRequest(
                    existing.idUnico(), existing.type(), existing.idElemento(),
                    existing.label(), existing.monto(), existing.timestamp(), newStatus);
            pendingStore.put(idUnico, updated);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{idUnico}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeAnnulment(@PathVariable String idUnico) {
        pendingStore.remove(idUnico);
        return ResponseEntity.ok().build();
    }
}