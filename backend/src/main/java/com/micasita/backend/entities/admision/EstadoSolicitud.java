package com.micasita.backend.entities.admision;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Estado_Solicitud")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_estado_solicitud")
    private Long id;

    @Column(name = "Nombre", length = 50)
    private String nombre;
}
