package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.JobOpeningRequest;
import com.altrium.hrlogin.dto.JobOpeningResponse;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class JobOpeningService {
    private final JobOpeningRepository jobOpeningRepository;

    public JobOpeningService(JobOpeningRepository jobOpeningRepository) {
        this.jobOpeningRepository = jobOpeningRepository;
    }

    public JobOpeningResponse createJobOpening(JobOpeningRequest request, String createdByUsername) {
        JobOpening job = new JobOpening();
        applyRequestToEntity(job, request);
        job.setCreatedBy(createdByUsername);
        return new JobOpeningResponse(jobOpeningRepository.save(job));
    }

    public List<JobOpeningResponse> getAllJobOpenings() {
        return jobOpeningRepository.findAll().stream().map(JobOpeningResponse::new).toList();
    }

    public JobOpeningResponse getJobOpening(Long id) {
        return new JobOpeningResponse(jobOpeningRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Job opening not found")));
    }

    public JobOpeningResponse updateJobOpening(Long id, JobOpeningRequest request) {
        JobOpening job = jobOpeningRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Job opening not found"));
        applyRequestToEntity(job, request);
        return new JobOpeningResponse(jobOpeningRepository.save(job));
    }

    public JobOpeningResponse updateStatus(Long id, String status) {
        JobOpening job = jobOpeningRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Job opening not found"));
        job.setStatus(status);
        return new JobOpeningResponse(jobOpeningRepository.save(job));
    }

    public void deleteJobOpening(Long id) {
        if (!jobOpeningRepository.existsById(id)) throw new NoSuchElementException("Job opening not found");
        jobOpeningRepository.deleteById(id);
    }

    private void applyRequestToEntity(JobOpening job, JobOpeningRequest request) {
        job.setTitle(request.getTitle().trim());
        job.setDepartment(request.getDepartment().trim());
        job.setLocation(request.getLocation().trim());
        job.setEmploymentType(request.getEmploymentType().trim());
        job.setVacancies(request.getVacancies());
        job.setDescription(request.getDescription().trim());
        job.setQualifications(request.getQualifications().trim());
        job.setSkills(request.getSkills().trim());
        job.setExperienceRequired(request.getExperienceRequired().trim());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "OPEN");
        job.setInterviewStages(request.getInterviewStages());
        job.setAssignedTo(request.getAssignedTo() != null && !request.getAssignedTo().isBlank() ? request.getAssignedTo() : null);
    }
}
