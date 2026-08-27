package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.*;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.service.CandidateService;
import com.altrium.hrlogin.service.InterviewService;
import com.altrium.hrlogin.service.InterviewerDashboardService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/interviewer")
@CrossOrigin(origins = "*")
public class InterviewerController {
    private final InterviewerDashboardService dashboardService;
    private final InterviewRepository interviewRepository;
    private final InterviewService interviewService;
    private final CandidateRepository candidateRepository;
    private final CandidateService candidateService;

    public InterviewerController(InterviewerDashboardService dashboardService, InterviewRepository interviewRepository,
                                  InterviewService interviewService, CandidateRepository candidateRepository,
                                  CandidateService candidateService) {
        this.dashboardService = dashboardService;
        this.interviewRepository = interviewRepository;
        this.interviewService = interviewService;
        this.candidateRepository = candidateRepository;
        this.candidateService = candidateService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<InterviewerDashboardResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.buildDashboard(authentication.getName()));
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewResponse>> myInterviews(Authentication authentication) {
        return ResponseEntity.ok(interviewService.getAllInterviews().stream()
                .filter(i -> authentication.getName().equals(getInterviewerUsername(i.getId()))).toList());
    }

    @GetMapping("/interviews/{id}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable Long id, Authentication authentication) {
        assertInterviewInScope(id, authentication.getName());
        return ResponseEntity.ok(interviewService.getFeedback(id));
    }

    @PostMapping("/interviews/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request, Authentication authentication) {
        assertInterviewInScope(id, authentication.getName());
        return ResponseEntity.ok(interviewService.submitFeedback(id, request, authentication.getName()));
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<CandidateResponse>> myCandidates(Authentication authentication) {
        Set<Long> myCandidateIds = getMyCandidateIds(authentication.getName());
        return ResponseEntity.ok(candidateService.getAllCandidates().stream()
                .filter(c -> myCandidateIds.contains(c.getId())).toList());
    }

    @GetMapping("/candidates/{id}/cv")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id, Authentication authentication) throws MalformedURLException {
        Set<Long> myCandidateIds = getMyCandidateIds(authentication.getName());
        if (!myCandidateIds.contains(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        Path filePath = candidateService.getCvFilePath(id);
        if (filePath == null) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) return ResponseEntity.notFound().build();
        String contentType = candidate.getCvContentType() != null ? candidate.getCvContentType() : "application/octet-stream";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + candidate.getCvFileName() + "\"").body(resource);
    }

    private String getInterviewerUsername(Long interviewId) {
        return interviewRepository.findById(interviewId).map(Interview::getInterviewer).orElse(null);
    }

    private Set<Long> getMyCandidateIds(String username) {
        return interviewRepository.findAll().stream().filter(i -> username.equals(i.getInterviewer()))
                .map(Interview::getCandidateId).collect(Collectors.toSet());
    }

    private void assertInterviewInScope(Long interviewId, String username) {
        Interview interview = interviewRepository.findById(interviewId).orElseThrow(() -> new NoSuchElementException("Interview not found"));
        if (!username.equals(interview.getInterviewer())) throw new NoSuchElementException("Interview not found");
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        Map<String, String> errors = new java.util.LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}
