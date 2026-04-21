package com.micasita.backend.entities.talleres;

import com.micasita.backend.entities.BaseEntity;
import com.micasita.backend.entities.core.Persona;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity(name = "TalleresParticipante")
@Table(name = "Participante")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@AttributeOverride(name = "id", column = @Column(name = "ID_participante"))
public class Participante extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona")
    @ToString.Exclude
    private Persona persona;

    @Column(name = "Nombre_tmp", length = 100)
    private String nombreTmp;

    @Column(name = "Fecha_Nacimiento_tmp")
    private java.time.LocalDate fechaNacimientoTmp;

    @Column(name = "Nombre_responsable", length = 100)
    private String nombreResponsable;

    @Column(name = "Telefono_de_contacto", length = 20)
    private String telefonoDeContacto;

    @Column(name = "Activo")
    private Boolean activo;
}
