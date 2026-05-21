package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.Anuncio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnuncioRepository extends JpaRepository<Anuncio, Long> {

    List<Anuncio> findAllByActivoTrueOrderByFechaPublicacionDesc();

    List<Anuncio> findAllByOrderByFechaPublicacionDesc();
}