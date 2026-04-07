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

    @Column(name = "Email", unique = true, length = 100)
    private String email;

    @Column(name = "Password_hash", length = 255)
    private String passwordHash;

    @Column(name = "Activo", columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean activo;
}
