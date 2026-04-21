package com.micasita.backend.dto.talleres;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TallerResponse(
        Long id,
        String nombre,
        String descripcion,
        String rutaImagen,
        LocalDate fechaInicial,
        LocalDate fechaFinal,
        BigDecimal costo,
        Integer cuposMaximos,
        Integer edadMinima,
        Integer edadMaxima,
        Boolean activo,
        Long idTipoPublico,
        String tipoPublico,
        List<CupoTallerResponse> cupos
) {
}
