package com.micasita.backend.repositories.academico;

import com.micasita.backend.entities.academico.AsistenciaGeneral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface AsistenciaGeneralRepository extends JpaRepository<AsistenciaGeneral, Long> {
    Optional<AsistenciaGeneral> findByGrupoIdAndFecha(Long grupoId, LocalDate fecha);
}
