package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    boolean existsByEstudianteIdAndAnioLectivo(Long estudianteId, String anioLectivo);

    @Query("""
            select count(m)
            from Matricula m
            where upper(m.estadoMatricula.nombreEstado) = 'PENDIENTE'
            """)
    long countPendientesCaja();

    @Query("""
            select
                m.id as matriculaId,
                e.id as estudianteId,
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.anioLectivo as anioLectivo,
                coalesce(m.montoBase, 0) as montoEsperado,
                m.fechaMatricula as fechaMatricula,
                m.estadoMatricula.nombreEstado as estado
            from Matricula m
            join m.estudiante e
            join e.persona p
            where upper(m.estadoMatricula.nombreEstado) = 'PENDIENTE'
            order by m.fechaMatricula desc, m.id desc
            """)
    List<MatriculaPendienteCajaView> findPendientesCaja();

            @Query("""
                select distinct
                e.id as estudianteId,
                e.id as id,
                e.persona.id as personaId,
                p.nombre as nombre,
                p.apellido as apellido
                from Matricula m
                join m.estudiante e
                join e.persona p
                where upper(m.estadoMatricula.nombreEstado) = 'OFICIAL'
                  and m.anioLectivo = :anioLectivo
                order by p.nombre, p.apellido, e.id
                """)
            List<EstudianteActivoView> findActivosByAnioLectivo(String anioLectivo);

    interface MatriculaPendienteCajaView {
        Long getMatriculaId();
        Long getEstudianteId();
        String getEstudiante();
        String getAnioLectivo();
        BigDecimal getMontoEsperado();
        LocalDate getFechaMatricula();
        String getEstado();
    }

    interface EstudianteActivoView {
        Long getId();
        Long getEstudianteId();
        Long getPersonaId();
        String getNombre();
        String getApellido();
    }
}
