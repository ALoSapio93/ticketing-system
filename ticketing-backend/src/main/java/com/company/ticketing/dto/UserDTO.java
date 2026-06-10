package com.company.ticketing.dto;

import com.company.ticketing.entity.Role;
import com.company.ticketing.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private Role role;
    private String department;
    private String phone;
    private String avatarUrl;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public static UserDTO from(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setDepartment(user.getDepartment());
        dto.setPhone(user.getPhone());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setEnabled(user.isEnabled());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        return dto;
    }
}
