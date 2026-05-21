package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "Auditoria_Accesos_Sistema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaAccesoSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_acceso")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "Email_Usuario", nullable = false, length = 100)
    private String emailUsuario;

    @Column(name = "Fecha_Ingreso")
    private LocalDateTime fechaIngreso;

    @Column(name = "IP_Terminal", nullable = false, length = 45)
    private String ipTerminal;

    @Column(name = "Navegador_Cliente", length = 255)
    private String navegadorCliente;

    @Column(name = "Estado_Intento", nullable = false, length = 20)
    private String estadoIntento;

}
