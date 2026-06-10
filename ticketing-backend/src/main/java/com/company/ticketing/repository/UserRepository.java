package com.company.ticketing.repository;

import com.company.ticketing.entity.Role;
import com.company.ticketing.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") Role role);
}
