package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.ConfiguracionFinanzas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracionFinanzasRepository extends JpaRepository<ConfiguracionFinanzas, Long> {
    Optional<ConfiguracionFinanzas> findFirstByOrderByIdAsc();
}