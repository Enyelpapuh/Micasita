package com.micasita.backend.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendimientoSistemaDTO {

    // Asumimos 4 columnas retornadas por el SP. Ajustar nombres si es necesario.
    private String periodo;            // e.g. fecha o etiqueta temporal
    private Long totalRequests;        // conteo total de peticiones
    private Double avgResponseMs;      // latencia promedio en ms
    private Double maxResponseMs;      // latencia máxima en ms

}
