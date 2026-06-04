package com.micasita.backend.controller;

import com.micasita.backend.entities.core.AuditoriaAccesoSistema;
import com.micasita.backend.entities.core.LogAuditoria;
import com.micasita.backend.repositories.core.AuditoriaAccesoRepository;
import com.micasita.backend.repositories.core.LogAuditoriaRepository;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController("auditoriaLogControllerBean")
@RequestMapping("/admin/auditoria")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173", "http://localhost:4000"})
public class AuditoriaController {

    private final AuditoriaAccesoRepository auditoriaAccesoRepository;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaController(AuditoriaAccesoRepository auditoriaAccesoRepository, LogAuditoriaRepository logAuditoriaRepository, UsuarioRepository usuarioRepository) {
        this.auditoriaAccesoRepository = auditoriaAccesoRepository;
        this.logAuditoriaRepository = logAuditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/rendimiento")
    public ResponseEntity<List<Object>> getRendimiento() {
        // Endpoint antiguo devuelto vacío para prevenir el error 403 mientras actualizas
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/log")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(@RequestParam(defaultValue = "30") int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        
        List<AuditoriaAccesoSistema> accesos = auditoriaAccesoRepository.findAll();
        List<LogAuditoria> operaciones = logAuditoriaRepository.findAll();

        // Traer todos los usuarios a memoria para asociar nombres reales a los IDs sin sobrecargar la BD (N+1)
        Map<Long, Usuario> usersMap = usuarioRepository.findAll().stream()
                .collect(Collectors.toMap(Usuario::getId, u -> u));

        List<AuditLogDto> logs = new ArrayList<>();
        
        logs.addAll(accesos.stream()
                .filter(a -> a.getFechaIngreso() != null && a.getFechaIngreso().isAfter(startDate))
                .map(a -> {
                    Usuario uAcceso = a.getUsuario();
                    String nombreAcceso = uAcceso != null && uAcceso.getPersona() != null ? uAcceso.getPersona().getNombre() + " " + uAcceso.getPersona().getApellido() : "Usuario";
                    return new AuditLogDto(
                            a.getId(),
                            a.getFechaIngreso().toString(),
                            a.getEmailUsuario(),
                            nombreAcceso,
                            "EXITOSO".equalsIgnoreCase(a.getEstadoIntento()) ? "LOGIN_EXITOSO" : "LOGIN_FALLIDO",
                            "Acceso al Sistema",
                            String.valueOf(a.getId()),
                            "Intento de inicio de sesión " + (a.getEstadoIntento() != null ? a.getEstadoIntento().toLowerCase() : "desconocido"),
                            a.getIpTerminal(),
                            a.getNavegadorCliente(),
                            null, null, null
                    );
                })
                .collect(Collectors.toList()));

        logs.addAll(operaciones.stream()
                .filter(o -> o.getFechaHora() != null && o.getFechaHora().isAfter(startDate))
                .map(o -> {
                    String accion = "ACTUALIZAR";
                    if ("INSERT".equalsIgnoreCase(o.getAccion())) accion = "CREAR";
                    if ("DELETE".equalsIgnoreCase(o.getAccion())) accion = "ELIMINAR";
                    
                    String descripcion = "Registro alterado en la tabla " + o.getTablaAfectada();
                    if ("Taller".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Actualización de datos de Taller (precios, descripción, etc)";
                    if ("Persona_Roles".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Asignación o revocación de un rol de sistema";
                    if ("Mensualidad".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Modificación o anulación en registro de pago de mensualidad";
                    if ("Pago_matricula".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Modificación o anulación en registro de pago de matrícula";
                    if ("Pago_cupo".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Modificación o anulación en registro de pago de taller";
                    if ("Persona".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Modificación de datos personales (nombre, correo, identificador, etc)";
                    if ("Usuario".equalsIgnoreCase(o.getTablaAfectada())) descripcion = "Modificación de cuenta de usuario o configuración de acceso";

                    Long userId = o.getIdUsuario() != null ? ((Number) o.getIdUsuario()).longValue() : null;
                    Usuario u = userId != null ? usersMap.get(userId) : null;
                    String userEmail = u != null ? u.getEmail() : (userId != null ? "ID: " + userId : "Proceso Interno");
                    String userNombre = u != null && u.getPersona() != null ? u.getPersona().getNombre() + " " + u.getPersona().getApellido() : (userId != null ? "Usuario Desconocido" : "Trigger SQL");

                    return new AuditLogDto(
                            o.getIdLog() + 1000000L, // offset para evitar colisión de ID en el frontend con accesos
                            o.getFechaHora().toString(),
                            userEmail,
                            userNombre,
                            accion,
                            o.getTablaAfectada(),
                            String.valueOf(o.getIdRegistro()),
                            descripcion,
                            o.getIpTerminal() != null ? o.getIpTerminal() : "Local",
                            o.getNavegadorCliente() != null ? o.getNavegadorCliente() : "N/A",
                            o.getValorAnterior(),
                            o.getValorNuevo(),
                            o.getCamposModificados()
                    );
                })
                .collect(Collectors.toList()));
                
        logs.sort((a, b) -> b.fecha().compareTo(a.fecha()));

        return ResponseEntity.ok(logs);
    }

    public record AuditLogDto(Long id, String fecha, String usuarioEmail, String usuarioNombre, String accion, String entidad, String entidadId, String descripcion, String ip, String navegador, String valorAnterior, String valorNuevo, String camposModificados) {}
}