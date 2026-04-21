package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.EstudianteAsignatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EstudianteAsignaturaRepository extends JpaRepository<EstudianteAsignatura, Long> {
    boolean existsByEstudianteIdAndAsignaturaId(Long estudianteId, Long asignaturaId);

    Optional<EstudianteAsignatura> findByEstudianteIdAndAsignaturaId(Long estudianteId, Long asignaturaId);

    List<EstudianteAsignatura> findByAsignaturaIdAndEstudianteIdIn(Long asignaturaId, List<Long> estudianteIds);
}
