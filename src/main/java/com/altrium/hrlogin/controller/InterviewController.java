package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.*;
import com.altrium.hrlogin.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
public class InterviewController {
    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) { this.interviewService = interviewService; }

    @GetMapping("/api/interviews")
    public ResponseEntity<List<InterviewResponse>> listInterviews() {
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }

    @GetMapping("/api/interviews/{id}")
    public ResponseEntity<InterviewResponse> getInterview(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getInterview(id));
    }

    // HR only ever sees HR's own feedback row for this interview — never
    // the Hiring Manager's or Interviewer's.
    @GetMapping("/api/interviews/{id}/feedback")
    public ResponseEntity<FeedbackResponse> getFeedback(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getFeedbackForRole(id, "HR"));
    }

    @PostMapping("/api/hr/interviews")
    public ResponseEntity<?> createInterview(@Valid @RequestBody InterviewRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(interviewService.createInterview(request, authentication.getName()));
    }

    @PutMapping("/api/hr/interviews/{id}")
    public ResponseEntity<?> updateInterview(@PathVariable Long id, @Valid @RequestBody InterviewRequest request) {
        return ResponseEntity.ok(interviewService.updateInterview(id, request));
    }

    @DeleteMapping("/api/hr/interviews/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable Long id) {
        interviewService.deleteInterview(id);
        return ResponseEntity.noContent().build();
    }

    // Submits/updates HR's own feedback row only — never touches the
    // Hiring Manager's or Interviewer's row for the same interview.
    @PostMapping("/api/hr/interviews/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request, Authentication authentication) {
        return ResponseEntity.ok(interviewService.submitFeedback(id, request, authentication.getName(), "HR"));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }
}
