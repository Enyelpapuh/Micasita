package com.micasita.backend.entities.talleres;

import com.micasita.backend.entities.BaseEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity(name = "TalleresCupoTaller")
@Table(name = "Cupo_taller")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@AttributeOverride(name = "id", column = @Column(name = "ID_cupo"))
public class CupoTaller extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "ID_participante", nullable = false)
	@ToString.Exclude
	private Participante participante;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "ID_taller", nullable = false)
	@ToString.Exclude
	private Taller taller;

	@Column(name = "Fecha")
	private LocalDate fecha;

	@Transient
	private String descripcion;

	@Column(name = "Costo", precision = 10, scale = 2)
	private BigDecimal costo;
}
