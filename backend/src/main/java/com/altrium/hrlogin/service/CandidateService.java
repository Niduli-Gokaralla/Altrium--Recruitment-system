package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.CandidateRequest;
import com.altrium.hrlogin.dto.CandidateResponse;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

@Service
public class CandidateService {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;

    @Value("${app.upload.cv-dir:uploads/cvs}")
    private String uploadDir;

    public CandidateService(CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository) {
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
    }

    public Map<String, String> validate(CandidateRequest request, MultipartFile cvFile) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (!StringUtils.hasText(request.getFullName())) errors.put("fullName", "Full name is required");
        if (!StringUtils.hasText(request.getEmail())) errors.put("email", "Email is required");
        else if (!request.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) errors.put("email", "Enter a valid email address");
        if (request.getJobOpeningId() == null) errors.put("jobOpeningId", "Applied position is required");
        else if (!jobOpeningRepository.existsById(request.getJobOpeningId())) errors.put("jobOpeningId", "Selected job opening does not exist");

        if (cvFile != null && !cvFile.isEmpty()) {
            String extension = getExtension(cvFile.getOriginalFilename());
            if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
                errors.put("cvFile", "CV must be a PDF, DOC, or DOCX file");
            } else if (cvFile.getSize() > MAX_FILE_SIZE_BYTES) {
                errors.put("cvFile", "CV file must be under 5MB");
            }
        }
        return errors;
    }

    public CandidateResponse createCandidate(CandidateRequest request, MultipartFile cvFile, String createdByUsername) throws IOException {
        Candidate candidate = new Candidate();
        applyRequestToEntity(candidate, request);
        candidate.setStage(StringUtils.hasText(request.getStage()) ? request.getStage() : "APPLIED");
        candidate.setCreatedBy(createdByUsername);
        if (cvFile != null && !cvFile.isEmpty()) storeCvFile(candidate, cvFile);
        return toResponse(candidateRepository.save(candidate));
    }

    public CandidateResponse updateCandidate(Long id, CandidateRequest request, MultipartFile cvFile) throws IOException {
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        applyRequestToEntity(candidate, request);
        if (StringUtils.hasText(request.getStage())) candidate.setStage(request.getStage());
        if (cvFile != null && !cvFile.isEmpty()) {
            deleteCvFileIfPresent(candidate);
            storeCvFile(candidate, cvFile);
        }
        return toResponse(candidateRepository.save(candidate));
    }

    public CandidateResponse updateStage(Long id, String stage) {
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        candidate.setStage(stage);
        return toResponse(candidateRepository.save(candidate));
    }

    public void deleteCandidate(Long id) {
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        deleteCvFileIfPresent(candidate);
        candidateRepository.delete(candidate);
    }

    public List<CandidateResponse> getAllCandidates() {
        return candidateRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public CandidateResponse getCandidate(Long id) {
        return toResponse(candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found")));
    }

    public Path getCvFilePath(Long id) {
        Candidate candidate = candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
        if (candidate.getCvStoredName() == null) return null;
        return Paths.get(uploadDir, candidate.getCvStoredName());
    }

    public Candidate getCandidateEntity(Long id) {
        return candidateRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Candidate not found"));
    }

    private void applyRequestToEntity(Candidate candidate, CandidateRequest request) {
        candidate.setFullName(request.getFullName().trim());
        candidate.setEmail(request.getEmail().trim());
        candidate.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        candidate.setJobOpeningId(request.getJobOpeningId());
        candidate.setSkills(request.getSkills());
        candidate.setExperience(request.getExperience());
        candidate.setQualifications(request.getQualifications());
    }

    private void storeCvFile(Candidate candidate, MultipartFile cvFile) throws IOException {
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String extension = getExtension(cvFile.getOriginalFilename());
        String storedName = UUID.randomUUID() + "." + extension;
        Files.copy(cvFile.getInputStream(), dir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        candidate.setCvFileName(cvFile.getOriginalFilename());
        candidate.setCvStoredName(storedName);
        candidate.setCvContentType(cvFile.getContentType());
        candidate.setCvFileSize(cvFile.getSize());
    }

    private void deleteCvFileIfPresent(Candidate candidate) {
        if (candidate.getCvStoredName() == null) return;
        try { Files.deleteIfExists(Paths.get(uploadDir, candidate.getCvStoredName())); } catch (IOException ignored) {}
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return null;
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private CandidateResponse toResponse(Candidate candidate) {
        String jobTitle = jobOpeningRepository.findById(candidate.getJobOpeningId())
                .map(job -> job.getTitle()).orElse("(job opening removed)");
        return new CandidateResponse(candidate, jobTitle);
    }
}
