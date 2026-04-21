package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PersonaRepository extends JpaRepository<Persona, Long> {

	Optional<Persona> findByCorreo(String correo);

	Optional<Persona> findByIdentificador(String identificador);

	@Query("""
			select p
			from Persona p
			where (:correo is not null and p.correo = :correo)
			   or (:identificador is not null and p.identificador = :identificador)
			""")
	Optional<Persona> findFirstByCorreoOrIdentificador(String correo, String identificador);
}
