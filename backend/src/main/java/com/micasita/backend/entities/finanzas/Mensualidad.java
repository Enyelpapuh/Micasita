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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    @ToString.Exclude
    private com.micasita.backend.entities.core.Usuario usuario;

    @Column(name = "fecha_de_pago")
    private LocalDate fechaDePago;

    @Column(name = "Monto_Base", precision = 10, scale = 2)
    private BigDecimal montoBase;

    @Column(name = "Monto_Mora", precision = 10, scale = 2)
    private BigDecimal montoMora;

    @Column(name = "Detalle", length = 200)
    private String detalle;

    @Column(name = "Mes_de_pago")
    private Integer mesDePago;

    @Column(name = "Numero_Recibo", length = 20, unique = true, nullable = false)
    private String numeroRecibo;

    @Column(name = "Es_Anulado", columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean esAnulado;

    @Column(name = "Motivo_Anulacion", length = 255)
    private String motivoAnulacion;

    @Column(name = "Monto_Reembolsado", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal montoReembolsado = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_caja_sesion")
    @ToString.Exclude
    private CajaSesion cajaSesion;

    @Column(name = "Monto_Recibido", precision = 10, scale = 2)
    private BigDecimal montoRecibido;

    @Column(name = "Cambio_Devuelto", precision = 10, scale = 2)
    private BigDecimal cambioDevuelto;
}
