package com.company.ticketing.service;

import com.company.ticketing.entity.*;
import com.company.ticketing.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalTickets(ticketRepository.count());
        stats.setOpenTickets(ticketRepository.countByStatus(TicketStatus.OPEN));
        stats.setInProgressTickets(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS));
        stats.setResolvedTickets(ticketRepository.countByStatus(TicketStatus.RESOLVED));
        stats.setClosedTickets(ticketRepository.countByStatus(TicketStatus.CLOSED));
        stats.setCriticalOpen(ticketRepository.countOpenByPriority(TicketPriority.CRITICAL));
        stats.setHighOpen(ticketRepository.countOpenByPriority(TicketPriority.HIGH));
        stats.setTotalUsers(userRepository.count());
        stats.setOverdueTickets((long) ticketRepository.findOverdueTickets(LocalDateTime.now()).size());

        // By status
        Map<String, Long> byStatus = new HashMap<>();
        ticketRepository.countGroupByStatus().forEach(row -> byStatus.put(row[0].toString(), (Long) row[1]));
        stats.setByStatus(byStatus);

        // By priority
        Map<String, Long> byPriority = new HashMap<>();
        ticketRepository.countOpenGroupByPriority().forEach(row -> byPriority.put(row[0].toString(), (Long) row[1]));
        stats.setByPriority(byPriority);

        // By type
        Map<String, Long> byType = new HashMap<>();
        ticketRepository.countGroupByType().forEach(row -> byType.put(row[0].toString(), (Long) row[1]));
        stats.setByType(byType);

        // Trend last 30 days
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Map<String, Object>> trend = ticketRepository.countByCreatedDateFrom(thirtyDaysAgo)
            .stream().map(row -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("date", row[0].toString());
                entry.put("count", row[1]);
                return entry;
            }).collect(Collectors.toList());
        stats.setTrend(trend);

        return stats;
    }

    @Transactional(readOnly = true)
    public UserStats getUserStats(User user) {
        UserStats stats = new UserStats();
        stats.setReportedTotal(ticketRepository.countByReporter(user.getId()));
        stats.setAssignedOpen(ticketRepository.countOpenByAssignee(user.getId()));
        stats.setReportedOpen(ticketRepository.countByStatus(TicketStatus.OPEN));
        return stats;
    }

    @Data
    public static class DashboardStats {
        private long totalTickets;
        private long openTickets;
        private long inProgressTickets;
        private long resolvedTickets;
        private long closedTickets;
        private long criticalOpen;
        private long highOpen;
        private long totalUsers;
        private long overdueTickets;
        private Map<String, Long> byStatus;
        private Map<String, Long> byPriority;
        private Map<String, Long> byType;
        private List<Map<String, Object>> trend;
    }

    @Data
    public static class UserStats {
        private long reportedTotal;
        private long assignedOpen;
        private long reportedOpen;
    }
}
