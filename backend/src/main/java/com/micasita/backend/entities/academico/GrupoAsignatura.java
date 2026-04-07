package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Grupo_Asignatura")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GrupoAsignatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Grupo_Asignatura")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Grupo", nullable = false)
    @ToString.Exclude
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Asignatura", nullable = false)
    @ToString.Exclude
    private Asignatura asignatura;
}
