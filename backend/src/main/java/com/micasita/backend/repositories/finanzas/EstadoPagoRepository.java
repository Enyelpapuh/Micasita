package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.EstadoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoPagoRepository extends JpaRepository<EstadoPago, Long> {
    Optional<EstadoPago> findByNombre(String nombre);
}
