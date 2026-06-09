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
                coalesce(pc.esAnulado, false) as anulado,
                pc.motivoAnulacion as motivoAnulacion,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pc.usuario.email) as cajero
            from PagoCupo pc
            join pc.cupo c
            join c.participante part
            left join part.persona per
            left join pc.usuario.persona userPer
            where lower(pc.usuario.email) = lower(:email)
            order by pc.id desc
            """)
    List<PagoCupoCajaView> findRecentCaja(String email);

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
                coalesce(pc.esAnulado, false) as anulado,
                pc.motivoAnulacion as motivoAnulacion,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pc.usuario.email) as cajero
            from PagoCupo pc
            join pc.cupo c
            join c.participante part
            left join part.persona per
            left join pc.usuario.persona userPer
            order by pc.id desc
            """)
    List<PagoCupoCajaView> findAllRecentCaja();

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
                coalesce(pc.esAnulado, false) as anulado,
                pc.motivoAnulacion as motivoAnulacion,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pc.usuario.email) as cajero
            from PagoCupo pc
            join pc.cupo c
            join c.participante part
            left join part.persona per
            left join pc.usuario.persona userPer
            where pc.cajaSesion.id = :sessionId
            order by pc.id desc
            """)
    List<PagoCupoCajaView> findByCajaSesionId(Long sessionId);

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
        String getCajero();
    }
}
