package com.company.ticketing.controller;

import com.company.ticketing.dto.AuthDTOs;
import com.company.ticketing.dto.UserDTO;
import com.company.ticketing.entity.User;
import com.company.ticketing.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthDTOs.AuthResponse> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTOs.AuthResponse> register(@Valid @RequestBody AuthDTOs.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthDTOs.AuthResponse> refresh(@Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserDTO.from(user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AuthDTOs.ChangePasswordRequest request) {
        authService.changePassword(user, request);
        return ResponseEntity.ok().build();
    }
}
