package com.company.ticketing.dto;

import com.company.ticketing.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class TicketDTOs {

    @Data
    public static class CreateTicketRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotNull private TicketType type;
        @NotNull private TicketPriority priority;
        private TicketCategory category;
        private Long assigneeId;
        private String department;
        private LocalDateTime dueDate;
    }

    @Data
    public static class UpdateTicketRequest {
        private String title;
        private String description;
        private TicketType type;
        private TicketPriority priority;
        private TicketStatus status;
        private TicketCategory category;
        private Long assigneeId;
        private String department;
        private LocalDateTime dueDate;
    }

    @Data
    public static class TicketResponse {
        private Long id;
        private String ticketNumber;
        private String title;
        private String description;
        private TicketType type;
        private TicketStatus status;
        private TicketPriority priority;
        private TicketCategory category;
        private UserDTO reporter;
        private UserDTO assignee;
        private String department;
        private LocalDateTime dueDate;
        private LocalDateTime resolvedAt;
        private LocalDateTime closedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private int commentCount;
        private int attachmentCount;

        public static TicketResponse from(Ticket ticket) {
            TicketResponse r = new TicketResponse();
            r.setId(ticket.getId());
            r.setTicketNumber(ticket.getTicketNumber());
            r.setTitle(ticket.getTitle());
            r.setDescription(ticket.getDescription());
            r.setType(ticket.getType());
            r.setStatus(ticket.getStatus());
            r.setPriority(ticket.getPriority());
            r.setCategory(ticket.getCategory());
            r.setReporter(UserDTO.from(ticket.getReporter()));
            if (ticket.getAssignee() != null) r.setAssignee(UserDTO.from(ticket.getAssignee()));
            r.setDepartment(ticket.getDepartment());
            r.setDueDate(ticket.getDueDate());
            r.setResolvedAt(ticket.getResolvedAt());
            r.setClosedAt(ticket.getClosedAt());
            r.setCreatedAt(ticket.getCreatedAt());
            r.setUpdatedAt(ticket.getUpdatedAt());
            r.setCommentCount(ticket.getComments().size());
            r.setAttachmentCount(ticket.getAttachments().size());
            return r;
        }
    }

    @Data
    public static class TicketFilterRequest {
        private TicketStatus status;
        private TicketPriority priority;
        private TicketType type;
        private TicketCategory category;
        private Long assigneeId;
        private Long reporterId;
        private String search;
        private int page = 0;
        private int size = 10;
        private String sortBy = "createdAt";
        private String sortDir = "desc";
    }

    @Data
    public static class CommentRequest {
        @NotBlank private String content;
        private boolean internal = false;
    }

    @Data
    public static class CommentResponse {
        private Long id;
        private UserDTO author;
        private String content;
        private boolean internal;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static CommentResponse from(Comment comment) {
            CommentResponse r = new CommentResponse();
            r.setId(comment.getId());
            r.setAuthor(UserDTO.from(comment.getAuthor()));
            r.setContent(comment.getContent());
            r.setInternal(comment.isInternal());
            r.setCreatedAt(comment.getCreatedAt());
            r.setUpdatedAt(comment.getUpdatedAt());
            return r;
        }
    }

    @Data
    public static class HistoryResponse {
        private Long id;
        private UserDTO changedBy;
        private String fieldChanged;
        private String oldValue;
        private String newValue;
        private LocalDateTime changedAt;

        public static HistoryResponse from(TicketHistory h) {
            HistoryResponse r = new HistoryResponse();
            r.setId(h.getId());
            r.setChangedBy(UserDTO.from(h.getChangedBy()));
            r.setFieldChanged(h.getFieldChanged());
            r.setOldValue(h.getOldValue());
            r.setNewValue(h.getNewValue());
            r.setChangedAt(h.getChangedAt());
            return r;
        }
    }
}
