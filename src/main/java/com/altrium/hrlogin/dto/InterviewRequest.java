package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class InterviewRequest {
    @NotNull(message = "Candidate is required")
    private Long candidateId;
    @NotNull(message = "Interview date is required")
    private LocalDate interviewDate;
    @NotNull(message = "Interview time is required")
    private LocalTime interviewTime;
    @NotBlank(message = "Interviewer is required")
    private String interviewer;
    @NotBlank(message = "Hiring Manager is required")
    private String hiringManager;
    @NotBlank(message = "Interview stage is required")
    private String stage;
    private String status;

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
}
