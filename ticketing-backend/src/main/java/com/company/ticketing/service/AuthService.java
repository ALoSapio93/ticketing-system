package com.company.ticketing.service;

import com.company.ticketing.dto.AuthDTOs;
import com.company.ticketing.dto.UserDTO;
import com.company.ticketing.entity.Role;
import com.company.ticketing.entity.User;
import com.company.ticketing.exception.BadRequestException;
import com.company.ticketing.exception.ResourceNotFoundException;
import com.company.ticketing.repository.UserRepository;
import com.company.ticketing.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthDTOs.AuthResponse login(AuthDTOs.LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato"));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthDTOs.AuthResponse(accessToken, refreshToken, UserDTO.from(user));
    }

    @Transactional
    public AuthDTOs.AuthResponse register(AuthDTOs.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email già registrata: " + request.getEmail());
        }
        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole() != null ? request.getRole() : Role.ROLE_USER)
            .department(request.getDepartment())
            .phone(request.getPhone())
            .build();

        userRepository.save(user);
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthDTOs.AuthResponse(accessToken, refreshToken, UserDTO.from(user));
    }

    @Transactional
    public AuthDTOs.AuthResponse refreshToken(AuthDTOs.RefreshTokenRequest request) {
        String email = jwtService.extractUsername(request.getRefreshToken());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato"));

        if (!jwtService.isTokenValid(request.getRefreshToken(), user)) {
            throw new BadRequestException("Refresh token non valido");
        }

        String accessToken = jwtService.generateToken(user);
        return new AuthDTOs.AuthResponse(accessToken, request.getRefreshToken(), UserDTO.from(user));
    }

    @Transactional
    public void changePassword(User currentUser, AuthDTOs.ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Password attuale non corretta");
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    @Transactional
    public void initDefaultAdmin() {
        if (!userRepository.existsByEmail("admin@company.com")) {
            User admin = User.builder()
                .firstName("Admin")
                .lastName("System")
                .email("admin@company.com")
                .password(passwordEncoder.encode("Admin123!"))
                .role(Role.ROLE_ADMIN)
                .department("IT")
                .build();
            userRepository.save(admin);
        }
    }
}
