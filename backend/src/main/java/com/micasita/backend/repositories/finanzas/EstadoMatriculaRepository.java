package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.EstadoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoMatriculaRepository extends JpaRepository<EstadoMatricula, Long> {

    Optional<EstadoMatricula> findByNombreEstado(String nombreEstado);
}
