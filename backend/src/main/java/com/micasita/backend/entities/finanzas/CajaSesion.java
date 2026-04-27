package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.core.Usuario;
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
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Caja_Sesion")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CajaSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_caja_sesion")
    private Long id;

    @Column(name = "Codigo", length = 40, nullable = false, unique = true)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_caja", nullable = false)
    @ToString.Exclude
    private EstadoCaja estadoCaja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario_apertura", nullable = false)
    @ToString.Exclude
    private Usuario usuarioApertura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario_cierre")
    @ToString.Exclude
    private Usuario usuarioCierre;

    @Column(name = "Saldo_inicial", precision = 10, scale = 2)
    private BigDecimal saldoInicial;

    @Column(name = "Saldo_cierre", precision = 10, scale = 2)
    private BigDecimal saldoCierre;

    @Column(name = "Observacion_apertura", length = 255)
    private String observacionApertura;

    @Column(name = "Observacion_cierre", length = 255)
    private String observacionCierre;

    @Column(name = "Fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "Fecha_cierre")
    private LocalDateTime fechaCierre;
}