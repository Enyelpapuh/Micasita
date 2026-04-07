package com.micasita.backend.entities.academico;

import com.micasita.backend.entities.core.Persona;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Participante")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Participante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_participante")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona", nullable = false)
    @ToString.Exclude
    private Persona persona;
}
