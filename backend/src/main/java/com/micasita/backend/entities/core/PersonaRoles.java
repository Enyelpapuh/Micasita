package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Persona_Roles")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PersonaRoles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Persona_Roles")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona", nullable = false)
    @ToString.Exclude
    private Persona persona;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_roles", nullable = false)
    @ToString.Exclude
    private Roles rol;
}
