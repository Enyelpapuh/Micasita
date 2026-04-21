package com.micasita.backend.entities.core;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.*;

import java.time.LocalDate;

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

    @Column(name = "Fecha_Nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "Telefono", length = 20)
    private String telefono;

    @Column(name = "Correo", length = 100, unique = true)
    private String correo;

    @Column(name = "Identificador", length = 40, unique = true)
    private String identificador;

    @Column(name = "Activo")
    private Boolean activo;
}
