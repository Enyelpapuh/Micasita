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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        private final com.micasita.backend.service.finanzas.ConfiguracionFinanzasService configuracionFinanzasService;

    public FinanzasCajaController(
                        CajaFinanzasService cajaFinanzasService,
            CupoTallerRepository cupoTallerRepository,
            MatriculaRepository matriculaRepository,
            PagoCupoRepository pagoCupoRepository,
            PagoMatriculaRepository pagoMatriculaRepository,
            MensualidadRepository mensualidadRepository,
            com.micasita.backend.service.finanzas.ConfiguracionFinanzasService configuracionFinanzasService
    ) {
                this.cajaFinanzasService = cajaFinanzasService;
        this.cupoTallerRepository = cupoTallerRepository;
        this.matriculaRepository = matriculaRepository;
        this.pagoCupoRepository = pagoCupoRepository;
        this.pagoMatriculaRepository = pagoMatriculaRepository;
        this.mensualidadRepository = mensualidadRepository;
        this.configuracionFinanzasService = configuracionFinanzasService;
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

        @GetMapping("/estudiantes/{id}/mensualidades/pendientes")
        public ResponseEntity<List<PendienteMensualidadResponse>> pendientesMensualidades(@PathVariable("id") Long estudianteId) {
                List<MensualidadRepository.PendienteMensualidadView> pendientes = mensualidadRepository.findPendientesByEstudianteId(estudianteId);
                List<PendienteMensualidadResponse> resp = pendientes.stream()
                                .map(v -> new PendienteMensualidadResponse(v.getMensualidadId(), v.getMes(), v.getMontoBase(), v.getMontoMora(), v.getMonto(), v.getEstado(), v.getFechaPago()))
                                .toList();

                int mesLimite = Math.max(LocalDate.now().getMonthValue() - 1, 0);
                if (mesLimite > 0) {
                        Set<Integer> yaPendientes = new HashSet<>(resp.stream().map(PendienteMensualidadResponse::mes).toList());
                        Set<Integer> mesesPagados = new HashSet<>(mensualidadRepository.findMesesPagadosHasta(estudianteId, mesLimite));

                        List<PendienteMensualidadResponse> ajustado = new ArrayList<>(resp);
                        for (int mes = 1; mes <= mesLimite; mes++) {
                                if (!yaPendientes.contains(mes) && !mesesPagados.contains(mes)) {
                                        ajustado.add(new PendienteMensualidadResponse(null, mes, null, null, null, "PENDIENTE_ESTIMADO", null));
                                }
                        }

                        resp = ajustado.stream()
                                .sorted((a, b) -> Integer.compare(a.mes() == null ? 0 : a.mes(), b.mes() == null ? 0 : b.mes()))
                                .toList();
                }

                return ResponseEntity.ok(resp);
        }

        @GetMapping("/estudiantes/{id}/mensualidades/meses-resumen")
        public ResponseEntity<MensualidadMesesResumenResponse> mesesResumenMensualidad(@PathVariable("id") Long estudianteId) {
                int mesActual = LocalDate.now().getMonthValue();
                List<Integer> mesesPagados = mensualidadRepository.findMesesPagadosHasta(estudianteId, 12);
                return ResponseEntity.ok(new MensualidadMesesResumenResponse(mesesPagados, mesActual));
        }

        @GetMapping("/mensualidades/pendientes/estudiantes")
        public ResponseEntity<List<ResumenPendientesMensualidadResponse>> estudiantesPendientesMensualidad() {
                int anio = LocalDate.now().getYear();
                int mesLimite = Math.max(LocalDate.now().getMonthValue() - 1, 0);
                List<MensualidadRepository.ResumenPendientesMensualidadView> pendientes = mensualidadRepository.findResumenPendientesCaja(String.valueOf(anio), mesLimite);
                List<ResumenPendientesMensualidadResponse> resp = pendientes.stream()
                                .map(v -> new ResumenPendientesMensualidadResponse(v.getEstudianteId(), clean(v.getEstudiante()), v.getMesesPagados(), v.getMesesPendientes(), v.getProximoMes()))
                                .toList();
                return ResponseEntity.ok(resp);
        }

        @GetMapping("/estudiantes/{id}/matricula/preview")
        public ResponseEntity<MatriculaPreviewResponse> previewMatricula(@PathVariable("id") Long estudianteId) {
                java.math.BigDecimal monto = configuracionFinanzasService.resolveMontoMatricula(estudianteId, null);
                java.math.BigDecimal montoBase = configuracionFinanzasService.getConfiguration().montoMatriculaBase();
                return ResponseEntity.ok(new MatriculaPreviewResponse(monto, montoBase));
        }

        @GetMapping("/tarifas")
        public ResponseEntity<CajaTarifasResponse> tarifas() {
                var config = configuracionFinanzasService.getConfiguration();
                return ResponseEntity.ok(new CajaTarifasResponse(config.montoMatriculaBase(), config.montoMensualidadBase()));
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
                        v.getEstudianteId(),
                        clean(v.getEstudiante()),
                        clean(v.getAnioLectivo()),
                                v.getMontoEsperado(),
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
                        Boolean.TRUE.equals(v.getAnulado()),
                        clean(v.getMotivoAnulacion())
                ))
                .toList();

        List<MensualidadItem> mensualidades = mensualidadRepository.findRecentCaja().stream()
                .limit(safeLimit)
                .map(v -> new MensualidadItem(
                        v.getMensualidadId(),
                        clean(v.getEstudiante()),
                        monthLabel(v.getMes()),
                        v.getMontoBase(),
                        v.getMontoMora(),
                        v.getMonto(),
                        v.getFechaPago(),
                        clean(v.getEstado()),
                        clean(v.getMetodoPago()),
                        clean(v.getDetalle()),
                        Boolean.TRUE.equals(v.getAnulado()),
                        clean(v.getMotivoAnulacion())
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
                        Boolean.TRUE.equals(v.getAnulado()),
                        clean(v.getMotivoAnulacion())
                ))
                .toList();

        BigDecimal totalCobradoTalleres = safeAmount(pagoCupoRepository.sumCobradoCaja());
        BigDecimal totalCobradoMatriculas = safeAmount(pagoMatriculaRepository.sumCobradoCaja());
        BigDecimal totalCobradoMensualidades = safeAmount(mensualidadRepository.sumCobradoCaja());
        BigDecimal totalCobradoGeneral = totalCobradoTalleres.add(totalCobradoMatriculas).add(totalCobradoMensualidades);

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
                totalCobradoTalleres,
                totalCobradoMatriculas,
                totalCobradoMensualidades,
                totalCobradoGeneral,
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

        private BigDecimal safeAmount(BigDecimal value) {
                return value == null ? BigDecimal.ZERO : value;
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
            Long estudianteId,
            String estudiante,
            String anioLectivo,
            BigDecimal montoEsperado,
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
            boolean anulado,
            String motivoAnulacion
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
            boolean anulado,
            String motivoAnulacion
    ) {}

    public record MensualidadItem(
            Long mensualidadId,
            String estudiante,
            String mes,
            BigDecimal montoBase,
            BigDecimal montoMora,
            BigDecimal monto,
            LocalDate fechaPago,
            String estado,
            String metodoPago,
            String detalle,
            boolean anulado,
            String motivoAnulacion
    ) {}

    public record PendienteMensualidadResponse(
            Long mensualidadId,
            Integer mes,
            BigDecimal montoBase,
            BigDecimal montoMora,
            BigDecimal monto,
            String estado,
            LocalDate fechaPago
    ) {}

    public record ResumenPendientesMensualidadResponse(
            Long estudianteId,
            String estudiante,
            Long mesesPagados,
            Long mesesPendientes,
            Integer proximoMes
    ) {}

    public record MensualidadMesesResumenResponse(
            List<Integer> mesesPagados,
            Integer mesActual
    ) {}

    public record MatriculaPreviewResponse(BigDecimal monto, BigDecimal montoBase) {}

    public record CajaTarifasResponse(
            BigDecimal montoMatriculaBase,
            BigDecimal montoMensualidadBase
    ) {}

    public record CajaDashboardResponse(
            CajaMetricas metricas,
            BigDecimal totalCobradoTalleres,
            BigDecimal totalCobradoMatriculas,
            BigDecimal totalCobradoMensualidades,
            BigDecimal totalCobradoGeneral,
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
