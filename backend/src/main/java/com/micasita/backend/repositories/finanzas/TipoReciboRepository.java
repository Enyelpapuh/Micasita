package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.TipoRecibo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoReciboRepository extends JpaRepository<TipoRecibo, Long> {
    Optional<TipoRecibo> findByCodigo(String codigo);
}