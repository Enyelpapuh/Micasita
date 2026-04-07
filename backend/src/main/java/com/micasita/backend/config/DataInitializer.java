package com.micasita.backend.config;

import com.micasita.backend.entities.academico.Puesto;
import com.micasita.backend.entities.academico.EstadoAsistencia;
import com.micasita.backend.entities.admision.EstadoSolicitud;
import com.micasita.backend.entities.admision.TipoDocumento;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Roles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.entities.finanzas.EstadoPago;
import com.micasita.backend.entities.finanzas.MetodoPago;
import com.micasita.backend.repositories.academico.PuestoRepository;
import com.micasita.backend.repositories.academico.EstadoAsistenciaRepository;
import com.micasita.backend.repositories.admision.EstadoSolicitudRepository;
import com.micasita.backend.repositories.admision.TipoDocumentoRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.RolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import com.micasita.backend.repositories.finanzas.EstadoPagoRepository;
import com.micasita.backend.repositories.finanzas.MetodoPagoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Objects;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PersonaRepository personaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolesRepository rolesRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final EstadoSolicitudRepository estadoSolicitudRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final EstadoPagoRepository estadoPagoRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final PuestoRepository puestoRepository;
    private final EstadoAsistenciaRepository estadoAsistenciaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            PersonaRepository personaRepository,
            UsuarioRepository usuarioRepository,
            RolesRepository rolesRepository,
            PersonaRolesRepository personaRolesRepository,
            EstadoSolicitudRepository estadoSolicitudRepository,
            TipoDocumentoRepository tipoDocumentoRepository,
            EstadoPagoRepository estadoPagoRepository,
            MetodoPagoRepository metodoPagoRepository,
                PuestoRepository puestoRepository,
                EstadoAsistenciaRepository estadoAsistenciaRepository,
                PasswordEncoder passwordEncoder
    ) {
        this.personaRepository = personaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolesRepository = rolesRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.estadoSolicitudRepository = estadoSolicitudRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.estadoPagoRepository = estadoPagoRepository;
        this.metodoPagoRepository = metodoPagoRepository;
        this.puestoRepository = puestoRepository;
        this.estadoAsistenciaRepository = estadoAsistenciaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedSuperAdmin();
        seedEstadosSolicitud();
        seedTiposDocumento();
        seedEstadosPago();
        seedMetodosPago();
        seedPuestos();
        seedEstadosAsistencia();
    }

    private void seedRoles() {
        createRoleIfNotExists("ADMIN");
        createRoleIfNotExists("USER");
    }

    private void seedSuperAdmin() {
        Roles adminRole = rolesRepository.findByNombreRol("ADMIN")
                .orElseGet(() -> rolesRepository.save(Roles.builder().nombreRol("ADMIN").build()));

        Usuario adminUser = usuarioRepository.findByEmail("foo@gmail.com")
                .orElseGet(() -> {
                    Persona persona = personaRepository.save(Persona.builder()
                            .nombre("admin")
                            .apellido("user")
                            .edad(30)
                            .telefono("0000000000")
                            .build());

                    return usuarioRepository.save(Usuario.builder()
                            .persona(persona)
                            .email("foo@gmail.com")
                    .passwordHash(passwordEncoder.encode("123"))
                            .activo(true)
                            .build());
                });

        if (Objects.nonNull(adminUser.getPasswordHash()) && !adminUser.getPasswordHash().startsWith("$2")) {
            adminUser.setPasswordHash(passwordEncoder.encode("123"));
            adminUser.setActivo(true);
            usuarioRepository.save(adminUser);
        }

        if (!personaRolesRepository.existsByPersonaIdAndRolId(adminUser.getPersona().getId(), adminRole.getId())) {
            personaRolesRepository.save(PersonaRoles.builder()
                    .persona(adminUser.getPersona())
                    .rol(adminRole)
                    .build());
        }
    }

    private void seedEstadosSolicitud() {
        createEstadoSolicitudIfNotExists("PENDIENTE");
        createEstadoSolicitudIfNotExists("EN_REVISION");
        createEstadoSolicitudIfNotExists("APROBADA");
        createEstadoSolicitudIfNotExists("RECHAZADA");
    }

    private void seedTiposDocumento() {
        createTipoDocumentoIfNotExists("CEDULA", true);
        createTipoDocumentoIfNotExists("ACTA_NACIMIENTO", true);
        createTipoDocumentoIfNotExists("CERTIFICADO_MEDICO", true);
        createTipoDocumentoIfNotExists("RECORD_NOTAS", false);
    }

    private void seedEstadosPago() {
        createEstadoPagoIfNotExists("PENDIENTE");
        createEstadoPagoIfNotExists("PAGADO");
        createEstadoPagoIfNotExists("VENCIDO");
        createEstadoPagoIfNotExists("ANULADO");
    }

    private void seedMetodosPago() {
        createMetodoPagoIfNotExists("EFECTIVO");
        createMetodoPagoIfNotExists("TRANSFERENCIA");
        createMetodoPagoIfNotExists("TARJETA");
        createMetodoPagoIfNotExists("DEPOSITO");
    }

    private void seedPuestos() {
        createPuestoIfNotExists("DOCENTE", "Docente titular de aula", "OPERATIVO");
        createPuestoIfNotExists("COORDINADOR", "Coordinacion academica", "MANDO_MEDIO");
        createPuestoIfNotExists("ADMINISTRATIVO", "Gestion administrativa", "OPERATIVO");
    }

    private void seedEstadosAsistencia() {
        createEstadoAsistenciaIfNotExists("PRESENTE");
        createEstadoAsistenciaIfNotExists("AUSENTE");
        createEstadoAsistenciaIfNotExists("JUSTIFICADO");
    }

    private void createRoleIfNotExists(String name) {
        rolesRepository.findByNombreRol(name)
                .orElseGet(() -> rolesRepository.save(Roles.builder().nombreRol(name).build()));
    }

    private void createEstadoSolicitudIfNotExists(String name) {
        estadoSolicitudRepository.findByNombre(name)
                .orElseGet(() -> estadoSolicitudRepository.save(EstadoSolicitud.builder().nombre(name).build()));
    }

    private void createTipoDocumentoIfNotExists(String name, boolean required) {
        tipoDocumentoRepository.findByNombre(name)
                .orElseGet(() -> tipoDocumentoRepository.save(
                        TipoDocumento.builder().nombre(name).esObligatorio(required).build()
                ));
    }

    private void createEstadoPagoIfNotExists(String name) {
        estadoPagoRepository.findByNombre(name)
                .orElseGet(() -> estadoPagoRepository.save(EstadoPago.builder().nombre(name).build()));
    }

    private void createMetodoPagoIfNotExists(String name) {
        metodoPagoRepository.findByNombre(name)
                .orElseGet(() -> metodoPagoRepository.save(MetodoPago.builder().nombre(name).build()));
    }

    private void createPuestoIfNotExists(String name, String description, String range) {
        puestoRepository.findByNombre(name)
                .orElseGet(() -> puestoRepository.save(Puesto.builder()
                        .nombre(name)
                        .descripcion(description)
                        .rango(range)
                        .build()));
    }

    private void createEstadoAsistenciaIfNotExists(String name) {
        estadoAsistenciaRepository.findByNombre(name)
                .orElseGet(() -> estadoAsistenciaRepository.save(EstadoAsistencia.builder().nombre(name).build()));
    }
}

