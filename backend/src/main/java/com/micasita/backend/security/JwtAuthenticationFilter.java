package com.micasita.backend.security;

import com.micasita.backend.dto.auth.JwtPayload;
import com.micasita.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        log.info("[JWT] {} {} authHeaderPresent={}", request.getMethod(), request.getRequestURI(), authorizationHeader != null);

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authorizationHeader.substring(7);
            log.info("[JWT] bearer token detected path={} tokenPrefix={}", request.getRequestURI(), safeTokenPrefix(token));

            jwtService.parseAndValidate(token)
                    .ifPresentOrElse(
                            payload -> {
                                log.info("[JWT] token valid user={} roles={} path={}", payload.email(), payload.roles(), request.getRequestURI());
                                setAuthentication(request, payload);
                            },
                            () -> log.warn("[JWT] token invalid or expired path={} tokenPrefix={}", request.getRequestURI(), safeTokenPrefix(token))
                    );
        } else if (authorizationHeader == null) {
            log.info("[JWT] no Authorization header for path={}", request.getRequestURI());
        } else if (!authorizationHeader.startsWith("Bearer ")) {
            log.warn("[JWT] Authorization header without Bearer prefix path={} valuePrefix={}", request.getRequestURI(), safeTokenPrefix(authorizationHeader));
        } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.info("[JWT] authentication already present path={}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(HttpServletRequest request, JwtPayload payload) {
        List<SimpleGrantedAuthority> roleAuthorities = payload.roles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
            .toList();

        List<SimpleGrantedAuthority> permissionAuthorities = payload.permisos().stream()
            .map(perm -> new SimpleGrantedAuthority(perm))
            .toList();

        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.addAll(roleAuthorities);
        authorities.addAll(permissionAuthorities);

        log.info("[JWT] setting authentication user={} authorities={}", payload.email(), authorities);

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                payload.email(),
                null,
                authorities
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String safeTokenPrefix(String value) {
        if (value == null || value.isBlank()) {
            return "<empty>";
        }

        int endIndex = Math.min(value.length(), 24);
        return value.substring(0, endIndex);
    }
}
