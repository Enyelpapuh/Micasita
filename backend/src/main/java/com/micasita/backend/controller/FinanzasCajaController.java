package com.micasita.backend.controller;

import com.micasita.backend.entities.finanzas.CajaSesion;
import com.micasita.backend.service.finanzas.CajaFinanzasService;
import com.micasita.backend.repositories.finanzas.MatriculaRepository;
import com.micasita.backend.repositories.finanzas.MensualidadRepository;
import com.micasita.backend.repositories.finanzas.PagoCupoRepository;
import com.micasita.backend.repositories.finanzas.PagoMatriculaRepository;
import com.micasita.backend.repositories.talleres.CupoTallerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/finanzas/caja")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
@PreAuthorize("hasAnyRole('ADMIN','DEVELOPER','ADMINISTRACION','CAJA')")
public class FinanzasCajaController {

        private final CajaFinanzasService cajaFinanzasService;
    private final CupoTallerRepository cupoTallerRepository;
    private final MatriculaRepository matriculaRepository;
    private final PagoCupoRepository pagoCupoRepository;
    private final PagoMatriculaRepository pagoMatriculaRepository;
    private final MensualidadRepository mensualidadRepository;

    public FinanzasCajaController(
                        CajaFinanzasService cajaFinanzasService,
            CupoTallerRepository cupoTallerRepository,
            MatriculaRepository matriculaRepository,
            PagoCupoRepository pagoCupoRepository,
            PagoMatriculaRepository pagoMatriculaRepository,
            MensualidadRepository mensualidadRepository
    ) {
                this.cajaFinanzasService = cajaFinanzasService;
        this.cupoTallerRepository = cupoTallerRepository;
        this.matriculaRepository = matriculaRepository;
        this.pagoCupoRepository = pagoCupoRepository;
        this.pagoMatriculaRepository = pagoMatriculaRepository;
        this.mensualidadRepository = mensualidadRepository;
    }

        @GetMapping("/session/active")
        public ResponseEntity<CajaSesionResponse> activeSession(Authentication authentication) {
                CajaSesion session = cajaFinanzasService.getActiveSession(authentication.getName());
                return ResponseEntity.ok(session == null ? null : CajaSesionResponse.from(session));
        }

        @GetMapping("/metodos-pago")
        public ResponseEntity<List<CajaFinanzasService.MetodoPagoOption>> metodosPago() {
                return ResponseEntity.ok(cajaFinanzasService.listMetodosPago());
        }

