package com.micasita.backend.repositories.talleres;

import com.micasita.backend.entities.talleres.TipoPublicoTaller;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoPublicoTallerRepository extends JpaRepository<TipoPublicoTaller, Long> {

    Optional<TipoPublicoTaller> findByNombre(String nombre);
}
