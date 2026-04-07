package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Estudiante_Asignatura")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstudianteAsignatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Estudiante_Asignatura")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estudiante", nullable = false)
    @ToString.Exclude
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Asignatura", nullable = false)
    @ToString.Exclude
    private Asignatura asignatura;

    @Column(name = "Periodo")
    private LocalDate periodo;

    @Column(name = "Nota_Final")
    private Integer notaFinal;
}
