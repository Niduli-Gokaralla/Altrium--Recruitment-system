package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.CandidateRankingResponse;
import com.altrium.hrlogin.service.CandidateRankingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hiring-manager")
@CrossOrigin(origins = "*")
public class CandidateRankingController {
    private final CandidateRankingService candidateRankingService;

    public CandidateRankingController(CandidateRankingService candidateRankingService) {
        this.candidateRankingService = candidateRankingService;
    }

    // AC: an optional `stage` query param narrows the ranking to just
    // that interview round's own performance (e.g. "Technical Interview
    // Ranking"), instead of the blended overall score.
    @GetMapping("/candidate-ranking")
    public ResponseEntity<List<CandidateRankingResponse>> getCandidateRanking(
            @RequestParam(value = "jobId", required = false) Long jobId,
            @RequestParam(value = "stage", required = false) String stage,
            Authentication authentication) {
        return ResponseEntity.ok(candidateRankingService.getRanking(authentication.getName(), jobId, stage));
    }
}
