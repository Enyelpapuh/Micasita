package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Long> {
    Optional<MetodoPago> findByNombre(String nombre);
}
