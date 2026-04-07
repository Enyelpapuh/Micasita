package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.PersonaRoles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonaRolesRepository extends JpaRepository<PersonaRoles, Long> {
    boolean existsByPersonaIdAndRolId(Long personaId, Long rolId);

    List<PersonaRoles> findAllByPersonaId(Long personaId);
}
