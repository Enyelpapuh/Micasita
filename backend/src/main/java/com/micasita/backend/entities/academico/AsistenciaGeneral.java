package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Asistencia_general")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AsistenciaGeneral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_asistencia_general")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Grupo", nullable = false)
    @ToString.Exclude
    private Grupo grupo;

    @Column(name = "Fecha")
    private LocalDate fecha;
}
