package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.GrupoAsignatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrupoAsignaturaRepository extends JpaRepository<GrupoAsignatura, Long> {
    boolean existsByGrupoIdAndAsignaturaId(Long grupoId, Long asignaturaId);

    List<GrupoAsignatura> findByGrupoIdOrderByIdAsc(Long grupoId);
}
