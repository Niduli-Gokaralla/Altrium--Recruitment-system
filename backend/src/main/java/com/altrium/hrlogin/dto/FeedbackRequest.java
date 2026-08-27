package com.altrium.hrlogin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FeedbackRequest {
    @NotNull @Min(1) @Max(5) private Integer technicalSkills;
    @NotNull @Min(1) @Max(5) private Integer communication;
    @NotNull @Min(1) @Max(5) private Integer problemSolving;
    @NotNull @Min(1) @Max(5) private Integer culturalFit;
    @NotNull @Min(1) @Max(5) private Integer overallRecommendation;
    @NotBlank(message = "Comments are required") private String comments;

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
}
