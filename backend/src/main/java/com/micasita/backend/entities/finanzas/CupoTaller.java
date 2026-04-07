package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.academico.Participante;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Cupo_taller")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CupoTaller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_cupo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_participante", nullable = false)
    @ToString.Exclude
    private Participante participante;

    @Column(name = "Fecha")
    private LocalDate fecha;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;

    @Column(name = "Costo", precision = 10, scale = 2)
    private BigDecimal costo;
}
