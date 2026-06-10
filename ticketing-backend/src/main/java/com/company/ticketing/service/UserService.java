package com.company.ticketing.service;

import com.company.ticketing.dto.AuthDTOs;
import com.company.ticketing.dto.UserDTO;
import com.company.ticketing.entity.User;
import com.company.ticketing.exception.BadRequestException;
import com.company.ticketing.exception.ResourceNotFoundException;
import com.company.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<UserDTO> getUsers(String search, int page, int size) {
        return userRepository.searchUsers(search, PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(UserDTO::from);
    }

    @Transactional(readOnly = true)
    public UserDTO getUser(Long id) {
        return UserDTO.from(userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato: " + id)));
    }

    @Transactional
    public UserDTO createUser(AuthDTOs.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email già in uso");
        }
        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole() != null ? request.getRole() : com.company.ticketing.entity.Role.ROLE_USER)
            .department(request.getDepartment())
            .phone(request.getPhone())
            .build();
        return UserDTO.from(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUser(Long id, AuthDTOs.RegisterRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato: " + id));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email già in uso");
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setDepartment(request.getDepartment());
        user.setPhone(request.getPhone());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return UserDTO.from(userRepository.save(user));
    }

    @Transactional
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato: " + id));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utente non trovato: " + id);
        }
        userRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllActiveUsers() {
        return userRepository.findAll().stream()
            .filter(User::isEnabled)
            .map(UserDTO::from)
            .collect(Collectors.toList());
    }
}
