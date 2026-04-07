package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.Roles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolesRepository extends JpaRepository<Roles, Long> {
    Optional<Roles> findByNombreRol(String nombreRol);
}
