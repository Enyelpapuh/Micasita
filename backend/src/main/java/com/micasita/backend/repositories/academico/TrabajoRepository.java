package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Trabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrabajoRepository extends JpaRepository<Trabajo, Long> {
    List<Trabajo> findByEstudianteAsignaturaIdOrderByFechaDesc(Long estudianteAsignaturaId);
}
