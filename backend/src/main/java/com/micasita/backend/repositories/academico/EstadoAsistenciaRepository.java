package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.EstadoAsistencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoAsistenciaRepository extends JpaRepository<EstadoAsistencia, Long> {
    Optional<EstadoAsistencia> findByNombre(String nombre);
}
