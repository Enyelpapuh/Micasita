package com.micasita.backend.repositories.talleres;

import com.micasita.backend.entities.talleres.Participante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ParticipanteRepository extends JpaRepository<Participante, Long> {

    @Query("""
            select p
            from TalleresParticipante p
                left join p.persona per
                where (:correo is not null and per.correo = :correo)
                    or (:identificador is not null and per.identificador = :identificador)
            """)
    Optional<Participante> findFirstByCorreoOrIdentificador(String correo, String identificador);
}
