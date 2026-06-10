package com.company.ticketing.config;

import com.company.ticketing.entity.*;
import com.company.ticketing.repository.*;
import com.company.ticketing.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        authService.initDefaultAdmin();

        if (userRepository.count() < 2) {
            User manager = userRepository.save(User.builder()
                .firstName("Marco").lastName("Rossi").email("manager@company.com")
                .password(passwordEncoder.encode("Manager123!"))
                .role(Role.ROLE_MANAGER).department("IT").build());

            User user1 = userRepository.save(User.builder()
                .firstName("Laura").lastName("Bianchi").email("laura@company.com")
                .password(passwordEncoder.encode("User123!"))
                .role(Role.ROLE_USER).department("Finance").build());

            User user2 = userRepository.save(User.builder()
                .firstName("Giovanni").lastName("Ferrari").email("giovanni@company.com")
                .password(passwordEncoder.encode("User123!"))
                .role(Role.ROLE_USER).department("HR").build());

            User admin = userRepository.findByEmail("admin@company.com").orElse(null);

            // Seed tickets
            if (ticketRepository.count() == 0 && admin != null) {
                ticketRepository.save(Ticket.builder()
                    .ticketNumber("TKT-202506-0001").title("Bug: Login non funziona su mobile")
                    .description("Gli utenti non riescono ad accedere dall'app mobile dopo l'ultimo deploy.")
                    .type(TicketType.BUG).priority(TicketPriority.CRITICAL).status(TicketStatus.OPEN)
                    .category(TicketCategory.SOFTWARE).reporter(user1).assignee(manager)
                    .dueDate(LocalDateTime.now().plusDays(1)).build());

                ticketRepository.save(Ticket.builder()
                    .ticketNumber("TKT-202506-0002").title("Feature: Export report PDF")
                    .description("Necessario aggiungere l'export in PDF per i report mensili di vendita.")
                    .type(TicketType.FEATURE_REQUEST).priority(TicketPriority.MEDIUM).status(TicketStatus.IN_PROGRESS)
                    .category(TicketCategory.SOFTWARE).reporter(user2).assignee(manager).build());

                ticketRepository.save(Ticket.builder()
                    .ticketNumber("TKT-202506-0003").title("Accesso VPN non funzionante")
                    .description("Impossibile connettersi alla VPN aziendale dalla sede di Milano.")
                    .type(TicketType.INCIDENT).priority(TicketPriority.HIGH).status(TicketStatus.RESOLVED)
                    .category(TicketCategory.NETWORK).reporter(user1).assignee(admin)
                    .resolvedAt(LocalDateTime.now().minusHours(2)).build());

                ticketRepository.save(Ticket.builder()
                    .ticketNumber("TKT-202506-0004").title("Richiesta nuovo laptop")
                    .description("Il laptop attuale ha più di 5 anni e non supporta gli aggiornamenti necessari.")
                    .type(TicketType.CHANGE_REQUEST).priority(TicketPriority.LOW).status(TicketStatus.PENDING)
                    .category(TicketCategory.HARDWARE).reporter(user2).build());
            }

            log.info("=== DATI INIZIALI CARICATI ===");
            log.info("Admin:   admin@company.com   / Admin123!");
            log.info("Manager: manager@company.com / Manager123!");
            log.info("User:    laura@company.com   / User123!");
            log.info("User:    giovanni@company.com / User123!");
        }
    }
}
