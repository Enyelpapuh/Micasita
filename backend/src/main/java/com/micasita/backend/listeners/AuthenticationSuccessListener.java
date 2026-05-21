package com.micasita.backend.listeners;

import com.micasita.backend.entities.core.AuditoriaAccesoSistema;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.AuditoriaAccesoRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

public class AuthenticationSuccessListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationSuccessListener.class);

    private final AuditoriaAccesoRepository auditoriaRepo;
    private final UsuarioRepository usuarioRepository;

    public AuthenticationSuccessListener(AuditoriaAccesoRepository auditoriaRepo, UsuarioRepository usuarioRepository) {
        this.auditoriaRepo = auditoriaRepo;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        try {
            String principalName = event.getAuthentication() != null ? event.getAuthentication().getName() : null;
            if (principalName == null) {
                log.warn("AuthenticationSuccessEvent with no principal name");
                return;
            }

            // Try to resolve current HttpServletRequest
            HttpServletRequest request = resolveRequest();

            String ip = extractClientIp(request);
            String userAgent = request != null ? defaultIfNull(request.getHeader("User-Agent"), "<unknown>") : "<unknown>";

            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(principalName);

            AuditoriaAccesoSistema record = AuditoriaAccesoSistema.builder()
                    .usuario(usuarioOpt.orElse(null))
                    .emailUsuario(principalName)
                    .fechaIngreso(LocalDateTime.now())
                    .ipTerminal(ip)
                    .navegadorCliente(userAgent)
                    .estadoIntento("EXITOSO")
                    .build();

            auditoriaRepo.save(record);

            log.info("Logged successful authentication for {} ip={} ua={}", principalName, ip, userAgent);
        } catch (Exception ex) {
            log.error("Error saving authentication audit", ex);
        }
    }

    private HttpServletRequest resolveRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "<unknown>";

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            if (parts.length > 0) {
                return parts[0].trim();
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();

        return request.getRemoteAddr();
    }

    private String defaultIfNull(String value, String defaultVal) {
        return value == null ? defaultVal : value;
    }
}
