package com.micasita.backend.entities.core;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.*;

@Entity
@Table(name = "Persona")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_persona")
    private Long id;

    @Column(name = "Nombre", length = 100)
    private String nombre;

    @Column(name = "Apellido", length = 100)
    private String apellido;

    @Column(name = "Edad")
    private Integer edad;

    @Column(name = "Telefono", length = 20)
    private String telefono;
}
