package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.HojaAsignatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HojaAsignaturaRepository extends JpaRepository<HojaAsignatura, Long> {
    List<HojaAsignatura> findByAsignaturaIdOrderByIdAsc(Long asignaturaId);
}
