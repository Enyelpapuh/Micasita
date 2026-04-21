package com.micasita.backend.entities.admision;

import com.micasita.backend.entities.core.Persona;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Solicitud_Admision")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SolicitudAdmision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_solicitud")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_persona")
    @ToString.Exclude
    private Persona persona;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estado_solicitud", nullable = false)
    @ToString.Exclude
    private EstadoSolicitud estadoSolicitud;

    @CreationTimestamp
    @Column(name = "Fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "Comentarios_Director", length = 500)
    private String comentariosDirector;

    @Column(name = "Nombre_Postulante", length = 100)
    private String nombrePostulante;

    @Column(name = "Apellido_Postulante", length = 100)
    private String apellidoPostulante;

    @Column(name = "Fecha_Nacimiento_Postulante")
    private java.time.LocalDate fechaNacimientoPostulante;

    @Column(name = "Telefono_Postulante", length = 20)
    private String telefonoPostulante;

    @Column(name = "Correo_Postulante", length = 100)
    private String correoPostulante;

    @Column(name = "Identificador_Postulante", length = 40)
    private String identificadorPostulante;

    @Column(name = "Tutores_Adicionales_Resumen", length = 1200)
    private String tutoresAdicionalesResumen;

    @Column(name = "Nombre_Tutor", length = 120)
    private String nombreTutor;

    @Column(name = "Parentesco_Tutor", length = 60)
    private String parentescoTutor;

    @Column(name = "Telefono_Tutor", length = 20)
    private String telefonoTutor;

    @Column(name = "Correo_Tutor", length = 100)
    private String correoTutor;

    @Column(name = "Activo")
    private Boolean activo;

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<DocumentoSolicitud> documentos;
}
