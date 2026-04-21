package com.micasita.backend.repositories.talleres;

import com.micasita.backend.entities.talleres.CupoTaller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CupoTallerRepository extends JpaRepository<CupoTaller, Long> {

    long countByTallerId(Long tallerId);

    @Query("""
            select count(c) > 0
            from TalleresCupoTaller c
            where c.taller.id = :tallerId
              and c.participante.id = :participanteId
            """)
    boolean existsByTallerAndParticipante(Long tallerId, Long participanteId);
}