        @PostMapping("/session/open")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> openSession(
                        Authentication authentication,
                        @RequestBody OpenCajaRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.openSession(authentication.getName(), request.saldoInicial(), request.observacion()));
        }

        @PostMapping("/session/close")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> closeSession(
                        Authentication authentication,
                        @RequestBody CloseCajaRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.closeSession(authentication.getName(), request.saldoCierre(), request.observacion()));
        }

        @PostMapping("/payments/matricula")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> payMatricula(
                        Authentication authentication,
                        @RequestBody MatriculaPaymentRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.payMatricula(
                                authentication.getName(),
                                request.matriculaId(),
                                request.monto(),
                                request.metodoPagoId(),
                                request.detalle()
                ));
        }

        @PostMapping("/payments/taller")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> payTaller(
                        Authentication authentication,
                        @RequestBody TallerPaymentRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.payTaller(
                                authentication.getName(),
                                request.cupoId(),
                                request.monto(),
                                request.metodoPagoId(),
                                request.detalle()
                ));
        }

        @PostMapping("/payments/mensualidad")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> payMensualidad(
                        Authentication authentication,
                        @RequestBody MensualidadPaymentRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.payMensualidad(
                                authentication.getName(),
                                request.estudianteId(),
                                request.mesDePago(),
                                request.montoBase(),
                                request.montoMora(),
                                request.metodoPagoId(),
                                request.detalle()
                ));
        }

        @PostMapping("/payments/matricula/{id}/annul")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> annulMatricula(
                        Authentication authentication,
                        @PathVariable Long id,
                        @RequestBody AnulacionRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.annulPagoMatricula(authentication.getName(), id, request.motivo()));
        }

        @PostMapping("/payments/taller/{id}/annul")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> annulTaller(
                        Authentication authentication,
                        @PathVariable Long id,
                        @RequestBody AnulacionRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.annulPagoTaller(authentication.getName(), id, request.motivo()));
        }

        @PostMapping("/payments/mensualidad/{id}/annul")
        public ResponseEntity<CajaFinanzasService.CajaOperacionResult> annulMensualidad(
                        Authentication authentication,
                        @PathVariable Long id,
                        @RequestBody AnulacionRequest request
        ) {
                return ResponseEntity.ok(cajaFinanzasService.annulPagoMensualidad(authentication.getName(), id, request.motivo()));
        }

    @GetMapping("/dashboard")
    public ResponseEntity<CajaDashboardResponse> dashboard(@RequestParam(defaultValue = "25") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        List<CupoPendienteItem> talleresPendientes = cupoTallerRepository.findPendientesPagoCaja().stream()
                .limit(safeLimit)
                .map(v -> new CupoPendienteItem(
                        v.getCupoId(),
                        v.getTallerId(),
                        clean(v.getTaller()),
                        clean(v.getParticipante()),
                        v.getMontoEsperado(),
                        v.getFechaInscripcion(),
                        "ESPERA_PAGO"
                ))
                .toList();

        List<MatriculaPendienteItem> matriculasPendientes = matriculaRepository.findPendientesCaja().stream()
                .limit(safeLimit)
                .map(v -> new MatriculaPendienteItem(
                        v.getMatriculaId(),
                        clean(v.getEstudiante()),
                        clean(v.getAnioLectivo()),
                        v.getFechaMatricula(),
                        clean(v.getEstado())
                ))
                .toList();

        List<PagoMatriculaItem> pagosMatricula = pagoMatriculaRepository.findRecentCaja().stream()
                .limit(safeLimit)
                .map(v -> new PagoMatriculaItem(
                        v.getPagoMatriculaId(),
                        v.getMatriculaId(),
                        clean(v.getEstudiante()),
                        v.getMonto(),
                        v.getFechaPago(),
                        clean(v.getEstado()),
                        clean(v.getMetodoPago()),
                        clean(v.getDetalle()),
                        Boolean.TRUE.equals(v.getAnulado())
                ))
                .toList();

        List<MensualidadItem> mensualidades = mensualidadRepository.findRecentCaja().stream()
                .limit(safeLimit)
                .map(v -> new MensualidadItem(
                        v.getMensualidadId(),
                        clean(v.getEstudiante()),
                        monthLabel(v.getMes()),
                        v.getMonto(),
                        v.getFechaPago(),
                        clean(v.getEstado()),
                        clean(v.getMetodoPago()),
                        clean(v.getDetalle()),
                        Boolean.TRUE.equals(v.getAnulado())
                ))
                .toList();

        List<PagoCupoItem> pagosTaller = pagoCupoRepository.findRecentCaja().stream()
                .limit(safeLimit)
                .map(v -> new PagoCupoItem(
                        v.getPagoCupoId(),
                        v.getCupoId(),
                        clean(v.getTaller()),
                        clean(v.getParticipante()),
                        clean(v.getNumeroRecibo()),
                        v.getMonto(),
                        v.getFechaPago(),
                        clean(v.getEstado()),
                        clean(v.getMetodoPago()),
                        Boolean.TRUE.equals(v.getAnulado())
                ))
                .toList();

        CajaMetricas metricas = new CajaMetricas(
                cupoTallerRepository.countPendientesPagoCaja(),
                matriculaRepository.countPendientesCaja(),
                pagoMatriculaRepository.countPendientesCaja(),
                mensualidadRepository.countPendientesCaja(),
                pagosTaller.size(),
                pagosMatricula.size(),
                mensualidades.size()
        );

        return ResponseEntity.ok(new CajaDashboardResponse(
                metricas,
                talleresPendientes,
                matriculasPendientes,
                pagosTaller,
                pagosMatricula,
                mensualidades
        ));
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

        private String monthLabel(Integer month) {
                if (month == null) {
                        return "";
                }
                return String.valueOf(month);
        }

    public record CajaMetricas(
            long talleresPendientesPago,
            long matriculasPendientes,
            long pagosMatriculaPendientes,
            long mensualidadesPendientes,
            long registrosTaller,
            long registrosMatricula,
            long registrosMensualidad
    ) {}

    public record CupoPendienteItem(
            Long cupoId,
            Long tallerId,
            String taller,
            String participante,
            BigDecimal montoEsperado,
            LocalDate fechaInscripcion,
            String estado
    ) {}

    public record MatriculaPendienteItem(
            Long matriculaId,
            String estudiante,
            String anioLectivo,
            LocalDate fechaMatricula,
            String estado
    ) {}

    public record PagoCupoItem(
            Long pagoCupoId,
            Long cupoId,
            String taller,
            String participante,
            String numeroRecibo,
            BigDecimal monto,
            LocalDate fechaPago,
            String estado,
            String metodoPago,
            boolean anulado
    ) {}

    public record PagoMatriculaItem(
            Long pagoMatriculaId,
            Long matriculaId,
            String estudiante,
            BigDecimal monto,
            LocalDate fechaPago,
            String estado,
            String metodoPago,
            String detalle,
            boolean anulado
    ) {}

    public record MensualidadItem(
            Long mensualidadId,
            String estudiante,
            String mes,
            BigDecimal monto,
            LocalDate fechaPago,
            String estado,
            String metodoPago,
            String detalle,
            boolean anulado
    ) {}

    public record CajaDashboardResponse(
            CajaMetricas metricas,
            List<CupoPendienteItem> talleresPendientes,
            List<MatriculaPendienteItem> matriculasPendientes,
            List<PagoCupoItem> pagosTaller,
            List<PagoMatriculaItem> pagosMatricula,
            List<MensualidadItem> mensualidades
    ) {}

        public record CajaSesionResponse(
                        Long id,
                        String codigo,
                        String estado,
                        BigDecimal saldoInicial,
                        BigDecimal saldoCierre,
                        LocalDateTime fechaApertura,
                        LocalDateTime fechaCierre,
                        String observacionApertura,
                        String observacionCierre
        ) {
                static CajaSesionResponse from(CajaSesion session) {
                        return new CajaSesionResponse(
                                        session.getId(),
                                        session.getCodigo(),
                                        session.getEstadoCaja() != null ? session.getEstadoCaja().getNombre() : null,
                                        session.getSaldoInicial(),
                                        session.getSaldoCierre(),
                                        session.getFechaApertura(),
                                        session.getFechaCierre(),
                                        session.getObservacionApertura(),
                                        session.getObservacionCierre()
                        );
                }
        }

        public record AnulacionRequest(String motivo) {}

        public record OpenCajaRequest(BigDecimal saldoInicial, String observacion) {}

        public record CloseCajaRequest(BigDecimal saldoCierre, String observacion) {}

        public record MatriculaPaymentRequest(Long matriculaId, BigDecimal monto, Long metodoPagoId, String detalle) {}

        public record TallerPaymentRequest(Long cupoId, BigDecimal monto, Long metodoPagoId, String detalle) {}

        public record MensualidadPaymentRequest(Long estudianteId, Integer mesDePago, BigDecimal montoBase, BigDecimal montoMora, Long metodoPagoId, String detalle) {}
}
