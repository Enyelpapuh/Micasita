package com.micasita.backend.dto.talleres;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CupoTallerResponse(
        Long id,
        LocalDate fecha,
        BigDecimal costo,
        Long idParticipante
) {
}
