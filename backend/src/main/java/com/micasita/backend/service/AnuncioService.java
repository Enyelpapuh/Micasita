package com.micasita.backend.service;

import com.micasita.backend.dto.core.AnuncioResponse;
import com.micasita.backend.dto.core.CreateAnuncioRequest;
import com.micasita.backend.dto.core.UpdateAnuncioRequest;
import com.micasita.backend.entities.core.Anuncio;
import com.micasita.backend.entities.core.Usuario;
import com.micasita.backend.repositories.core.AnuncioRepository;
import com.micasita.backend.repositories.core.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
@SuppressWarnings("null")
public class AnuncioService {

    private static final String IMAGE_ROUTE_PREFIX = "/api/noticias/imagen/";

    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;
    private final Path uploadDirectory;
    private final long maxUploadBytes;

    public AnuncioService(
            AnuncioRepository anuncioRepository,
            UsuarioRepository usuarioRepository,
            @Value("${app.upload.anuncios-dir:uploads/anuncios}") String uploadDirectory,
            @Value("${app.upload.anuncios-max-bytes:5242880}") long maxUploadBytes
    ) {
        this.anuncioRepository = anuncioRepository;
        this.usuarioRepository = usuarioRepository;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        this.maxUploadBytes = maxUploadBytes;
        System.out.println("[AnuncioService] Constructor - uploadDirectory config: " + uploadDirectory);
        System.out.println("[AnuncioService] Constructor - resolved absolute path: " + this.uploadDirectory);
    }

