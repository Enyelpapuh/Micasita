package com.micasita.backend.service.finanzas;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class ReceiptNumberService {
    private static final DateTimeFormatter YEAR_MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    private ReceiptNumberService() {
    }

    public static String build(String prefix, LocalDate date, long sequence) {
        String safePrefix = prefix == null || prefix.isBlank() ? "REC" : prefix.trim().toUpperCase();
        LocalDate safeDate = date == null ? LocalDate.now() : date;
        return "%s-%s-%04d".formatted(safePrefix, safeDate.format(YEAR_MONTH), sequence);
    }
}