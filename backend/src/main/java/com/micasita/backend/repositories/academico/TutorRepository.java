package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {
    Optional<Tutor> findByPersonaId(Long personaId);
}
