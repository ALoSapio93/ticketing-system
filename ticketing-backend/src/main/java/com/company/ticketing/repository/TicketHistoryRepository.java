package com.company.ticketing.repository;

import com.company.ticketing.entity.Ticket;
import com.company.ticketing.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketOrderByChangedAtAsc(Ticket ticket);
}
