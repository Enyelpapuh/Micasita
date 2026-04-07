package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Roles")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Roles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_roles")
    private Long id;

    @Column(name = "Nombre_rol", length = 50)
    private String nombreRol;
}
