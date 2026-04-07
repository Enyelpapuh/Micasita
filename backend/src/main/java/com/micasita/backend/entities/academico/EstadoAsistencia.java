package com.micasita.backend.entities.academico;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Estado_Asistencia")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoAsistencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_estado_asistencia")
    private Long id;

    @Column(name = "Nombre", length = 50)
    private String nombre;
}
