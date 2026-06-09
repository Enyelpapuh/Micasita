package com.micasita.backend.config;

import com.micasita.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/admin/usuarios/avatar/**", "/api/admin/usuarios/avatar/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/admision/documentos/**", "/api/admision/documentos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/talleres", "/talleres/**", "/api/talleres", "/api/talleres/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/talleres/*/inscripciones", "/api/talleres/*/inscripciones").permitAll()
                    .requestMatchers(HttpMethod.GET, "/admision/config", "/api/admision/config").permitAll()
                    .requestMatchers(HttpMethod.GET, "/noticias", "/api/noticias", "/noticias/imagen/**", "/api/noticias/imagen/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/admision/solicitudes", "/api/admision/solicitudes").permitAll()
                    .requestMatchers("/auth/**", "/api/auth/**", "/db-status", "/api/db-status").permitAll()
                    .requestMatchers("/api/auth/recover-password/**").permitAll()
                    .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5127", "http://localhost:5173","http://localhost:4000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
