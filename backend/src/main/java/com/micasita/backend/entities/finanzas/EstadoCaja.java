package com.micasita.backend.entities.finanzas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Estado_Caja")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_estado_caja")
    private Long id;

    @Column(name = "Nombre", length = 20, nullable = false, unique = true)
    private String nombre;
}