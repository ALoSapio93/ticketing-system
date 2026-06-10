package com.company.ticketing.controller;

import com.company.ticketing.entity.User;
import com.company.ticketing.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    public ResponseEntity<StatsService.DashboardStats> getDashboard() {
        return ResponseEntity.ok(statsService.getDashboardStats());
    }

    @GetMapping("/user")
    public ResponseEntity<StatsService.UserStats> getUserStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(statsService.getUserStats(user));
    }
}
