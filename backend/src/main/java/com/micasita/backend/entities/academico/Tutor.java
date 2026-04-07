package com.micasita.backend.entities.academico;

import com.micasita.backend.entities.core.Persona;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Tutor")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_tutor")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona", nullable = false)
    @ToString.Exclude
    private Persona persona;

    @Column(name = "Direccion", length = 100)
    private String direccion;

    @Column(name = "Cedula", length = 16)
    private String cedula;
}
