package com.company.ticketing.dto;

import com.company.ticketing.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTOs {

    @Data
    public static class LoginRequest {
        @Email(message = "Email non valida")
        @NotBlank(message = "Email obbligatoria")
        private String email;

        @NotBlank(message = "Password obbligatoria")
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @Email @NotBlank private String email;
        @Size(min = 8, message = "Password minimo 8 caratteri") private String password;
        private Role role = Role.ROLE_USER;
        private String department;
        private String phone;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private UserDTO user;

        public AuthResponse(String accessToken, String refreshToken, UserDTO user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
        }
    }

    @Data
    public static class RefreshTokenRequest {
        @NotBlank private String refreshToken;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @Size(min = 8) private String newPassword;
    }
}
