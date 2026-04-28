package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Profesor_Grupo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfesorGrupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Profesor_Grupo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Profesor", nullable = false)
    @ToString.Exclude
    private Profesor profesor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Grupo", nullable = false)
    @ToString.Exclude
    private Grupo grupo;

    @Column(name = "Cantidad_Alumnos", insertable = false, updatable = false)
    private Integer cantidadAlumnos;


    @Column(name = "Fecha_Inicio")
    private LocalDate fechaInicio;
}
