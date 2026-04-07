package com.micasita.backend.entities.academico;

import com.micasita.backend.entities.core.Persona;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Profesor")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Profesor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Profesor")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona", nullable = false)
    @ToString.Exclude
    private Persona persona;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Puesto", nullable = false)
    @ToString.Exclude
    private Puesto puesto;

    @Column(name = "Carrera", length = 100)
    private String carrera;
}
