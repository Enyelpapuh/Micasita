package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Pago_cupo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagoCupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_pago_cupo")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_cupo", nullable = false)
    @ToString.Exclude
    private CupoTaller cupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_metodo_pago", nullable = false)
    @ToString.Exclude
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_pago", nullable = false)
    @ToString.Exclude
    private EstadoPago estadoPago;

    @Column(name = "Monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "Detalle", length = 200)
    private String detalle;

    @Column(name = "Fecha_de_pago")
    private LocalDate fechaDePago;
}
