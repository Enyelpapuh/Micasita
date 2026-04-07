package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Puesto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PuestoRepository extends JpaRepository<Puesto, Long> {
    Optional<Puesto> findByNombre(String nombre);
}
