package com.micasita.backend.repositories.admision;

import com.micasita.backend.entities.admision.DocumentoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentoSolicitudRepository extends JpaRepository<DocumentoSolicitud, Long> {
	boolean existsByTipoDocumentoId(Long tipoDocumentoId);
}
