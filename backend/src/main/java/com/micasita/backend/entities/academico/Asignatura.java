package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Asignatura")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Asignatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Asignatura")
    private Long id;

    @Column(name = "Nombre", length = 200)
    private String nombre;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;
}
