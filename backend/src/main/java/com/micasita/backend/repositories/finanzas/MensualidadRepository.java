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
            select
                m.id as mensualidadId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.mesDePago as mes,
                (coalesce(m.montoBase, 0) + coalesce(m.montoMora, 0)) as monto,
                m.fechaDePago as fechaPago,
                m.estadoPago.nombre as estado,
                m.metodoPago.nombre as metodoPago,
                m.detalle as detalle,
                coalesce(m.esAnulado, false) as anulado
            from Mensualidad m
            join m.estudiante e
            join e.persona p
            order by m.id desc
            """)
    List<MensualidadCajaView> findRecentCaja();

    interface MensualidadCajaView {
        Long getMensualidadId();
        String getEstudiante();
        Integer getMes();
        BigDecimal getMonto();
        LocalDate getFechaPago();
        String getEstado();
        String getMetodoPago();
        String getDetalle();
        Boolean getAnulado();
    }
}
