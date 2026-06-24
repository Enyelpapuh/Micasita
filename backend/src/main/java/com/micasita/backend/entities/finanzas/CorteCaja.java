package com.micasita.backend.entities.finanzas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Corte_Caja")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CorteCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_corte")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_caja_sesion", nullable = false)
    @ToString.Exclude
    private CajaSesion cajaSesion;

    @Column(name = "Total_cobrado", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalCobrado;

    @Column(name = "Total_anulado", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAnulado;

    @Column(name = "Total_matriculas", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalMatriculas;

    @Column(name = "Total_talleres", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalTalleres;

    @Column(name = "Total_mensualidades", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalMensualidades;

    @Column(name = "Cantidad_anulaciones", nullable = false)
    private Integer cantidadAnulaciones;

    @Column(name = "Diferencia", precision = 10, scale = 2, nullable = false)
    private BigDecimal diferencia;

    @Column(name = "Fecha_corte", nullable = false)
    private LocalDateTime fechaCorte;
}
