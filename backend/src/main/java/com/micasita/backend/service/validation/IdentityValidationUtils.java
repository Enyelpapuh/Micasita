package com.micasita.backend.service.validation;

import java.util.Locale;
import java.util.regex.Pattern;

public final class IdentityValidationUtils {

    private static final Pattern PHONE_8_DIGITS = Pattern.compile("^\\d{8}$");
    private static final Pattern CEDULA_WITH_HYPHENS = Pattern.compile("^\\d{3}-\\d{6}-\\d{4}[A-Za-z]$");
    private static final Pattern CEDULA_NO_HYPHENS = Pattern.compile("^\\d{13}[A-Za-z]$");
    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");
    private static final Pattern HAS_SPECIAL = Pattern.compile(".*[^A-Za-z0-9].*");

    private IdentityValidationUtils() {
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_8_DIGITS.matcher(phone).matches();
    }

    public static boolean isValidCedula(String identificador) {
        if (identificador == null) {
            return false;
        }
        return CEDULA_WITH_HYPHENS.matcher(identificador).matches()
                || CEDULA_NO_HYPHENS.matcher(identificador).matches();
    }

    public static String validateStrongPassword(
            String rawPassword,
            String email,
            String nombre,
            String apellido,
            String identificador
    ) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return "PASSWORD_REQUIRED";
        }

        String password = rawPassword.trim();
        if (password.length() < 10 || password.length() > 64) {
            return "PASSWORD_LENGTH_INVALID";
        }

        if (!HAS_UPPERCASE.matcher(password).matches()) {
            return "PASSWORD_UPPERCASE_REQUIRED";
        }

        if (!HAS_LOWERCASE.matcher(password).matches()) {
            return "PASSWORD_LOWERCASE_REQUIRED";
        }

        if (!HAS_DIGIT.matcher(password).matches()) {
            return "PASSWORD_DIGIT_REQUIRED";
        }

        if (!HAS_SPECIAL.matcher(password).matches()) {
            return "PASSWORD_SPECIAL_REQUIRED";
        }

        String passwordLc = password.toLowerCase(Locale.ROOT);
        if (containsInsensitive(passwordLc, extractEmailUser(email))) {
            return "PASSWORD_CONTAINS_PERSONAL_DATA";
        }
        if (containsInsensitive(passwordLc, nombre)) {
            return "PASSWORD_CONTAINS_PERSONAL_DATA";
        }
        if (containsInsensitive(passwordLc, apellido)) {
            return "PASSWORD_CONTAINS_PERSONAL_DATA";
        }
        if (containsInsensitive(passwordLc, identificador)) {
            return "PASSWORD_CONTAINS_PERSONAL_DATA";
        }

        return null;
    }

    private static boolean containsInsensitive(String valueLc, String candidate) {
        if (candidate == null) {
            return false;
        }
        String normalized = candidate.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() < 3) {
            return false;
        }
        return valueLc.contains(normalized);
    }

    private static String extractEmailUser(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        int index = trimmed.indexOf('@');
        return index > 0 ? trimmed.substring(0, index) : trimmed;
    }
}
