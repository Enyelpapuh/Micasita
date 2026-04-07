package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Estudiante_Grupo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstudianteGrupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Estudiante_Grupo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estudiante", nullable = false)
    @ToString.Exclude
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Grupo", nullable = false)
    @ToString.Exclude
    private Grupo grupo;

    @Column(name = "Fecha_Inscripcion")
    private LocalDate fechaInscripcion;
}