    @Transactional
    public List<AnuncioResponse> listPublic() {
        return anuncioRepository.findAllByActivoTrueOrderByFechaPublicacionDesc().stream()
                .filter(this::isVisible)
                .sorted(Comparator.comparing(Anuncio::getFechaPublicacion, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<AnuncioResponse> listAdmin() {
        return anuncioRepository.findAllByOrderByFechaPublicacionDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public AnuncioResponse create(String email, CreateAnuncioRequest request) {
        Usuario usuario = requireUser(email);
        validateRequest(request);

        Anuncio anuncio = Anuncio.builder()
                .titulo(trimToNull(request.titulo()))
                .descripcion(trimToNull(request.descripcion()))
                .fechaPublicacion(LocalDateTime.now())
                .fechaExpiracion(request.fechaExpiracion())
                .usuario(usuario)
                .activo(true)
                .build();

        return toResponse(anuncioRepository.save(anuncio));
    }

    public AnuncioResponse update(String email, Long id, UpdateAnuncioRequest request) {
        requireUser(email);
        validateRequest(request);

        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_NOT_FOUND"));

        anuncio.setTitulo(trimToNull(request.titulo()));
        anuncio.setDescripcion(trimToNull(request.descripcion()));
        anuncio.setFechaExpiracion(request.fechaExpiracion());

        return toResponse(anuncioRepository.save(anuncio));
    }

    public AnuncioResponse uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_IMAGE_REQUIRED");
        }

        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_NOT_FOUND"));

        String previousRutaImagen = anuncio.getRutaImagen();
        String rutaImagen = saveImage(anuncio.getId(), file);

        anuncio.setRutaImagen(rutaImagen);
        Anuncio saved = anuncioRepository.save(anuncio);

        if (previousRutaImagen != null && !previousRutaImagen.equals(rutaImagen)) {
            deleteImageIfManaged(previousRutaImagen);
        }

        return toResponse(saved);
    }

    public AnuncioResponse setActive(Long id, boolean activo) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_NOT_FOUND"));

        anuncio.setActivo(activo);
        Anuncio saved = anuncioRepository.save(anuncio);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_NOT_FOUND"));

        anuncio.setActivo(false);
        anuncioRepository.save(anuncio);
        deleteImageIfManaged(anuncio.getRutaImagen());
    }

    @Transactional(readOnly = true)
    public Resource getImageResource(String fileName) {
        try {
            Path target = uploadDirectory.resolve(fileName).normalize();

            if (!target.startsWith(uploadDirectory) || !Files.exists(target)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_IMAGE_NOT_FOUND");
            }

            return new UrlResource(target.toUri());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ANUNCIO_IMAGE_READ_ERROR", ex);
        }
    }

    public MediaType getImageMediaType(String fileName) {
        try {
            Path target = uploadDirectory.resolve(fileName).normalize();

            if (!target.startsWith(uploadDirectory) || !Files.exists(target)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ANUNCIO_IMAGE_NOT_FOUND");
            }

            String contentType = Files.probeContentType(target);
            if (contentType == null || contentType.isBlank()) {
                return MediaType.APPLICATION_OCTET_STREAM;
            }

            return MediaType.parseMediaType(contentType);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ANUNCIO_IMAGE_TYPE_ERROR", ex);
        }
    }

    private boolean isVisible(Anuncio anuncio) {
        if (Boolean.FALSE.equals(anuncio.getActivo())) {
            return false;
        }

        LocalDate fechaExpiracion = anuncio.getFechaExpiracion();
        return fechaExpiracion == null || !fechaExpiracion.isBefore(LocalDate.now());
    }

    private void validateRequest(CreateAnuncioRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_PAYLOAD_REQUIRED");
        }
        if (trimToNull(request.titulo()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_TITLE_REQUIRED");
        }
        if (trimToNull(request.descripcion()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_DESCRIPTION_REQUIRED");
        }
    }

    private void validateRequest(UpdateAnuncioRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_PAYLOAD_REQUIRED");
        }
        if (trimToNull(request.titulo()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_TITLE_REQUIRED");
        }
        if (trimToNull(request.descripcion()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_DESCRIPTION_REQUIRED");
        }
    }

    private Usuario requireUser(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID"));
    }

    private String saveImage(Long anuncioId, MultipartFile file) {
        if (file.getSize() > maxUploadBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_IMAGE_TOO_LARGE");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_IMAGE_INVALID_TYPE");
        }

        String fileName = buildEncodedFileName(anuncioId, file.getOriginalFilename());

        try {
            Files.createDirectories(uploadDirectory);
            Path target = uploadDirectory.resolve(fileName).normalize();

            if (!target.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ANUNCIO_IMAGE_INVALID_NAME");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }

            return IMAGE_ROUTE_PREFIX + fileName;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ANUNCIO_IMAGE_SAVE_ERROR", ex);
        }
    }

    private void deleteImageIfManaged(String rutaImagen) {
        String fileName = extractFileName(rutaImagen);
        if (fileName == null) {
            return;
        }

        try {
            Path target = uploadDirectory.resolve(fileName).normalize();
            if (target.startsWith(uploadDirectory)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ignored) {
            // La noticia ya fue desactivada; el archivo puede quedar como residuo si no se pudo borrar.
        }
    }

    private String extractFileName(String rutaImagen) {
        if (rutaImagen == null || rutaImagen.isBlank()) {
            return null;
        }

        int slashIndex = rutaImagen.lastIndexOf('/');
        if (slashIndex < 0 || slashIndex == rutaImagen.length() - 1) {
            return null;
        }

        return rutaImagen.substring(slashIndex + 1);
    }

    private String buildEncodedFileName(Long anuncioId, String originalFileName) {
        String extension = getFileExtension(originalFileName);

        String baseName = originalFileName;
        if (baseName == null || baseName.isBlank()) {
            baseName = "archivo";
        }

        int dotIndex = baseName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = baseName.substring(0, dotIndex);
        }

        String encodedName = java.util.Base64.getUrlEncoder()
                .withoutPadding()
            .encodeToString(baseName.getBytes(StandardCharsets.UTF_8));

        if (encodedName.length() > 48) {
            encodedName = encodedName.substring(0, 48);
        }

        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        return "anuncio-" + anuncioId + "-" + encodedName + "-" + randomSuffix + extension;
    }

    private String getFileExtension(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "";
        }

        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFileName.length() - 1) {
            return "";
        }

        return originalFileName.substring(dotIndex);
    }

    private AnuncioResponse toResponse(Anuncio anuncio) {
        return new AnuncioResponse(
                anuncio.getId(),
                anuncio.getTitulo(),
                anuncio.getDescripcion(),
                anuncio.getRutaImagen(),
                anuncio.getFechaPublicacion(),
                anuncio.getFechaExpiracion(),
                anuncio.getActivo(),
                anuncio.getUsuario() != null ? anuncio.getUsuario().getId() : null
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}