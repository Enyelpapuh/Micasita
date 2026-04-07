package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Grupo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Grupo")
    private Long id;

    @Column(name = "Nombre", length = 100)
    private String nombre;

    @Column(name = "Codigo_funcion")
    private Integer codigoFuncion;
}
