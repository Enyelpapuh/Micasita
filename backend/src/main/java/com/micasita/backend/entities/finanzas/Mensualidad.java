package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.academico.Estudiante;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Mensualidad")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Mensualidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_pago_mensualidad")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estudiante", nullable = false)
    @ToString.Exclude
    private Estudiante estudiante;

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

    @Column(name = "Mes_de_pago", length = 20)
    private String mesDePago;
}
