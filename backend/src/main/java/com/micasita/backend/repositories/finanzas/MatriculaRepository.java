package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
                concat(coalesce(p.nombre, ''), ' ', coalesce(p.apellido, '')) as estudiante,
                m.anioLectivo as anioLectivo,
                m.fechaMatricula as fechaMatricula,
                m.estadoMatricula.nombreEstado as estado
            from Matricula m
            join m.estudiante e
            join e.persona p
            where upper(m.estadoMatricula.nombreEstado) = 'PENDIENTE'
            order by m.fechaMatricula desc, m.id desc
            """)
    List<MatriculaPendienteCajaView> findPendientesCaja();

    interface MatriculaPendienteCajaView {
        Long getMatriculaId();
        String getEstudiante();
        String getAnioLectivo();
        LocalDate getFechaMatricula();
        String getEstado();
    }
}
