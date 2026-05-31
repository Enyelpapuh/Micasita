package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

import com.micasita.backend.entities.core.Usuario;

@Entity
@Table(name = "Asistencia_Estudiante")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AsistenciaEstudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_asistencia")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Estudiante_Asignatura", nullable = false)
    @ToString.Exclude
    private EstudianteAsignatura estudianteAsignatura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_Asistencia", nullable = false)
    @ToString.Exclude
    private EstadoAsistencia estadoAsistencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    @ToString.Exclude
    private Usuario usuario;

    @Column(name = "Fecha")
    private LocalDate fecha;

    @Column(name = "Observaciones", length = 200)
    private String observaciones;
}
