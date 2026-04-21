package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.EstudianteTutor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstudianteTutorRepository extends JpaRepository<EstudianteTutor, Long> {
    boolean existsByEstudianteIdAndTutorId(Long estudianteId, Long tutorId);
}
