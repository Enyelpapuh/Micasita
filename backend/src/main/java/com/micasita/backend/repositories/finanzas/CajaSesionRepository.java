package com.micasita.backend.repositories.finanzas;

import com.micasita.backend.entities.finanzas.CajaSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CajaSesionRepository extends JpaRepository<CajaSesion, Long> {
    Optional<CajaSesion> findTopByEstadoCajaNombreOrderByFechaAperturaDesc(String estado);

    boolean existsByEstadoCajaNombre(String estado);

        Optional<CajaSesion> findTopByUsuarioAperturaEmailAndEstadoCajaNombreOrderByFechaAperturaDesc(String email, String estado);

        @Query("""
                        select c
                        from CajaSesion c
                        where c.usuarioApertura.email = :email
                            and upper(c.estadoCaja.nombre) = upper(:estado)
                        order by c.fechaApertura desc
                        """)
            Optional<CajaSesion> findActiveSessionByEmail(
                @Param("email") String email,
                @Param("estado") String estado
            );
}