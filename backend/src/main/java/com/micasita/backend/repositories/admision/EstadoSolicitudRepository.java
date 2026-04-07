package com.micasita.backend.repositories.admision;

import com.micasita.backend.entities.admision.EstadoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoSolicitudRepository extends JpaRepository<EstadoSolicitud, Long> {
    Optional<EstadoSolicitud> findByNombre(String nombre);
}
