package com.micasita.backend.service.finanzas;

import com.micasita.backend.entities.finanzas.ConfiguracionFinanzas;
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

    public ConfiguracionFinanzasService(
            ConfiguracionFinanzasRepository configuracionFinanzasRepository
    ) {
        this.configuracionFinanzasRepository = configuracionFinanzasRepository;
    }

    public ConfiguracionFinanzasResponse getConfiguration() {
        return toResponse(getOrCreateConfiguration());
    }

    public ConfiguracionFinanzasResponse updateConfiguration(UpdateConfiguracionFinanzasRequest request) {
        ConfiguracionFinanzas current = getOrCreateConfiguration();
        current.setMontoMatriculaBase(defaultMoney(request.montoMatriculaBase(), current.getMontoMatriculaBase()));
        current.setMontoMensualidadBase(defaultMoney(request.montoMensualidadBase(), current.getMontoMensualidadBase()));
        current.setMontoMora(defaultMoney(request.montoMora(), current.getMontoMora()));
        current.setDiasGracia(request.diasGracia() != null ? Math.max(1, request.diasGracia()) : current.getDiasGracia());
        current.setActivo(request.activo() != null ? request.activo() : current.getActivo());
        return toResponse(configuracionFinanzasRepository.save(current));
    }

    public BigDecimal resolveMontoMatricula(Long estudianteId, BigDecimal montoSolicitado) {
        BigDecimal explicitMonto = normalizeAmount(montoSolicitado);
        if (explicitMonto != null) {
            return explicitMonto;
        }

        ConfiguracionFinanzas config = getOrCreateConfiguration();
        return defaultMoney(config.getMontoMatriculaBase(), BigDecimal.ZERO);
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
        if (mesDePago == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        int currentMonth = LocalDate.now().getMonthValue();
        int currentDay = LocalDate.now().getDayOfMonth();
        int dayLimit = config.getDiasGracia() != null ? Math.max(1, config.getDiasGracia()) : 5;
        int periodsLate = calculateLatePeriods(mesDePago, currentMonth, currentDay, dayLimit);
        if (periodsLate <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal lateFee = defaultMoney(config.getMontoMora(), BigDecimal.ZERO);
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

    private ConfiguracionFinanzas getOrCreateConfiguration() {
        return configuracionFinanzasRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> configuracionFinanzasRepository.save(ConfiguracionFinanzas.builder()
                        .montoMatriculaBase(BigDecimal.ZERO)
                        .montoMensualidadBase(BigDecimal.ZERO)
                        .montoMora(BigDecimal.ZERO)
                        .diasGracia(5)
                        .activo(true)
                        .build()));
    }

    private ConfiguracionFinanzasResponse toResponse(ConfiguracionFinanzas config) {
        return new ConfiguracionFinanzasResponse(
                config.getId(),
                defaultMoney(config.getMontoMatriculaBase(), BigDecimal.ZERO),
                defaultMoney(config.getMontoMensualidadBase(), BigDecimal.ZERO),
                defaultMoney(config.getMontoMora(), BigDecimal.ZERO),
                config.getDiasGracia() != null ? config.getDiasGracia() : 5,
                Boolean.TRUE.equals(config.getActivo())
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
            BigDecimal montoMora,
            int diasGracia,
            boolean activo
    ) {}

    public record UpdateConfiguracionFinanzasRequest(
            BigDecimal montoMatriculaBase,
            BigDecimal montoMensualidadBase,
            BigDecimal montoMora,
            Integer diasGracia,
            Boolean activo
    ) {}
}