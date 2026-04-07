package com.micasita.backend.entities.finanzas;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Metodo_Pago")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_metodo_pago")
    private Long id;

    @Column(name = "Nombre", length = 50)
    private String nombre;
}
