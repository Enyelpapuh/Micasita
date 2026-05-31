package com.micasita.backend.config;

import com.micasita.backend.entities.academico.Puesto;
import com.micasita.backend.entities.academico.EstadoAsistencia;
import com.micasita.backend.entities.academico.Profesor;
import com.micasita.backend.entities.academico.Grupo;
import com.micasita.backend.entities.academico.ProfesorGrupo;
import com.micasita.backend.entities.admision.EstadoSolicitud;
import com.micasita.backend.entities.admision.SolicitudAdmision;
import com.micasita.backend.entities.admision.TipoDocumento;
import com.micasita.backend.entities.academico.Estudiante;
import com.micasita.backend.entities.core.Persona;
import com.micasita.backend.entities.core.PersonaRoles;
import com.micasita.backend.entities.core.Roles;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.entities.finanzas.EstadoCaja;
import com.micasita.backend.entities.finanzas.EstadoPago;
import com.micasita.backend.entities.finanzas.EstadoMatricula;
import com.micasita.backend.entities.finanzas.MetodoPago;
import com.micasita.backend.entities.finanzas.TipoRecibo;
import com.micasita.backend.entities.talleres.Taller;
import com.micasita.backend.entities.talleres.TipoPublicoTaller;
import com.micasita.backend.repositories.academico.EstudianteRepository;
import com.micasita.backend.repositories.academico.PuestoRepository;
import com.micasita.backend.repositories.academico.ProfesorRepository;
import com.micasita.backend.repositories.academico.GrupoRepository;
import com.micasita.backend.repositories.academico.ProfesorGrupoRepository;
import com.micasita.backend.repositories.academico.EstadoAsistenciaRepository;
import com.micasita.backend.repositories.admision.EstadoSolicitudRepository;
import com.micasita.backend.repositories.admision.SolicitudAdmisionRepository;
import com.micasita.backend.repositories.admision.TipoDocumentoRepository;
import com.micasita.backend.repositories.core.PersonaRepository;
import com.micasita.backend.repositories.core.PersonaRolesRepository;
import com.micasita.backend.repositories.core.RolesRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import com.micasita.backend.repositories.finanzas.EstadoCajaRepository;
import com.micasita.backend.repositories.finanzas.EstadoPagoRepository;
import com.micasita.backend.repositories.finanzas.EstadoMatriculaRepository;
import com.micasita.backend.repositories.finanzas.MetodoPagoRepository;
import com.micasita.backend.repositories.finanzas.TipoReciboRepository;
import com.micasita.backend.repositories.talleres.TallerRepository;
import com.micasita.backend.repositories.talleres.TipoPublicoTallerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Objects;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PersonaRepository personaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolesRepository rolesRepository;
    private final PersonaRolesRepository personaRolesRepository;
    private final EstadoSolicitudRepository estadoSolicitudRepository;
    private final SolicitudAdmisionRepository solicitudAdmisionRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final EstudianteRepository estudianteRepository;
    private final EstadoPagoRepository estadoPagoRepository;
    private final EstadoCajaRepository estadoCajaRepository;
    private final EstadoMatriculaRepository estadoMatriculaRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final TipoReciboRepository tipoReciboRepository;
    private final PuestoRepository puestoRepository;
    private final EstadoAsistenciaRepository estadoAsistenciaRepository;
    private final TallerRepository tallerRepository;
    private final TipoPublicoTallerRepository tipoPublicoTallerRepository;
    private final ProfesorRepository profesorRepository;
    private final GrupoRepository grupoRepository;
    private final ProfesorGrupoRepository profesorGrupoRepository;
    private final PasswordEncoder passwordEncoder;
    


    public DataInitializer(
            PersonaRepository personaRepository,
            UsuarioRepository usuarioRepository,
            RolesRepository rolesRepository,
            PersonaRolesRepository personaRolesRepository,
            EstadoSolicitudRepository estadoSolicitudRepository,
            SolicitudAdmisionRepository solicitudAdmisionRepository,
            TipoDocumentoRepository tipoDocumentoRepository,
            EstudianteRepository estudianteRepository,
            EstadoPagoRepository estadoPagoRepository,
            EstadoCajaRepository estadoCajaRepository,
            EstadoMatriculaRepository estadoMatriculaRepository,
            MetodoPagoRepository metodoPagoRepository,
            TipoReciboRepository tipoReciboRepository,
                PuestoRepository puestoRepository,
                EstadoAsistenciaRepository estadoAsistenciaRepository,
                TallerRepository tallerRepository,
                TipoPublicoTallerRepository tipoPublicoTallerRepository,
                ProfesorRepository profesorRepository,
                GrupoRepository grupoRepository,
                ProfesorGrupoRepository profesorGrupoRepository,
                PasswordEncoder passwordEncoder
    ) {
        this.personaRepository = personaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolesRepository = rolesRepository;
        this.personaRolesRepository = personaRolesRepository;
        this.estadoSolicitudRepository = estadoSolicitudRepository;
        this.solicitudAdmisionRepository = solicitudAdmisionRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.estudianteRepository = estudianteRepository;
        this.estadoPagoRepository = estadoPagoRepository;
        this.estadoCajaRepository = estadoCajaRepository;
        this.estadoMatriculaRepository = estadoMatriculaRepository;
        this.metodoPagoRepository = metodoPagoRepository;
        this.tipoReciboRepository = tipoReciboRepository;
        this.puestoRepository = puestoRepository;
        this.estadoAsistenciaRepository = estadoAsistenciaRepository;
        this.tallerRepository = tallerRepository;
        this.tipoPublicoTallerRepository = tipoPublicoTallerRepository;
        this.profesorRepository = profesorRepository;
        this.grupoRepository = grupoRepository;
        this.profesorGrupoRepository = profesorGrupoRepository;
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
        seedEstadosCaja();
        seedEstadosMatricula();
        seedMetodosPago();
        seedTiposRecibo();
        seedPuestos();
        seedEstadosAsistencia();
        seedTiposPublicoTaller();
        seedGrupos();
        seedProfesores();
        seedProfesorGrupos();
        seedDemoUsuariosConRoles();
        seedDemoEstudiantes();
        seedDemoSolicitudesPendientes();
        seedDemoTalleres();
    }

    private void seedRoles() {
        createRoleIfNotExists("DEVELOPER");
        createRoleIfNotExists("ADMIN_DIRECCION");
        createRoleIfNotExists("ADMINISTRACION");
        createRoleIfNotExists("CAJA");
        createRoleIfNotExists("PROFESOR");
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
                            .fechaNacimiento(LocalDate.of(1995, 1, 1))
                            .telefono("0000000000")
                            .activo(true)
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

    private void seedEstadosCaja() {
        createEstadoCajaIfNotExists("ABIERTA");
        createEstadoCajaIfNotExists("CERRADA");
        createEstadoCajaIfNotExists("ANULADA");
    }

    private void seedMetodosPago() {
        createMetodoPagoIfNotExists("EFECTIVO");
        createMetodoPagoIfNotExists("TRANSFERENCIA");
        createMetodoPagoIfNotExists("TARJETA");
        createMetodoPagoIfNotExists("DEPOSITO");
    }

    private void seedTiposRecibo() {
        createTipoReciboIfNotExists("MATRICULA", "MAT");
        createTipoReciboIfNotExists("TALLER", "TAL");
        createTipoReciboIfNotExists("MENSUALIDAD", "MEN");
    }

    private void seedEstadosMatricula() {
        createEstadoMatriculaIfNotExists("PENDIENTE");
        createEstadoMatriculaIfNotExists("ADMITIDO");
        createEstadoMatriculaIfNotExists("OFICIAL");
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

    private void seedTiposPublicoTaller() {
        createTipoPublicoTallerIfNotExists("NINO");
        createTipoPublicoTallerIfNotExists("ADULTO");
        createTipoPublicoTallerIfNotExists("GENERAL");
    }

        private void seedDemoUsuariosConRoles() {
        createUserWithRole(
            "admin.dir@micasita.local",
            "123",
            "Ada",
            "Direccion",
            "88880001",
            "ADM-DIR-001",
            LocalDate.of(1988, 2, 10),
            "ADMIN_DIRECCION"
        );
        createUserWithRole(
            "admin.fin@micasita.local",
            "123",
            "Ana",
            "Administracion",
            "88880002",
            "ADM-001",
            LocalDate.of(1990, 5, 15),
            "ADMINISTRACION"
        );
        createUserWithRole(
            "caja.1@micasita.local",
            "123",
            "Carlos",
            "Caja",
            "88880003",
            "CAJ-001",
            LocalDate.of(1992, 7, 5),
            "CAJA"
        );
        createUserWithRole(
            "caja.2@micasita.local",
            "123",
            "Cecilia",
            "Caja",
            "88880004",
            "CAJ-002",
            LocalDate.of(1994, 9, 18),
            "CAJA"
        );
        createUserWithRole(
            "profe.1@micasita.local",
            "123",
            "Paula",
            "Docente",
            "88880005",
            "PROF-001",
            LocalDate.of(1987, 4, 8),
            "PROFESOR"
        );
        createUserWithRole(
            "profe.2@micasita.local",
            "123",
            "Pedro",
            "Docente",
            "88880006",
            "PROF-002",
            LocalDate.of(1986, 11, 21),
            "PROFESOR"
        );
        createUserWithRole(
            "recepcion@micasita.local",
            "123",
            "Rosa",
            "Recepcion",
            "88880007",
            "REC-001",
            LocalDate.of(1995, 1, 12),
            "USER"
        );
        createUserWithRole(
            "dev.ops@micasita.local",
            "123",
            "Diego",
            "Dev",
            "88880008",
            "DEV-001",
            LocalDate.of(1991, 3, 3),
            "DEVELOPER"
        );
        }

        private void seedDemoEstudiantes() {
        ensureEstudiante(
            "estudiante.1@micasita.local",
            "EST-001",
            "Elena",
            "Lopez",
            "88881001",
            LocalDate.of(2013, 5, 4)
        );
        ensureEstudiante(
            "estudiante.2@micasita.local",
            "EST-002",
            "Erick",
            "Martinez",
            "88881002",
            LocalDate.of(2012, 8, 14)
        );
        ensureEstudiante(
            "estudiante.3@micasita.local",
            "EST-003",
            "Eva",
            "Santos",
            "88881003",
            LocalDate.of(2014, 10, 22)
        );
        ensureEstudiante(
            "estudiante.4@micasita.local",
            "EST-004",
            "Elias",
            "Rojas",
            "88881004",
            LocalDate.of(2011, 12, 2)
        );
        }

        private void seedDemoSolicitudesPendientes() {
        if (solicitudAdmisionRepository.count() >= 5) {
            return;
        }

        EstadoSolicitud pendiente = estadoSolicitudRepository.findByNombre("PENDIENTE")
            .orElseThrow(() -> new IllegalStateException("Estado PENDIENTE no encontrado"));

        List<SolicitudAdmision> solicitudes = List.of(
            SolicitudAdmision.builder()
                .estadoSolicitud(pendiente)
                .comentariosDirector("Pendiente de revision inicial")
                .nombrePostulante("Lucia")
                .apellidoPostulante("Gomez")
                .fechaNacimientoPostulante(LocalDate.of(2015, 6, 1))
                .telefonoPostulante("88882001")
                .correoPostulante("postulante.1@micasita.local")
                .identificadorPostulante("POST-001")
                .nombreTutor("Marta Gomez")
                .parentescoTutor("Madre")
                .telefonoTutor("88883001")
                .correoTutor("tutor.1@micasita.local")
                .activo(true)
                .build(),
            SolicitudAdmision.builder()
                .estadoSolicitud(pendiente)
                .comentariosDirector("Esperando documentacion")
                .nombrePostulante("Mateo")
                .apellidoPostulante("Ruiz")
                .fechaNacimientoPostulante(LocalDate.of(2014, 2, 11))
                .telefonoPostulante("88882002")
                .correoPostulante("postulante.2@micasita.local")
                .identificadorPostulante("POST-002")
                .nombreTutor("Jorge Ruiz")
                .parentescoTutor("Padre")
                .telefonoTutor("88883002")
                .correoTutor("tutor.2@micasita.local")
                .activo(true)
                .build(),
            SolicitudAdmision.builder()
                .estadoSolicitud(pendiente)
                .comentariosDirector("Pendiente entrevista")
                .nombrePostulante("Camila")
                .apellidoPostulante("Pineda")
                .fechaNacimientoPostulante(LocalDate.of(2016, 1, 19))
                .telefonoPostulante("88882003")
                .correoPostulante("postulante.3@micasita.local")
                .identificadorPostulante("POST-003")
                .nombreTutor("Paola Pineda")
                .parentescoTutor("Madre")
                .telefonoTutor("88883003")
                .correoTutor("tutor.3@micasita.local")
                .activo(true)
                .build(),
            SolicitudAdmision.builder()
                .estadoSolicitud(pendiente)
                .comentariosDirector("Pendiente validacion de edad")
                .nombrePostulante("Samuel")
                .apellidoPostulante("Reyes")
                .fechaNacimientoPostulante(LocalDate.of(2013, 3, 7))
                .telefonoPostulante("88882004")
                .correoPostulante("postulante.4@micasita.local")
                .identificadorPostulante("POST-004")
                .nombreTutor("Gloria Reyes")
                .parentescoTutor("Tia")
                .telefonoTutor("88883004")
                .correoTutor("tutor.4@micasita.local")
                .activo(true)
                .build(),
            SolicitudAdmision.builder()
                .estadoSolicitud(pendiente)
                .comentariosDirector("Pendiente cupo")
                .nombrePostulante("Valentina")
                .apellidoPostulante("Mora")
                .fechaNacimientoPostulante(LocalDate.of(2012, 9, 30))
                .telefonoPostulante("88882005")
                .correoPostulante("postulante.5@micasita.local")
                .identificadorPostulante("POST-005")
                .nombreTutor("Mario Mora")
                .parentescoTutor("Padre")
                .telefonoTutor("88883005")
                .correoTutor("tutor.5@micasita.local")
                .activo(true)
                .build()
        );

        solicitudAdmisionRepository.saveAll(solicitudes);
        }

        private void seedDemoTalleres() {
        TipoPublicoTaller general = tipoPublicoTallerRepository.findByNombre("GENERAL")
            .orElseThrow(() -> new IllegalStateException("Tipo publico GENERAL no encontrado"));

        createTallerIfNotExists("Taller 1", "Introduccion al arte", general, 35, 10, 7, 15);
        createTallerIfNotExists("Taller 2", "Musica inicial", general, 40, 12, 8, 16);
        createTallerIfNotExists("Taller 3", "Expresion corporal", general, 45, 15, 7, 17);
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

    private void createEstadoCajaIfNotExists(String name) {
        estadoCajaRepository.findByNombre(name)
                .orElseGet(() -> estadoCajaRepository.save(EstadoCaja.builder().nombre(name).build()));
    }

    private void createMetodoPagoIfNotExists(String name) {
        metodoPagoRepository.findByNombre(name)
                .orElseGet(() -> metodoPagoRepository.save(MetodoPago.builder().nombre(name).build()));
    }

    private void createTipoReciboIfNotExists(String nombre, String codigo) {
        tipoReciboRepository.findByCodigo(codigo)
                .orElseGet(() -> tipoReciboRepository.save(TipoRecibo.builder()
                        .nombre(nombre)
                        .codigo(codigo)
                        .activo(true)
                        .build()));
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

    private void createTipoPublicoTallerIfNotExists(String name) {
        tipoPublicoTallerRepository.findByNombre(name)
                .orElseGet(() -> tipoPublicoTallerRepository.save(TipoPublicoTaller.builder().nombre(name).build()));
    }

    private void seedGrupos() {
        createGrupoIfNotExists("Grupo A", 101);
        createGrupoIfNotExists("Grupo B", 102);
    }

    private void seedProfesores() {
        // ensure puesto DOCENTE exists (seedPuestos runs earlier)
        createProfesorIfNotExists("profe.a@micasita.local", "PROF-A-001", "Ana", "Garcia", "89990001", LocalDate.of(1985, 4, 1), "Artes");
        createProfesorIfNotExists("profe.b@micasita.local", "PROF-B-001", "Luis", "Martinez", "89990002", LocalDate.of(1980, 9, 12), "Musica");
    }

    private void seedProfesorGrupos() {
        // assign a single profesor to a single grupo (one class)
        createProfesorGrupoIfNotExists("profe.a@micasita.local", "Grupo A", 15, LocalDate.now().plusDays(3));
    }

    private void createGrupoIfNotExists(String nombre, Integer codigoFuncion) {
        boolean exists = grupoRepository.findAll().stream()
                .anyMatch(g -> nombre.equalsIgnoreCase(g.getNombre()));

        if (exists) {
            return;
        }

        grupoRepository.save(Grupo.builder()
                .nombre(nombre)
                .codigoFuncion(codigoFuncion)
                .build());
    }

    private void createProfesorIfNotExists(
            String correo,
            String identificador,
            String nombre,
            String apellido,
            String telefono,
            LocalDate nacimiento,
            String carrera
    ) {
        Persona persona = personaRepository.findFirstByCorreoOrIdentificador(correo, identificador)
                .orElseGet(() -> personaRepository.save(Persona.builder()
                        .nombre(nombre)
                        .apellido(apellido)
                        .fechaNacimiento(nacimiento)
                        .telefono(telefono)
                        .correo(correo)
                        .identificador(identificador)
                        .activo(true)
                        .build()));

        boolean exists = profesorRepository.findAll().stream()
                .anyMatch(p -> p.getPersona() != null && p.getPersona().getId().equals(persona.getId()));

        if (exists) {
            return;
        }

        Puesto puesto = puestoRepository.findByNombre("DOCENTE").orElse(null);

        profesorRepository.save(Profesor.builder()
                .persona(persona)
                .puesto(puesto)
                .carrera(carrera)
                .build());
    }

    private void createProfesorGrupoIfNotExists(String profesorCorreo, String grupoNombre, Integer cantidadAlumnos, LocalDate fechaInicio) {
        Persona persona = personaRepository.findByCorreo(profesorCorreo).orElse(null);
        if (persona == null) return;

        Profesor profesor = profesorRepository.findAll().stream()
                .filter(p -> p.getPersona() != null && persona.getId().equals(p.getPersona().getId()))
                .findFirst().orElse(null);
        if (profesor == null) return;

        Grupo grupo = grupoRepository.findAll().stream()
                .filter(g -> grupoNombre.equalsIgnoreCase(g.getNombre()))
                .findFirst().orElse(null);
        if (grupo == null) return;

        if (profesorGrupoRepository.existsByProfesorIdAndGrupoId(profesor.getId(), grupo.getId())) {
            return;
        }

        profesorGrupoRepository.save(ProfesorGrupo.builder()
                .profesor(profesor)
                .grupo(grupo)
                .fechaInicio(fechaInicio)
                .build());
    }

    private void createEstadoMatriculaIfNotExists(String name) {
        estadoMatriculaRepository.findByNombreEstado(name)
                .orElseGet(() -> estadoMatriculaRepository.save(EstadoMatricula.builder().nombreEstado(name).build()));
    }

        private void createUserWithRole(
            String email,
            String rawPassword,
            String nombre,
            String apellido,
            String telefono,
            String identificador,
            LocalDate fechaNacimiento,
            String roleName
        ) {
        Persona persona = personaRepository.findFirstByCorreoOrIdentificador(email, identificador)
            .orElseGet(() -> personaRepository.save(Persona.builder()
                .nombre(nombre)
                .apellido(apellido)
                .fechaNacimiento(fechaNacimiento)
                .telefono(telefono)
                .correo(email)
                .identificador(identificador)
                .activo(true)
                .build()));

        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseGet(() -> usuarioRepository.save(Usuario.builder()
                .persona(persona)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .activo(true)
                .build()));

        if (Objects.nonNull(usuario.getPasswordHash()) && !usuario.getPasswordHash().startsWith("$2")) {
            usuario.setPasswordHash(passwordEncoder.encode(rawPassword));
            usuario.setActivo(true);
            usuarioRepository.save(usuario);
        }

        Roles role = rolesRepository.findByNombreRol(roleName)
            .orElseGet(() -> rolesRepository.save(Roles.builder().nombreRol(roleName).build()));

        if (!personaRolesRepository.existsByPersonaIdAndRolId(persona.getId(), role.getId())) {
            personaRolesRepository.save(PersonaRoles.builder()
                .persona(persona)
                .rol(role)
                .build());
        }
        }

        private void ensureEstudiante(
            String correo,
            String identificador,
            String nombre,
            String apellido,
            String telefono,
            LocalDate nacimiento
        ) {
        Persona persona = personaRepository.findFirstByCorreoOrIdentificador(correo, identificador)
            .orElseGet(() -> personaRepository.save(Persona.builder()
                .nombre(nombre)
                .apellido(apellido)
                .fechaNacimiento(nacimiento)
                .telefono(telefono)
                .correo(correo)
                .identificador(identificador)
                .activo(true)
                .build()));

        if (!estudianteRepository.existsByPersonaId(persona.getId())) {
            estudianteRepository.save(Estudiante.builder().persona(persona).build());
        }
        }

        private void createTallerIfNotExists(
            String nombre,
            String descripcion,
            TipoPublicoTaller tipoPublico,
            int costo,
            int cupos,
            int edadMin,
            int edadMax
        ) {
        boolean exists = tallerRepository.findAll().stream()
            .anyMatch(t -> nombre.equalsIgnoreCase(t.getNombre()));

        if (exists) {
            return;
        }

        tallerRepository.save(Taller.builder()
            .nombre(nombre)
            .descripcion(descripcion)
            .tipoPublico(tipoPublico)
            .rutaImagen(null)
            .fechaInicial(LocalDate.now().plusDays(3))
            .fechaFinal(LocalDate.now().plusMonths(2))
            .costo(java.math.BigDecimal.valueOf(costo))
            .cuposMaximos(cupos)
            .edadMinima(edadMin)
            .edadMaxima(edadMax)
            .activo(true)
            .build());
        }
}

