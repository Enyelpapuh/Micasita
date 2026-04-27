package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.PagoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
            select
                pm.id as pagoMatriculaId,
                pm.matricula.id as matriculaId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                pm.monto as monto,
                pm.fechaDePago as fechaPago,
                pm.estadoPago.nombre as estado,
                pm.metodoPago.nombre as metodoPago,
                pm.detalle as detalle,
                coalesce(pm.esAnulado, false) as anulado
            from PagoMatricula pm
            join pm.matricula m
            join m.estudiante e
            join e.persona p
            order by pm.id desc
            """)
    List<PagoMatriculaCajaView> findRecentCaja();

    interface PagoMatriculaCajaView {
        Long getPagoMatriculaId();
        Long getMatriculaId();
        String getEstudiante();
        BigDecimal getMonto();
        LocalDate getFechaPago();
        String getEstado();
        String getMetodoPago();
        String getDetalle();
        Boolean getAnulado();
    }
}
