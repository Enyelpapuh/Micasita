package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.EstadoCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoCajaRepository extends JpaRepository<EstadoCaja, Long> {
    Optional<EstadoCaja> findByNombre(String nombre);
}