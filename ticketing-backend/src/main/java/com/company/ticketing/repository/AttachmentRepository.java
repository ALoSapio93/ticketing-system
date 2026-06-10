package com.company.ticketing.repository;

import com.company.ticketing.entity.Attachment;
import com.company.ticketing.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTicket(Ticket ticket);
}
