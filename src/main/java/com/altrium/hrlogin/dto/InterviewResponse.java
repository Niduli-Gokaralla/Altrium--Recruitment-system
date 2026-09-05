package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.Interview;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class InterviewResponse {
    private Long id, candidateId;
    private String candidateName, jobOpeningTitle, interviewer, hiringManager, stage, status, createdBy;
    private LocalDate interviewDate;
    private LocalTime interviewTime;
    private boolean hasFeedback;
    private LocalDateTime createdAt;

    private String stageDecision;
    private String stageDecisionComment;
    private String stageDecisionBy;
    private LocalDateTime stageDecisionAt;

    public InterviewResponse(Interview interview, String candidateName, String jobOpeningTitle, boolean hasFeedback) {
        this.id = interview.getId();
        this.candidateId = interview.getCandidateId();
        this.candidateName = candidateName;
        this.jobOpeningTitle = jobOpeningTitle;
        this.interviewDate = interview.getInterviewDate();
        this.interviewTime = interview.getInterviewTime();
        this.interviewer = interview.getInterviewer();
        this.hiringManager = interview.getHiringManager();
        this.stage = interview.getStage();
        this.status = interview.getStatus();
        this.hasFeedback = hasFeedback;
        this.createdBy = interview.getCreatedBy();
        this.createdAt = interview.getCreatedAt();
        this.stageDecision = interview.getStageDecision();
        this.stageDecisionComment = interview.getStageDecisionComment();
        this.stageDecisionBy = interview.getStageDecisionBy();
        this.stageDecisionAt = interview.getStageDecisionAt();
    }

    public Long getId() { return id; }
    public Long getCandidateId() { return candidateId; }
    public String getCandidateName() { return candidateName; }
    public String getJobOpeningTitle() { return jobOpeningTitle; }
    public LocalDate getInterviewDate() { return interviewDate; }
    public LocalTime getInterviewTime() { return interviewTime; }
    public String getInterviewer() { return interviewer; }
    public String getHiringManager() { return hiringManager; }
    public String getStage() { return stage; }
    public String getStatus() { return status; }
    public boolean isHasFeedback() { return hasFeedback; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getStageDecision() { return stageDecision; }
    public String getStageDecisionComment() { return stageDecisionComment; }
    public String getStageDecisionBy() { return stageDecisionBy; }
    public LocalDateTime getStageDecisionAt() { return stageDecisionAt; }
}
