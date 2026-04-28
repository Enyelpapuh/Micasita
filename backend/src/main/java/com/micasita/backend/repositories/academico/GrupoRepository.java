package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.Grupo;
import com.micasita.backend.entities.academico.Puesto;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GrupoRepository extends JpaRepository<Grupo, Long> {

    Optional<Puesto> findByNombre(String string);
}
