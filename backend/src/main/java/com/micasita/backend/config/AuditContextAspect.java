package com.micasita.backend.config;

import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import org.hibernate.Session;
import org.hibernate.FlushMode;
import java.util.Optional;

@Aspect
@Component
public class AuditContextAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Intercepta todos los métodos save y delete en tus repositorios
    @Before("execution(* com.micasita.backend.repositories..*.save*(..)) || execution(* com.micasita.backend.repositories..*.delete*(..))")
    public void setSessionContext() {
        try {
            Long userId = null;
            String userAgent = "Desconocido";

            // 1. Obtener el Navegador (User-Agent) del Request HTTP actual
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                userAgent = request.getHeader("User-Agent");
                if (userAgent != null && userAgent.length() > 255) {
                    userAgent = userAgent.substring(0, 255); // Prevenir desbordamiento en la base de datos
                }
            }

            // 2. Obtener el ID del Usuario Logueado desde Spring Security
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
                Session session = entityManager.unwrap(Session.class);
                FlushMode previousFlushMode = session.getHibernateFlushMode();
                
                // IMPORTANTE: Pausar el Auto-Flush para que esta consulta no dispare los Triggers prematuramente
                session.setHibernateFlushMode(FlushMode.MANUAL);
                try {
                    String email = authentication.getName();
                    Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
                    if (usuarioOpt.isPresent()) {
                        userId = usuarioOpt.get().getId();
                    }
                } finally {
                    session.setHibernateFlushMode(previousFlushMode);
                }
            }

            final Long finalUserId = userId;
            final String finalUserAgent = userAgent;

            // 3. Enviar las variables a SQL Server usando JDBC puro. Esto evita que JPA analice
            // la consulta y vuelva a disparar un Flush accidental.
            Session session = entityManager.unwrap(Session.class);
            session.doWork(connection -> {
                try (java.sql.CallableStatement cs = connection.prepareCall("{call sp_set_session_context(?, ?)}")) {
                    cs.setNString(1, "UserId");
                    if (finalUserId != null) cs.setInt(2, finalUserId.intValue());
                    else cs.setNull(2, java.sql.Types.INTEGER);
                    cs.execute();
                } catch (Exception ex) { /* Ignorar si la base de datos rechaza el comando */ }
                
                try (java.sql.CallableStatement cs = connection.prepareCall("{call sp_set_session_context(?, ?)}")) {
                    cs.setNString(1, "UserAgent");
                    if (finalUserAgent != null) cs.setNString(2, finalUserAgent);
                    else cs.setNull(2, java.sql.Types.NVARCHAR);
                    cs.execute();
                } catch (Exception ex) { /* Ignorar */ }
            });

        } catch (Exception e) {
            System.err.println("No se pudo inyectar el contexto de auditoría: " + e.getMessage());
        }
    }
}