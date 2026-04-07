package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.Persona;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<Persona, Long> {
}
