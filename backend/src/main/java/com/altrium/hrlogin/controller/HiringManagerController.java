package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.*;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewFeedbackRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import com.altrium.hrlogin.service.CandidateService;
import com.altrium.hrlogin.service.HiringManagerDashboardService;
import com.altrium.hrlogin.service.InterviewService;
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
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hiring-manager")
@CrossOrigin(origins = "*")
public class HiringManagerController {
    private final HiringManagerDashboardService dashboardService;
    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;
    private final CandidateService candidateService;
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final InterviewService interviewService;

    public HiringManagerController(HiringManagerDashboardService dashboardService, JobOpeningRepository jobOpeningRepository,
                                    CandidateRepository candidateRepository, CandidateService candidateService,
                                    InterviewRepository interviewRepository, InterviewFeedbackRepository feedbackRepository,
                                    InterviewService interviewService) {
        this.dashboardService = dashboardService;
        this.jobOpeningRepository = jobOpeningRepository;
        this.candidateRepository = candidateRepository;
        this.candidateService = candidateService;
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
        this.interviewService = interviewService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<HiringManagerDashboardResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.buildDashboard(authentication.getName()));
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<JobOpeningResponse>> myJobs(Authentication authentication) {
        Set<Long> myJobIds = getMyJobIds(authentication.getName());
        return ResponseEntity.ok(jobOpeningRepository.findAll().stream().filter(j -> myJobIds.contains(j.getId()))
                .map(JobOpeningResponse::new).toList());
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<CandidateResponse>> myCandidates(Authentication authentication) {
        Set<Long> myJobIds = getMyJobIds(authentication.getName());
        return ResponseEntity.ok(candidateService.getAllCandidates().stream()
                .filter(c -> myJobIds.contains(c.getJobOpeningId())).toList());
    }

    @GetMapping("/candidates/{id}/cv")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id, Authentication authentication) throws MalformedURLException {
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        Optional<JobOpening> job = jobOpeningRepository.findById(candidate.getJobOpeningId());
        if (job.isEmpty() || !authentication.getName().equals(job.get().getAssignedTo()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Path filePath = candidateService.getCvFilePath(id);
        if (filePath == null) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) return ResponseEntity.notFound().build();
        String contentType = candidate.getCvContentType() != null ? candidate.getCvContentType() : "application/octet-stream";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + candidate.getCvFileName() + "\"").body(resource);
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewResponse>> myInterviews(Authentication authentication) {
        Set<Long> myCandidateIds = getMyCandidateIds(authentication.getName());
        return ResponseEntity.ok(interviewService.getAllInterviews().stream()
                .filter(i -> myCandidateIds.contains(i.getCandidateId())).toList());
    }

    @GetMapping("/interviews/{id}/feedback")
    public ResponseEntity<?> getFeedback(@PathVariable Long id, Authentication authentication) {
        assertInterviewInScope(id, authentication.getName());
        return ResponseEntity.ok(interviewService.getFeedback(id));
    }

    @PostMapping("/interviews/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request, Authentication authentication) {
        assertInterviewInScope(id, authentication.getName());
        return ResponseEntity.ok(interviewService.submitFeedback(id, request, authentication.getName()));
    }

    @PostMapping("/candidates/{candidateId}/decision")
    public ResponseEntity<?> makeDecision(@PathVariable Long candidateId, @Valid @RequestBody HiringDecisionRequest request, Authentication authentication) {
        Candidate candidate = candidateRepository.findById(candidateId).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        Optional<JobOpening> job = jobOpeningRepository.findById(candidate.getJobOpeningId());
        if (job.isEmpty() || !authentication.getName().equals(job.get().getAssignedTo()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "This candidate is not assigned to you"));

        boolean hasFeedback = interviewRepository.findAll().stream().filter(i -> i.getCandidateId().equals(candidateId))
                .anyMatch(i -> feedbackRepository.findByInterviewId(i.getId()).isPresent());
        if (!hasFeedback) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Feedback must be completed before this candidate can be moved or rejected"));

        candidate.setStage(request.getDecision());
        candidateRepository.save(candidate);
        return ResponseEntity.ok(Map.of("candidateId", candidateId, "stage", candidate.getStage()));
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<HiringManagerDashboardService.RankingEntry>> getRanking(
            @RequestParam(required = false) Long jobId, Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getRanking(authentication.getName(), jobId));
    }

    @GetMapping("/kpis")
    public ResponseEntity<HiringManagerDashboardService.KpiSummary> getKpis(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getKpis(authentication.getName()));
    }

    private Set<Long> getMyJobIds(String username) {
        return jobOpeningRepository.findAll().stream().filter(j -> username.equals(j.getAssignedTo()))
                .map(JobOpening::getId).collect(Collectors.toSet());
    }

    private Set<Long> getMyCandidateIds(String username) {
        Set<Long> myJobIds = getMyJobIds(username);
        return candidateRepository.findAll().stream().filter(c -> myJobIds.contains(c.getJobOpeningId()))
                .map(Candidate::getId).collect(Collectors.toSet());
    }

    private void assertInterviewInScope(Long interviewId, String username) {
        Interview interview = interviewRepository.findById(interviewId).orElseThrow(() -> new NoSuchElementException("Interview not found"));
        Set<Long> myCandidateIds = getMyCandidateIds(username);
        if (!myCandidateIds.contains(interview.getCandidateId())) throw new NoSuchElementException("Interview not found");
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
