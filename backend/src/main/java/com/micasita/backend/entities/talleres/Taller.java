package com.micasita.backend.entities.talleres;

import com.micasita.backend.entities.BaseEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "TalleresTaller")
@Table(name = "Taller")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@AttributeOverride(name = "id", column = @Column(name = "ID_taller"))
public class Taller extends BaseEntity {

    @Column(name = "Nombre", length = 100)
    private String nombre;

    @Column(name = "Descripcion", length = 200)
    private String descripcion;

    @Column(name = "Fecha_inicial")
    private LocalDate fechaInicial;

    @Column(name = "Fecha_final")
    private LocalDate fechaFinal;

    @Column(name = "Costo", precision = 10, scale = 2)
    private BigDecimal costo;

    @Column(name = "Cupos_maximos")
    private Integer cuposMaximos;

    @Builder.Default
    @OneToMany(mappedBy = "taller", fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<CupoTaller> cupos = new ArrayList<>();
}
