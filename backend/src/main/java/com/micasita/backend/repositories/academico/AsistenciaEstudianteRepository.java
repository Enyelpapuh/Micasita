package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.AsistenciaEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AsistenciaEstudianteRepository extends JpaRepository<AsistenciaEstudiante, Long> {
    Optional<AsistenciaEstudiante> findByEstudianteAsignaturaIdAndFecha(Long estudianteAsignaturaId, LocalDate fecha);

    List<AsistenciaEstudiante> findByEstudianteAsignaturaIdInAndFecha(List<Long> estudianteAsignaturaIds, LocalDate fecha);

    List<AsistenciaEstudiante> findByEstudianteAsignaturaIdInAndFechaBetween(List<Long> estudianteAsignaturaIds, LocalDate start, LocalDate end);
}
