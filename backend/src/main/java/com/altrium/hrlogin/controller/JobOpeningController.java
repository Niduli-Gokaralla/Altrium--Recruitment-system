package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.JobOpeningRequest;
import com.altrium.hrlogin.dto.JobOpeningResponse;
import com.altrium.hrlogin.dto.JobStatusUpdateRequest;
import com.altrium.hrlogin.service.JobOpeningService;
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
@RequestMapping("/api/hr/jobs")
@CrossOrigin(origins = "*")
public class JobOpeningController {
    private final JobOpeningService jobOpeningService;

    public JobOpeningController(JobOpeningService jobOpeningService) { this.jobOpeningService = jobOpeningService; }

    @PostMapping
    public ResponseEntity<JobOpeningResponse> createJobOpening(@Valid @RequestBody JobOpeningRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobOpeningService.createJobOpening(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<JobOpeningResponse>> listJobOpenings() {
        return ResponseEntity.ok(jobOpeningService.getAllJobOpenings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobOpeningResponse> getJobOpening(@PathVariable Long id) {
        return ResponseEntity.ok(jobOpeningService.getJobOpening(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobOpeningResponse> updateJobOpening(@PathVariable Long id, @Valid @RequestBody JobOpeningRequest request) {
        return ResponseEntity.ok(jobOpeningService.updateJobOpening(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobOpeningResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody JobStatusUpdateRequest request) {
        return ResponseEntity.ok(jobOpeningService.updateStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobOpening(@PathVariable Long id) {
        jobOpeningService.deleteJobOpening(id);
        return ResponseEntity.noContent().build();
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
