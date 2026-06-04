package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Usuario")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_usuario")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona", unique = true, nullable = false)
    @ToString.Exclude
    private Persona persona;

    @Column(name = "Email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "Password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "Path_avatar", length = 255)
    private String pathAvatar;

    @Column(name = "Activo", nullable = false, columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean activo;

    @Column(name = "Intentos_Fallidos", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer intentosFallidos = 0;

    @Column(name = "Token_Version", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private Long tokenVersion = 0L;
}
