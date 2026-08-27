package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.HiringManagerDashboardResponse;
import com.altrium.hrlogin.dto.HiringManagerDashboardResponse.CandidateAttention;
import com.altrium.hrlogin.dto.HiringManagerDashboardResponse.UpcomingInterview;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.model.InterviewFeedback;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewFeedbackRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HiringManagerDashboardService {
    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;

    private static final List<String> PIPELINE_STAGES = List.of("APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "HIRED");

    public HiringManagerDashboardService(JobOpeningRepository jobOpeningRepository, CandidateRepository candidateRepository,
                                          InterviewRepository interviewRepository, InterviewFeedbackRepository feedbackRepository) {
        this.jobOpeningRepository = jobOpeningRepository;
        this.candidateRepository = candidateRepository;
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public HiringManagerDashboardResponse buildDashboard(String hiringManagerUsername) {
        List<JobOpening> myJobs = jobOpeningRepository.findAll().stream()
                .filter(j -> hiringManagerUsername.equals(j.getAssignedTo())).toList();
        Set<Long> myJobIds = myJobs.stream().map(JobOpening::getId).collect(Collectors.toSet());
        Map<Long, JobOpening> jobById = myJobs.stream().collect(Collectors.toMap(JobOpening::getId, j -> j));

        List<Candidate> myCandidates = candidateRepository.findAll().stream()
                .filter(c -> myJobIds.contains(c.getJobOpeningId())).toList();
        Map<Long, Candidate> candidateById = myCandidates.stream().collect(Collectors.toMap(Candidate::getId, c -> c));
        Set<Long> myCandidateIds = candidateById.keySet();

        List<Interview> myInterviews = interviewRepository.findAll().stream()
                .filter(i -> myCandidateIds.contains(i.getCandidateId())).toList();

        HiringManagerDashboardResponse response = new HiringManagerDashboardResponse();
        response.setMyJobOpeningsCount(myJobs.size());
        response.setCandidatesCount(myCandidates.size());
        response.setInterviewsCount(myInterviews.size());

        Map<String, Integer> pipeline = new LinkedHashMap<>();
        for (String stage : PIPELINE_STAGES) pipeline.put(stage, 0);
        for (Candidate c : myCandidates) pipeline.merge(c.getStage(), 1, Integer::sum);
        response.setPipeline(pipeline);

        List<CandidateAttention> attention = new ArrayList<>();
        for (Interview interview : myInterviews) {
            if (!"COMPLETED".equals(interview.getStatus())) continue;
            Candidate c = candidateById.get(interview.getCandidateId());
            if (c == null || !"INTERVIEW".equals(c.getStage())) continue;
            boolean hasFeedback = feedbackRepository.findByInterviewId(interview.getId()).isPresent();
            CandidateAttention ca = new CandidateAttention();
            ca.candidateId = c.getId();
            ca.candidateName = c.getFullName();
            ca.jobTitle = jobById.containsKey(c.getJobOpeningId()) ? jobById.get(c.getJobOpeningId()).getTitle() : "";
            ca.stage = c.getStage();
            ca.reason = hasFeedback ? "Interview completed — review feedback" : "Interview completed — feedback pending";
            attention.add(ca);
        }
        response.setCandidatesRequiringAttention(attention);

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
                    u.jobTitle = c != null && jobById.containsKey(c.getJobOpeningId()) ? jobById.get(c.getJobOpeningId()).getTitle() : "";
                    u.stage = i.getStage();
                    u.interviewDate = i.getInterviewDate();
                    u.interviewTime = i.getInterviewTime();
                    return u;
                }).toList();
        response.setUpcomingInterviews(upcoming);

        int pendingCount = 0;
        for (Candidate c : myCandidates) {
            if (!"INTERVIEW".equals(c.getStage())) continue;
            boolean hasFeedback = myInterviews.stream().filter(i -> i.getCandidateId().equals(c.getId()))
                    .anyMatch(i -> feedbackRepository.findByInterviewId(i.getId()).isPresent());
            if (hasFeedback) pendingCount++;
        }
        response.setPendingDecisionsCount(pendingCount);
        return response;
    }

    public List<RankingEntry> getRanking(String hiringManagerUsername, Long jobIdFilter) {
        List<JobOpening> myJobs = jobOpeningRepository.findAll().stream()
                .filter(j -> hiringManagerUsername.equals(j.getAssignedTo()))
                .filter(j -> jobIdFilter == null || jobIdFilter.equals(j.getId())).toList();
        Set<Long> myJobIds = myJobs.stream().map(JobOpening::getId).collect(Collectors.toSet());
        Map<Long, JobOpening> jobById = myJobs.stream().collect(Collectors.toMap(JobOpening::getId, j -> j));

        List<Candidate> scopedCandidates = candidateRepository.findAll().stream()
                .filter(c -> myJobIds.contains(c.getJobOpeningId())).toList();

        List<RankingEntry> ranked = new ArrayList<>();
        List<RankingEntry> incomplete = new ArrayList<>();
        for (Candidate c : scopedCandidates) {
            List<Interview> candidateInterviews = interviewRepository.findAll().stream()
                    .filter(i -> i.getCandidateId().equals(c.getId())).toList();
            List<Double> scores = new ArrayList<>();
            for (Interview i : candidateInterviews) {
                feedbackRepository.findByInterviewId(i.getId()).ifPresent(f -> scores.add(averageScore(f)));
            }
            RankingEntry entry = new RankingEntry();
            entry.candidateId = c.getId();
            entry.candidateName = c.getFullName();
            entry.jobTitle = jobById.containsKey(c.getJobOpeningId()) ? jobById.get(c.getJobOpeningId()).getTitle() : "";
            entry.stage = c.getStage();
            if (scores.isEmpty()) { entry.totalScore = null; incomplete.add(entry); }
            else {
                entry.totalScore = Math.round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;
                ranked.add(entry);
            }
        }
        ranked.sort((a, b) -> Double.compare(b.totalScore, a.totalScore));
        int rank = 1;
        for (RankingEntry entry : ranked) entry.rank = rank++;
        ranked.addAll(incomplete);
        return ranked;
    }

    public KpiSummary getKpis(String hiringManagerUsername) {
        List<JobOpening> myJobs = jobOpeningRepository.findAll().stream()
                .filter(j -> hiringManagerUsername.equals(j.getAssignedTo())).toList();
        Set<Long> myJobIds = myJobs.stream().map(JobOpening::getId).collect(Collectors.toSet());

        List<Candidate> myCandidates = candidateRepository.findAll().stream()
                .filter(c -> myJobIds.contains(c.getJobOpeningId())).toList();

        KpiSummary summary = new KpiSummary();
        summary.totalCandidates = myCandidates.size();
        summary.totalJobOpenings = myJobs.size();

        Map<String, Integer> stageCounts = new LinkedHashMap<>();
        for (String stage : PIPELINE_STAGES) stageCounts.put(stage, 0);
        stageCounts.put("NOT_SHORTLISTED", 0);
        stageCounts.put("REJECTED", 0);
        for (Candidate c : myCandidates) stageCounts.merge(c.getStage(), 1, Integer::sum);
        summary.stageCounts = stageCounts;
        summary.hiredCount = stageCounts.getOrDefault("HIRED", 0);
        summary.rejectedCount = stageCounts.getOrDefault("REJECTED", 0);

        List<JobKpi> perJob = new ArrayList<>();
        for (JobOpening job : myJobs) {
            List<Candidate> jobCandidates = myCandidates.stream().filter(c -> c.getJobOpeningId().equals(job.getId())).toList();
            List<Double> allScores = new ArrayList<>();
            for (Candidate c : jobCandidates) {
                interviewRepository.findAll().stream().filter(i -> i.getCandidateId().equals(c.getId()))
                        .forEach(i -> feedbackRepository.findByInterviewId(i.getId()).ifPresent(f -> allScores.add(averageScore(f))));
            }
            JobKpi jk = new JobKpi();
            jk.jobTitle = job.getTitle();
            jk.candidateCount = jobCandidates.size();
            jk.averageScore = allScores.isEmpty() ? null : Math.round(allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0;
            perJob.add(jk);
        }
        summary.perJob = perJob;
        return summary;
    }

    private double averageScore(InterviewFeedback f) {
        return (f.getTechnicalSkills() + f.getCommunication() + f.getProblemSolving() + f.getCulturalFit() + f.getOverallRecommendation()) / 5.0;
    }

    public static class RankingEntry {
        public Integer rank;
        public Long candidateId;
        public String candidateName, jobTitle, stage;
        public Double totalScore;
    }

    public static class KpiSummary {
        public int totalCandidates, totalJobOpenings, hiredCount, rejectedCount;
        public Map<String, Integer> stageCounts;
        public List<JobKpi> perJob;
    }

    public static class JobKpi {
        public String jobTitle;
        public int candidateCount;
        public Double averageScore;
    }
}
