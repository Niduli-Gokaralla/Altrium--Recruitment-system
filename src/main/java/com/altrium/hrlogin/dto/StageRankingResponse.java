package com.altrium.hrlogin.dto;

public class StageRankingResponse {
    private Long candidateId;
    private String candidateName;
    private Long interviewId; // needed for the Advance to Next Stage button
    private String jobTitle;
    private String candidateStatus; // candidate's current stage, for display

    private Double interviewerScore; // null if that role hasn't submitted feedback yet
    private Double hrScore;
    private Double hiringManagerScore;
    private Double stageScore;       // null unless all 3 above are present
    private Integer rank;            // null for incomplete entries
    private boolean hasAllScores;

    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getCandidateStatus() { return candidateStatus; }
    public void setCandidateStatus(String candidateStatus) { this.candidateStatus = candidateStatus; }
    public Double getInterviewerScore() { return interviewerScore; }
    public void setInterviewerScore(Double interviewerScore) { this.interviewerScore = interviewerScore; }
    public Double getHrScore() { return hrScore; }
    public void setHrScore(Double hrScore) { this.hrScore = hrScore; }
    public Double getHiringManagerScore() { return hiringManagerScore; }
    public void setHiringManagerScore(Double hiringManagerScore) { this.hiringManagerScore = hiringManagerScore; }
    public Double getStageScore() { return stageScore; }
    public void setStageScore(Double stageScore) { this.stageScore = stageScore; }
    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
    public boolean isHasAllScores() { return hasAllScores; }
    public void setHasAllScores(boolean hasAllScores) { this.hasAllScores = hasAllScores; }
}
