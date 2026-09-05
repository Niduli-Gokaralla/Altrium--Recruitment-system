package com.altrium.hrlogin.dto;

import com.altrium.hrlogin.model.InterviewFeedback;
import java.time.LocalDateTime;

public class FeedbackResponse {
    private Long id, interviewId;
    private String evaluatorRole;
    private Integer technicalSkills, communication, problemSolving, culturalFit, overallRecommendation;
    private String comments, submittedBy;
    private LocalDateTime submittedAt, updatedAt;

    public FeedbackResponse(InterviewFeedback f) {
        this.id = f.getId();
        this.interviewId = f.getInterviewId();
        this.evaluatorRole = f.getEvaluatorRole();
        this.technicalSkills = f.getTechnicalSkills();
        this.communication = f.getCommunication();
        this.problemSolving = f.getProblemSolving();
        this.culturalFit = f.getCulturalFit();
        this.overallRecommendation = f.getOverallRecommendation();
        this.comments = f.getComments();
        this.submittedBy = f.getSubmittedBy();
        this.submittedAt = f.getSubmittedAt();
        this.updatedAt = f.getUpdatedAt();
    }

    public Long getId() { return id; }
    public Long getInterviewId() { return interviewId; }
    public String getEvaluatorRole() { return evaluatorRole; }
    public Integer getTechnicalSkills() { return technicalSkills; }
    public Integer getCommunication() { return communication; }
    public Integer getProblemSolving() { return problemSolving; }
    public Integer getCulturalFit() { return culturalFit; }
    public Integer getOverallRecommendation() { return overallRecommendation; }
    public String getComments() { return comments; }
    public String getSubmittedBy() { return submittedBy; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
