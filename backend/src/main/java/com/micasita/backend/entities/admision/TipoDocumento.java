package com.micasita.backend.entities.admision;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Tipo_Documento")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TipoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_tipo_documento")
    private Long id;

    @Column(name = "Nombre", length = 100)
    private String nombre;

    @Column(name = "Es_Obligatorio", columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean esObligatorio;
}
