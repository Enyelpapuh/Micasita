package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "Log_Auditoria")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_log")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    @ToString.Exclude
    private Usuario usuario;

    @Column(name = "Tabla_Afectada", length = 50)
    private String tablaAfectada;

    @Column(name = "ID_Registro", nullable = false)
    private Long idRegistro;

    @Column(name = "Accion", length = 10)
    private String accion;

    @Lob
    @Column(name = "Valor_Anterior")
    private String valorAnterior;

    @Lob
    @Column(name = "Valor_Nuevo")
    private String valorNuevo;

    @CreationTimestamp
    @Column(name = "Fecha_Hora", updatable = false)
    private LocalDateTime fechaHora;

    @Column(name = "IP_Terminal", length = 45)
    private String ipTerminal;
}