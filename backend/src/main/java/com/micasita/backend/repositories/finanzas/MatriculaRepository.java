package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    boolean existsByEstudianteIdAndAnioLectivo(Long estudianteId, String anioLectivo);
}
