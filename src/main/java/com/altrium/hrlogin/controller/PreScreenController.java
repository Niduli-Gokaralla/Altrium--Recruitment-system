package com.altrium.hrlogin.controller;

import com.altrium.hrlogin.dto.ScreeningResult;
import com.altrium.hrlogin.service.CandidateScreeningService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.NoSuchElementException;

// AC: lets HR check a CV's match score against a job's requirements
// BEFORE creating a candidate record — nothing is saved to the database
// or written to disk here. If HR decides not to proceed, the applicant
// never enters the system at all.
@RestController
@RequestMapping("/api/hr/candidates")
@CrossOrigin(origins = "*")
public class PreScreenController {
    private final CandidateScreeningService candidateScreeningService;

    public PreScreenController(CandidateScreeningService candidateScreeningService) {
        this.candidateScreeningService = candidateScreeningService;
    }

    @PostMapping(value = "/pre-screen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> preScreen(@RequestParam("jobOpeningId") Long jobOpeningId,
                                        @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
                                        @RequestParam(value = "skills", required = false) String skills,
                                        @RequestParam(value = "experience", required = false) String experience,
                                        @RequestParam(value = "qualifications", required = false) String qualifications) {
        try {
            ScreeningResult result = candidateScreeningService.preScreenUpload(cvFile, jobOpeningId, skills, experience, qualifications);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Could not read the uploaded file."));
        }
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }
}
