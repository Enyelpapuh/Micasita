package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.DocumentoEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentoEstudianteRepository extends JpaRepository<DocumentoEstudiante, Long> {
    List<DocumentoEstudiante> findByEstudianteIdOrderByIdDesc(Long estudianteId);

    boolean existsByEstudianteIdAndTipoDocumentoId(Long estudianteId, Long tipoDocumentoId);
}