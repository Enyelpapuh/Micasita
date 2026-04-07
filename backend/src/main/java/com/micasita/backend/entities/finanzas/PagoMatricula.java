package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Pago_matricula")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagoMatricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_pago_matricula")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_matricula", nullable = false)
    @ToString.Exclude
    private Matricula matricula;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_metodo_pago", nullable = false)
    @ToString.Exclude
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_pago", nullable = false)
    @ToString.Exclude
    private EstadoPago estadoPago;

    @Column(name = "fecha_de_pago")
    private LocalDate fechaDePago;

    @Column(name = "Monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "Detalle", length = 200)
    private String detalle;
}
