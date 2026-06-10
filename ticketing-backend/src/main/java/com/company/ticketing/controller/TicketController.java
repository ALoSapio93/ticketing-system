package com.company.ticketing.controller;

import com.company.ticketing.dto.TicketDTOs;
import com.company.ticketing.entity.User;
import com.company.ticketing.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketDTOs.TicketResponse> createTicket(
            @Valid @RequestBody TicketDTOs.CreateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request, user));
    }

    @GetMapping
    public ResponseEntity<Page<TicketDTOs.TicketResponse>> getTickets(
            TicketDTOs.TicketFilterRequest filter,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTickets(filter, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDTOs.TicketResponse> getTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicket(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketDTOs.TicketResponse> updateTicket(
            @PathVariable Long id,
            @RequestBody TicketDTOs.UpdateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        ticketService.deleteTicket(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketDTOs.CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody TicketDTOs.CommentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, request, user));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketDTOs.CommentResponse>> getComments(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getComments(id, user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketDTOs.HistoryResponse>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getHistory(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketDTOs.TicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody TicketDTOs.UpdateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, user));
    }
}
