package com.altrium.hrlogin.dto;

import java.time.LocalDate;
import java.util.List;

public class CandidateRankingResponse {
    private Long candidateId;
    private String candidateName;
    private Long jobOpeningId;
    private String jobTitle;
    private String stage;
    private boolean hasFeedback;
    private Integer rank;

    private Double overallScore;
    private Double technicalScore;
    private Double skillsScore;
    private Double experienceScore;
    private Double qualificationsScore;
    private Double otherCriteriaScore;

    private List<String> strengths;
    private List<String> areasToConsider;

    private String latestStageDecision;

    // AC: the full per-interview history (every stage, its own score,
    // and its own stage decision) — not just the latest one. Purely
    // informational, mirrors the Interview History table already on
    // Feedback & Decisions.
    private List<InterviewHistoryEntry> interviewHistory;

    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public Long getJobOpeningId() { return jobOpeningId; }
    public void setJobOpeningId(Long jobOpeningId) { this.jobOpeningId = jobOpeningId; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public boolean isHasFeedback() { return hasFeedback; }
    public void setHasFeedback(boolean hasFeedback) { this.hasFeedback = hasFeedback; }
    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }
    public Double getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Double technicalScore) { this.technicalScore = technicalScore; }
    public Double getSkillsScore() { return skillsScore; }
    public void setSkillsScore(Double skillsScore) { this.skillsScore = skillsScore; }
    public Double getExperienceScore() { return experienceScore; }
    public void setExperienceScore(Double experienceScore) { this.experienceScore = experienceScore; }
    public Double getQualificationsScore() { return qualificationsScore; }
    public void setQualificationsScore(Double qualificationsScore) { this.qualificationsScore = qualificationsScore; }
    public Double getOtherCriteriaScore() { return otherCriteriaScore; }
    public void setOtherCriteriaScore(Double otherCriteriaScore) { this.otherCriteriaScore = otherCriteriaScore; }
    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }
    public List<String> getAreasToConsider() { return areasToConsider; }
    public void setAreasToConsider(List<String> areasToConsider) { this.areasToConsider = areasToConsider; }
    public String getLatestStageDecision() { return latestStageDecision; }
    public void setLatestStageDecision(String latestStageDecision) { this.latestStageDecision = latestStageDecision; }
    public List<InterviewHistoryEntry> getInterviewHistory() { return interviewHistory; }
    public void setInterviewHistory(List<InterviewHistoryEntry> interviewHistory) { this.interviewHistory = interviewHistory; }

    public static class InterviewHistoryEntry {
        private String stage;
        private String interviewer;
        private LocalDate interviewDate;
        private Double score; // 0-100, null if no feedback yet for this interview
        private String stageDecision; // ADVANCE/REJECT/ON_HOLD, null if not decided yet
        private String stageDecisionComment;

        public InterviewHistoryEntry(String stage, String interviewer, LocalDate interviewDate, Double score, String stageDecision, String stageDecisionComment) {
            this.stage = stage;
            this.interviewer = interviewer;
            this.interviewDate = interviewDate;
            this.score = score;
            this.stageDecision = stageDecision;
            this.stageDecisionComment = stageDecisionComment;
        }

        public String getStage() { return stage; }
        public String getInterviewer() { return interviewer; }
        public LocalDate getInterviewDate() { return interviewDate; }
        public Double getScore() { return score; }
        public String getStageDecision() { return stageDecision; }
        public String getStageDecisionComment() { return stageDecisionComment; }
    }
}
