package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Trabajo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Trabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Trabajo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Estudiante_Asignatura", nullable = false)
    @ToString.Exclude
    private EstudianteAsignatura estudianteAsignatura;

    @Column(name = "Nota")
    private Integer nota;

    @Column(name = "Fecha")
    private LocalDate fecha;
}
