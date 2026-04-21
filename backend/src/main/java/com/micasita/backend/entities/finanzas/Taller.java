package com.micasita.backend.entities.finanzas;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Taller {

    private Long id;
    private String nombre;
    private String descripcion;
    private String rutaImagen;
    private LocalDate fechaInicial;
    private LocalDate fechaFinal;
    private BigDecimal costo;
    private Integer cuposMaximos;
}
