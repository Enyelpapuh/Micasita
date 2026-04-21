package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.academico.Participante;
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
public class CupoTaller {

    private Long id;
    private Taller taller;
    private Participante participante;
    private LocalDate fecha;
    private String descripcion;
    private BigDecimal costo;
}
