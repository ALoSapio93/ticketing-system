package com.company.ticketing.repository;

import com.company.ticketing.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    Page<Ticket> findByReporter(User reporter, Pageable pageable);

    Page<Ticket> findByAssignee(User assignee, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:type IS NULL OR t.type = :type) AND " +
           "(:category IS NULL OR t.category = :category) AND " +
           "(:assigneeId IS NULL OR t.assignee.id = :assigneeId) AND " +
           "(:reporterId IS NULL OR t.reporter.id = :reporterId) AND " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')) OR " +
           "LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')))")
    Page<Ticket> findWithFilters(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("type") TicketType type,
            @Param("category") TicketCategory category,
            @Param("assigneeId") Long assigneeId,
            @Param("reporterId") Long reporterId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.priority = :priority AND t.status NOT IN ('CLOSED', 'RESOLVED')")
    long countOpenByPriority(@Param("priority") TicketPriority priority);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignee.id = :userId AND t.status NOT IN ('CLOSED', 'RESOLVED', 'REJECTED')")
    long countOpenByAssignee(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.reporter.id = :userId")
    long countByReporter(@Param("userId") Long userId);

    @Query("SELECT t FROM Ticket t WHERE t.dueDate < :now AND t.status NOT IN ('CLOSED', 'RESOLVED', 'REJECTED')")
    List<Ticket> findOverdueTickets(@Param("now") LocalDateTime now);

    @Query(value = "SELECT COALESCE(MAX(CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)), 0) FROM tickets WHERE ticket_number LIKE :pattern", nativeQuery = true)
    int findMaxSequenceByPattern(@Param("pattern") String pattern);

    @Query("SELECT t.status, COUNT(t) FROM Ticket t GROUP BY t.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT t.priority, COUNT(t) FROM Ticket t WHERE t.status NOT IN ('CLOSED', 'RESOLVED') GROUP BY t.priority")
    List<Object[]> countOpenGroupByPriority();

    @Query("SELECT t.type, COUNT(t) FROM Ticket t GROUP BY t.type")
    List<Object[]> countGroupByType();

    @Query("SELECT DATE(t.createdAt), COUNT(t) FROM Ticket t WHERE t.createdAt >= :from GROUP BY DATE(t.createdAt) ORDER BY DATE(t.createdAt)")
    List<Object[]> countByCreatedDateFrom(@Param("from") LocalDateTime from);
}
