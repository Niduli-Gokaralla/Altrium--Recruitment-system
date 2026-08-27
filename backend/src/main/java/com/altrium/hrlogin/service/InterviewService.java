package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.*;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.model.InterviewFeedback;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewFeedbackRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class InterviewService {
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;

    public InterviewService(InterviewRepository interviewRepository, InterviewFeedbackRepository feedbackRepository,
                             CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository) {
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
    }

    public InterviewResponse createInterview(InterviewRequest request, String createdByUsername) {
        if (!candidateRepository.existsById(request.getCandidateId()))
            throw new NoSuchElementException("Selected candidate does not exist");
        Interview interview = new Interview();
        applyRequestToEntity(interview, request);
        interview.setCreatedBy(createdByUsername);
        return toResponse(interviewRepository.save(interview));
    }

    public InterviewResponse updateInterview(Long id, InterviewRequest request) {
        Interview interview = interviewRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Interview not found"));
        applyRequestToEntity(interview, request);
        return toResponse(interviewRepository.save(interview));
    }

    public List<InterviewResponse> getAllInterviews() {
        return interviewRepository.findAllByOrderByInterviewDateAscInterviewTimeAsc().stream().map(this::toResponse).toList();
    }

    public InterviewResponse getInterview(Long id) {
        return toResponse(interviewRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Interview not found")));
    }

    public void deleteInterview(Long id) {
        if (!interviewRepository.existsById(id)) throw new NoSuchElementException("Interview not found");
        interviewRepository.deleteById(id);
    }

    public FeedbackResponse submitFeedback(Long interviewId, FeedbackRequest request, String submittedByUsername) {
        Interview interview = interviewRepository.findById(interviewId).orElseThrow(() -> new NoSuchElementException("Interview not found"));
        InterviewFeedback feedback = feedbackRepository.findByInterviewId(interviewId).orElseGet(InterviewFeedback::new);
        boolean isNew = feedback.getId() == null;
        feedback.setInterviewId(interviewId);
        feedback.setTechnicalSkills(request.getTechnicalSkills());
        feedback.setCommunication(request.getCommunication());
        feedback.setProblemSolving(request.getProblemSolving());
        feedback.setCulturalFit(request.getCulturalFit());
        feedback.setOverallRecommendation(request.getOverallRecommendation());
        feedback.setComments(request.getComments());
        if (isNew) feedback.setSubmittedBy(submittedByUsername);
        feedback.setUpdatedAt(java.time.LocalDateTime.now());
        InterviewFeedback saved = feedbackRepository.save(feedback);
        interview.setStatus("COMPLETED");
        interviewRepository.save(interview);
        return new FeedbackResponse(saved);
    }

    public FeedbackResponse getFeedback(Long interviewId) {
        InterviewFeedback feedback = feedbackRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new NoSuchElementException("No feedback submitted for this interview"));
        return new FeedbackResponse(feedback);
    }

    private void applyRequestToEntity(Interview interview, InterviewRequest request) {
        interview.setCandidateId(request.getCandidateId());
        interview.setInterviewDate(request.getInterviewDate());
        interview.setInterviewTime(request.getInterviewTime());
        interview.setInterviewer(request.getInterviewer().trim());
        interview.setStage(request.getStage());
        if (request.getStatus() != null && !request.getStatus().isBlank()) interview.setStatus(request.getStatus());
        else if (interview.getStatus() == null) interview.setStatus("SCHEDULED");
    }

    private InterviewResponse toResponse(Interview interview) {
        Candidate candidate = candidateRepository.findById(interview.getCandidateId()).orElse(null);
        String candidateName = candidate != null ? candidate.getFullName() : "(candidate removed)";
        String jobTitle = "";
        if (candidate != null) {
            jobTitle = jobOpeningRepository.findById(candidate.getJobOpeningId()).map(job -> job.getTitle()).orElse("");
        }
        boolean hasFeedback = feedbackRepository.findByInterviewId(interview.getId()).isPresent();
        return new InterviewResponse(interview, candidateName, jobTitle, hasFeedback);
    }
}
