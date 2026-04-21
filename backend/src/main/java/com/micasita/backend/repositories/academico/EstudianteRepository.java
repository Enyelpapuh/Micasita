package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    boolean existsByPersonaId(Long personaId);

    Optional<Estudiante> findByPersonaId(Long personaId);
}
