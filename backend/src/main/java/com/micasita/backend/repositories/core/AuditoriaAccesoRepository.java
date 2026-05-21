package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.AuditoriaAccesoSistema;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditoriaAccesoRepository extends JpaRepository<AuditoriaAccesoSistema, Long> {

	// Ejemplo (opcional): si el procedimiento devuelve un único valor entero
	// @Procedure(procedureName = "SP_Auditoria_Rendimiento_Sistema")
	// Integer spAuditoriaRendimiento();

	// Método nativo para ejecutar el procedimiento almacenado y retornar filas posicionales
	@org.springframework.data.jpa.repository.Query(value = "EXEC SP_Auditoria_Rendimiento_Sistema", nativeQuery = true)
	java.util.List<Object[]> ejecutarSpAuditoriaRendimiento();

}
