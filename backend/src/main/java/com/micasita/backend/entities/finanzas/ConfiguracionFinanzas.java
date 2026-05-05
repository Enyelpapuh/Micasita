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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Configuracion_Finanzas")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConfiguracionFinanzas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_config_finanzas")
    private Long id;

    @Column(name = "Monto_Matricula_Base", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMatriculaBase;

    @Column(name = "Monto_Mensualidad_Base", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMensualidadBase;

    @Column(name = "Monto_Mora_Fija", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoMoraFija;

    @Column(name = "Porcentaje_Descuento_Familiar", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeDescuentoFamiliar;

    @Column(name = "Maximo_Descuento_Familiar", precision = 10, scale = 2, nullable = false)
    private BigDecimal maximoDescuentoFamiliar;

    @Column(name = "Aplicar_Mora_Automatica", nullable = false)
    private Boolean aplicarMoraAutomatica;

    @Column(name = "Dias_Limite_Mora", nullable = false)
    private Integer diasLimiteMora;

    @Column(name = "Activo", nullable = false)
    private Boolean activo;

    @UpdateTimestamp
    @Column(name = "Ultima_Actualizacion")
    private LocalDateTime ultimaActualizacion;
}