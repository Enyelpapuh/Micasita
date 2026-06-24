package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.CorteCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CorteCajaRepository extends JpaRepository<CorteCaja, Long> {
    Optional<CorteCaja> findByCajaSesionId(Long sessionId);
}
