package com.company.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "is_read")
    @Builder.Default
    private boolean read = false;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        TICKET_CREATED, TICKET_ASSIGNED, TICKET_UPDATED,
        TICKET_RESOLVED, TICKET_CLOSED, COMMENT_ADDED
    }
}
