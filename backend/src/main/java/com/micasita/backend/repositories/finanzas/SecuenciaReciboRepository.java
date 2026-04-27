package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.SecuenciaRecibo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SecuenciaReciboRepository extends JpaRepository<SecuenciaRecibo, Long> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        select s
                        from SecuenciaRecibo s
                        join fetch s.tipoRecibo tr
                        where tr.id = :tipoReciboId
                            and s.anio = :anio
                            and s.mes = :mes
                        """)
            Optional<SecuenciaRecibo> findByTipoReciboIdAndAnioAndMes(
                @Param("tipoReciboId") Long tipoReciboId,
                @Param("anio") Integer anio,
                @Param("mes") Integer mes
            );
}