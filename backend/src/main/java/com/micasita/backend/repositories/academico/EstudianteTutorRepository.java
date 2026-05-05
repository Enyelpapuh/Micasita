package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.EstudianteTutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EstudianteTutorRepository extends JpaRepository<EstudianteTutor, Long> {
    boolean existsByEstudianteIdAndTutorId(Long estudianteId, Long tutorId);

    List<EstudianteTutor> findByEstudianteIdOrderByIdAsc(Long estudianteId);

        @Query("""
            select distinct et.tutor.id
            from EstudianteTutor et
            where et.estudiante.id = :estudianteId
                        """)
        List<Long> findTutorIdsByEstudianteId(@Param("estudianteId") Long estudianteId);

        @Query("""
            select distinct et.estudiante.id
            from EstudianteTutor et
            where et.tutor.id in :tutorIds
              and et.estudiante.id <> :estudianteId
            """)
        List<Long> findFamiliaStudentIdsByTutorIds(
            @Param("tutorIds") List<Long> tutorIds,
            @Param("estudianteId") Long estudianteId
        );
}
