package com.company.ticketing.service;

import com.company.ticketing.entity.Notification;
import com.company.ticketing.entity.Role;
import com.company.ticketing.entity.User;
import com.company.ticketing.repository.NotificationRepository;
import com.company.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional
    public void notifyUser(User user, String title, String message, Long ticketId, Notification.NotificationType type) {
        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .ticketId(ticketId)
            .type(type)
            .build();
        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void notifyAdminsAndManagers(String title, String message, Long ticketId, Notification.NotificationType type) {
        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
        List<User> managers = userRepository.findByRole(Role.ROLE_MANAGER);
        admins.addAll(managers);
        for (User user : admins) {
            notifyUser(user, title, message, ticketId, type);
        }
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(User user, int page, int size) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public long countUnread(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUser(user);
    }

    @Transactional
    public void markAsRead(Long id, User user) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }
}
