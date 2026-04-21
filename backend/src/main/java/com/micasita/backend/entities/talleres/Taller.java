package com.micasita.backend.entities.talleres;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "TalleresTaller")
@Table(name = "Taller")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Taller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_taller")
    private Long id;

    @Column(name = "Nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;

    @Column(name = "Ruta_Imagen", length = 255)
    private String rutaImagen;

    @Column(name = "Fecha_inicial")
    private LocalDate fechaInicial;

    @Column(name = "Fecha_final")
    private LocalDate fechaFinal;

    @Column(name = "Costo", precision = 10, scale = 2)
    private BigDecimal costo;

    @Column(name = "Cupos_maximos")
    private Integer cuposMaximos;

    @Column(name = "Edad_minima")
    private Integer edadMinima;

    @Column(name = "Edad_maxima")
    private Integer edadMaxima;

    @Column(name = "Activo")
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_tipo_publico", nullable = false)
    @ToString.Exclude
    private TipoPublicoTaller tipoPublico;

    @Builder.Default
    @OneToMany(mappedBy = "taller", fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<CupoTaller> cupos = new ArrayList<>();
}
