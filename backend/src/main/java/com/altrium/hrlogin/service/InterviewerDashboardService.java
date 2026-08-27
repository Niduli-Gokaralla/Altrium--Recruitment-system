package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.InterviewerDashboardResponse;
import com.altrium.hrlogin.dto.InterviewerDashboardResponse.PendingFeedback;
import com.altrium.hrlogin.dto.InterviewerDashboardResponse.UpcomingInterview;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewFeedbackRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class InterviewerDashboardService {
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;

    public InterviewerDashboardService(InterviewRepository interviewRepository, InterviewFeedbackRepository feedbackRepository,
                                        CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository) {
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
    }

    public InterviewerDashboardResponse buildDashboard(String interviewerUsername) {
        List<Interview> myInterviews = interviewRepository.findAll().stream()
                .filter(i -> interviewerUsername.equals(i.getInterviewer())).toList();

        Set<Long> myCandidateIds = new HashSet<>();
        for (Interview i : myInterviews) myCandidateIds.add(i.getCandidateId());

        Map<Long, Candidate> candidateById = new HashMap<>();
        for (Long id : myCandidateIds) candidateRepository.findById(id).ifPresent(c -> candidateById.put(id, c));

        InterviewerDashboardResponse response = new InterviewerDashboardResponse();
        response.setAssignedInterviewsCount(myInterviews.size());
        response.setCandidatesCount(myCandidateIds.size());

        LocalDate today = LocalDate.now();
        List<UpcomingInterview> upcoming = myInterviews.stream()
                .filter(i -> "SCHEDULED".equals(i.getStatus()) && !i.getInterviewDate().isBefore(today))
                .sorted(Comparator.comparing(Interview::getInterviewDate).thenComparing(Interview::getInterviewTime))
                .limit(6)
                .map(i -> {
                    UpcomingInterview u = new UpcomingInterview();
                    u.interviewId = i.getId();
                    Candidate c = candidateById.get(i.getCandidateId());
                    u.candidateName = c != null ? c.getFullName() : "";
                    u.jobOpeningTitle = jobTitleFor(c);
                    u.stage = i.getStage();
                    u.interviewDate = i.getInterviewDate();
                    u.interviewTime = i.getInterviewTime();
                    return u;
                }).toList();
        response.setUpcomingInterviews(upcoming);

        List<PendingFeedback> pending = new ArrayList<>();
        for (Interview i : myInterviews) {
            boolean happened = "COMPLETED".equals(i.getStatus()) || ("SCHEDULED".equals(i.getStatus()) && i.getInterviewDate().isBefore(today));
            if (!happened) continue;
            boolean hasFeedback = feedbackRepository.findByInterviewId(i.getId()).isPresent();
            if (hasFeedback) continue;
            PendingFeedback pf = new PendingFeedback();
            pf.interviewId = i.getId();
            Candidate c = candidateById.get(i.getCandidateId());
            pf.candidateName = c != null ? c.getFullName() : "";
            pf.jobOpeningTitle = jobTitleFor(c);
            pf.stage = i.getStage();
            pf.interviewDate = i.getInterviewDate();
            pending.add(pf);
        }
        response.setPendingFeedback(pending);
        response.setPendingFeedbackCount(pending.size());
        return response;
    }

    private String jobTitleFor(Candidate c) {
        if (c == null) return "";
        JobOpening job = jobOpeningRepository.findById(c.getJobOpeningId()).orElse(null);
        return job != null ? job.getTitle() : "";
    }
}
