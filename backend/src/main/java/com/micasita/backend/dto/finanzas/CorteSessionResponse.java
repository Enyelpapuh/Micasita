package com.micasita.backend.dto.finanzas;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CorteSessionResponse(
        Long sessionId,
        String codigo,
        LocalDateTime fechaApertura,
        LocalDateTime fechaCierre,
        BigDecimal saldoInicial,
        BigDecimal saldoCierre,
        BigDecimal totalCobrado,
        BigDecimal totalAnulado,
        DesgloseCorte desglose,
        Integer cantidadAnulaciones,
        BigDecimal diferencia,
        String observacionCierre,
        String usuarioAperturaNombre,
        String usuarioCierreNombre
) {
    public record DesgloseCorte(
            CategoriaCorte matriculas,
            CategoriaCorte talleres,
            CategoriaCorte mensualidades
    ) {}

    public record CategoriaCorte(
            BigDecimal cobrado,
            BigDecimal anulado
    ) {}
}
