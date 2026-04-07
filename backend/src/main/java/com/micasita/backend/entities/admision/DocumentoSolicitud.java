package com.micasita.backend.entities.admision;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Documento_Solicitud")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocumentoSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_doc_solicitud")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_solicitud", nullable = false)
    @ToString.Exclude
    private SolicitudAdmision solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_tipo_documento", nullable = false)
    @ToString.Exclude
    private TipoDocumento tipoDocumento;

    @Column(name = "Ruta_Archivo", length = 255)
    private String rutaArchivo;

    @Column(name = "Fecha_Subida")
    private LocalDateTime fechaSubida;
}
