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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    @ToString.Exclude
    private com.micasita.backend.entities.core.Usuario usuario;

    @Column(name = "fecha_de_pago")
    private LocalDate fechaDePago;

    @Column(name = "Monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "Detalle", length = 200)
    private String detalle;

    @Column(name = "Numero_Recibo", length = 20, unique = true, nullable = false)
    private String numeroRecibo;

    @Column(name = "Es_Anulado", columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean esAnulado;

    @Column(name = "Motivo_Anulacion", length = 255)
    private String motivoAnulacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_caja_sesion")
    @ToString.Exclude
    private CajaSesion cajaSesion;
}
