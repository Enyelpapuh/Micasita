package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Estado_Matricula")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoMatricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_estado_matricula")
    private Long id;

    @Column(name = "Nombre_Estado", length = 50, nullable = false)
    private String nombreEstado;
}