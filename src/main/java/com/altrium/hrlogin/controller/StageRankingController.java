package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.StageRankingResponse;
import com.altrium.hrlogin.service.StageRankingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hiring-manager")
@CrossOrigin(origins = "*")
public class StageRankingController {
    private final StageRankingService stageRankingService;

    public StageRankingController(StageRankingService stageRankingService) {
        this.stageRankingService = stageRankingService;
    }

    // AC: stage is REQUIRED — there is deliberately no "overall" ranking
    // option. jobId is optional (ranks across all your assigned jobs if
    // omitted, though the frontend always supplies it).
    @GetMapping("/stage-ranking")
    public ResponseEntity<?> getStageRanking(
            @RequestParam(value = "jobId", required = false) Long jobId,
            @RequestParam("stage") String stage,
            Authentication authentication) {
        if (stage == null || stage.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "An interview stage must be selected."));
        }
        List<StageRankingResponse> result = stageRankingService.getStageRanking(authentication.getName(), jobId, stage);
        return ResponseEntity.ok(result);
    }
}
