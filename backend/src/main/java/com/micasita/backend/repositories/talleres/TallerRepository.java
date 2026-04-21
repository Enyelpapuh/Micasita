package com.micasita.backend.repositories.talleres;

import com.micasita.backend.entities.talleres.Taller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TallerRepository extends JpaRepository<Taller, Long> {

    @Query("""
            select distinct t
            from TalleresTaller t
            left join fetch t.tipoPublico
            left join fetch t.cupos c
            left join fetch c.participante
            order by t.id desc
            """)
    List<Taller> findAllWithCupos();

    @Query("""
            select distinct t
            from TalleresTaller t
            left join fetch t.tipoPublico
            left join fetch t.cupos c
            left join fetch c.participante
            where t.id = :id
            """)
    Optional<Taller> findByIdWithCupos(Long id);
}
