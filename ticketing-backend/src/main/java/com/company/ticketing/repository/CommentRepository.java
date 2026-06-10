package com.company.ticketing.repository;

import com.company.ticketing.entity.Comment;
import com.company.ticketing.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicketOrderByCreatedAtAsc(Ticket ticket);
    List<Comment> findByTicketAndInternalFalseOrderByCreatedAtAsc(Ticket ticket);
}
