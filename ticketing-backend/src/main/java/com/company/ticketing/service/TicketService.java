package com.company.ticketing.service;

import com.company.ticketing.dto.TicketDTOs;
import com.company.ticketing.entity.*;
import com.company.ticketing.exception.BadRequestException;
import com.company.ticketing.exception.ForbiddenException;
import com.company.ticketing.exception.ResourceNotFoundException;
import com.company.ticketing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TicketHistoryRepository historyRepository;
    private final NotificationService notificationService;

    @Transactional
    public TicketDTOs.TicketResponse createTicket(TicketDTOs.CreateTicketRequest request, User reporter) {
        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assegnatario non trovato"));
        }

        Ticket ticket = Ticket.builder()
            .ticketNumber(generateTicketNumber())
            .title(request.getTitle())
            .description(request.getDescription())
            .type(request.getType())
            .priority(request.getPriority())
            .category(request.getCategory())
            .reporter(reporter)
            .assignee(assignee)
            .department(request.getDepartment())
            .dueDate(request.getDueDate())
            .status(TicketStatus.OPEN)
            .build();

        ticket = ticketRepository.save(ticket);

        // Notify assignee
        if (assignee != null) {
            notificationService.notifyUser(assignee, "Ticket assegnato",
                "Ti è stato assegnato il ticket " + ticket.getTicketNumber() + ": " + ticket.getTitle(),
                ticket.getId(), Notification.NotificationType.TICKET_ASSIGNED);
        }

        // Notify admins and managers
        notificationService.notifyAdminsAndManagers("Nuovo ticket creato",
            "Nuovo ticket " + ticket.getTicketNumber() + " aperto da " + reporter.getFullName(),
            ticket.getId(), Notification.NotificationType.TICKET_CREATED);

        return TicketDTOs.TicketResponse.from(ticket);
    }

    @Transactional
    public TicketDTOs.TicketResponse updateTicket(Long id, TicketDTOs.UpdateTicketRequest request, User currentUser) {
        Ticket ticket = getTicketOrThrow(id);

        // Only reporter, assignee, admin, or manager can update
        if (!canModify(ticket, currentUser)) {
            throw new ForbiddenException("Non hai i permessi per modificare questo ticket");
        }

        if (request.getTitle() != null) {
            recordChange(ticket, currentUser, "title", ticket.getTitle(), request.getTitle());
            ticket.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) ticket.setDescription(request.getDescription());
        if (request.getType() != null) {
            recordChange(ticket, currentUser, "type", ticket.getType().name(), request.getType().name());
            ticket.setType(request.getType());
        }
        if (request.getPriority() != null) {
            recordChange(ticket, currentUser, "priority", ticket.getPriority().name(), request.getPriority().name());
            ticket.setPriority(request.getPriority());
        }
        if (request.getCategory() != null) ticket.setCategory(request.getCategory());
        if (request.getDepartment() != null) ticket.setDepartment(request.getDepartment());
        if (request.getDueDate() != null) ticket.setDueDate(request.getDueDate());

        if (request.getStatus() != null && !request.getStatus().equals(ticket.getStatus())) {
            TicketStatus oldStatus = ticket.getStatus();
            ticket.setStatus(request.getStatus());
            recordChange(ticket, currentUser, "status", oldStatus.name(), request.getStatus().name());

            if (request.getStatus() == TicketStatus.RESOLVED) ticket.setResolvedAt(LocalDateTime.now());
            if (request.getStatus() == TicketStatus.CLOSED) ticket.setClosedAt(LocalDateTime.now());

            // Notify reporter of status change
            if (!ticket.getReporter().getId().equals(currentUser.getId())) {
                notificationService.notifyUser(ticket.getReporter(), "Stato ticket aggiornato",
                    "Il ticket " + ticket.getTicketNumber() + " è ora " + request.getStatus().name(),
                    ticket.getId(), Notification.NotificationType.TICKET_UPDATED);
            }
        }

        if (request.getAssigneeId() != null) {
            User newAssignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assegnatario non trovato"));
            String oldAssignee = ticket.getAssignee() != null ? ticket.getAssignee().getFullName() : "Nessuno";
            recordChange(ticket, currentUser, "assignee", oldAssignee, newAssignee.getFullName());
            ticket.setAssignee(newAssignee);

            notificationService.notifyUser(newAssignee, "Ticket assegnato",
                "Ti è stato assegnato il ticket " + ticket.getTicketNumber(),
                ticket.getId(), Notification.NotificationType.TICKET_ASSIGNED);
        }

        return TicketDTOs.TicketResponse.from(ticketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public Page<TicketDTOs.TicketResponse> getTickets(TicketDTOs.TicketFilterRequest filter, User currentUser) {
        Sort sort = filter.getSortDir().equalsIgnoreCase("asc")
            ? Sort.by(filter.getSortBy()).ascending()
            : Sort.by(filter.getSortBy()).descending();
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

        // Regular users only see their own tickets
        Long reporterId = filter.getReporterId();
        if (currentUser.getRole() == Role.ROLE_USER) {
            reporterId = currentUser.getId();
        }

        Page<Ticket> tickets = ticketRepository.findWithFilters(
            filter.getStatus(), filter.getPriority(), filter.getType(),
            filter.getCategory(), filter.getAssigneeId(), reporterId,
            filter.getSearch(), pageable
        );

        return tickets.map(TicketDTOs.TicketResponse::from);
    }

    @Transactional(readOnly = true)
    public TicketDTOs.TicketResponse getTicket(Long id, User currentUser) {
        Ticket ticket = getTicketOrThrow(id);
        if (currentUser.getRole() == Role.ROLE_USER &&
            !ticket.getReporter().getId().equals(currentUser.getId()) &&
            (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(currentUser.getId()))) {
            throw new ForbiddenException("Non hai i permessi per visualizzare questo ticket");
        }
        return TicketDTOs.TicketResponse.from(ticket);
    }

    @Transactional
    public void deleteTicket(Long id, User currentUser) {
        Ticket ticket = getTicketOrThrow(id);
        if (currentUser.getRole() == Role.ROLE_USER) {
            throw new ForbiddenException("Non hai i permessi per eliminare ticket");
        }
        ticketRepository.delete(ticket);
    }

    @Transactional
    public TicketDTOs.CommentResponse addComment(Long ticketId, TicketDTOs.CommentRequest request, User author) {
        Ticket ticket = getTicketOrThrow(ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Non è possibile commentare un ticket chiuso");
        }

        Comment comment = Comment.builder()
            .ticket(ticket)
            .author(author)
            .content(request.getContent())
            .internal(request.isInternal() && author.getRole() != Role.ROLE_USER)
            .build();
        comment = commentRepository.save(comment);

        // Notify relevant parties
        if (!ticket.getReporter().getId().equals(author.getId())) {
            notificationService.notifyUser(ticket.getReporter(), "Nuovo commento",
                "Nuovo commento sul ticket " + ticket.getTicketNumber(),
                ticketId, Notification.NotificationType.COMMENT_ADDED);
        }
        if (ticket.getAssignee() != null && !ticket.getAssignee().getId().equals(author.getId())) {
            notificationService.notifyUser(ticket.getAssignee(), "Nuovo commento",
                "Nuovo commento sul ticket " + ticket.getTicketNumber(),
                ticketId, Notification.NotificationType.COMMENT_ADDED);
        }

        return TicketDTOs.CommentResponse.from(comment);
    }

    @Transactional(readOnly = true)
    public List<TicketDTOs.CommentResponse> getComments(Long ticketId, User currentUser) {
        Ticket ticket = getTicketOrThrow(ticketId);
        List<Comment> comments;
        if (currentUser.getRole() == Role.ROLE_USER) {
            comments = commentRepository.findByTicketAndInternalFalseOrderByCreatedAtAsc(ticket);
        } else {
            comments = commentRepository.findByTicketOrderByCreatedAtAsc(ticket);
        }
        return comments.stream().map(TicketDTOs.CommentResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketDTOs.HistoryResponse> getHistory(Long ticketId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        return historyRepository.findByTicketOrderByChangedAtAsc(ticket)
            .stream().map(TicketDTOs.HistoryResponse::from).collect(Collectors.toList());
    }

    private Ticket getTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket non trovato con id: " + id));
    }

    private boolean canModify(Ticket ticket, User user) {
        return user.getRole() == Role.ROLE_ADMIN ||
               user.getRole() == Role.ROLE_MANAGER ||
               ticket.getReporter().getId().equals(user.getId()) ||
               (ticket.getAssignee() != null && ticket.getAssignee().getId().equals(user.getId()));
    }

    private void recordChange(Ticket ticket, User user, String field, String oldVal, String newVal) {
        TicketHistory history = TicketHistory.builder()
            .ticket(ticket)
            .changedBy(user)
            .fieldChanged(field)
            .oldValue(oldVal)
            .newValue(newVal)
            .build();
        historyRepository.save(history);
    }

    private String generateTicketNumber() {
        String prefix = "TKT";
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        int nextSeq = ticketRepository.findMaxSequenceByPattern(prefix + "-" + date + "-%") + 1;
        return String.format("%s-%s-%04d", prefix, date, nextSeq);
    }
}
