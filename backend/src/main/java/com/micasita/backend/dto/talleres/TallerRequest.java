package com.micasita.backend.dto.talleres;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TallerRequest(
        String nombre,
        String descripcion,
        LocalDate fechaInicial,
        LocalDate fechaFinal,
        BigDecimal costo,
        Integer cuposMaximos,
        Integer edadMinima,
        Integer edadMaxima,
        Boolean activo,
        Long idTipoPublico
) {
}
