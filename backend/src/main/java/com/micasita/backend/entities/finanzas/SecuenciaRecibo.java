package com.micasita.backend.entities.finanzas;

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
import lombok.ToString;

@Entity
@Table(name = "Secuencia_Recibo")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SecuenciaRecibo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_secuencia_recibo")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_tipo_recibo", nullable = false)
    @ToString.Exclude
    private TipoRecibo tipoRecibo;

    @Column(name = "Anio", nullable = false)
    private Integer anio;

    @Column(name = "Mes", nullable = false)
    private Integer mes;

    @Column(name = "Ultimo_numero", nullable = false)
    private Integer ultimoNumero;
}