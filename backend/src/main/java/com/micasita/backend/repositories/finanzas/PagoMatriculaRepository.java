package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.PagoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PagoMatriculaRepository extends JpaRepository<PagoMatricula, Long> {

    @Query("""
            select count(pm)
            from PagoMatricula pm
            where upper(pm.estadoPago.nombre) = 'PENDIENTE'
            """)
    long countPendientesCaja();

        @Query("""
            select coalesce(sum(pm.monto), 0)
            from PagoMatricula pm
            where upper(pm.estadoPago.nombre) = 'PAGADO'
              and (pm.esAnulado is null or pm.esAnulado = false)
            """)
        BigDecimal sumCobradoCaja();

    @Query("""
            select coalesce(sum(pm.monto), 0)
            from PagoMatricula pm
            where pm.cajaSesion.id = :sessionId
              and upper(pm.estadoPago.nombre) = 'PAGADO'
              and (pm.esAnulado is null or pm.esAnulado = false)
            """)
    BigDecimal sumCobradoBySessionId(@Param("sessionId") Long sessionId);

    @Query("""
            select coalesce(sum(pm.monto), 0)
            from PagoMatricula pm
            where pm.cajaSesion.id = :sessionId
              and (pm.esAnulado = true or upper(pm.estadoPago.nombre) = 'ANULADO')
            """)
    BigDecimal sumAnuladoBySessionId(@Param("sessionId") Long sessionId);

    @Query("""
            select count(pm)
            from PagoMatricula pm
            where pm.cajaSesion.id = :sessionId
              and (pm.esAnulado = true or upper(pm.estadoPago.nombre) = 'ANULADO')
            """)
    long countAnuladoBySessionId(@Param("sessionId") Long sessionId);

    @Query("""
            select
                pm.id as pagoMatriculaId,
                pm.matricula.id as matriculaId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                pm.monto as monto,
                pm.fechaDePago as fechaPago,
                pm.estadoPago.nombre as estado,
                pm.metodoPago.nombre as metodoPago,
                pm.detalle as detalle,
                coalesce(pm.esAnulado, false) as anulado,
                pm.motivoAnulacion as motivoAnulacion,
                pm.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pm.usuario.email) as cajero,
                m.anioLectivo as anioLectivo,
                pm.montoRecibido as montoRecibido,
                pm.cambioDevuelto as cambioDevuelto
            from PagoMatricula pm
            join pm.matricula m
            join m.estudiante e
            join e.persona p
            left join pm.usuario.persona userPer
            where lower(pm.usuario.email) = lower(:email)
            order by pm.id desc
            """)
    List<PagoMatriculaCajaView> findRecentCaja(String email);

    @Query("""
            select
                pm.id as pagoMatriculaId,
                pm.matricula.id as matriculaId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                pm.monto as monto,
                pm.fechaDePago as fechaPago,
                pm.estadoPago.nombre as estado,
                pm.metodoPago.nombre as metodoPago,
                pm.detalle as detalle,
                coalesce(pm.esAnulado, false) as anulado,
                pm.motivoAnulacion as motivoAnulacion,
                pm.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pm.usuario.email) as cajero,
                m.anioLectivo as anioLectivo,
                pm.montoRecibido as montoRecibido,
                pm.cambioDevuelto as cambioDevuelto
            from PagoMatricula pm
            join pm.matricula m
            join m.estudiante e
            join e.persona p
            left join pm.usuario.persona userPer
            order by pm.id desc
            """)
    List<PagoMatriculaCajaView> findAllRecentCaja();

    @Query("""
            select
                pm.id as pagoMatriculaId,
                pm.matricula.id as matriculaId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                pm.monto as monto,
                pm.fechaDePago as fechaPago,
                pm.estadoPago.nombre as estado,
                pm.metodoPago.nombre as metodoPago,
                pm.detalle as detalle,
                coalesce(pm.esAnulado, false) as anulado,
                pm.motivoAnulacion as motivoAnulacion,
                pm.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), pm.usuario.email) as cajero,
                m.anioLectivo as anioLectivo,
                pm.montoRecibido as montoRecibido,
                pm.cambioDevuelto as cambioDevuelto
            from PagoMatricula pm
            join pm.matricula m
            join m.estudiante e
            join e.persona p
            left join pm.usuario.persona userPer
            where pm.cajaSesion.id = :sessionId
            order by pm.id desc
            """)
    List<PagoMatriculaCajaView> findByCajaSesionId(Long sessionId);

    interface PagoMatriculaCajaView {
        Long getPagoMatriculaId();
        Long getMatriculaId();
        String getEstudiante();
        String getNumeroRecibo();
        BigDecimal getMonto();
        LocalDate getFechaPago();
        String getEstado();
        String getMetodoPago();
        String getDetalle();
        Boolean getAnulado();
        String getMotivoAnulacion();
        String getCajero();
        String getAnioLectivo();
        BigDecimal getMontoRecibido();
        BigDecimal getCambioDevuelto();
    }
}
