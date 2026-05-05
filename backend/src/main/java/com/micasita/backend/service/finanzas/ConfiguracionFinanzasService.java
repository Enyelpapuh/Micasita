package com.micasita.backend.service.finanzas;

import com.micasita.backend.entities.finanzas.ConfiguracionFinanzas;
import com.micasita.backend.repositories.academico.EstudianteTutorRepository;
import com.micasita.backend.repositories.finanzas.ConfiguracionFinanzasRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ConfiguracionFinanzasService {

    private final ConfiguracionFinanzasRepository configuracionFinanzasRepository;
    private final EstudianteTutorRepository estudianteTutorRepository;

    public ConfiguracionFinanzasService(
            ConfiguracionFinanzasRepository configuracionFinanzasRepository,
            EstudianteTutorRepository estudianteTutorRepository
    ) {
        this.configuracionFinanzasRepository = configuracionFinanzasRepository;
        this.estudianteTutorRepository = estudianteTutorRepository;
    }

    public ConfiguracionFinanzasResponse getConfiguration() {
        return toResponse(getOrCreateConfiguration());
    }

    public ConfiguracionFinanzasResponse updateConfiguration(UpdateConfiguracionFinanzasRequest request) {
        ConfiguracionFinanzas current = getOrCreateConfiguration();
        current.setMontoMatriculaBase(defaultMoney(request.montoMatriculaBase(), current.getMontoMatriculaBase()));
        current.setMontoMensualidadBase(defaultMoney(request.montoMensualidadBase(), current.getMontoMensualidadBase()));
        current.setMontoMoraFija(defaultMoney(request.montoMoraFija(), current.getMontoMoraFija()));
        current.setPorcentajeDescuentoFamiliar(defaultMoney(request.porcentajeDescuentoFamiliar(), current.getPorcentajeDescuentoFamiliar()));
        current.setMaximoDescuentoFamiliar(defaultMoney(request.maximoDescuentoFamiliar(), current.getMaximoDescuentoFamiliar()));
        current.setAplicarMoraAutomatica(request.aplicarMoraAutomatica() != null ? request.aplicarMoraAutomatica() : current.getAplicarMoraAutomatica());
        current.setDiasLimiteMora(request.diasLimiteMora() != null ? Math.max(1, request.diasLimiteMora()) : current.getDiasLimiteMora());
        current.setActivo(request.activo() != null ? request.activo() : current.getActivo());
        return toResponse(configuracionFinanzasRepository.save(current));
    }

    public BigDecimal resolveMontoMatricula(Long estudianteId, BigDecimal montoSolicitado) {
        BigDecimal explicitMonto = normalizeAmount(montoSolicitado);
        if (explicitMonto != null) {
            return explicitMonto;
        }

        ConfiguracionFinanzas config = getOrCreateConfiguration();
        BigDecimal base = defaultMoney(config.getMontoMatriculaBase(), BigDecimal.ZERO);
        BigDecimal discount = calculateFamilyDiscount(estudianteId, base, config);
        BigDecimal total = base.subtract(discount);
        return total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal resolveMontoMensualidadBase(BigDecimal montoBaseSolicitado) {
        BigDecimal explicitMonto = normalizeAmount(montoBaseSolicitado);
        if (explicitMonto != null) {
            return explicitMonto;
        }
        return defaultMoney(getOrCreateConfiguration().getMontoMensualidadBase(), BigDecimal.ZERO);
    }

    public BigDecimal resolveMontoMora(Integer mesDePago, BigDecimal montoMoraSolicitado) {
        BigDecimal explicitMonto = normalizeAmount(montoMoraSolicitado);
        if (explicitMonto != null) {
            return explicitMonto;
        }

        ConfiguracionFinanzas config = getOrCreateConfiguration();
        if (!Boolean.TRUE.equals(config.getAplicarMoraAutomatica()) || mesDePago == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        int currentMonth = LocalDate.now().getMonthValue();
        int currentDay = LocalDate.now().getDayOfMonth();
        int dayLimit = config.getDiasLimiteMora() != null ? Math.max(1, config.getDiasLimiteMora()) : 10;
        int periodsLate = calculateLatePeriods(mesDePago, currentMonth, currentDay, dayLimit);
        if (periodsLate <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal lateFee = defaultMoney(config.getMontoMoraFija(), BigDecimal.ZERO);
        return lateFee.multiply(BigDecimal.valueOf(periodsLate)).setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateLatePeriods(int mesDePago, int currentMonth, int currentDay, int dayLimit) {
        if (mesDePago > currentMonth) {
            return 0;
        }

        int laggedMonths = Math.max(currentMonth - mesDePago, 0);
        boolean currentMonthLate = mesDePago == currentMonth && currentDay > dayLimit;
        return currentMonthLate ? laggedMonths + 1 : laggedMonths;
    }

    private BigDecimal calculateFamilyDiscount(Long estudianteId, BigDecimal base, ConfiguracionFinanzas config) {
        if (estudianteId == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        List<Long> tutorIds = estudianteTutorRepository.findTutorIdsByEstudianteId(estudianteId);
        if (tutorIds.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        List<Long> familyStudentIds = estudianteTutorRepository.findFamiliaStudentIdsByTutorIds(tutorIds, estudianteId);
        if (familyStudentIds.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal discount = base
                .multiply(defaultMoney(config.getPorcentajeDescuentoFamiliar(), BigDecimal.ZERO))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal maxDiscount = defaultMoney(config.getMaximoDescuentoFamiliar(), BigDecimal.ZERO);
        if (maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
            discount = maxDiscount;
        }

        return discount.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private ConfiguracionFinanzas getOrCreateConfiguration() {
        return configuracionFinanzasRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> configuracionFinanzasRepository.save(ConfiguracionFinanzas.builder()
                        .montoMatriculaBase(BigDecimal.ZERO)
                        .montoMensualidadBase(BigDecimal.ZERO)
                        .montoMoraFija(BigDecimal.ZERO)
                        .porcentajeDescuentoFamiliar(BigDecimal.ZERO)
                        .maximoDescuentoFamiliar(BigDecimal.ZERO)
                        .aplicarMoraAutomatica(true)
                        .diasLimiteMora(10)
                        .activo(true)
                        .build()));
    }

    private ConfiguracionFinanzasResponse toResponse(ConfiguracionFinanzas config) {
        return new ConfiguracionFinanzasResponse(
                config.getId(),
                defaultMoney(config.getMontoMatriculaBase(), BigDecimal.ZERO),
                defaultMoney(config.getMontoMensualidadBase(), BigDecimal.ZERO),
                defaultMoney(config.getMontoMoraFija(), BigDecimal.ZERO),
                defaultMoney(config.getPorcentajeDescuentoFamiliar(), BigDecimal.ZERO),
                defaultMoney(config.getMaximoDescuentoFamiliar(), BigDecimal.ZERO),
                Boolean.TRUE.equals(config.getAplicarMoraAutomatica()),
                config.getDiasLimiteMora() != null ? config.getDiasLimiteMora() : 10,
                Boolean.TRUE.equals(config.getActivo()),
                config.getUltimaActualizacion()
        );
    }

    private BigDecimal normalizeAmount(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultMoney(BigDecimal value, BigDecimal fallback) {
        return (value == null ? fallback : value).setScale(2, RoundingMode.HALF_UP);
    }

    public record ConfiguracionFinanzasResponse(
            Long id,
            BigDecimal montoMatriculaBase,
            BigDecimal montoMensualidadBase,
            BigDecimal montoMoraFija,
            BigDecimal porcentajeDescuentoFamiliar,
            BigDecimal maximoDescuentoFamiliar,
            boolean aplicarMoraAutomatica,
            int diasLimiteMora,
            boolean activo,
            LocalDateTime ultimaActualizacion
    ) {}

    public record UpdateConfiguracionFinanzasRequest(
            BigDecimal montoMatriculaBase,
            BigDecimal montoMensualidadBase,
            BigDecimal montoMoraFija,
            BigDecimal porcentajeDescuentoFamiliar,
            BigDecimal maximoDescuentoFamiliar,
            Boolean aplicarMoraAutomatica,
            Integer diasLimiteMora,
            Boolean activo
    ) {}
}