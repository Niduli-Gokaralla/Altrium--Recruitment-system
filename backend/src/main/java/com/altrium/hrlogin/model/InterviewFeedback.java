package com.altrium.hrlogin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_feedback")
public class InterviewFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "interview_id", nullable = false, unique = true)
    private Long interviewId;

    @Column(name = "technical_skills", nullable = false)
    private Integer technicalSkills;

    @Column(nullable = false)
    private Integer communication;

    @Column(name = "problem_solving", nullable = false)
    private Integer problemSolving;

    @Column(name = "cultural_fit", nullable = false)
    private Integer culturalFit;

    @Column(name = "overall_recommendation", nullable = false)
    private Integer overallRecommendation;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(nullable = false)
    private String submittedBy;

    @Column(nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public InterviewFeedback() {}

    public Long getId() { return id; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public Integer getTechnicalSkills() { return technicalSkills; }
    public void setTechnicalSkills(Integer technicalSkills) { this.technicalSkills = technicalSkills; }
    public Integer getCommunication() { return communication; }
    public void setCommunication(Integer communication) { this.communication = communication; }
    public Integer getProblemSolving() { return problemSolving; }
    public void setProblemSolving(Integer problemSolving) { this.problemSolving = problemSolving; }
    public Integer getCulturalFit() { return culturalFit; }
    public void setCulturalFit(Integer culturalFit) { this.culturalFit = culturalFit; }
    public Integer getOverallRecommendation() { return overallRecommendation; }
    public void setOverallRecommendation(Integer overallRecommendation) { this.overallRecommendation = overallRecommendation; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
