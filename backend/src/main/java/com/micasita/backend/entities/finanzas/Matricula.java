package com.micasita.backend.entities.finanzas;

import com.micasita.backend.entities.academico.Estudiante;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Matricula")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_matricula")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estudiante", nullable = false)
    @ToString.Exclude
    private Estudiante estudiante;

    @Column(name = "fecha_matricula")
    private LocalDate fechaMatricula;

    @Column(name = "Anio_lectivo", length = 20)
    private String anioLectivo;

    @Column(name = "Estado", length = 50)
    private String estado;
}
