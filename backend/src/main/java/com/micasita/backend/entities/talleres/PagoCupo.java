package com.micasita.backend.entities.talleres;

import com.micasita.backend.entities.BaseEntity;
import com.micasita.backend.entities.finanzas.EstadoPago;
import com.micasita.backend.entities.finanzas.MetodoPago;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity(name = "TalleresPagoCupo")
@Table(name = "Pago_cupo")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@AttributeOverride(name = "id", column = @Column(name = "ID_pago_cupo"))
public class PagoCupo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
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
