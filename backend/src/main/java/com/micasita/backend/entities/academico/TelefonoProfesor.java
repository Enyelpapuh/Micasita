package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Telefono_Profesor")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TelefonoProfesor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Telefono_Profesor")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_Profesor", nullable = false)
    @ToString.Exclude
    private Profesor profesor;

    @Column(name = "Celular")
    private Integer celular;
}
