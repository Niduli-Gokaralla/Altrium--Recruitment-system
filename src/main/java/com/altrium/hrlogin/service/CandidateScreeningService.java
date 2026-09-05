package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.ScreeningResult;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;

// AC: automatically scores a candidate against a job opening's required
// skills, and recommends Shortlist/Reject based on the job's configured
// cutoff. This is keyword-based matching (does the CV/profile text
// contain each required skill?) — not true semantic/AI matching. It's
// deliberately explainable: HR can see exactly which skills matched and
// which didn't, rather than trusting an opaque score.
//
// This NEVER changes a candidate's stage on its own — it only computes
// a recommendation. A human still has to click Shortlist/Not Shortlisted.
@Service
public class CandidateScreeningService {
    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final CvTextExtractionService cvTextExtractionService;

    @Value("${app.upload.cv-dir:uploads/cvs}")
    private String uploadDir;

    public CandidateScreeningService(CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository,
                                      CvTextExtractionService cvTextExtractionService) {
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.cvTextExtractionService = cvTextExtractionService;
    }

    // Screens an EXISTING, already-saved candidate (used by the
    // Candidates page's View modal).
    public ScreeningResult screenCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        JobOpening job = jobOpeningRepository.findById(candidate.getJobOpeningId())
                .orElseThrow(() -> new NoSuchElementException("Job opening not found"));

        String textToMatch;
        boolean cvTextAvailable = false;
        String extractionMessage = null;
        String sourceUsed;

        if (candidate.getCvStoredName() != null) {
            Path filePath = Paths.get(uploadDir, candidate.getCvStoredName());
            CvTextExtractionService.ExtractionResult extraction =
                    cvTextExtractionService.extractText(filePath, candidate.getCvContentType(), candidate.getCvFileName());
            if (extraction.success && !extraction.text.isBlank()) {
                textToMatch = extraction.text;
                cvTextAvailable = true;
                sourceUsed = "CV";
            } else {
                extractionMessage = extraction.message;
                textToMatch = buildProfileText(candidate.getSkills(), candidate.getExperience(), candidate.getQualifications());
                sourceUsed = "PROFILE";
            }
        } else {
            extractionMessage = "No CV uploaded — screening is based on the candidate's entered skills/experience/qualifications instead.";
            textToMatch = buildProfileText(candidate.getSkills(), candidate.getExperience(), candidate.getQualifications());
            sourceUsed = "PROFILE";
        }

        return buildResult(textToMatch, cvTextAvailable, extractionMessage, sourceUsed, job);
    }

    // AC: pre-screens a CV BEFORE any candidate record is created or any
    // file is saved to disk. Reads directly from the uploaded file's
    // stream. If HR decides not to proceed, nothing was ever persisted —
    // rejected applicants never enter the system at all.
    public ScreeningResult preScreenUpload(MultipartFile cvFile, Long jobOpeningId,
                                            String manualSkills, String manualExperience, String manualQualifications) throws IOException {
        JobOpening job = jobOpeningRepository.findById(jobOpeningId)
                .orElseThrow(() -> new NoSuchElementException("Job opening not found"));

        String textToMatch;
        boolean cvTextAvailable = false;
        String extractionMessage = null;
        String sourceUsed;

        if (cvFile != null && !cvFile.isEmpty()) {
            CvTextExtractionService.ExtractionResult extraction =
                    cvTextExtractionService.extractTextFromStream(cvFile.getInputStream(), cvFile.getOriginalFilename());
            if (extraction.success && !extraction.text.isBlank()) {
                textToMatch = extraction.text;
                cvTextAvailable = true;
                sourceUsed = "CV";
            } else {
                extractionMessage = extraction.message;
                textToMatch = buildProfileText(manualSkills, manualExperience, manualQualifications);
                sourceUsed = "PROFILE";
            }
        } else {
            extractionMessage = "No CV attached yet — screening is based on the typed-in skills/experience/qualifications fields instead.";
            textToMatch = buildProfileText(manualSkills, manualExperience, manualQualifications);
            sourceUsed = "PROFILE";
        }

        return buildResult(textToMatch, cvTextAvailable, extractionMessage, sourceUsed, job);
    }

    private ScreeningResult buildResult(String textToMatch, boolean cvTextAvailable, String extractionMessage, String sourceUsed, JobOpening job) {
        List<String> requiredSkills = parseSkills(job.getSkills());
        List<ScreeningResult.SkillMatch> matches = new ArrayList<>();
        int matchedCount = 0;
        String lowerText = textToMatch.toLowerCase();

        for (String skill : requiredSkills) {
            boolean matched = !skill.isBlank() && lowerText.contains(skill.toLowerCase().trim());
            if (matched) matchedCount++;
            matches.add(new ScreeningResult.SkillMatch(skill.trim(), matched));
        }

        int scorePercent = requiredSkills.isEmpty() ? 0 : Math.round((matchedCount * 100f) / requiredSkills.size());

        ScreeningResult result = new ScreeningResult();
        result.setCvTextAvailable(cvTextAvailable);
        result.setExtractionMessage(extractionMessage);
        result.setSourceUsed(sourceUsed);
        result.setSkillMatches(matches);
        result.setMatchScorePercent(scorePercent);
        result.setCutoffScore(job.getCutoffScore());
        result.setRecommendation(scorePercent >= job.getCutoffScore() ? "SHORTLIST" : "REJECT");
        return result;
    }

    private String buildProfileText(String skills, String experience, String qualifications) {
        StringBuilder sb = new StringBuilder();
        if (skills != null) sb.append(skills).append(" ");
        if (experience != null) sb.append(experience).append(" ");
        if (qualifications != null) sb.append(qualifications);
        return sb.toString();
    }

    private List<String> parseSkills(String skillsCsv) {
        if (skillsCsv == null || skillsCsv.isBlank()) return List.of();
        return Arrays.stream(skillsCsv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
