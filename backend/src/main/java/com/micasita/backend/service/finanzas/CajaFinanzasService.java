package com.micasita.backend.service.finanzas;

import com.micasita.backend.entities.academico.Estudiante;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.entities.finanzas.CajaSesion;
import com.micasita.backend.entities.finanzas.EstadoCaja;
import com.micasita.backend.entities.finanzas.EstadoMatricula;
import com.micasita.backend.entities.finanzas.EstadoPago;
import com.micasita.backend.entities.finanzas.Matricula;
import com.micasita.backend.entities.finanzas.Mensualidad;
import com.micasita.backend.entities.finanzas.MetodoPago;
import com.micasita.backend.entities.finanzas.PagoCupo;
import com.micasita.backend.entities.finanzas.PagoMatricula;
import com.micasita.backend.entities.finanzas.SecuenciaRecibo;
import com.micasita.backend.entities.finanzas.TipoRecibo;
import com.micasita.backend.entities.talleres.CupoTaller;
import com.micasita.backend.repositories.academico.EstudianteRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import com.micasita.backend.repositories.finanzas.CajaSesionRepository;
import com.micasita.backend.repositories.finanzas.EstadoCajaRepository;
import com.micasita.backend.repositories.finanzas.EstadoMatriculaRepository;
import com.micasita.backend.repositories.finanzas.EstadoPagoRepository;
import com.micasita.backend.repositories.finanzas.MatriculaRepository;
import com.micasita.backend.repositories.finanzas.MensualidadRepository;
import com.micasita.backend.repositories.finanzas.MetodoPagoRepository;
import com.micasita.backend.repositories.finanzas.PagoCupoRepository;
import com.micasita.backend.repositories.finanzas.PagoMatriculaRepository;
import com.micasita.backend.repositories.finanzas.SecuenciaReciboRepository;
import com.micasita.backend.repositories.finanzas.TipoReciboRepository;
import com.micasita.backend.repositories.talleres.CupoTallerRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class CajaFinanzasService {

    private static final String ESTADO_ABIERTA = "ABIERTA";
    private static final String ESTADO_CERRADA = "CERRADA";
    private static final String ESTADO_PAGADO = "PAGADO";
    private static final String ESTADO_ANULADO = "ANULADO";
    private static final String ESTADO_PENDIENTE = "PENDIENTE";

    private final CajaSesionRepository cajaSesionRepository;
    private final EstadoCajaRepository estadoCajaRepository;
    private final TipoReciboRepository tipoReciboRepository;
    private final SecuenciaReciboRepository secuenciaReciboRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstadoPagoRepository estadoPagoRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final CupoTallerRepository cupoTallerRepository;
    private final PagoCupoRepository pagoCupoRepository;
    private final MatriculaRepository matriculaRepository;
    private final PagoMatriculaRepository pagoMatriculaRepository;
    private final EstudianteRepository estudianteRepository;
    private final MensualidadRepository mensualidadRepository;
    private final EstadoMatriculaRepository estadoMatriculaRepository;
    private final ConfiguracionFinanzasService configuracionFinanzasService;

    public CajaFinanzasService(
            CajaSesionRepository cajaSesionRepository,
            EstadoCajaRepository estadoCajaRepository,
            TipoReciboRepository tipoReciboRepository,
            SecuenciaReciboRepository secuenciaReciboRepository,
            UsuarioRepository usuarioRepository,
            EstadoPagoRepository estadoPagoRepository,
            MetodoPagoRepository metodoPagoRepository,
            CupoTallerRepository cupoTallerRepository,
            PagoCupoRepository pagoCupoRepository,
            MatriculaRepository matriculaRepository,
            PagoMatriculaRepository pagoMatriculaRepository,
            EstudianteRepository estudianteRepository,
            MensualidadRepository mensualidadRepository,
                EstadoMatriculaRepository estadoMatriculaRepository,
                ConfiguracionFinanzasService configuracionFinanzasService
    ) {
        this.cajaSesionRepository = cajaSesionRepository;
        this.estadoCajaRepository = estadoCajaRepository;
        this.tipoReciboRepository = tipoReciboRepository;
        this.secuenciaReciboRepository = secuenciaReciboRepository;
        this.usuarioRepository = usuarioRepository;
        this.estadoPagoRepository = estadoPagoRepository;
        this.metodoPagoRepository = metodoPagoRepository;
        this.cupoTallerRepository = cupoTallerRepository;
        this.pagoCupoRepository = pagoCupoRepository;
        this.matriculaRepository = matriculaRepository;
        this.pagoMatriculaRepository = pagoMatriculaRepository;
        this.estudianteRepository = estudianteRepository;
        this.mensualidadRepository = mensualidadRepository;
        this.estadoMatriculaRepository = estadoMatriculaRepository;
        this.configuracionFinanzasService = configuracionFinanzasService;
    }

    public CajaSesion getActiveSession(String email) {
        return cajaSesionRepository.findActiveSessionByEmail(email, ESTADO_ABIERTA)
                .orElse(null);
    }

    public List<MetodoPagoOption> listMetodosPago() {
        return metodoPagoRepository.findAll().stream()
                .map(m -> new MetodoPagoOption(m.getId(), m.getNombre()))
                .toList();
    }

    public CajaOperacionResult openSession(String email, BigDecimal saldoInicial, String observacion) {
        Usuario usuario = requireUser(email);
        if (getActiveSession(email) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CAJA_SESSION_ALREADY_OPEN");
        }

        CajaSesion session = CajaSesion.builder()
                .codigo(buildSessionCode(usuario.getId()))
                .estadoCaja(requireEstadoCaja(ESTADO_ABIERTA))
                .usuarioApertura(usuario)
                .saldoInicial(safeMoney(saldoInicial))
                .observacionApertura(trimToNull(observacion))
                .fechaApertura(LocalDateTime.now())
                .build();

        CajaSesion saved = cajaSesionRepository.save(session);
        return new CajaOperacionResult(saved.getId(), saved.getCodigo(), ESTADO_ABIERTA, "Caja abierta");
    }

    public CajaOperacionResult closeSession(String email, BigDecimal saldoCierre, String observacion) {
        CajaSesion session = getRequiredActiveSession(email);
        session.setEstadoCaja(requireEstadoCaja(ESTADO_CERRADA));
        session.setUsuarioCierre(requireUser(email));
        session.setSaldoCierre(safeMoney(saldoCierre));
        session.setObservacionCierre(trimToNull(observacion));
        session.setFechaCierre(LocalDateTime.now());
        cajaSesionRepository.save(session);
        return new CajaOperacionResult(session.getId(), session.getCodigo(), ESTADO_CERRADA, "Caja cerrada");
    }

    public CajaOperacionResult payMatricula(String email, Long matriculaId, BigDecimal monto, Long metodoPagoId, String detalle) {
        CajaSesion session = getRequiredActiveSession(email);
        Matricula matricula = matriculaRepository.findById(matriculaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MATRICULA_NOT_FOUND"));

        BigDecimal montoMatricula = configuracionFinanzasService.resolveMontoMatricula(
            matricula.getEstudiante() != null ? matricula.getEstudiante().getId() : null,
            monto
        );

        String receipt = nextReceipt("MAT");
        PagoMatricula pago = PagoMatricula.builder()
                .matricula(matricula)
                .usuario(requireUser(email))
                .numeroRecibo(receipt)
            .monto(montoMatricula)
                .metodoPago(requireMetodoPago(metodoPagoId))
                .estadoPago(requireEstadoPago(ESTADO_PAGADO))
                .fechaDePago(LocalDate.now())
                .esAnulado(false)
                .motivoAnulacion(null)
                .cajaSesion(session)
                .detalle(trimToNull(detalle))
                .build();

        PagoMatricula saved = pagoMatriculaRepository.save(pago);
        matricula.setEstadoMatricula(requireEstadoMatricula("OFICIAL"));
        matriculaRepository.save(matricula);
        return new CajaOperacionResult(saved.getId(), receipt, ESTADO_PAGADO, "Pago de matricula registrado");
    }

    public CajaOperacionResult payTaller(String email, Long cupoId, BigDecimal monto, Long metodoPagoId, String detalle) {
        CajaSesion session = getRequiredActiveSession(email);
        CupoTaller cupo = cupoTallerRepository.findById(cupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CUPO_NOT_FOUND"));

        String receipt = nextReceipt("TAL");
        PagoCupo pago = PagoCupo.builder()
                .cupo(cupo)
                .usuario(requireUser(email))
                .numeroRecibo(receipt)
                .monto(monto != null ? monto : cupo.getCosto())
                .metodoPago(requireMetodoPago(metodoPagoId))
                .estadoPago(requireEstadoPago(ESTADO_PAGADO))
                .fechaDePago(LocalDate.now())
                .esAnulado(false)
                .motivoAnulacion(null)
                .cajaSesion(session)
                .build();

        pagoCupoRepository.save(pago);
        return new CajaOperacionResult(pago.getId(), receipt, ESTADO_PAGADO, "Pago de taller registrado");
    }

    public CajaOperacionResult payMensualidad(
            String email,
            Long estudianteId,
            Integer mes,
            BigDecimal montoBase,
            BigDecimal montoMora,
            Long metodoPagoId,
            String detalle
    ) {
        CajaSesion session = getRequiredActiveSession(email);
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ESTUDIANTE_NOT_FOUND"));

        BigDecimal montoBaseFinal = configuracionFinanzasService.resolveMontoMensualidadBase(montoBase);
        BigDecimal montoMoraFinal = configuracionFinanzasService.resolveMontoMora(mes, montoMora);

        String receipt = nextReceipt("MEN");
        Mensualidad mensualidad = Mensualidad.builder()
                .estudiante(estudiante)
                .usuario(requireUser(email))
                .numeroRecibo(receipt)
            .montoBase(montoBaseFinal)
            .montoMora(montoMoraFinal)
                .metodoPago(requireMetodoPago(metodoPagoId))
                .estadoPago(requireEstadoPago(ESTADO_PAGADO))
                .mesDePago(mes)
                .fechaDePago(LocalDate.now())
                .esAnulado(false)
                .motivoAnulacion(null)
                .cajaSesion(session)
                .detalle(trimToNull(detalle))
                .build();

        Mensualidad saved = mensualidadRepository.save(mensualidad);
        return new CajaOperacionResult(saved.getId(), receipt, ESTADO_PAGADO, "Mensualidad registrada");
    }

    public CajaOperacionResult annulPagoMatricula(String email, Long pagoMatriculaId, String motivo) {
        getRequiredActiveSession(email);
        PagoMatricula pago = pagoMatriculaRepository.findById(pagoMatriculaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PAGO_MATRICULA_NOT_FOUND"));
        if (Boolean.TRUE.equals(pago.getEsAnulado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PAGO_MATRICULA_ALREADY_ANULLED");
        }
        pago.setEsAnulado(true);
        pago.setMotivoAnulacion(requireMotivo(motivo));
        pago.setEstadoPago(requireEstadoPago(ESTADO_ANULADO));
        pagoMatriculaRepository.save(pago);
        return new CajaOperacionResult(pago.getId(), pago.getNumeroRecibo(), ESTADO_ANULADO, "Pago de matricula anulado");
    }

    public CajaOperacionResult annulPagoTaller(String email, Long pagoCupoId, String motivo) {
        getRequiredActiveSession(email);
        PagoCupo pago = pagoCupoRepository.findById(pagoCupoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PAGO_TALLER_NOT_FOUND"));
        if (Boolean.TRUE.equals(pago.getEsAnulado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PAGO_TALLER_ALREADY_ANULLED");
        }
        pago.setEsAnulado(true);
        pago.setMotivoAnulacion(requireMotivo(motivo));
        pago.setEstadoPago(requireEstadoPago(ESTADO_ANULADO));
        pagoCupoRepository.save(pago);
        return new CajaOperacionResult(pago.getId(), pago.getNumeroRecibo(), ESTADO_ANULADO, "Pago de taller anulado");
    }

    public CajaOperacionResult annulPagoMensualidad(String email, Long mensualidadId, String motivo) {
        getRequiredActiveSession(email);
        Mensualidad mensualidad = mensualidadRepository.findById(mensualidadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PAGO_MENSUALIDAD_NOT_FOUND"));
        if (Boolean.TRUE.equals(mensualidad.getEsAnulado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PAGO_MENSUALIDAD_ALREADY_ANULLED");
        }
        mensualidad.setEsAnulado(true);
        mensualidad.setMotivoAnulacion(requireMotivo(motivo));
        mensualidad.setEstadoPago(requireEstadoPago(ESTADO_ANULADO));
        mensualidadRepository.save(mensualidad);
        return new CajaOperacionResult(mensualidad.getId(), mensualidad.getNumeroRecibo(), ESTADO_ANULADO, "Mensualidad anulada");
    }

    private CajaSesion getRequiredActiveSession(String email) {
        CajaSesion session = getActiveSession(email);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CAJA_SESSION_NOT_OPEN");
        }
        return session;
    }

    private Usuario requireUser(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));
    }

    private EstadoCaja requireEstadoCaja(String nombre) {
        return estadoCajaRepository.findByNombre(nombre)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ESTADO_CAJA_MISSING"));
    }

    private EstadoPago requireEstadoPago(String nombre) {
        return estadoPagoRepository.findByNombre(nombre)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ESTADO_PAGO_MISSING"));
    }

    private MetodoPago requireMetodoPago(Long metodoPagoId) {
        return metodoPagoRepository.findById(metodoPagoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "METODO_PAGO_NOT_FOUND"));
    }

    private EstadoMatricula requireEstadoMatricula(String nombre) {
        return estadoMatriculaRepository.findByNombreEstado(nombre)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ESTADO_MATRICULA_MISSING"));
    }

    private String nextReceipt(String tipoCodigo) {
        TipoRecibo tipoRecibo = tipoReciboRepository.findByCodigo(tipoCodigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TIPO_RECIBO_MISSING"));

        YearMonth period = YearMonth.now();
        SecuenciaRecibo secuencia = secuenciaReciboRepository
                .findByTipoReciboIdAndAnioAndMes(tipoRecibo.getId(), period.getYear(), period.getMonthValue())
                .orElseGet(() -> SecuenciaRecibo.builder()
                        .tipoRecibo(tipoRecibo)
                        .anio(period.getYear())
                        .mes(period.getMonthValue())
                        .ultimoNumero(0)
                        .build());

        int next = secuencia.getUltimoNumero() + 1;
        secuencia.setUltimoNumero(next);
        secuenciaReciboRepository.save(secuencia);

        return ReceiptNumberService.build(tipoRecibo.getCodigo(), LocalDate.now(), next);
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requireMotivo(String value) {
        String motivo = trimToNull(value);
        if (motivo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MOTIVO_ANULACION_REQUIRED");
        }
        return motivo;
    }

    private String buildSessionCode(Long userId) {
        String fechaHora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String sufijo = UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        return "CAJ-" + userId + "-" + fechaHora + "-" + sufijo;
    }

    public record CajaOperacionResult(
            Long id,
            String codigo,
            String estado,
            String mensaje
    ) {}

    public record MetodoPagoOption(Long id, String nombre) {}
}