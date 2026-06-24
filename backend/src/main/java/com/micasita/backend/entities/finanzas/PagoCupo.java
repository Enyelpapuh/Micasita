package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.entities.talleres.CupoTaller;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Pago_cupo")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoCupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_pago_cupo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_cupo", nullable = false)
    @ToString.Exclude
    private CupoTaller cupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    @ToString.Exclude
    private Usuario usuario;

    @Column(name = "Numero_Recibo", length = 20, unique = true, nullable = false)
    private String numeroRecibo;

    @Column(name = "Monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_metodo_pago", nullable = false)
    @ToString.Exclude
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_pago", nullable = false)
    @ToString.Exclude
    private EstadoPago estadoPago;

    @Column(name = "Es_Anulado", columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean esAnulado;

    @Column(name = "Motivo_Anulacion", length = 255)
    private String motivoAnulacion;

    @Column(name = "Fecha_de_pago")
    private LocalDate fechaDePago;

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
