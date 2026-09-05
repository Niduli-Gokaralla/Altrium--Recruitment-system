package com.altrium.hrlogin.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "interviews")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "interview_date", nullable = false)
    private LocalDate interviewDate;

    @Column(name = "interview_time", nullable = false)
    private LocalTime interviewTime;

    @Column(nullable = false)
    private String interviewer;

    // AC: the Hiring Manager selected for this specific interview —
    // independent of whichever Hiring Manager the job opening itself is
    // assigned to.
    @Column(name = "hiring_manager")
    private String hiringManager;

    @Column(nullable = false)
    private String stage;

    @Column(nullable = false)
    private String status = "SCHEDULED";

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "stage_decision")
    private String stageDecision;

    @Column(name = "stage_decision_comment", columnDefinition = "TEXT")
    private String stageDecisionComment;

    @Column(name = "stage_decision_by")
    private String stageDecisionBy;

    @Column(name = "stage_decision_at")
    private LocalDateTime stageDecisionAt;

    public Interview() {}

    public Long getId() { return id; }
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public LocalDate getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDate interviewDate) { this.interviewDate = interviewDate; }
    public LocalTime getInterviewTime() { return interviewTime; }
    public void setInterviewTime(LocalTime interviewTime) { this.interviewTime = interviewTime; }
    public String getInterviewer() { return interviewer; }
    public void setInterviewer(String interviewer) { this.interviewer = interviewer; }
    public String getHiringManager() { return hiringManager; }
    public void setHiringManager(String hiringManager) { this.hiringManager = hiringManager; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getStageDecision() { return stageDecision; }
    public void setStageDecision(String stageDecision) { this.stageDecision = stageDecision; }
    public String getStageDecisionComment() { return stageDecisionComment; }
    public void setStageDecisionComment(String stageDecisionComment) { this.stageDecisionComment = stageDecisionComment; }
    public String getStageDecisionBy() { return stageDecisionBy; }
    public void setStageDecisionBy(String stageDecisionBy) { this.stageDecisionBy = stageDecisionBy; }
    public LocalDateTime getStageDecisionAt() { return stageDecisionAt; }
    public void setStageDecisionAt(LocalDateTime stageDecisionAt) { this.stageDecisionAt = stageDecisionAt; }
}
