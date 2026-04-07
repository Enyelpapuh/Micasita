package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Estado_Pago")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_estado_pago")
    private Long id;

    @Column(name = "Nombre", length = 50)
    private String nombre;
}
