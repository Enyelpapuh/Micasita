package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Puesto")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Puesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Puesto")
    private Long id;

    @Column(name = "Nombre", length = 200)
    private String nombre;

    @Column(name = "Descripcion", length = 300)
    private String descripcion;

    @Column(name = "Rango", length = 50)
    private String rango;
}
