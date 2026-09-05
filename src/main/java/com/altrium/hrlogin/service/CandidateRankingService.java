package com.altrium.hrlogin.service;

import com.altrium.hrlogin.dto.CandidateRankingResponse;
import com.altrium.hrlogin.model.Candidate;
import com.altrium.hrlogin.model.Interview;
import com.altrium.hrlogin.model.InterviewFeedback;
import com.altrium.hrlogin.model.JobOpening;
import com.altrium.hrlogin.repository.CandidateRepository;
import com.altrium.hrlogin.repository.InterviewFeedbackRepository;
import com.altrium.hrlogin.repository.InterviewRepository;
import com.altrium.hrlogin.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class CandidateRankingService {
    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository interviewFeedbackRepository;

    public CandidateRankingService(CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository,
                                    InterviewRepository interviewRepository, InterviewFeedbackRepository interviewFeedbackRepository) {
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.interviewRepository = interviewRepository;
        this.interviewFeedbackRepository = interviewFeedbackRepository;
    }

    public List<CandidateRankingResponse> getRanking(String hmUsername, Long jobIdFilter) {
        return getRanking(hmUsername, jobIdFilter, null);
    }

    // AC: an optional `stageFilter` (e.g. "Technical Interview") narrows
    // the ranking to ONLY that round's own feedback — so "Technical
    // Interview Ranking" genuinely reflects who did best in THAT round,
    // not everyone's blended overall score. Skills/Experience/
    // Qualifications stay profile-based (not interview-specific) either
    // way. When stageFilter is null, behavior is unchanged (existing
    // overall ranking).
    public List<CandidateRankingResponse> getRanking(String hmUsername, Long jobIdFilter, String stageFilter) {
        List<JobOpening> myJobs = jobOpeningRepository.findAll().stream()
                .filter(j -> hmUsername.equals(j.getAssignedTo()))
                .filter(j -> jobIdFilter == null || jobIdFilter.equals(j.getId()))
                .toList();

        Map<Long, JobOpening> jobsById = myJobs.stream().collect(Collectors.toMap(JobOpening::getId, j -> j));
        Set<Long> myJobIds = jobsById.keySet();

        List<Candidate> candidates = candidateRepository.findAll().stream()
                .filter(c -> myJobIds.contains(c.getJobOpeningId()))
                .toList();

        List<Interview> allInterviews = interviewRepository.findAll();
        List<InterviewFeedback> allFeedback = interviewFeedbackRepository.findAll();
        Map<Long, List<InterviewFeedback>> feedbackGroupedByInterview = allFeedback.stream()
                .collect(Collectors.groupingBy(InterviewFeedback::getInterviewId));

        List<CandidateRankingResponse> results = new ArrayList<>();

        for (Candidate candidate : candidates) {
            JobOpening job = jobsById.get(candidate.getJobOpeningId());
            CandidateRankingResponse dto = new CandidateRankingResponse();
            dto.setCandidateId(candidate.getId());
            dto.setCandidateName(candidate.getFullName());
            dto.setJobOpeningId(job.getId());
            dto.setJobTitle(job.getTitle());
            dto.setStage(candidate.getStage());

            List<Interview> candidateInterviews = allInterviews.stream()
                    .filter(i -> i.getCandidateId().equals(candidate.getId()))
                    .sorted(Comparator.comparing(i -> i.getInterviewDate().toString() + i.getInterviewTime().toString()))
                    .toList();

            candidateInterviews.stream()
                    .reduce((first, second) -> second)
                    .ifPresent(latest -> dto.setLatestStageDecision(latest.getStageDecision()));

            // Interview History always shows the FULL history regardless
            // of the stage filter, so HR/HM still get full context.
            List<CandidateRankingResponse.InterviewHistoryEntry> history = candidateInterviews.stream()
                    .map(interview -> {
                        List<InterviewFeedback> thisInterviewFeedback = feedbackGroupedByInterview.getOrDefault(interview.getId(), List.of());
                        Double score = thisInterviewFeedback.isEmpty() ? null :
                                avg(thisInterviewFeedback.stream().flatMap(f -> Stream.of(
                                        (double) f.getTechnicalSkills(), (double) f.getCommunication(),
                                        (double) f.getProblemSolving(), (double) f.getCulturalFit()
                                )).toList()) * 20;
                        return new CandidateRankingResponse.InterviewHistoryEntry(
                                interview.getStage(), interview.getInterviewer(), interview.getInterviewDate(),
                                score != null ? round1(score) : null,
                                interview.getStageDecision(), interview.getStageDecisionComment()
                        );
                    })
                    .toList();
            dto.setInterviewHistory(history);

            // AC: when a stage filter is active, ONLY that stage's own
            // interview(s) count toward "has feedback" / Technical /
            // Other Criteria — a candidate with no interview at this
            // specific stage is excluded from this particular ranking.
            List<Interview> interviewsForScoring = stageFilter == null || stageFilter.isBlank()
                    ? candidateInterviews
                    : candidateInterviews.stream().filter(i -> stageFilter.equals(i.getStage())).toList();

            List<Long> interviewIdsForScoring = interviewsForScoring.stream().map(Interview::getId).toList();
            List<InterviewFeedback> candidateFeedback = interviewIdsForScoring.stream()
                    .flatMap(id -> feedbackGroupedByInterview.getOrDefault(id, List.of()).stream())
                    .toList();

            if (candidateFeedback.isEmpty()) {
                dto.setHasFeedback(false);
                results.add(dto);
                continue;
            }
            dto.setHasFeedback(true);

            double technical = avg(candidateFeedback.stream().map(f -> (double) f.getTechnicalSkills()).toList()) * 20;
            double otherCriteria = avg(candidateFeedback.stream().flatMap(f -> Stream.of(
                    (double) f.getCommunication(), (double) f.getProblemSolving(),
                    (double) f.getCulturalFit(), (double) f.getOverallRecommendation()
            )).toList()) * 20;

            double skills = keywordMatchScore(job.getSkills(), candidate.getSkills());
            double qualifications = wordOverlapScore(job.getQualifications(), candidate.getQualifications());
            double experience = experienceMatchScore(job.getExperienceRequired(), candidate.getExperience());

            double overall = technical * 0.35 + skills * 0.25 + experience * 0.20 + qualifications * 0.10 + otherCriteria * 0.10;

            dto.setTechnicalScore(round1(technical));
            dto.setSkillsScore(round1(skills));
            dto.setExperienceScore(round1(experience));
            dto.setQualificationsScore(round1(qualifications));
            dto.setOtherCriteriaScore(round1(otherCriteria));
            dto.setOverallScore(round1(overall));

            dto.setStrengths(buildStrengths(dto));
            dto.setAreasToConsider(buildAreasToConsider(dto));

            results.add(dto);
        }

        List<CandidateRankingResponse> ranked = results.stream().filter(CandidateRankingResponse::isHasFeedback)
                .sorted(Comparator.comparingDouble(CandidateRankingResponse::getOverallScore).reversed())
                .toList();
        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).setRank(i + 1);
        }

        List<CandidateRankingResponse> incomplete = results.stream().filter(r -> !r.isHasFeedback()).toList();

        List<CandidateRankingResponse> combined = new ArrayList<>(ranked);
        combined.addAll(incomplete);
        return combined;
    }

    private List<String> buildStrengths(CandidateRankingResponse dto) {
        List<String> strengths = new ArrayList<>();
        if (dto.getTechnicalScore() >= 80) strengths.add("Strong technical interview performance");
        if (dto.getSkillsScore() >= 80) strengths.add("Strong match on required skills");
        if (dto.getExperienceScore() >= 80) strengths.add("Relevant professional experience");
        if (dto.getQualificationsScore() >= 80) strengths.add("Strong match on required qualifications");
        if (dto.getOtherCriteriaScore() >= 80) strengths.add("Well-rounded interview feedback (communication, problem solving, cultural fit)");
        return strengths;
    }

    private List<String> buildAreasToConsider(CandidateRankingResponse dto) {
        List<String> areas = new ArrayList<>();
        if (dto.getTechnicalScore() < 60) areas.add("Lower technical interview score");
        if (dto.getSkillsScore() < 60) areas.add("Some gaps against the job's required skills");
        if (dto.getExperienceScore() < 60) areas.add("Experience level may be below what's required");
        if (dto.getQualificationsScore() < 60) areas.add("Qualifications gap relative to job requirements");
        if (dto.getOtherCriteriaScore() < 60) areas.add("Mixed feedback on communication/problem solving/cultural fit");
        return areas;
    }

    private double avg(List<Double> values) {
        return values.isEmpty() ? 0 : values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }

    private double keywordMatchScore(String requiredSkillsCsv, String candidateSkills) {
        if (requiredSkillsCsv == null || requiredSkillsCsv.isBlank()) return 50;
        List<String> required = Arrays.stream(requiredSkillsCsv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (required.isEmpty()) return 50;
        String candidateLower = candidateSkills == null ? "" : candidateSkills.toLowerCase();
        long matched = required.stream().filter(s -> candidateLower.contains(s.toLowerCase())).count();
        return (matched * 100.0) / required.size();
    }

    private double wordOverlapScore(String requiredText, String candidateText) {
        if (requiredText == null || requiredText.isBlank()) return 50;
        Set<String> requiredWords = Arrays.stream(requiredText.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 3).collect(Collectors.toSet());
        if (requiredWords.isEmpty()) return 50;
        String candidateLower = candidateText == null ? "" : candidateText.toLowerCase();
        long matched = requiredWords.stream().filter(candidateLower::contains).count();
        return (matched * 100.0) / requiredWords.size();
    }

    private static final Pattern YEARS_PATTERN = Pattern.compile("(\\d+)\\s*-\\s*(\\d+)|(\\d+)");

    private double experienceMatchScore(String requiredText, String candidateText) {
        if (requiredText == null || requiredText.isBlank()) return 50;
        Integer minRequired = parseMinYears(requiredText);
        Integer candidateYears = parseFirstNumber(candidateText);
        if (minRequired == null || candidateYears == null) {
            return wordOverlapScore(requiredText, candidateText);
        }
        if (candidateYears >= minRequired) return 100;
        if (minRequired == 0) return 100;
        return Math.max(0, Math.min(100, (candidateYears * 100.0) / minRequired));
    }

    private Integer parseMinYears(String text) {
        Matcher m = YEARS_PATTERN.matcher(text);
        if (m.find()) {
            if (m.group(1) != null) return Integer.parseInt(m.group(1));
            if (m.group(3) != null) return Integer.parseInt(m.group(3));
        }
        return null;
    }

    private Integer parseFirstNumber(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+)").matcher(text);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }
}
