package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.ProfesorGrupo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfesorGrupoRepository extends JpaRepository<ProfesorGrupo, Long> {
    boolean existsByProfesorIdAndGrupoId(Long profesorId, Long grupoId);
}
