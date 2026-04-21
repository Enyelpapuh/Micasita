package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "Configuracion_Sistema")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConfiguracionSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_config")
    private Long id;

    @Column(name = "Nombre_Institucion", length = 150)
    private String nombreInstitucion;

    @Column(name = "Eslogan", length = 255)
    private String eslogan;

    @Column(name = "Ruta_Logo", length = 500)
    private String rutaLogo;

    @Column(name = "Correo_Contacto", length = 100)
    private String correoContacto;

    @Column(name = "Telefono", length = 20)
    private String telefono;

    @Column(name = "Direccion", length = 1000)
    private String direccion;

    @UpdateTimestamp
    @Column(name = "Ultima_Actualizacion")
    private LocalDateTime ultimaActualizacion;
}