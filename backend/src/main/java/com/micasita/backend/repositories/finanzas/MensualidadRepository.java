package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.Mensualidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MensualidadRepository extends JpaRepository<Mensualidad, Long> {

    @Query("""
            select count(m)
            from Mensualidad m
            where upper(m.estadoPago.nombre) = 'PENDIENTE'
            """)
    long countPendientesCaja();

        @Query("""
            select coalesce(sum(coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)), 0)
            from Mensualidad m
            where upper(m.estadoPago.nombre) = 'PAGADO'
              and (m.esAnulado is null or m.esAnulado = false)
            """)
        BigDecimal sumCobradoCaja();

    @Query("""
            select
                m.id as mensualidadId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.mesDePago as mes,
                coalesce(m.montoBase, 0) as montoBase,
                coalesce(m.montoMora, 0) as montoMora,
                (coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)) as monto,
                m.fechaDePago as fechaPago,
                m.estadoPago.nombre as estado,
                m.metodoPago.nombre as metodoPago,
                m.detalle as detalle,
                coalesce(m.esAnulado, false) as anulado,
                m.motivoAnulacion as motivoAnulacion,
                m.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), m.usuario.email) as cajero
            from Mensualidad m
            join m.estudiante e
            join e.persona p
            left join m.usuario.persona userPer
            where lower(m.usuario.email) = lower(:email)
            order by m.id desc
            """)
    List<MensualidadCajaView> findRecentCaja(String email);

    @Query("""
            select
                m.id as mensualidadId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.mesDePago as mes,
                coalesce(m.montoBase, 0) as montoBase,
                coalesce(m.montoMora, 0) as montoMora,
                (coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)) as monto,
                m.fechaDePago as fechaPago,
                m.estadoPago.nombre as estado,
                m.metodoPago.nombre as metodoPago,
                m.detalle as detalle,
                coalesce(m.esAnulado, false) as anulado,
                m.motivoAnulacion as motivoAnulacion,
                m.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), m.usuario.email) as cajero
            from Mensualidad m
            join m.estudiante e
            join e.persona p
            left join m.usuario.persona userPer
            order by m.id desc
            """)
    List<MensualidadCajaView> findAllRecentCaja();

    @Query("""
            select
                m.id as mensualidadId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.mesDePago as mes,
                coalesce(m.montoBase, 0) as montoBase,
                coalesce(m.montoMora, 0) as montoMora,
                (coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)) as monto,
                m.fechaDePago as fechaPago,
                m.estadoPago.nombre as estado,
                m.metodoPago.nombre as metodoPago,
                m.detalle as detalle,
                coalesce(m.esAnulado, false) as anulado,
                m.motivoAnulacion as motivoAnulacion,
                m.numeroRecibo as numeroRecibo,
                coalesce(nullif(trim(concat(coalesce(userPer.nombre, ''), ' ', coalesce(userPer.apellido, ''))), ''), m.usuario.email) as cajero
            from Mensualidad m
            join m.estudiante e
            join e.persona p
            left join m.usuario.persona userPer
            where m.cajaSesion.id = :sessionId
            order by m.id desc
            """)
    List<MensualidadCajaView> findByCajaSesionId(Long sessionId);

    interface MensualidadCajaView {
        Long getMensualidadId();
        String getEstudiante();
        Integer getMes();
        BigDecimal getMontoBase();
        BigDecimal getMontoMora();
        BigDecimal getMonto();
        LocalDate getFechaPago();
        String getEstado();
        String getMetodoPago();
        String getDetalle();
        String getNumeroRecibo();
        Boolean getAnulado();
        String getMotivoAnulacion();
        String getCajero();
    }

    @Query("""
            select
                m.id as mensualidadId,
                m.mesDePago as mes,
                coalesce(m.montoBase, 0) as montoBase,
                coalesce(m.montoMora, 0) as montoMora,
                (coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)) as monto,
                m.estadoPago.nombre as estado,
                m.fechaDePago as fechaPago
            from Mensualidad m
            where m.estudiante.id = :estudianteId
              and upper(m.estadoPago.nombre) <> 'PAGADO'
            order by m.mesDePago asc
            """)
    List<PendienteMensualidadView> findPendientesByEstudianteId(Long estudianteId);

    @Query("""
            select
                e.id as estudianteId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                count(mp.id) as mesesPagados,
                case
                    when :mesLimite - count(mp.id) < 0 then 0
                    else :mesLimite - count(mp.id)
                end as mesesPendientes,
                coalesce(max(mp.mesDePago), 0) + 1 as proximoMes
            from Matricula mat
            join mat.estudiante e
            join e.persona p
            left join Mensualidad mp on mp.estudiante.id = e.id
                and coalesce(mp.esAnulado, false) = false
                and upper(mp.estadoPago.nombre) = 'PAGADO'
            where upper(mat.estadoMatricula.nombreEstado) = 'OFICIAL'
              and mat.anioLectivo = :anioLectivo
            group by e.id, p.nombre, p.apellido
            having (:mesLimite - count(mp.id)) > 0
            order by p.nombre, p.apellido, e.id
            """)
    List<ResumenPendientesMensualidadView> findResumenPendientesCaja(String anioLectivo, Integer mesLimite);

            @Query("""
                select distinct m.mesDePago
                from Mensualidad m
                where m.estudiante.id = :estudianteId
                  and upper(m.estadoPago.nombre) = 'PAGADO'
                  and coalesce(m.esAnulado, false) = false
                  and m.mesDePago between 1 and :mesLimite
                order by m.mesDePago
                """)
            List<Integer> findMesesPagadosHasta(Long estudianteId, Integer mesLimite);

    interface PendienteMensualidadView {
        Long getMensualidadId();
        Integer getMes();
        BigDecimal getMontoBase();
        BigDecimal getMontoMora();
        BigDecimal getMonto();
        String getEstado();
        LocalDate getFechaPago();
    }

    interface ResumenPendientesMensualidadView {
        Long getEstudianteId();
        String getEstudiante();
        Long getMesesPagados();
        Long getMesesPendientes();
        Integer getProximoMes();
    }
}
