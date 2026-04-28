package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.EstudianteGrupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstudianteGrupoRepository extends JpaRepository<EstudianteGrupo, Long> {
    boolean existsByEstudianteIdAndGrupoId(Long estudianteId, Long grupoId);

    List<EstudianteGrupo> findByEstudianteIdOrderByIdAsc(Long estudianteId);

    List<EstudianteGrupo> findByGrupoIdOrderByIdAsc(Long grupoId);
}
