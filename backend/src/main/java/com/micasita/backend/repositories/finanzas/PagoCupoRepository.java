package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.PagoCupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PagoCupoRepository extends JpaRepository<PagoCupo, Long> {

    @Query("""
            select count(pc)
            from PagoCupo pc
            where upper(pc.estadoPago.nombre) = 'PENDIENTE'
              and (pc.esAnulado is null or pc.esAnulado = false)
            """)
    long countPendientesCaja();

        @Query("""
            select coalesce(sum(pc.monto), 0)
            from PagoCupo pc
            where upper(pc.estadoPago.nombre) = 'PAGADO'
              and (pc.esAnulado is null or pc.esAnulado = false)
            """)
        BigDecimal sumCobradoCaja();

    @Query("""
            select
                pc.id as pagoCupoId,
                pc.cupo.id as cupoId,
                pc.cupo.taller.nombre as taller,
                concat(coalesce(per.nombre, ''), ' ', coalesce(per.apellido, ''), coalesce(part.nombreTmp, '')) as participante,
                pc.numeroRecibo as numeroRecibo,
                pc.monto as monto,
                pc.fechaDePago as fechaPago,
                pc.estadoPago.nombre as estado,
                pc.metodoPago.nombre as metodoPago,
                pc.esAnulado as anulado,
                pc.motivoAnulacion as motivoAnulacion
            from PagoCupo pc
            join pc.cupo c
            join c.participante part
            left join part.persona per
            order by pc.id desc
            """)
    List<PagoCupoCajaView> findRecentCaja();

    interface PagoCupoCajaView {
        Long getPagoCupoId();
        Long getCupoId();
        String getTaller();
        String getParticipante();
        String getNumeroRecibo();
        BigDecimal getMonto();
        LocalDate getFechaPago();
        String getEstado();
        String getMetodoPago();
        Boolean getAnulado();
        String getMotivoAnulacion();
    }
}
