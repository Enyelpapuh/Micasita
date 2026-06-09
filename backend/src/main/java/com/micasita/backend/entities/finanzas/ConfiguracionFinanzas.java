package com.micasita.backend.entities.finanzas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "Configuracion_Finanzas")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConfiguracionFinanzas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_configuracion")
    private Long id;

    @Builder.Default
    @Column(name = "Monto_Matricula_Base", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMatriculaBase = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "Monto_Mensualidad_Base", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMensualidadBase = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "Monto_Mora", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMora = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "Dias_Gracia", nullable = false)
    private Integer diasGracia = 5;

    @Builder.Default
    @Column(name = "Activo", nullable = false)
    private Boolean activo = true;
}