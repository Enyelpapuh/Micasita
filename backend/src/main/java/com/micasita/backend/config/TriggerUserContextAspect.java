package com.micasita.backend.config;

import com.micasita.backend.repositories.core.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TriggerUserContextAspect {

    private final EntityManager entityManager;
    private final UsuarioRepository usuarioRepository;

    public TriggerUserContextAspect(EntityManager entityManager, UsuarioRepository usuarioRepository) {
        this.entityManager = entityManager;
        this.usuarioRepository = usuarioRepository;
    }

    // Intercepta todos los métodos transaccionales en tus servicios antes de que se ejecuten
    @Before("execution(* com.micasita.backend.service..*(..)) && @annotation(org.springframework.transaction.annotation.Transactional)")
    public void injectUserIdToSqlSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            
            usuarioRepository.findByEmail(email).ifPresent(usuario -> {
                // Envia el ID real del usuario a la sesión actual de SQL Server
                entityManager.createNativeQuery("EXEC sp_set_session_context @key=N'AppUserId', @value=:userId")
                        .setParameter("userId", usuario.getId())
                        .executeUpdate();
            });
        }
    }
}