package com.micasita.backend.repositories.talleres;

import com.micasita.backend.entities.talleres.CupoTaller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface CupoTallerRepository extends JpaRepository<CupoTaller, Long> {

    long countByTallerId(Long tallerId);

    @Query("""
            select count(c) > 0
            from TalleresCupoTaller c
            where c.taller.id = :tallerId
              and c.participante.id = :participanteId
            """)
    boolean existsByTallerAndParticipante(Long tallerId, Long participanteId);

    @Query("""
        select count(c)
        from TalleresCupoTaller c
        where not exists (
          select 1
          from PagoCupo pc
          where pc.cupo.id = c.id
            and upper(pc.estadoPago.nombre) = 'PAGADO'
            and (pc.esAnulado is null or pc.esAnulado = false)
        )
        """)
    long countPendientesPagoCaja();

    @Query("""
        select
          c.id as cupoId,
          c.taller.id as tallerId,
          c.taller.nombre as taller,
          concat(coalesce(per.nombre, ''), ' ', coalesce(per.apellido, ''), coalesce(part.nombreTmp, '')) as participante,
          c.costo as montoEsperado,
          c.fecha as fechaInscripcion
        from TalleresCupoTaller c
        join c.participante part
        left join part.persona per
        where not exists (
          select 1
          from PagoCupo pc
          where pc.cupo.id = c.id
            and upper(pc.estadoPago.nombre) = 'PAGADO'
            and (pc.esAnulado is null or pc.esAnulado = false)
        )
        order by c.id desc
        """)
    List<CupoPendienteCajaView> findPendientesPagoCaja();

    interface CupoPendienteCajaView {
      Long getCupoId();
      Long getTallerId();
      String getTaller();
      String getParticipante();
      BigDecimal getMontoEsperado();
      LocalDate getFechaInscripcion();
    }
}
