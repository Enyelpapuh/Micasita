package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.DocumentoEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentoEstudianteRepository extends JpaRepository<DocumentoEstudiante, Long> {
    boolean existsByEstudianteIdAndTipoDocumentoId(Long estudianteId, Long tipoDocumentoId);
}
