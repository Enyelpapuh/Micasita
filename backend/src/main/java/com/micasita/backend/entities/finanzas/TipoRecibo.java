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
@Table(name = "Tipo_Recibo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TipoRecibo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_tipo_recibo")
    private Long id;

    @Column(name = "Nombre", length = 50, nullable = false)
    private String nombre;

    @Column(name = "Codigo", length = 10, nullable = false, unique = true)
    private String codigo;

    @Column(name = "Activo", nullable = false)
    private Boolean activo;
}