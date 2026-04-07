package com.micasita.backend.entities.academico;

import com.micasita.backend.entities.admision.TipoDocumento;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Documento_Estudiante")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocumentoEstudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_doc_estudiante")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_estudiante", nullable = false)
    @ToString.Exclude
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_tipo_documento", nullable = false)
    @ToString.Exclude
    private TipoDocumento tipoDocumento;

    @Column(name = "Ruta_Archivo", length = 255)
    private String rutaArchivo;

    @Column(name = "Fecha_Registro")
    private LocalDateTime fechaRegistro;
}
