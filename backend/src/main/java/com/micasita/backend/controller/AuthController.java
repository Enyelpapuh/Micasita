package com.micasita.backend.controller;

import com.micasita.backend.dto.auth.AuthResponse;
import com.micasita.backend.dto.auth.AuthUserResponse;
import com.micasita.backend.dto.auth.ChangePasswordRequest;
import com.micasita.backend.dto.auth.LoginRequest;
import com.micasita.backend.dto.auth.UpdateMyProfileRequest;
import com.micasita.backend.service.AuthService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173","http://localhost:4000"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.me(authentication.getName()));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        authService.logout(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(Authentication authentication, @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/profile")
    public ResponseEntity<AuthUserResponse> updateMyProfile(
            Authentication authentication,
            @RequestBody UpdateMyProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateMyProfile(authentication.getName(), request));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthUserResponse> uploadMyAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(authService.uploadMyAvatar(authentication.getName(), file));
    }

    @PostMapping("/recover-password/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestBody PasswordRecoveryRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message", "Código enviado con éxito."));
    }

    @PostMapping("/recover-password/reset")
    public ResponseEntity<Map<String, String>> resetPasswordWithCode(@RequestBody PasswordResetWithCodeRequest request) {
        authService.resetPasswordWithCode(request.email(), request.codigo(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente. Ya puedes iniciar sesión."));
    }
}

record PasswordRecoveryRequest(String email) {}
record PasswordResetWithCodeRequest(String email, String codigo, String newPassword) {}
