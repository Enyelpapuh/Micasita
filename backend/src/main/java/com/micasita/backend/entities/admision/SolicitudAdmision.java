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
    @JoinColumn(name = "ID_persona", nullable = false)
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

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<DocumentoSolicitud> documentos;
}
