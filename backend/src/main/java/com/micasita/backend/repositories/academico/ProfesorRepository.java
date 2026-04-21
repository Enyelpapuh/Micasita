package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Profesor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfesorRepository extends JpaRepository<Profesor, Long> {
}
