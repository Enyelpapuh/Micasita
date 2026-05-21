package com.micasita.backend.entities.core;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Anuncio")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_anuncio")
    private Long id;

    @Column(name = "Titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "Descripcion", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String descripcion;

    @Column(name = "Ruta_Imagen", length = 500)
    private String rutaImagen;

    @Column(name = "Fecha_Publicacion", nullable = false)
    private LocalDateTime fechaPublicacion;

    @Column(name = "Fecha_Expiracion")
    private LocalDate fechaExpiracion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "Activo")
    private Boolean activo;
}