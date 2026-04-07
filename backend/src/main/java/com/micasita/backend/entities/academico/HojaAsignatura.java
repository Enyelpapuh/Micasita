package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Hoja_Asignatura")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HojaAsignatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Hoja_Asignatura")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Asignatura", nullable = false)
    @ToString.Exclude
    private Asignatura asignatura;

    @Column(name = "Nombre", length = 100)
    private String nombre;
}
