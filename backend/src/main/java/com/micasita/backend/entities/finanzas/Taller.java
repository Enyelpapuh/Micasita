package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Taller")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Taller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_taller")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_cupo", nullable = false)
    @ToString.Exclude
    private CupoTaller cupo;

    @Column(name = "Nombre", length = 100)
    private String nombre;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;

    @Column(name = "Fecha_inicial")
    private LocalDate fechaInicial;

    @Column(name = "Fecha_final")
    private LocalDate fechaFinal;

    @Column(name = "Costo", precision = 10, scale = 2)
    private BigDecimal costo;

    @Column(name = "Cupos_maximos")
    private Integer cuposMaximos;
}
