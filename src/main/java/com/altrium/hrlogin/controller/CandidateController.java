package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.CandidateRequest;
import com.altrium.hrlogin.dto.CandidateResponse;
import com.altrium.hrlogin.dto.CandidateStageUpdateRequest;
import com.altrium.hrlogin.dto.ScreeningResult;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.service.CandidateScreeningService;
import com.altrium.hrlogin.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/hr/candidates")
@CrossOrigin(origins = "*")
public class CandidateController {
    private final CandidateService candidateService;
    private final CandidateScreeningService candidateScreeningService;

    public CandidateController(CandidateService candidateService, CandidateScreeningService candidateScreeningService) {
        this.candidateService = candidateService;
        this.candidateScreeningService = candidateScreeningService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> createCandidate(@ModelAttribute CandidateRequest request,
                                          @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
                                          Authentication authentication) throws IOException {
    Map<String, String> errors = candidateService.validate(request, cvFile);
    if (cvFile == null || cvFile.isEmpty()) {
        errors.put("cvFile", "A CV file is required.");
    }
    if (!errors.isEmpty()) return ResponseEntity.badRequest().body(errors);
    return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.createCandidate(request, cvFile, authentication.getName()));
}

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateCandidate(@PathVariable Long id, @ModelAttribute CandidateRequest request,
                                              @RequestParam(value = "cvFile", required = false) MultipartFile cvFile) throws IOException {
        Map<String, String> errors = candidateService.validate(request, cvFile);
        if (!errors.isEmpty()) return ResponseEntity.badRequest().body(errors);
        return ResponseEntity.ok(candidateService.updateCandidate(id, request, cvFile));
    }

    @GetMapping
    public ResponseEntity<List<CandidateResponse>> listCandidates() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateResponse> getCandidate(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidate(id));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<CandidateResponse> updateStage(@PathVariable Long id, @Valid @RequestBody CandidateStageUpdateRequest request) {
        return ResponseEntity.ok(candidateService.updateStage(id, request.getStage()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/cv")
    public ResponseEntity<Resource> downloadCv(@PathVariable Long id) throws MalformedURLException {
        Path filePath = candidateService.getCvFilePath(id);
        if (filePath == null) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) return ResponseEntity.notFound().build();
        Candidate candidate = candidateService.getCandidateEntity(id);
        String contentType = candidate.getCvContentType() != null ? candidate.getCvContentType() : "application/octet-stream";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + candidate.getCvFileName() + "\"").body(resource);
    }

    // AC: automated CV screening — computes a match score against the
    // candidate's job opening's required skills, and a Shortlist/Reject
    // recommendation. Purely advisory — does NOT change the candidate's
    // stage; HR still makes the final call via the existing stage endpoint.
    @GetMapping("/{id}/screening")
    public ResponseEntity<ScreeningResult> screenCandidate(@PathVariable Long id) {
        return ResponseEntity.ok(candidateScreeningService.screenCandidate(id));
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
