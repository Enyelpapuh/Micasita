package com.micasita.backend.repositories.admision;

import com.micasita.backend.entities.admision.TipoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoDocumentoRepository extends JpaRepository<TipoDocumento, Long> {
    Optional<TipoDocumento> findByNombre(String nombre);
}
