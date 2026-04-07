package com.micasita.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.micasita.backend.dto.auth.JwtPayload;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class JwtService {

    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    private final ObjectMapper objectMapper;
    private final byte[] secretBytes;
    private final long expirationMinutes;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    public long getExpirationMinutes() {
        return expirationMinutes;
    }

    public String generateToken(Long userId, Long personaId, String email, String nombre, String apellido, List<String> roles, List<String> permisos) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(expirationMinutes * 60);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("sub", email);
        payload.put("userId", userId);
        payload.put("personaId", personaId);
        payload.put("email", email);
        payload.put("nombre", nombre);
        payload.put("apellido", apellido);
        payload.put("iat", issuedAt.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        ArrayNode rolesNode = payload.putArray("roles");
        roles.forEach(rolesNode::add);

        ArrayNode permissionsNode = payload.putArray("permisos");
        permisos.forEach(permissionsNode::add);

        String headerPart = base64Url(HEADER_JSON);
        String payloadPart = base64Url(payload.toString());
        String unsignedToken = headerPart + "." + payloadPart;

        return unsignedToken + "." + sign(unsignedToken);
    }

    public Optional<JwtPayload> parseAndValidate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String unsignedToken = parts[0] + "." + parts[1];
            String expectedSignature = sign(unsignedToken);
            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }

            JsonNode payloadNode = objectMapper.readTree(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8));
            long expEpoch = payloadNode.path("exp").asLong(0L);
            if (Instant.now().getEpochSecond() >= expEpoch) {
                return Optional.empty();
            }

            List<String> roles = readStringArray(payloadNode.path("roles"));
            List<String> permissions = readStringArray(payloadNode.path("permisos"));

            return Optional.of(new JwtPayload(
                    payloadNode.path("userId").asLong(),
                    payloadNode.path("personaId").asLong(),
                    payloadNode.path("email").asText(null),
                    payloadNode.path("nombre").asText(null),
                    payloadNode.path("apellido").asText(null),
                    roles,
                    permissions,
                    Instant.ofEpochSecond(payloadNode.path("iat").asLong(0L)),
                    Instant.ofEpochSecond(expEpoch)
            ));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(item -> values.add(item.asText()));
        }
        return values;
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String unsignedToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] signatureBytes = mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el token", ex);
        }
    }
}
