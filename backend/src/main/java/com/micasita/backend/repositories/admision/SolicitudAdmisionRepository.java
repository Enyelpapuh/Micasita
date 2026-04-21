package com.micasita.backend.repositories.admision;

import com.micasita.backend.entities.admision.SolicitudAdmision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitudAdmisionRepository extends JpaRepository<SolicitudAdmision, Long> {
    List<SolicitudAdmision> findAllByOrderByFechaCreacionDesc();
}
