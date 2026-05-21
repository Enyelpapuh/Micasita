package com.micasita.backend.service;

import com.micasita.backend.dto.audit.RendimientoSistemaDTO;
import com.micasita.backend.repositories.core.AuditoriaAccesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AuditoriaService {

    private final AuditoriaAccesoRepository auditoriaRepo;

    public AuditoriaService(AuditoriaAccesoRepository auditoriaRepo) {
        this.auditoriaRepo = auditoriaRepo;
    }

    /**
     * Invoca el repositorio JPA que ejecuta el SP nativo y mapea cada fila
     * posicional (Object[]) a RendimientoSistemaDTO de forma segura.
     */
    @Transactional(readOnly = true)
    public List<RendimientoSistemaDTO> obtenerAuditoriaRendimiento() {
        List<Object[]> rows = auditoriaRepo.ejecutarSpAuditoriaRendimiento();

        return rows == null ? List.of() : rows.stream()
                .filter(Objects::nonNull)
                .map(this::mapRowToDto)
                .collect(Collectors.toList());
    }

    private RendimientoSistemaDTO mapRowToDto(Object[] row) {
        // Defender contra filas cortas
        String periodo = safeToString(row, 0);
        Long totalRequests = safeToLong(row, 1);
        Double avgResponseMs = safeToDouble(row, 2);
        Double maxResponseMs = safeToDouble(row, 3);

        return RendimientoSistemaDTO.builder()
                .periodo(periodo)
                .totalRequests(totalRequests)
                .avgResponseMs(avgResponseMs)
                .maxResponseMs(maxResponseMs)
                .build();
    }

    private String safeToString(Object[] row, int idx) {
        if (row == null || idx >= row.length) return null;
        Object v = row[idx];
        return v == null ? null : v.toString();
    }

    private Long safeToLong(Object[] row, int idx) {
        if (row == null || idx >= row.length) return null;
        Object v = row[idx];
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        if (v instanceof Timestamp) return ((Timestamp) v).getTime();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Double safeToDouble(Object[] row, int idx) {
        if (row == null || idx >= row.length) return null;
        Object v = row[idx];
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).doubleValue();
        try {
            return Double.parseDouble(v.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

}
